import { useState } from "react";
import type { View, RunDetail } from "../types";
import { useLoad, ErrorBox, StatusPill, Chevron, DiffView, Skeleton, copyText, fmtTime, relTime } from "./shared";

const SPK_COLORS = ["av-blue", "av-teal", "av-green", "av-amber", "av-rose", "av-slate"];

function speakerClass(speaker: string): string {
  let hash = 0;
  for (const ch of speaker) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return SPK_COLORS[hash % SPK_COLORS.length];
}

export default function RunDetailPage({ id, go }: { id: string; go: (v: View) => void }) {
  const { data, error, reload } = useLoad<RunDetail>(`/runs/${encodeURIComponent(id)}`);
  const [copied, setCopied] = useState(false);

  async function copyId() {
    if (data && (await copyText(data.id))) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  if (error) {
    return (
      <div>
        <h1>Run</h1>
        <ErrorBox error={error} retry={reload} />
        <button className="btn-secondary" onClick={() => go({ name: "runs" })}>
          Back to runs
        </button>
      </div>
    );
  }
  if (!data) return <div><h1>Run</h1><Skeleton lines={6} /></div>;

  const r = data.result;
  const totalMs = r ? Object.values(r.telemetry_ms).reduce((a, b) => a + b, 0) : 0;
  const maxMs = Math.max(1, ...data.events.map((e) => e.ms));

  return (
    <div>
      <button className="link-btn back" onClick={() => go({ name: "runs" })}>
        <Chevron dir="left" /> All runs
      </button>
      <div className="run-head">
        <h1>{data.title}</h1>
        <StatusPill status={data.status} />
      </div>
      <p className="lede">
        {data.mode} · started {relTime(data.created_at)} ({fmtTime(data.created_at)})
        {r ? ` · finished in ${Math.round(totalMs)} ms` : ""}
      </p>
      <p className="run-id-line">
        <code className="num">{data.id}</code>{" "}
        <button className="link-btn" onClick={copyId}>
          {copied ? "Copied" : "Copy run ID"}
        </button>
      </p>

      <div className="detail-grid">
        <section>
          <h2>Stage timeline</h2>
          <div className="card rail">
            {data.events.map((e, i) => (
              <div key={i} className="rail-item">
                <span className={`rail-dot dot-${e.state}`} />
                <div className="rail-body">
                  <div className="rail-top">
                    <strong>{e.stage}</strong>
                    <span className="rail-state">{e.state.replace("_", " ")}</span>
                    {e.ms > 0 && <span className="num">{Math.round(e.ms)} ms</span>}
                  </div>
                  {e.state === "done" && e.ms > 0 && (
                    <div className="dur" aria-hidden="true">
                      <i style={{ width: `${Math.max(3, (e.ms / maxMs) * 100)}%` }} />
                    </div>
                  )}
                  {e.detail && <p className="muted rail-detail">{e.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          {!r && (
            <div className="error-box">
              <strong>This run errored before producing an artifact.</strong> The timeline shows
              exactly which stage failed and why. Fix that stage, then start a new run.
            </div>
          )}

          {r && (
            <>
              <h2>Transcript</h2>
              <div className="card turns">
                {r.transcript.turns.map((t, i) => (
                  <div key={i} className="turn">
                    <div className="turn-head">
                      <span className={`spk ${speakerClass(t.speaker)}`}>{t.speaker}</span>
                      <span className="muted num">{t.start_ms}–{t.end_ms} ms</span>
                    </div>
                    <p>{t.text}</p>
                  </div>
                ))}
                {!r.transcript.turns.length && <p className="muted">No turns (PR URL mode).</p>}
              </div>

              <h2>Checks</h2>
              <div className="card checks">
                {r.checks.results.map((c) => (
                  <div key={c.name} className={`check-row ${c.passed ? "pass" : "fail"}`}>
                    <span className={`dot dot-${c.passed ? "done" : "failed"}`} />
                    <div>
                      <strong>{c.name}</strong>
                      <span className="muted"> {c.detail}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h2>Critic report</h2>
              <div className="card">
                <p className="critic-verdict">
                  Verdict <StatusPill status={r.critic.verdict === "pass" ? "done" : "needs_fix"} />
                  <span className="muted"> · {r.critic.retries_used} {r.critic.retries_used === 1 ? "retry" : "retries"} used</span>
                </p>
                {r.critic.violations.map((v, i) => (
                  <p key={i} className="violation">{v}</p>
                ))}
                {!r.critic.violations.length && <p className="muted">No violations.</p>}
                {r.critic.fix_instructions && (
                  <p className="fix">Repair list: {r.critic.fix_instructions}</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {r && (
        <>
          <h2>Draft diff</h2>
          <div className="card">
            <p>{r.draft.summary}</p>
            <p className="muted">
              Files: {r.draft.files_changed.join(", ") || "none listed"} · Tests:{" "}
              {r.draft.tests_added.join(", ") || "none listed"}
            </p>
            <DiffView diff={r.draft.unified_diff} />
          </div>

          <h2>Change diagram</h2>
          <div className="card diagram">
            {r.diagram.fallback_svg ? (
              <div dangerouslySetInnerHTML={{ __html: r.diagram.fallback_svg }} />
            ) : (
              <p className="muted">No diagram for this run.</p>
            )}
            <p className="muted">{r.diagram.prompt_used}</p>
          </div>

          <h2>Telemetry</h2>
          <div className="card tele">
            {Object.entries(r.telemetry_ms).map(([k, v]) => (
              <div key={k} className="tele-row">
                <span>{k.replace("_ms", "")}</span>
                <span className="num">{Math.round(v)} ms</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
