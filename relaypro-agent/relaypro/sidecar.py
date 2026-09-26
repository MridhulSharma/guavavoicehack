import logging
import os
import threading
from typing import Optional

import guava
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from relaypro.agent import build_agent
from relaypro.schema import CallGoal

logger = logging.getLogger("relaypro.sidecar")

app = FastAPI()

_current_call: Optional[guava.Call] = None

_NUMBER_NOISE = " -()."


def _normalize_number(number: str) -> str:
    return "".join(c for c in number if c not in _NUMBER_NOISE)


def _allowed_numbers() -> list[str]:
    """Numbers /call may dial, from RELAYPRO_ALLOWED_NUMBERS. Empty = no limit."""
    raw = os.environ.get("RELAYPRO_ALLOWED_NUMBERS", "")
    return [_normalize_number(n) for n in raw.split(",") if n.strip()]


def _describe_allowlist() -> str:
    allowed = _allowed_numbers()
    if allowed:
        return f"ALLOWLIST ENFORCED: [{', '.join(allowed)}]"
    return "ALLOWLIST OFF - all numbers allowed"


print(_describe_allowlist(), flush=True)


class SayBody(BaseModel):
    text: str


@app.get("/")
def health():
    return {"ok": True}


@app.post("/call")
def start_call(goal_json: dict):
    global _current_call

    goal = CallGoal.from_json(goal_json)

    allowed = _allowed_numbers()
    if allowed and _normalize_number(goal.to_number) not in allowed:
        logger.warning("blocked call to %s (not in allowlist)", goal.to_number)
        return JSONResponse(
            status_code=403,
            content={
                "status": "blocked",
                "reason": (
                    "to_number is not in RELAYPRO_ALLOWED_NUMBERS; "
                    "unset that env var to allow any number"
                ),
                "to_number": goal.to_number,
            },
        )

    def _on_call_started(call: guava.Call) -> None:
        global _current_call
        _current_call = call

    agent = build_agent(goal, on_call_started=_on_call_started)

    def _run_call():
        global _current_call
        try:
            agent.call_phone(
                from_number=os.environ["GUAVA_AGENT_NUMBER"],
                to_number=goal.to_number,
            )
        finally:
            _current_call = None

    thread = threading.Thread(target=_run_call, daemon=True)
    thread.start()

    return {"status": "started"}


@app.post("/say")
def say(body: SayBody):
    if _current_call is None:
        raise HTTPException(status_code=409, detail="no active call")
    _current_call.send_instruction(
        f'The human operator wants you to say exactly the following to the '
        f'caller now: "{body.text}"'
    )
    return {"status": "spoken"}
