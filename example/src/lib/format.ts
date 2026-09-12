export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour12: false });
}
