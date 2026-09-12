import { Card } from "./ui";

export function Home() {
  return (
    <>
      <Card title="What this example shows">
        <p className="card-desc" style={{ marginBottom: "0.75rem" }}>
          Convex actions are short, stateless request/response functions — there's no long-lived
          process to hold an OpenTelemetry span open for the duration of an LLM call. This
          component logs a call <span className="mark">once it's already finished</span>: you hand it the input, output, model,
          and token counts, and it exports one completed span to Langfuse over OTLP/HTTP while
          mirroring the same data into Convex tables you can query reactively.
        </p>
        <p className="card-desc" style={{ marginBottom: "0.75rem" }}>
          Use the <strong>Log a generation</strong> tab to simulate a chat completion. That
          returns a <span className="mono">traceId</span> — use it to add a follow-up step
          (a non-LLM span) or attach a rating score to the same trace, then look it up in the{" "}
          <strong>Trace explorer</strong> tab or in the Langfuse UI itself.
        </p>
      </Card>
      <Card title="Good to know">
        <ul
          style={{
            margin: 0,
            paddingLeft: "1.1rem",
            color: "var(--text-dim)",
            fontSize: "0.85rem",
            lineHeight: 1.6,
          }}
        >
          <li>No live/streaming spans — each call exports one already-finished observation.</li>
          <li>
            <span className="mono">userId</span>, <span className="mono">sessionId</span>, and{" "}
            <span className="mono">tags</span> are trace-level: set them on the first call for a
            trace and they apply to every observation logged under it.
          </li>
          <li>
            No SDK dependency — this component talks to Langfuse's OTLP and Scores REST endpoints
            directly over <span className="mono">fetch</span>.
          </li>
        </ul>
      </Card>
    </>
  );
}
