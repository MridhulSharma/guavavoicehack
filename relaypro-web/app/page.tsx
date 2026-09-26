"use client";

import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTo(0, el.scrollHeight);
  }, [events]);

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

  return (
    <div className="flex h-screen flex-col bg-white text-slate-900">
      {/* TOP - goal input */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight">RelayPro</span>
            <span className="text-xs text-slate-500">
              {isCalling ? "call live" : "idle"}
            </span>
          </div>
          <label className="flex flex-col text-xs font-medium text-slate-600">
            Phone number
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+15551234567"
              className="mt-1 w-44 rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </label>
          <label className="flex min-w-64 flex-1 flex-col text-xs font-medium text-slate-600">
            What should the agent accomplish?
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canStart) startCall();
              }}
              placeholder="Confirm you can hear me and ask what the weather is"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </label>
          <button
            onClick={startCall}
            disabled={!canStart}
            className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {starting ? "Starting..." : "Start"}
          </button>
        </div>
        {error && (
          <p className="mx-auto mt-2 max-w-6xl text-xs text-red-600">{error}</p>
        )}
      </header>

      {/* CENTER - transcript + sidebar */}
      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[7fr_3fr]">
        <div
          ref={transcriptRef}
          className="flex flex-col gap-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          {events.length === 0 && (
            <p className="m-auto text-sm text-slate-400">
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

        <aside className="overflow-y-auto rounded-lg border border-slate-200 p-4">
          {summary ? (
            <SummaryCard summary={summary} />
          ) : currentGoal ? (
            <div className="space-y-3 text-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Call goal
              </h2>
              <Field label="Calling">{currentGoal.to_number}</Field>
              <Field label="Objective">{currentGoal.objective}</Field>
              {(currentGoal.must_ask ?? []).length > 0 && (
                <Field label="Must ask">
                  <ul className="list-disc space-y-1 pl-4">
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
            <p className="text-sm text-slate-400">
              No call yet. Enter a number and an objective above.
            </p>
          )}
        </aside>
      </main>

      {/* BOTTOM - nudge bar */}
      <footer className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-end gap-3">
          <label className="flex flex-1 flex-col text-xs font-medium text-slate-600">
            Nudge the agent
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
              className="mt-1 w-full resize-none rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>
          <button
            onClick={sendNudge}
            disabled={!isCalling || nudgeText.trim().length === 0}
            className="rounded bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Nudge
          </button>
        </div>
      </footer>
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
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-0.5 text-slate-800">{children}</div>
    </div>
  );
}

const OUTCOME_STYLES: Record<CallSummary["outcome"], string> = {
  succeeded: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
};

function SummaryCard({ summary }: { summary: CallSummary }) {
  const collected = Object.entries(summary.collected ?? {});
  const answers = summary.must_ask_answers ?? [];

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Call summary
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
            OUTCOME_STYLES[summary.outcome] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {summary.outcome}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-800">{summary.summary}</p>

      {collected.length > 0 && (
        <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          {collected.map(([key, value]) => (
            <div key={key} className="flex gap-3 py-1.5 text-sm">
              <dt className="w-2/5 shrink-0 text-slate-500">{key}</dt>
              <dd className="flex-1 font-medium text-slate-900">
                {value === null || value === "" ? (
                  <span className="font-normal italic text-slate-400">not captured</span>
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
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Required questions
          </h3>
          <ul className="mt-2 space-y-2 text-sm">
            {answers.map((qa, i) => (
              <li key={i}>
                <div className="text-slate-500">{qa.question}</div>
                <div className="font-medium text-slate-900">
                  {qa.answer ?? (
                    <span className="font-normal italic text-slate-400">no answer</span>
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

function LiveCaret({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`ml-1 inline-block h-3.5 w-[2px] animate-pulse align-middle ${className}`}
    />
  );
}

function Bubble({ event }: { event: RelayEvent }) {
  switch (event.type) {
    case "utterance": {
      // Missing is_final means an older agent build that only sends finals.
      const live = event.is_final === false;
      return event.speaker === "agent" ? (
        <div
          className={`max-w-[75%] self-end rounded-2xl rounded-br-sm bg-blue-500 px-4 py-2 text-sm text-white ${
            live ? "opacity-70" : ""
          }`}
        >
          {event.text}
          {live && <LiveCaret className="bg-white/80" />}
        </div>
      ) : (
        <div
          className={`max-w-[75%] self-start rounded-2xl rounded-bl-sm bg-gray-200 px-4 py-2 text-sm text-black ${
            live ? "opacity-70" : ""
          }`}
        >
          {event.text}
          {live && <LiveCaret className="bg-slate-600" />}
        </div>
      );
    }

    case "nudge":
      return (
        <div className="max-w-[75%] self-end rounded-2xl border border-yellow-300 bg-yellow-100 px-4 py-2 text-sm italic text-yellow-900">
          <span className="font-medium not-italic">you nudged the agent →</span>{" "}
          {event.text}
        </div>
      );

    case "dtmf":
      return (
        <div className="self-center rounded-full bg-slate-200 px-3 py-1 font-mono text-xs text-slate-600">
          [pressed {event.digits}]
        </div>
      );

    case "call_started":
      return (
        <div className="self-center text-xs uppercase tracking-wide text-slate-400">
          call started
        </div>
      );

    case "task_complete":
      return (
        <div className="self-center rounded bg-green-50 px-3 py-1 text-xs text-green-700">
          objective complete
          {Object.keys(event.fields).length > 0 &&
            ` - ${Object.entries(event.fields)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(", ")}`}
        </div>
      );

    case "session_end":
      return (
        <div className="self-center text-xs uppercase tracking-wide text-slate-400">
          call ended - {event.reason}
        </div>
      );

    default:
      return null;
  }
}
