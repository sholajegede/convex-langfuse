import { describe, expect, test } from "vitest";
import { initConvexTest } from "./setup.test.js";
import { api } from "./_generated/api.js";

describe("traces", () => {
  test("recordTrace inserts then updates the same traceId", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordTrace, {
      traceId: "trace_123",
      name: "chat-completion",
      userId: "user_1",
    });

    let trace = await t.query(api.lib.getTrace, { traceId: "trace_123" });
    expect(trace?.name).toBe("chat-completion");

    await t.mutation(api.lib.recordTrace, {
      traceId: "trace_123",
      name: "chat-completion",
      userId: "user_1",
      sessionId: "session_1",
    });

    trace = await t.query(api.lib.getTrace, { traceId: "trace_123" });
    expect(trace?.sessionId).toBe("session_1");
  });

  test("listTracesByUser returns only that user's traces", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordTrace, {
      traceId: "trace_a",
      name: "a",
      userId: "user_a",
    });
    await t.mutation(api.lib.recordTrace, {
      traceId: "trace_b",
      name: "b",
      userId: "user_b",
    });

    const results = await t.query(api.lib.listTracesByUser, { userId: "user_a" });
    expect(results).toHaveLength(1);
    expect(results[0].traceId).toBe("trace_a");
  });
});

describe("observations", () => {
  test("recordObservation upserts by observationId", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordTrace, { traceId: "trace_1", name: "run" });
    await t.mutation(api.lib.recordObservation, {
      observationId: "span_1",
      traceId: "trace_1",
      type: "generation",
      name: "openai-call",
      model: "gpt-5",
      level: "DEFAULT",
      startedAt: 1000,
      endedAt: 1200,
    });

    const observations = await t.query(api.lib.listObservations, { traceId: "trace_1" });
    expect(observations).toHaveLength(1);
    expect(observations[0].model).toBe("gpt-5");
  });
});

describe("scores", () => {
  test("recordScore attaches a score to a trace", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordTrace, { traceId: "trace_1", name: "run" });
    await t.mutation(api.lib.recordScore, {
      scoreId: "score_1",
      traceId: "trace_1",
      name: "relevance",
      value: 0.9,
    });

    const scores = await t.query(api.lib.listScores, { traceId: "trace_1" });
    expect(scores).toHaveLength(1);
    expect(scores[0].value).toBe(0.9);
  });
});

describe("recent traces", () => {
  test("listRecentTraces returns traces newest first, capped by limit", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordTrace, { traceId: "trace_a", name: "a" });
    await t.mutation(api.lib.recordTrace, { traceId: "trace_b", name: "b" });
    await t.mutation(api.lib.recordTrace, { traceId: "trace_c", name: "c" });

    const all = await t.query(api.lib.listRecentTraces, {});
    expect(all).toHaveLength(3);
    expect(all[0].traceId).toBe("trace_c");

    const limited = await t.query(api.lib.listRecentTraces, { limit: 2 });
    expect(limited).toHaveLength(2);
  });
});

describe("stats", () => {
  test("getStats counts traces, observations, and scores", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordTrace, { traceId: "trace_1", name: "run" });
    await t.mutation(api.lib.recordObservation, {
      observationId: "span_1",
      traceId: "trace_1",
      type: "generation",
      name: "openai-call",
      level: "DEFAULT",
      startedAt: 1000,
      endedAt: 1200,
    });
    await t.mutation(api.lib.recordScore, {
      scoreId: "score_1",
      traceId: "trace_1",
      name: "relevance",
      value: 0.9,
    });

    const stats = await t.query(api.lib.getStats, {});
    expect(stats).toEqual({ traces: 1, observations: 1, scores: 1 });
  });
});
