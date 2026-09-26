import json
import logging
import os
import re
import uuid
from typing import Callable, Optional

import guava
from guava.events import AgentDTMFSentEvent, BotSessionEnded

from relaypro.ingest import post_event
from relaypro.schema import CallGoal

logger = logging.getLogger("relaypro.agent")

# --- IVR navigation -------------------------------------------------------

MAX_DTMF_PRESSES = 3

# "press 1 for sales", "press 2 to place an order", "for billing, press 3"
_MENU_FORWARD = re.compile(r"press\s+(\d|\*|#)\s*(?:for|to)?\s*([^.,;\n]{0,60})", re.I)
_MENU_REVERSE = re.compile(r"(?:for|to)\s+([^.,;\n]{0,60}?),?\s*press\s+(\d|\*|#)", re.I)

# Reaching a person almost always advances the goal, so it outranks everything.
_HUMAN_WORDS = (
    "representative", "operator", "agent", "someone", "customer service",
    "front desk", "receptionist", "speak", "talk",
)
_ORDER_WORDS = ("order", "reservation", "booking", "appointment", "schedule")
# Options we must never take: they leave English or hang up on us.
_AVOID_WORDS = (
    "español", "espanol", "spanish", "français", "francais", "french",
    "中文", "hang up", "goodbye", "repeat this menu", "voicemail",
    "leave a message",
)


def _menu_options(text: str) -> list[tuple[str, str]]:
    """Extract (digit, label) pairs from an IVR prompt, in the order heard."""
    found: list[tuple[str, str]] = []
    for digit, label in _MENU_FORWARD.findall(text):
        found.append((digit, label.strip().lower()))
    for label, digit in _MENU_REVERSE.findall(text):
        found.append((digit, label.strip().lower()))
    # A digit can match both patterns ("...press 4, for existing orders, press 5");
    # keep the most descriptive label for each.
    best: dict[str, str] = {}
    for digit, label in found:
        if len(label) > len(best.get(digit, "")):
            best[digit] = label
    return [(d, l) for d, l in best.items() if l]


def _choose_digit(text: str, goal_words: set[str]) -> Optional[str]:
    """Pick the digit that best advances the goal, or None to stay on the line."""
    best: tuple[int, Optional[str]] = (0, None)
    for digit, label in _menu_options(text):
        if any(w in label for w in _AVOID_WORDS):
            continue
        score = 0
        if any(w in label for w in _HUMAN_WORDS):
            score += 10
        if any(w in label for w in _ORDER_WORDS):
            score += 6
        score += 2 * len(goal_words & set(re.findall(r"[a-z]{4,}", label)))
        if score > best[0]:
            best = (score, digit)
    return best[1]


# --- Post-call summary ----------------------------------------------------

SUMMARY_SYSTEM = """You summarize a phone call an AI agent placed on a user's behalf.

Reply with ONLY a JSON object, no prose and no markdown fence:
{"outcome": "succeeded"|"failed"|"partial",
 "summary": string,
 "collected": {field: value},
 "must_ask_answers": [{"question": string, "answer": string}]}

- outcome: "succeeded" if the objective was met, "partial" if some of it was, "failed" otherwise.
- summary: one short paragraph, plain language, what happened and what the user needs to know.
- collected: a value for each requested field; use null for anything never established.
- must_ask_answers: one entry per required question, with the answer given or null."""


def _summarize(goal: CallGoal, transcript: list[tuple[str, str]], collected: dict) -> dict:
    """Ask Haiku for a CallSummary. Falls back to a transcript-only summary on any error."""
    lines = "\n".join(f"{who}: {text}" for who, text in transcript)
    fallback = {
        "outcome": "partial" if transcript else "failed",
        "summary": (
            f"Call to {goal.to_number} ended after {len(transcript)} exchanges. "
            "Automatic summary unavailable - see the transcript above."
        ),
        "collected": collected,
        "must_ask_answers": [{"question": q, "answer": None} for q in goal.must_ask],
    }
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return fallback

    try:
        import anthropic

        res = anthropic.Anthropic().messages.create(
            model="claude-haiku-4-5",
            max_tokens=1024,
            system=SUMMARY_SYSTEM,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Objective: {goal.objective}\n"
                        f"Required questions: {goal.must_ask or 'none'}\n"
                        f"Fields to collect: {goal.fields_to_collect or 'none'}\n"
                        f"Values the agent captured: {json.dumps(collected)}\n\n"
                        f"Transcript:\n{lines or '(no speech recorded)'}"
                    ),
                }
            ],
        )
        raw = "".join(b.text for b in res.content if b.type == "text").strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
        parsed = json.loads(raw)
        if parsed.get("outcome") not in ("succeeded", "failed", "partial"):
            parsed["outcome"] = fallback["outcome"]
        parsed.setdefault("summary", fallback["summary"])
        parsed.setdefault("collected", collected)
        parsed.setdefault("must_ask_answers", [])
        return parsed
    except Exception as e:
        logger.warning("summary generation failed: %s", e)
        return fallback


def build_agent(
    goal: CallGoal,
    on_call_started: Optional[Callable[[guava.Call], None]] = None,
) -> guava.Agent:
    # The SDK revises a caller utterance in place: CallerSpeechEvent carries an
    # utterance_id and, per its docstring, "for utterances with the same id, all
    # but the latest is out of date". There is no final/interim flag, so the only
    # signal that a turn is done is a later event superseding it -- a new id, the
    # agent speaking, or the call ending. _pending_caller holds the turn we have
    # not been able to call final yet.
    _pending_caller: dict[str, str] = {}
    # Full call record for the post-call summary, and IVR press bookkeeping.
    _transcript: list[tuple[str, str]] = []
    _dtmf_sent: dict[str, int] = {"count": 0}
    _collected: dict = {}
    _menus_handled: set[str] = set()
    _goal_words = set(
        re.findall(
            r"[a-z]{4,}",
            " ".join([goal.objective, *goal.must_ask, *goal.fields_to_collect]).lower(),
        )
    )

    def _finalize_caller_turn() -> None:
        """Re-post the open caller turn as final. Same id, so the UI updates in place."""
        if not _pending_caller:
            return
        post_event(
            {
                "type": "utterance",
                "speaker": "human",
                "text": _pending_caller["text"],
                "utterance_id": _pending_caller["id"],
                "is_final": True,
            }
        )
        _transcript.append(("caller", _pending_caller["text"]))
        _pending_caller.clear()

    def _try_ivr(call: guava.Call, utterance_id: str, text: str) -> None:
        """Press a key if the caller side is reading a menu. Bounded and one press per menu."""
        if _dtmf_sent["count"] >= MAX_DTMF_PRESSES or utterance_id in _menus_handled:
            return
        digit = _choose_digit(text, _goal_words)
        if digit is None:
            return  # Unclear menu: stay on the line rather than guess.
        _menus_handled.add(utterance_id)
        _dtmf_sent["count"] += 1
        logger.info("IVR: pressing %s (press %d/%d)", digit, _dtmf_sent["count"], MAX_DTMF_PRESSES)
        # on_agent_dtmf fires for this and emits the existing "dtmf" ingest event.
        call.send_dtmf(digit)

    agent = guava.Agent(
        name="Rae",
        organization=goal.context.get("user_name", "the caller"),
        purpose=(
            "You are an AI voice assistant calling on behalf of a user with a "
            "hearing disability. At the very start of the call, disclose that "
            "you are an AI. Then complete this objective: " + goal.objective
        ),
    )

    @agent.on_call_start
    def on_call_start(call: guava.Call):
        call.set_agent_dtmf(enabled=True)
        call.set_task(
            "relay",
            objective=goal.objective,
            checklist=[
                *[f"Ask: {q}" for q in goal.must_ask],
                *[
                    guava.Field(key=k, field_type="text", description=f"Collect: {k}")
                    for k in goal.fields_to_collect
                ],
                "End the call politely once the objective is met.",
            ],
        )
        post_event({"type": "call_started"})
        if on_call_started is not None:
            on_call_started(call)

    @agent.on_caller_speech
    def on_caller_speech(call: guava.Call, event):
        # No utterance_id means the SDK is not revising this one, so it stands alone.
        standalone = event.utterance_id is None
        utterance_id = event.utterance_id or f"caller-{uuid.uuid4().hex[:12]}"

        if _pending_caller and _pending_caller["id"] != utterance_id:
            _finalize_caller_turn()

        post_event(
            {
                "type": "utterance",
                "speaker": "human",
                "text": event.utterance,
                "utterance_id": utterance_id,
                "is_final": standalone,
            }
        )

        if standalone:
            _transcript.append(("caller", event.utterance))
        else:
            _pending_caller.update(id=utterance_id, text=event.utterance)

        _try_ivr(call, utterance_id, event.utterance)

    @agent.on_agent_speech
    def on_agent_speech(call: guava.Call, event):
        # The agent speaking means the caller's turn is over.
        _finalize_caller_turn()
        # AgentSpeechEvent has no utterance_id and is never revised, so each one
        # is a finished utterance in its own right.
        post_event(
            {
                "type": "utterance",
                "speaker": "agent",
                "text": event.utterance,
                "utterance_id": f"agent-{uuid.uuid4().hex[:12]}",
                "is_final": True,
            }
        )
        _transcript.append(("agent", event.utterance))

    @agent.on_agent_dtmf
    def on_agent_dtmf(call: guava.Call, event: AgentDTMFSentEvent):
        post_event({"type": "dtmf", "digits": "".join(event.digits)})
        _transcript.append(("agent", f"[pressed {''.join(event.digits)}]"))

    @agent.on_task_complete("relay")
    def on_task_complete(call: guava.Call):
        _finalize_caller_turn()
        collected = {k: call.get_field(k) for k in goal.fields_to_collect}
        post_event({"type": "task_complete", "fields": collected})
        _collected.update(collected)
        call.hangup("Thank the person politely and end the call.")

    @agent.on_session_end
    def on_session_end(call: guava.Call, event: BotSessionEnded):
        _finalize_caller_turn()
        post_event({"type": "session_end", "reason": event.termination_reason})
        post_event({"type": "summary", "summary": _summarize(goal, _transcript, _collected)})

    return agent
