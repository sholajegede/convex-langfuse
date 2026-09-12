import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Corners } from "./ui";

export type Tab = "home" | "generation" | "explorer" | "history";

export function Header(props: { tab: Tab; onTab: (tab: Tab) => void }) {
  const stats = useQuery(api.example.getStats);

  return (
    <div className="hero-frame">
      <Corners />

      <div className="hero-stats">
        <span>
          <strong>{stats?.traces ?? 0}</strong> traces logged
        </span>
        <span className="dot">·</span>
        <span>
          <strong>{stats?.observations ?? 0}</strong> observations
        </span>
        <span className="dot">·</span>
        <span>
          <strong>{stats?.scores ?? 0}</strong> scores
        </span>
      </div>

      <div className="hero-divider" />

      <div className="hero-main">
        <div className="wordmark">
          <span className="logo-mark">λ</span> convex-langfuse
        </div>
        <h1 className="hero-title">
          LLM <span className="hl">OBSERVABILITY</span>
          <br />
          WIRED INTO CONVEX
        </h1>
        <p className="hero-sub">
          Send traces, generations, and scores to Langfuse over OpenTelemetry — with a reactive
          local copy in Convex.
        </p>
      </div>

      <div className="hero-stripe" />
      <div className="hero-divider" />

      <div className="tabs">
        <button
          className={`tab${props.tab === "home" ? " active" : ""}`}
          onClick={() => props.onTab("home")}
        >
          Overview
        </button>
        <button
          className={`tab${props.tab === "generation" ? " active" : ""}`}
          onClick={() => props.onTab("generation")}
        >
          Log a generation
        </button>
        <button
          className={`tab${props.tab === "explorer" ? " active" : ""}`}
          onClick={() => props.onTab("explorer")}
        >
          Trace explorer
        </button>
        <button
          className={`tab${props.tab === "history" ? " active" : ""}`}
          onClick={() => props.onTab("history")}
        >
          History
        </button>
      </div>
    </div>
  );
}
