import { query, action } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { Langfuse } from "../../src/client/index.js";
import { v } from "convex/values";

const langfuse = new Langfuse(components.convexLangfuse, {
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
});

export const logChatCompletion = action({
  args: {
    userId: v.string(),
    prompt: v.string(),
    completion: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    return await langfuse.logGeneration(ctx, {
      name: "chat-completion",
      userId: args.userId,
      model: args.model,
      input: args.prompt,
      output: args.completion,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
    });
  },
});

export const rateResponse = action({
  args: { traceId: v.string(), value: v.number() },
  handler: async (ctx, args) => {
    await langfuse.recordScore(ctx, {
      traceId: args.traceId,
      name: "user-rating",
      value: args.value,
    });
    return null;
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

export const listTracesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await langfuse.listTracesByUser(ctx, args);
  },
});
