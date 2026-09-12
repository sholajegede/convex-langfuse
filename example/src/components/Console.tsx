import { useEffect, useRef, useSyncExternalStore } from "react";
import { subscribe, getEntries } from "../lib/logStore";
import { formatTime } from "../lib/format";

export function Console() {
  const entries = useSyncExternalStore(subscribe, getEntries);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <aside className="console">
      <div className="console-header">
        <h3>Activity</h3>
        <p>
          Every call this app makes into the Langfuse client, logged here. This component has no
          incoming webhooks — Langfuse ingestion is one-way — so this is the closest thing to a
          live feed.
        </p>
      </div>
      <div className="console-log" ref={logRef}>
        {entries.length === 0 && <div className="empty">Nothing yet — try an action.</div>}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`log-entry ${entry.status === "err" ? "err" : entry.status === "ok" ? "ok" : ""}`}
          >
            <div className="log-top">
              <span>{formatTime(entry.at)}</span>
              <span>{entry.status === "pending" ? "…" : entry.status === "ok" ? "ok" : "error"}</span>
            </div>
            <div className="log-title">{entry.title}</div>
            {entry.detail && <div className="log-detail">{entry.detail}</div>}
          </div>
        ))}
      </div>
    </aside>
  );
}
