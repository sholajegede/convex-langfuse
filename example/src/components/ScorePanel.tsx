import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Field, TextInput, Button } from "./ui";
import { withLog } from "../lib/logStore";

export function ScorePanel(props: { traceId: string | null }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<"up" | "down" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const rateResponse = useAction(api.example.rateResponse);

  async function submit(value: 0 | 1) {
    if (!props.traceId) return;
    setBusy(value === 1 ? "up" : "down");
    setError(null);
    setOk(null);
    try {
      const result = await withLog(`recordScore(user-rating=${value})`, () =>
        rateResponse({ traceId: props.traceId!, value, comment: comment || undefined }),
      );
      setOk(result.scoreId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card
      title="Rate the response"
      description="Attaches a user-rating score to the trace — the same call you'd make from a thumbs up/down button in a real app."
    >
      {!props.traceId ? (
        <div className="empty">Log a generation first to get a traceId to score.</div>
      ) : (
        <>
          <Field label="Comment (optional)">
            <TextInput value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
          <div className="row" style={{ marginBottom: "0.5rem" }}>
            <Button onClick={() => submit(1)} disabled={busy !== null}>
              {busy === "up" ? "Sending…" : "👍 Good"}
            </Button>
            <Button variant="secondary" onClick={() => submit(0)} disabled={busy !== null}>
              {busy === "down" ? "Sending…" : "👎 Bad"}
            </Button>
          </div>
          {error && <div className="error-text">{error}</div>}
          {ok && (
            <div className="trace-ref">
              <span className="label">scoreId</span>
              <span className="mono">{ok}</span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
