import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  traces: defineTable({
    traceId: v.string(),
    name: v.string(),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.string()),
    release: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_traceId", ["traceId"])
    .index("by_userId", ["userId"])
    .index("by_sessionId", ["sessionId"]),

  observations: defineTable({
    observationId: v.string(),
    traceId: v.string(),
    type: v.union(
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
    ),
    name: v.string(),
    input: v.optional(v.string()),
    output: v.optional(v.string()),
    model: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    level: v.union(
      v.literal("DEBUG"),
      v.literal("DEFAULT"),
      v.literal("WARNING"),
      v.literal("ERROR"),
    ),
    statusMessage: v.optional(v.string()),
    metadata: v.optional(v.string()),
    startedAt: v.number(),
    endedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_observationId", ["observationId"])
    .index("by_traceId", ["traceId"]),

  scores: defineTable({
    scoreId: v.string(),
    traceId: v.string(),
    name: v.string(),
    value: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_scoreId", ["scoreId"])
    .index("by_traceId", ["traceId"]),
});
