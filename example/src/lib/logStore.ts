export type LogEntry = {
  id: string;
  at: number;
  title: string;
  detail?: string;
  status: "ok" | "err" | "pending";
};

type Listener = (entries: LogEntry[]) => void;

let entries: LogEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(entries);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(entries);
  return () => listeners.delete(listener);
}

export function getEntries(): LogEntry[] {
  return entries;
}

export function pushLog(title: string, status: LogEntry["status"], detail?: string): string {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  entries = [...entries, { id, at: Date.now(), title, detail, status }].slice(-100);
  emit();
  return id;
}

export function updateLog(id: string, status: LogEntry["status"], detail?: string) {
  entries = entries.map((e) => (e.id === id ? { ...e, status, detail: detail ?? e.detail } : e));
  emit();
}

/**
 * Wraps a Convex action call, logging its attempt and outcome to the local
 * console panel. Since this component has no incoming webhooks (Langfuse
 * ingestion is one-way, client -> Langfuse), this is the only "live activity"
 * signal the example app has — every call this app makes to the langfuse
 * client shows up here, success or failure.
 */
export async function withLog<T>(title: string, fn: () => Promise<T>): Promise<T> {
  const id = pushLog(title, "pending");
  try {
    const result = await fn();
    updateLog(id, "ok", summarize(result));
    return result;
  } catch (err) {
    updateLog(id, "err", err instanceof Error ? err.message : String(err));
    throw err;
  }
}

function summarize(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  try {
    const str = JSON.stringify(value);
    return str.length > 200 ? `${str.slice(0, 200)}…` : str;
  } catch {
    return undefined;
  }
}
