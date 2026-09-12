import { query, action } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { Langfuse } from "../../src/client/index.js";
import { v } from "convex/values";

const langfuse = new Langfuse(components.convexLangfuse, {
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

export const logChatCompletion = action({
  args: {
    userId: v.string(),
    sessionId: v.optional(v.string()),
    prompt: v.string(),
    completion: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await langfuse.logGeneration(ctx, {
      traceName: "chat-completion",
      name: "chat-completion",
      userId: args.userId,
      sessionId: args.sessionId,
      tags: args.tags,
      model: args.model,
      input: args.prompt,
      output: args.completion,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
    });
  },
});

// Adds a non-LLM step (a retrieval, a tool call, a guardrail check) to an
// existing trace, to demonstrate grouping multiple observations together —
// see the README's "Continuing a Trace" section.
export const logStep = action({
  args: {
    traceId: v.string(),
    name: v.string(),
    input: v.optional(v.string()),
    output: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await langfuse.logSpan(ctx, {
      traceId: args.traceId,
      name: args.name,
      input: args.input,
      output: args.output,
    });
  },
});

export const rateResponse = action({
  args: { traceId: v.string(), value: v.number(), comment: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await langfuse.recordScore(ctx, {
      traceId: args.traceId,
      name: "user-rating",
      value: args.value,
      comment: args.comment,
    });
  },
});

export const getTrace = query({
  args: { traceId: v.string() },
  handler: async (ctx, args) => {
    return await langfuse.getTrace(ctx, args);
  },
});

export const listObservations = query({
  args: { traceId: v.string() },
  handler: async (ctx, args) => {
    return await langfuse.listObservations(ctx, args);
  },
});

export const listScores = query({
  args: { traceId: v.string() },
  handler: async (ctx, args) => {
    return await langfuse.listScores(ctx, args);
  },
});

export const listTracesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await langfuse.listTracesByUser(ctx, args);
  },
});

export const listTracesBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await langfuse.listTracesBySession(ctx, args);
  },
});

export const getDashboardUrl = query({
  args: {},
  handler: async () => {
    return process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com";
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    return await langfuse.getStats(ctx);
  },
});

export const listRecentTraces = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await langfuse.listRecentTraces(ctx, args);
  },
});
