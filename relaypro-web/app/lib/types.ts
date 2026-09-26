// Mirrors relaypro/schema.py CallGoal exactly.
export type CallGoal = {
  to_number: string;
  objective: string;
  must_ask?: string[];
  context?: Record<string, unknown>;
  fields_to_collect?: string[];
};

// Mirrors the payloads relaypro/agent.py posts through relaypro/ingest.py.
export type CallStartedEvent = { type: "call_started" };
export type UtteranceEvent = {
  type: "utterance";
  speaker: "human" | "agent";
  text: string;
  // Interim transcripts arrive repeatedly under one utterance_id; each revises
  // the last. Optional because older agent builds omit them.
  utterance_id?: string;
  is_final?: boolean;
};
export type DtmfEvent = { type: "dtmf"; digits: string };
export type TaskCompleteEvent = {
  type: "task_complete";
  fields: Record<string, unknown>;
};
export type SessionEndEvent = { type: "session_end"; reason: string };

// Emitted by /api/say, not by the Python agent.
export type NudgeEvent = { type: "nudge"; text: string };

// Emitted by /api/goal, and replayed to each new /api/stream subscriber.
export type GoalEvent = { type: "goal"; goal: CallGoal };

export type SummaryEvent = { type: "summary"; summary: CallSummary };

export type RelayEvent =
  | CallStartedEvent
  | UtteranceEvent
  | DtmfEvent
  | TaskCompleteEvent
  | SessionEndEvent
  | NudgeEvent
  | GoalEvent
  | SummaryEvent;

// Produced by the agent at session end from the full transcript.
export type CallSummary = {
  outcome: "succeeded" | "failed" | "partial";
  summary: string;
  collected: Record<string, unknown>;
  must_ask_answers: { question: string; answer: string | null }[];
};
