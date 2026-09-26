"use client";

import { useEffect, useRef, useState } from "react";

import { Backdrop } from "@/app/components/Backdrop";
import { Landing } from "@/app/components/Landing";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import type { CallGoal, CallSummary, RelayEvent } from "@/app/lib/types";

/**
 * Interim transcripts arrive as repeated "utterance" events sharing one
 * utterance_id, each superseding the last. Revise that bubble in place instead
 * of stacking a new one; everything else is append-only.
 */
function mergeEvent(prev: RelayEvent[], event: RelayEvent): RelayEvent[] {
  if (event.type !== "utterance" || !event.utterance_id) {
    return [...prev, event];
  }

  const at = prev.findIndex(
    (e) => e.type === "utterance" && e.utterance_id === event.utterance_id,
  );
  if (at === -1) return [...prev, event];

  const next = [...prev];
  next[at] = event;
  return next;
}

export default function Home() {
  const [phone, setPhone] = useState("");
  const [objective, setObjective] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [events, setEvents] = useState<RelayEvent[]>([]);
  const [currentGoal, setCurrentGoal] = useState<CallGoal | null>(null);
  // Phase 3 populates this; the sidebar swaps to a summary card when it lands.
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [nudgeText, setNudgeText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  // The greeting view comes first; submitting the objective reveals the call UI.
  const [view, setView] = useState<"landing" | "app">("landing");

  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const source = new EventSource("/api/stream");

    source.onmessage = (message) => {
      let event: RelayEvent;
      try {
        event = JSON.parse(message.data) as RelayEvent;
      } catch {
        return;
      }

      if (event.type === "goal") {
        setCurrentGoal(event.goal);
        setSummary(null);
        return;
      }

      if (event.type === "summary") {
        setSummary(event.summary);
        return;
      }

      setEvents((prev) => mergeEvent(prev, event));

      if (event.type === "call_started") setIsCalling(true);
      if (event.type === "session_end") setIsCalling(false);
    };

    return () => source.close();
  }, []);

  // `view` is a dependency because the transcript element only exists in the
  // app view: without it, events that arrived during the landing view would
  // render already scrolled to the top.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTo(0, el.scrollHeight);
  }, [events, view]);

  async function startCall() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/goal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to_number: phone.trim(),
          objective: objective.trim(),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? `start failed (${res.status})`);
        return;
      }
      setEvents([]);
    } catch (e) {
      setError(String(e));
    } finally {
      setStarting(false);
    }
  }

  async function sendNudge() {
    const text = nudgeText.trim();
    if (!text) return;
    setError(null);
    setNudgeText("");
    try {
      const res = await fetch("/api/say", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? `nudge failed (${res.status})`);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  const canStart =
    phone.trim().length > 0 && objective.trim().length > 0 && !starting;

  /** Landing submit: reveal the call UI, then fire the unchanged startCall. */
  function startFromLanding() {
    setView("app");
    void startCall();
  }

  return (
    <>
      <Backdrop live={isCalling} />

      <div className="app-shell flex h-screen flex-col">
        {view === "landing" ? (
          <>
            <header className="flex items-center justify-between px-5 py-4">
              <Brand isCalling={isCalling} showStatus={false} />
              <ThemeToggle />
            </header>

            <Landing
              phone={phone}
              onPhoneChange={setPhone}
              objective={objective}
              onObjectiveChange={setObjective}
              onStart={startFromLanding}
              canStart={canStart}
              starting={starting}
              error={error}
            />
          </>
        ) : (
          <>
            {/* TOP - goal input */}
            <header className="panel-bar view-enter sticky top-0 z-20 border-b px-5 py-4">
              <div className="mx-auto flex max-w-6xl flex-wrap items-end gap-4">
                <Brand isCalling={isCalling} showStatus />

                <label className="flex flex-col gap-1.5">
                  <span className="field-label">Number to call</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+15551234567"
                    className="field w-48"
                  />
                </label>

                <label className="flex min-w-64 flex-1 flex-col gap-1.5">
                  <span className="field-label">
                    What should the call accomplish?
                  </span>
                  <input
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canStart) startCall();
                    }}
                    placeholder="Confirm you can hear me and ask what the weather is"
                    className="field w-full"
                  />
                </label>

                <button
                  onClick={startCall}
                  disabled={!canStart}
                  className="btn btn-primary"
                >
                  {starting ? "Starting…" : "Start"}
                </button>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mx-auto mt-2 max-w-6xl text-[0.92rem] text-danger"
                >
                  {error}
                </p>
              )}
            </header>

            {/* CENTER - transcript + sidebar */}
            <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-5 overflow-hidden p-5 lg:grid-cols-[7fr_3fr]">
              <div
                ref={transcriptRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label="Live call transcript"
                className="panel panel-sunken view-enter stagger-1 scroll-area flex flex-col gap-3 p-5"
              >
                {events.length === 0 && (
                  <p className="m-auto max-w-sm text-center text-fg-subtle">
                    The live transcript will appear here once the call starts.
                  </p>
                )}
                {events.map((event, i) => (
                  <Bubble
                    key={
                      event.type === "utterance" && event.utterance_id
                        ? event.utterance_id
                        : `i${i}`
                    }
                    event={event}
                  />
                ))}
              </div>

              <aside className="panel view-enter stagger-2 scroll-area p-5">
                {summary ? (
                  <SummaryCard summary={summary} />
                ) : currentGoal ? (
                  <div className="space-y-4">
                    <h2 className="section-heading">Call goal</h2>
                    <Field label="Calling">{currentGoal.to_number}</Field>
                    <Field label="Objective">{currentGoal.objective}</Field>
                    {(currentGoal.must_ask ?? []).length > 0 && (
                      <Field label="Must ask">
                        <ul className="list-disc space-y-1 pl-5">
                          {(currentGoal.must_ask ?? []).map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </Field>
                    )}
                    {(currentGoal.fields_to_collect ?? []).length > 0 && (
                      <Field label="Collecting">
                        {(currentGoal.fields_to_collect ?? []).join(", ")}
                      </Field>
                    )}
                  </div>
                ) : (
                  <p className="text-fg-subtle">
                    No call yet. Enter a number and an objective above.
                  </p>
                )}
              </aside>
            </main>

            {/* BOTTOM - nudge bar */}
            <footer className="panel-bar view-enter stagger-3 sticky bottom-0 border-t px-5 py-4">
              <div className="mx-auto flex max-w-6xl items-end gap-4">
                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="field-label">Nudge the agent</span>
                  <textarea
                    value={nudgeText}
                    onChange={(e) => setNudgeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (isCalling) sendNudge();
                      }
                    }}
                    rows={2}
                    disabled={!isCalling}
                    placeholder={
                      isCalling
                        ? "Ask them to hold - I need to check something"
                        : "Available while a call is live"
                    }
                    className="field w-full resize-none"
                  />
                </label>
                <button
                  onClick={sendNudge}
                  disabled={!isCalling || nudgeText.trim().length === 0}
                  className="btn btn-quiet"
                >
                  Nudge
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </>
  );
}

function Brand({
  isCalling,
  showStatus,
}: {
  isCalling: boolean;
  showStatus: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[1.15rem] font-bold tracking-tight">Decibels</span>
      {showStatus && (
        <span className={`pill ${isCalling ? "pill-live" : "pill-idle"}`}>
          <span className="pill-dot" aria-hidden="true" />
          {isCalling ? "call live" : "idle"}
        </span>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

const OUTCOME_STYLES: Record<CallSummary["outcome"], string> = {
  succeeded: "outcome-ok",
  partial: "outcome-warn",
  failed: "outcome-bad",
};

function SummaryCard({ summary }: { summary: CallSummary }) {
  const collected = Object.entries(summary.collected ?? {});
  const answers = summary.must_ask_answers ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="section-heading">Call summary</h2>
        <span
          className={`pill ${OUTCOME_STYLES[summary.outcome] ?? "pill-idle"}`}
        >
          {summary.outcome}
        </span>
      </div>

      <p className="mt-3 leading-relaxed">{summary.summary}</p>

      {collected.length > 0 && (
        <dl className="divider-top mt-4">
          {collected.map(([key, value]) => (
            <div key={key} className="divider-row flex gap-3 py-2">
              <dt className="w-2/5 shrink-0 text-fg-muted">{key}</dt>
              <dd className="flex-1 font-medium">
                {value === null || value === "" ? (
                  <span className="italic text-fg-subtle">not captured</span>
                ) : (
                  String(value)
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {answers.length > 0 && (
        <>
          <h3 className="section-heading mt-5">Required questions</h3>
          <ul className="mt-2 space-y-3">
            {answers.map((qa, i) => (
              <li key={i}>
                <div className="text-fg-muted">{qa.question}</div>
                <div className="font-medium">
                  {qa.answer ?? (
                    <span className="italic text-fg-subtle">no answer</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function LiveCaret() {
  return <span aria-hidden="true" className="caret" />;
}

function Bubble({ event }: { event: RelayEvent }) {
  switch (event.type) {
    case "utterance": {
      // Missing is_final means an older agent build that only sends finals.
      const live = event.is_final === false;
      const tone = event.speaker === "agent" ? "bubble-agent" : "bubble-human";
      return (
        <div className={`bubble ${tone} ${live ? "bubble-interim" : ""}`}>
          {event.text}
          {live && <LiveCaret />}
        </div>
      );
    }

    case "nudge":
      return (
        <div className="bubble bubble-nudge">
          <span className="font-semibold not-italic">
            you nudged the agent →
          </span>{" "}
          {event.text}
        </div>
      );

    case "dtmf":
      return (
        <div className="marker-chip font-mono">[pressed {event.digits}]</div>
      );

    case "call_started":
      return <div className="marker">call started</div>;

    case "task_complete":
      return (
        <div className="marker-ok">
          objective complete
          {Object.keys(event.fields).length > 0 &&
            ` - ${Object.entries(event.fields)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(", ")}`}
        </div>
      );

    case "session_end":
      return <div className="marker">call ended - {event.reason}</div>;

    default:
      return null;
  }
}
