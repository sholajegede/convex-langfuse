import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

const observationTypeValidator = v.union(
  v.literal("span"),
  v.literal("generation"),
  v.literal("event"),
  v.literal("embedding"),
  v.literal("agent"),
  v.literal("tool"),
  v.literal("chain"),
  v.literal("retriever"),
  v.literal("guardrail"),
  v.literal("evaluator"),
);

const levelValidator = v.union(
  v.literal("DEBUG"),
  v.literal("DEFAULT"),
  v.literal("WARNING"),
  v.literal("ERROR"),
);

const traceValidator = v.object({
  _id: v.id("traces"),
  _creationTime: v.number(),
  traceId: v.string(),
  name: v.string(),
  userId: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  metadata: v.optional(v.string()),
  release: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const observationValidator = v.object({
  _id: v.id("observations"),
  _creationTime: v.number(),
  observationId: v.string(),
  traceId: v.string(),
  type: observationTypeValidator,
  name: v.string(),
  input: v.optional(v.string()),
  output: v.optional(v.string()),
  model: v.optional(v.string()),
  inputTokens: v.optional(v.number()),
  outputTokens: v.optional(v.number()),
  level: levelValidator,
  statusMessage: v.optional(v.string()),
  metadata: v.optional(v.string()),
  startedAt: v.number(),
  endedAt: v.number(),
  createdAt: v.number(),
});

const scoreValidator = v.object({
  _id: v.id("scores"),
  _creationTime: v.number(),
  scoreId: v.string(),
  traceId: v.string(),
  name: v.string(),
  value: v.number(),
  comment: v.optional(v.string()),
  createdAt: v.number(),
});

// ─── Queries ────────────────────────────────────────────────────────────────

export const getTrace = query({
  args: { traceId: v.string() },
  returns: v.union(v.null(), traceValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("traces")
      .withIndex("by_traceId", (q) => q.eq("traceId", args.traceId))
      .first();
  },
});

export const listTracesByUser = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(traceValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("traces")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listTracesBySession = query({
  args: { sessionId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(traceValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("traces")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listObservations = query({
  args: { traceId: v.string() },
  returns: v.array(observationValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("observations")
      .withIndex("by_traceId", (q) => q.eq("traceId", args.traceId))
      .order("asc")
      .collect();
  },
});

export const listScores = query({
  args: { traceId: v.string() },
  returns: v.array(scoreValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scores")
      .withIndex("by_traceId", (q) => q.eq("traceId", args.traceId))
      .collect();
  },
});

// Every trace, newest first, regardless of which user/session it belongs to.
// Unlike listTracesByUser/listTracesBySession, this doesn't require already
// knowing an identity to look under — useful for a "history" view where the
// caller's own userId/sessionId is only a client-side value that doesn't
// survive a page reload.
export const listRecentTraces = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(traceValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("traces")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getStats = query({
  args: {},
  returns: v.object({ traces: v.number(), observations: v.number(), scores: v.number() }),
  handler: async (ctx) => {
    const [traces, observations, scores] = await Promise.all([
      ctx.db.query("traces").collect(),
      ctx.db.query("observations").collect(),
      ctx.db.query("scores").collect(),
    ]);
    return { traces: traces.length, observations: observations.length, scores: scores.length };
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

export const recordTrace = mutation({
  args: {
    traceId: v.string(),
    name: v.string(),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.string()),
    release: v.optional(v.string()),
  },
  returns: v.id("traces"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("traces")
      .withIndex("by_traceId", (q) => q.eq("traceId", args.traceId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("traces", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const recordObservation = mutation({
  args: {
    observationId: v.string(),
    traceId: v.string(),
    type: observationTypeValidator,
    name: v.string(),
    input: v.optional(v.string()),
    output: v.optional(v.string()),
    model: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    level: levelValidator,
    statusMessage: v.optional(v.string()),
    metadata: v.optional(v.string()),
    startedAt: v.number(),
    endedAt: v.number(),
  },
  returns: v.id("observations"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("observations")
      .withIndex("by_observationId", (q) => q.eq("observationId", args.observationId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("observations", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const recordScore = mutation({
  args: {
    scoreId: v.string(),
    traceId: v.string(),
    name: v.string(),
    value: v.number(),
    comment: v.optional(v.string()),
  },
  returns: v.id("scores"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scores")
      .withIndex("by_scoreId", (q) => q.eq("scoreId", args.scoreId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("scores", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
