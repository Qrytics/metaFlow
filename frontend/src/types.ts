export interface SpeakerTurn {
  speaker: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface DraftDiff {
  summary: string;
  files_changed: string[];
  unified_diff: string;
  tests_added: string[];
}

export interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface CriticReport {
  verdict: "pass" | "needs_fix";
  violations: string[];
  fix_instructions: string;
  retries_used: number;
}

export interface StageEvent {
  stage: string;
  state: string;
  detail: string;
  ms: number;
  at: number;
}

export interface TeamSummary {
  id: string;
  name: string;
  created_at: number;
  member_count: number;
  sample_members: string[];
}

export interface Member {
  id: string;
  team_id: string;
  name: string;
  role: string;
  created_at: number;
}

export interface RunSummary {
  id: string;
  team_id: string | null;
  title: string;
  mode: string;
  status: string;
  created_at: number;
  updated_at: number;
}

export interface TeamDetail extends TeamSummary {
  members: Member[];
  recent_runs: RunSummary[];
}

export interface RunDetail extends RunSummary {
  events: StageEvent[];
  result: {
    transcript: { turns: SpeakerTurn[]; language: string };
    draft: DraftDiff;
    checks: { passed: boolean; results: CheckResult[] };
    critic: CriticReport;
    diagram: { image_url: string; prompt_used: string; fallback_svg: string };
    telemetry_ms: Record<string, number>;
  } | null;
}

export interface SetupCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export type View =
  | { name: "overview" }
  | { name: "new" }
  | { name: "runs" }
  | { name: "run"; id: string }
  | { name: "teams" }
  | { name: "team"; id: string }
  | { name: "diag" };
