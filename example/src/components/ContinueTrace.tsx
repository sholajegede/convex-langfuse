import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Field, TextInput, Button } from "./ui";
import { withLog } from "../lib/logStore";

export function ContinueTrace(props: { traceId: string | null }) {
  const [name, setName] = useState("vector-search");
  const [input, setInput] = useState("convex components");
  const [output, setOutput] = useState("3 matches");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const logStep = useAction(api.example.logStep);

  async function submit() {
    if (!props.traceId) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const result = await withLog(`logSpan(${name})`, () =>
        logStep({ traceId: props.traceId!, name, input, output }),
      );
      setOk(result.observationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Add a step to the trace"
      description="Non-LLM work — a retrieval, a tool call, a guardrail check — grouped under the same trace as the generation above."
    >
      {!props.traceId ? (
        <div className="empty">Log a generation first to get a traceId to attach this to.</div>
      ) : (
        <>
          <div className="trace-ref">
            <span className="label">Adding to traceId</span>
            <span className="mono">{props.traceId}</span>
          </div>
          <Field label="Step name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="row">
            <Field label="Input">
              <TextInput value={input} onChange={(e) => setInput(e.target.value)} />
            </Field>
            <Field label="Output">
              <TextInput value={output} onChange={(e) => setOutput(e.target.value)} />
            </Field>
          </div>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Sending…" : "Log step"}
          </Button>
          {error && <div className="error-text">{error}</div>}
          {ok && (
            <div className="trace-ref" style={{ marginTop: "1rem" }}>
              <span className="label">observationId</span>
              <span className="mono">{ok}</span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
