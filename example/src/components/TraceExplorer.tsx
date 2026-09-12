import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Field, TextInput, Button, Badge } from "./ui";

export function TraceExplorer(props: { currentTraceId: string | null; userId: string; sessionId: string }) {
  const [traceId, setTraceId] = useState(props.currentTraceId ?? "");
  const [userIdQuery, setUserIdQuery] = useState(props.userId);
  const [sessionIdQuery, setSessionIdQuery] = useState(props.sessionId);

  const trace = useQuery(api.example.getTrace, traceId ? { traceId } : "skip");
  const observations = useQuery(api.example.listObservations, traceId ? { traceId } : "skip");
  const scores = useQuery(api.example.listScores, traceId ? { traceId } : "skip");
  const tracesByUser = useQuery(
    api.example.listTracesByUser,
    userIdQuery ? { userId: userIdQuery } : "skip",
  );
  const tracesBySession = useQuery(
    api.example.listTracesBySession,
    sessionIdQuery ? { sessionId: sessionIdQuery } : "skip",
  );

  return (
    <>
      <Card
        title="Look up a trace"
        description="Reads straight from Convex — this updates live as new observations and scores come in, no polling."
      >
        <div className="row">
          <Field label="Trace ID">
            <TextInput value={traceId} onChange={(e) => setTraceId(e.target.value)} placeholder="trace_..." />
          </Field>
          {props.currentTraceId && (
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "0.85rem" }}>
              <Button variant="secondary" onClick={() => setTraceId(props.currentTraceId!)}>
                Use latest
              </Button>
            </div>
          )}
        </div>

        {!traceId && <div className="empty">Enter a trace ID to see its observations and scores.</div>}

        {traceId && trace === null && <div className="empty">No trace found for that ID.</div>}

        {traceId && trace && (
          <>
            <p className="card-desc" style={{ marginBottom: "0.5rem" }}>
              <strong>{trace.name}</strong>
              {trace.userId && (
                <>
                  {" "}
                  · user <span className="mono">{trace.userId}</span>
                </>
              )}
              {trace.sessionId && (
                <>
                  {" "}
                  · session <span className="mono">{trace.sessionId}</span>
                </>
              )}
            </p>

            <ul className="obs-list" style={{ marginBottom: "1rem" }}>
              {observations?.map((o) => (
                <li key={o.observationId} className="obs-item">
                  <div className="obs-top">
                    <span>
                      <Badge>{o.type}</Badge> {o.name}
                    </span>
                    <span className="mono">{o.model ?? ""}</span>
                  </div>
                  {(o.input || o.output) && (
                    <div className="obs-io">
                      {o.input && <div>in: {truncate(o.input)}</div>}
                      {o.output && <div>out: {truncate(o.output)}</div>}
                    </div>
                  )}
                </li>
              ))}
              {observations && observations.length === 0 && (
                <li className="empty">No observations yet.</li>
              )}
            </ul>

            <ul className="score-list">
              {scores?.map((s) => (
                <li key={s.scoreId} className="obs-item">
                  <span className="mono">{s.name}</span>: {s.value}
                  {s.comment && <span className="obs-io"> — {s.comment}</span>}
                </li>
              ))}
              {scores && scores.length === 0 && <li className="empty">No scores yet.</li>}
            </ul>
          </>
        )}
      </Card>

      <Card title="Browse by user or session">
        <div className="row">
          <Field label="User ID">
            <TextInput value={userIdQuery} onChange={(e) => setUserIdQuery(e.target.value)} />
          </Field>
          <Field label="Session ID">
            <TextInput value={sessionIdQuery} onChange={(e) => setSessionIdQuery(e.target.value)} />
          </Field>
        </div>
        <p className="card-desc">Traces for this user:</p>
        <TraceList traces={tracesByUser} onPick={setTraceId} />
        <p className="card-desc" style={{ marginTop: "0.75rem" }}>
          Traces for this session:
        </p>
        <TraceList traces={tracesBySession} onPick={setTraceId} />
      </Card>
    </>
  );
}

function TraceList(props: {
  traces: Array<{ traceId: string; name: string; _creationTime: number }> | undefined;
  onPick: (traceId: string) => void;
}) {
  if (!props.traces) return null;
  if (props.traces.length === 0) return <div className="empty">None yet.</div>;
  return (
    <ul className="obs-list">
      {props.traces.map((t) => (
        <li key={t.traceId} className="obs-item">
          <button
            className="tab"
            style={{ padding: 0, textAlign: "left" }}
            onClick={() => props.onPick(t.traceId)}
          >
            <span className="mono">{t.traceId}</span> — {t.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function truncate(text: string): string {
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}
