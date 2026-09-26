import { bus, getCurrentGoal, getCurrentSummary } from "@/app/lib/bus";
import type { RelayEvent } from "@/app/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      const onEvent = (event: RelayEvent) => send(event);
      bus.on("event", onEvent);

      // Open the stream immediately, then catch this tab up on the live goal.
      controller.enqueue(encoder.encode(": connected\n\n"));
      const goal = getCurrentGoal();
      if (goal) send({ type: "goal", goal });
      const summary = getCurrentSummary();
      if (summary) send({ type: "summary", summary });

      // Keeps proxies and idle connections from dropping the stream.
      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          closed = true;
        }
      }, 15_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(keepAlive);
        bus.off("event", onEvent);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
