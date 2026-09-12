import { useState } from "react";
import "./theme.css";
import { Header, type Tab } from "./components/Header";
import { TopBanner } from "./components/TopBanner";
import { Console } from "./components/Console";
import { Home } from "./components/Home";
import { LogGeneration } from "./components/LogGeneration";
import { ContinueTrace } from "./components/ContinueTrace";
import { ScorePanel } from "./components/ScorePanel";
import { TraceExplorer } from "./components/TraceExplorer";
import { History } from "./components/History";

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [userId] = useState(() => randomId("user"));
  const [sessionId] = useState(() => randomId("session"));
  const [currentTraceId, setCurrentTraceId] = useState<string | null>(null);

  return (
    <div className="shell">
      <div className="main">
        <Header tab={tab} onTab={setTab} />
        <TopBanner />

        {tab === "home" && <Home />}

        {tab === "generation" && (
          <>
            <LogGeneration userId={userId} sessionId={sessionId} onTrace={setCurrentTraceId} />
            <ContinueTrace traceId={currentTraceId} />
            <ScorePanel traceId={currentTraceId} />
          </>
        )}

        {tab === "explorer" && (
          <TraceExplorer currentTraceId={currentTraceId} userId={userId} sessionId={sessionId} />
        )}

        {tab === "history" && <History />}
      </div>
      <Console />
    </div>
  );
}
