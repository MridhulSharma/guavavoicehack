import { bus, setCurrentSummary } from "@/app/lib/bus";
import type { RelayEvent } from "@/app/lib/types";

const KNOWN_TYPES = new Set([
  "call_started",
  "utterance",
  "dtmf",
  "task_complete",
  "session_end",
  "summary",
  "nudge",
]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !KNOWN_TYPES.has((body as { type?: string }).type ?? "")
  ) {
    return Response.json({ error: "unknown event type" }, { status: 400 });
  }

  const event = body as RelayEvent;
  if (event.type === "summary") setCurrentSummary(event.summary);

  bus.emit("event", event);
  return Response.json({ ok: true });
}
