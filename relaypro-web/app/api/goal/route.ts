import Anthropic from "@anthropic-ai/sdk";

import { bus, setCurrentGoal, setCurrentSummary } from "@/app/lib/bus";
import type { CallGoal } from "@/app/lib/types";

const AGENT_URL = process.env.RELAY_AGENT_URL ?? "http://localhost:8787";

const PARSE_SYSTEM = `You turn a caller's free-text request into a plan for an AI voice agent that will phone someone on their behalf.

Reply with ONLY a JSON object, no prose and no markdown fence:
{"objective": string, "must_ask": string[], "fields_to_collect": string[], "context": object}

- objective: one clean imperative line naming the goal of the call.
- must_ask: questions the agent MUST ask out loud, e.g. "Is the crust gluten-free?". [] if none.
- fields_to_collect: snake_case data points to capture, e.g. ["price","pickup_time"]. [] if none.
- context: known details the agent should have, e.g. {"item":"large pepperoni","time":"2pm"}. {} if none.
Never invent a phone number and never add a to_number field.`;

/** Free text -> full CallGoal via Haiku. Falls back to objective-only so a call still goes out. */
async function parseObjective(raw: string): Promise<Omit<CallGoal, "to_number">> {
  const fallback = {
    objective: raw,
    must_ask: [],
    context: {},
    fields_to_collect: [],
  };

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: PARSE_SYSTEM,
      messages: [{ role: "user", content: raw }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .replace(/^```(?:json)?\s*|\s*```$/g, "");

    const parsed = JSON.parse(text) as Record<string, unknown>;
    const strings = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

    return {
      objective: typeof parsed.objective === "string" ? parsed.objective : raw,
      must_ask: strings(parsed.must_ask),
      fields_to_collect: strings(parsed.fields_to_collect),
      context:
        parsed.context && typeof parsed.context === "object" && !Array.isArray(parsed.context)
          ? (parsed.context as Record<string, unknown>)
          : {},
    };
  } catch (e) {
    console.warn("[goal] intent parse failed, using raw objective:", String(e));
    return fallback;
  }
}

export async function POST(request: Request) {
  let body: { to_number?: unknown; objective?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const to_number = typeof body.to_number === "string" ? body.to_number.trim() : "";
  const objective = typeof body.objective === "string" ? body.objective.trim() : "";

  if (!to_number || !objective) {
    return Response.json(
      { error: "to_number and objective are required" },
      { status: 400 },
    );
  }

  // to_number always comes from the form field, never from the model.
  const goal: CallGoal = { to_number, ...(await parseObjective(objective)) };
  console.log("[goal] parsed CallGoal:", JSON.stringify(goal));

  try {
    const res = await fetch(`${AGENT_URL}/call`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(goal),
    });
    if (!res.ok) {
      const detail = await res.text();
      return Response.json(
        { error: `agent rejected the call: ${detail}` },
        { status: 502 },
      );
    }
  } catch (e) {
    return Response.json(
      { error: `agent unreachable at ${AGENT_URL}: ${String(e)}` },
      { status: 502 },
    );
  }

  // Only becomes the live goal once the sidecar has accepted the call.
  setCurrentGoal(goal);
  setCurrentSummary(null);
  bus.emit("event", { type: "goal", goal });

  return Response.json({ ok: true, goal });
}
