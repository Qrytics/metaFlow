import { useState } from "react";

type StageState = "idle" | "running" | "done" | "error";

const STAGES = ["transcribe", "draft", "checks", "critic", "diagram"] as const;

export default function PipelinePage() {
  const [title, setTitle] = useState("Login retry fix");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Record<string, StageState>>({});
  const [result, setResult] = useState<string>("");

  async function run() {
    const order: Record<string, StageState> = {};
    for (const s of STAGES) order[s] = "running";
    setStage({ ...order });
    setResult("");
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("mode", "audio");
      if (file) form.append("file", file);
      const res = await fetch("/pipeline/run", { method: "POST", body: form });
      if (!res.ok) throw new Error(`backend ${res.status}`);
      const json = await res.json();
      const done: Record<string, StageState> = {};
      for (const s of STAGES) done[s] = "done";
      setStage(done);
      setResult(JSON.stringify(json, null, 2));
    } catch (e) {
      setStage({ error: "error" });
      setResult(String(e));
    }
  }

  return (
    <main className="rack">
      <h1>metaFlow</h1>
      <p className="sub">standup audio in, verified PR out</p>
      <label className="row">
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="row">
        Standup audio
        <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <button onClick={run}>RUN PIPELINE</button>
      <ol className="ladder">
        {STAGES.map((s) => (
          <li key={s} data-state={stage[s] ?? "idle"}>
            <span>{s}</span>
            <em>{stage[s] ?? "idle"}</em>
          </li>
        ))}
      </ol>
      {result && <pre className="out">{result}</pre>}
    </main>
  );
}
