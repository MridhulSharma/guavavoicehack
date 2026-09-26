import { EventEmitter } from "node:events";

import type { CallGoal, CallSummary } from "./types";

// Kept on globalThis so dev-mode module reloads don't hand /api/stream and
// /api/ingest two different emitters.
const g = globalThis as typeof globalThis & {
  __relayBus?: EventEmitter;
  __relayGoal?: CallGoal | null;
  __relaySummary?: CallSummary | null;
};

export const bus: EventEmitter = (g.__relayBus ??= new EventEmitter());

// One call at a time for the demo, so the active goal is just a global.
bus.setMaxListeners(0);

export function setCurrentGoal(goal: CallGoal | null): void {
  g.__relayGoal = goal;
}

export function getCurrentGoal(): CallGoal | null {
  return g.__relayGoal ?? null;
}

export function setCurrentSummary(summary: CallSummary | null): void {
  g.__relaySummary = summary;
}

export function getCurrentSummary(): CallSummary | null {
  return g.__relaySummary ?? null;
}
