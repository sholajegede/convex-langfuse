import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import "./App.css";

export default function App() {
  const [userId] = useState("user_demo");
  const [traceId, setTraceId] = useState<string | null>(null);

  const logChatCompletion = useAction(api.example.logChatCompletion);
  const rateResponse = useAction(api.example.rateResponse);
  const observations = useQuery(
    api.example.listObservations,
    traceId ? { traceId } : "skip",
  );

  async function runExample() {
    const result = await logChatCompletion({
      userId,
      prompt: "What is Convex?",
      completion: "Convex is a reactive backend platform.",
      model: "gpt-5",
      inputTokens: 12,
      outputTokens: 24,
    });
    setTraceId(result.traceId);
  }

  return (
    <main className="app">
      <h1>convex-langfuse</h1>
      <p>Send LLM traces and generations from your Convex app to Langfuse.</p>

      <button onClick={runExample}>Log a sample generation</button>

      {traceId && (
        <>
          <p>
            Trace <code>{traceId}</code>
          </p>
          <button onClick={() => rateResponse({ traceId, value: 1 })}>
            👍 Rate this response
          </button>
          <ul>
            {observations?.map((o) => (
              <li key={o.observationId}>
                {o.type} — {o.name} ({o.model ?? "n/a"})
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
