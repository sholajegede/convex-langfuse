import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Field, TextInput, TextArea, Button } from "./ui";
import { withLog } from "../lib/logStore";

export function LogGeneration(props: {
  userId: string;
  sessionId: string;
  onTrace: (traceId: string) => void;
}) {
  const [model, setModel] = useState("gpt-5");
  const [prompt, setPrompt] = useState("What is Convex?");
  const [completion, setCompletion] = useState(
    "Convex is a reactive backend platform: database, functions, and scheduling in one system.",
  );
  const [inputTokens, setInputTokens] = useState(12);
  const [outputTokens, setOutputTokens] = useState(28);
  const [tags, setTags] = useState("demo, chat");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ traceId: string; observationId: string } | null>(
    null,
  );

  const logChatCompletion = useAction(api.example.logChatCompletion);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const result = await withLog("logGeneration(chat-completion)", () =>
        logChatCompletion({
          userId: props.userId,
          sessionId: props.sessionId,
          model,
          prompt,
          completion,
          inputTokens,
          outputTokens,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      );
      setLastResult(result);
      props.onTrace(result.traceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Log a generation"
      description="Simulates a finished LLM call — the prompt, completion, and token usage are already in hand, exactly like the return value of a real model call."
    >
      <div className="row">
        <Field label="Model">
          <TextInput value={model} onChange={(e) => setModel(e.target.value)} />
        </Field>
        <Field label="Tags (comma-separated)">
          <TextInput value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
      </div>
      <Field label="Prompt">
        <TextArea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </Field>
      <Field label="Completion">
        <TextArea value={completion} onChange={(e) => setCompletion(e.target.value)} />
      </Field>
      <div className="row">
        <Field label="Input tokens">
          <TextInput
            type="number"
            value={inputTokens}
            onChange={(e) => setInputTokens(Number(e.target.value))}
          />
        </Field>
        <Field label="Output tokens">
          <TextInput
            type="number"
            value={outputTokens}
            onChange={(e) => setOutputTokens(Number(e.target.value))}
          />
        </Field>
      </div>
      <Button onClick={submit} disabled={busy}>
        {busy ? "Sending to Langfuse…" : "Log generation"}
      </Button>
      {error && <div className="error-text">{error}</div>}
      {lastResult && (
        <div className="trace-ref" style={{ marginTop: "1rem" }}>
          <span className="label">traceId</span>
          <span className="mono">{lastResult.traceId}</span>
        </div>
      )}
    </Card>
  );
}
