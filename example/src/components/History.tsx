import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Badge, Button } from "./ui";
import { formatTime } from "../lib/format";
import { withLog } from "../lib/logStore";

function safeParse(value: string): string {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "string" ? parsed : JSON.stringify(parsed);
  } catch {
    return value;
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function History() {
  const traces = useQuery(api.example.listRecentTraces, { limit: 30 });

  return (
    <Card
      title="History"
      description="Every trace recorded in this Convex deployment, newest first — survives a page reload, unlike the Activity console or the trace explorer's user/session search, both of which key off a browser-local identity. Click a trace to expand it, or replay one to recreate it live."
    >
      {traces === undefined && <div className="empty">Loading…</div>}
      {traces && traces.length === 0 && (
        <div className="empty">No traces yet — log a generation to get started.</div>
      )}
      {traces && traces.length > 0 && (
        <ul className="obs-list">
          {traces.map((trace) => (
            <TraceRow
              key={trace.traceId}
              traceId={trace.traceId}
              name={trace.name}
              userId={trace.userId}
              sessionId={trace.sessionId}
              createdAt={trace.createdAt}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function TraceRow(props: {
  traceId: string;
  name: string;
  userId?: string;
  sessionId?: string;
  createdAt: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replaying, setReplaying] = useState(false);

  const observations = useQuery(api.example.listObservations, { traceId: props.traceId });
  const scores = useQuery(api.example.listScores, { traceId: props.traceId });

  const logChatCompletion = useAction(api.example.logChatCompletion);
  const logStep = useAction(api.example.logStep);
  const rateResponse = useAction(api.example.rateResponse);

  const generationCount = observations?.filter((o) => o.type === "generation").length ?? 0;
  const stepCount = (observations?.length ?? 0) - generationCount;
  const scoreCount = scores?.length ?? 0;

  async function replay() {
    if (!observations) return;
    setReplaying(true);
    try {
      const generation = observations.find((o) => o.type === "generation");
      let newTraceId: string | null = null;

      if (generation) {
        const result = await withLog(`replay: ${props.name}`, () =>
          logChatCompletion({
            userId: props.userId ?? "user_replay",
            sessionId: props.sessionId,
            model: generation.model ?? "gpt-5",
            prompt: generation.input ? safeParse(generation.input) : "",
            completion: generation.output ? safeParse(generation.output) : "",
            inputTokens: generation.inputTokens ?? 0,
            outputTokens: generation.outputTokens ?? 0,
          }),
        );
        newTraceId = result.traceId;
      }

      const steps = observations.filter((o) => o.type !== "generation");
      for (const step of steps) {
        if (!newTraceId) break;
        await withLog(`replay: ${step.name}`, () =>
          logStep({
            traceId: newTraceId!,
            name: step.name,
            input: step.input ? safeParse(step.input) : undefined,
            output: step.output ? safeParse(step.output) : undefined,
          }),
        );
      }

      for (const score of scores ?? []) {
        if (!newTraceId) break;
        await withLog(`replay: ${score.name}`, () =>
          rateResponse({ traceId: newTraceId!, value: score.value, comment: score.comment }),
        );
      }
    } finally {
      setReplaying(false);
    }
  }

  return (
    <li className="obs-item">
      <div
        className="obs-top"
        style={{ cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>
          <span style={{ color: "var(--text-dim)", marginRight: "0.35rem" }}>
            {expanded ? "▾" : "▸"}
          </span>
          <strong>{props.name}</strong>{" "}
          <span className="mono" style={{ color: "var(--text-dim)" }}>
            {props.traceId.slice(0, 12)}…
          </span>
        </span>
        <span className="mono">{formatTime(props.createdAt)}</span>
      </div>

      <div className="obs-io" style={{ marginBottom: "0.4rem" }}>
        {generationCount} generation{generationCount === 1 ? "" : "s"} · {stepCount} step
        {stepCount === 1 ? "" : "s"} · {scoreCount} score{scoreCount === 1 ? "" : "s"}
        {props.userId && <> · user {props.userId}</>}
      </div>

      {expanded && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.6rem" }}>
            {observations?.map((o) => (
              <div key={o.observationId} className="obs-io">
                <Badge>{o.type}</Badge> {o.name}
                {o.model && <> · {o.model}</>}
                {(o.input || o.output) && (
                  <div style={{ marginTop: "0.2rem" }}>
                    {o.input && <div>in: {truncate(safeParse(o.input), 140)}</div>}
                    {o.output && <div>out: {truncate(safeParse(o.output), 140)}</div>}
                  </div>
                )}
              </div>
            ))}
            {scores?.map((s) => (
              <div key={s.scoreId} className="obs-io">
                <Badge tone={s.value > 0 ? "good" : "bad"}>score</Badge> {s.name}: {s.value}
                {s.comment && <> — {s.comment}</>}
              </div>
            ))}
          </div>
          <Button variant="secondary" onClick={replay} disabled={replaying || !generationCount}>
            {replaying ? "Replaying…" : "🔁 Replay this"}
          </Button>
          <span className="obs-io" style={{ marginLeft: "0.6rem" }}>
            Recreates this scenario as a brand-new trace, live.
          </span>
        </>
      )}
    </li>
  );
}
