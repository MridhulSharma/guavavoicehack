import { bus } from "@/app/lib/bus";

const AGENT_URL = process.env.RELAY_AGENT_URL ?? "http://localhost:8787";

export async function POST(request: Request) {
  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${AGENT_URL}/say`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: `agent rejected the nudge: ${detail}` },
        { status: 502 },
      );
    }
  } catch (e) {
    return Response.json(
      { error: `agent unreachable at ${AGENT_URL}: ${String(e)}` },
      { status: 502 },
    );
  }

  // Shows in the transcript as soon as the sidecar takes it, well before the
  // agent actually works it into what it is saying.
  bus.emit("event", { type: "nudge", text });

  return Response.json({ ok: true });
}
