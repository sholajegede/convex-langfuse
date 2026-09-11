import type { GenericActionCtx, GenericDataModel } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

export type LangfuseOptions = {
  publicKey: string;
  secretKey: string;
  /** Defaults to the EU Langfuse Cloud region. */
  baseUrl?: string;
};

export type ObservationLevel = "DEBUG" | "DEFAULT" | "WARNING" | "ERROR";

export type LogObservationArgs = {
  /** Continue an existing trace, or omit to start a new one. */
  traceId?: string;
  traceName?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
  release?: string;
  traceMetadata?: Record<string, unknown>;

  name: string;
  input?: unknown;
  output?: unknown;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  level?: ObservationLevel;
  statusMessage?: string;
  metadata?: Record<string, unknown>;
  startTime?: number;
  endTime?: number;
};

export type LogObservationResult = {
  traceId: string;
  observationId: string;
};

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type OtlpAttribute = { key: string; value: Record<string, unknown> };

function attr(key: string, value: unknown): OtlpAttribute | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return { key, value: { stringValue: value } };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { key, value: { intValue: String(value) } }
      : { key, value: { doubleValue: value } };
  }
  if (typeof value === "boolean") return { key, value: { boolValue: value } };
  if (Array.isArray(value)) {
    return {
      key,
      value: {
        arrayValue: {
          values: value.map((v) => ({ stringValue: String(v) })),
        },
      },
    };
  }
  return { key, value: { stringValue: JSON.stringify(value) } };
}

function flattenMetadata(prefix: string, metadata: Record<string, unknown> | undefined): OtlpAttribute[] {
  if (!metadata) return [];
  return Object.entries(metadata)
    .map(([k, v]) => attr(`${prefix}.${k}`, typeof v === "object" ? JSON.stringify(v) : v))
    .filter((a): a is OtlpAttribute => a !== null);
}

/**
 * Send LLM traces, generations, and scores to Langfuse over its OpenTelemetry
 * ingestion endpoint (the legacy `/api/public/ingestion` batch API sunsets on
 * Langfuse Cloud in November 2026), while keeping a reactive local copy in Convex.
 */
export class Langfuse {
  constructor(
    private component: ComponentApi,
    private options: LangfuseOptions,
  ) {}

  private authHeader(): string {
    return `Basic ${btoa(`${this.options.publicKey}:${this.options.secretKey}`)}`;
  }

  private baseUrl(): string {
    return this.options.baseUrl ?? "https://cloud.langfuse.com";
  }

  private async exportSpan(args: {
    traceId: string;
    spanId: string;
    name: string;
    startTimeUnixNano: string;
    endTimeUnixNano: string;
    attributes: OtlpAttribute[];
  }): Promise<void> {
    const body = {
      resourceSpans: [
        {
          resource: {
            attributes: [{ key: "service.name", value: { stringValue: "convex-langfuse" } }],
          },
          scopeSpans: [
            {
              scope: { name: "convex-langfuse" },
              spans: [
                {
                  traceId: args.traceId,
                  spanId: args.spanId,
                  name: args.name,
                  kind: 1,
                  startTimeUnixNano: args.startTimeUnixNano,
                  endTimeUnixNano: args.endTimeUnixNano,
                  attributes: args.attributes,
                },
              ],
            },
          ],
        },
      ],
    };

    const res = await fetch(`${this.baseUrl()}/api/public/otel/v1/traces`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
        "x-langfuse-ingestion-version": "4",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Failed to export span to Langfuse: ${res.status} ${await res.text()}`);
    }
  }

  private async logObservation(
    ctx: GenericActionCtx<GenericDataModel>,
    type:
      | "span"
      | "generation"
      | "event"
      | "embedding"
      | "agent"
      | "tool"
      | "chain"
      | "retriever"
      | "guardrail"
      | "evaluator",
    args: LogObservationArgs,
  ): Promise<LogObservationResult> {
    const traceId = args.traceId ?? randomHex(16);
    const spanId = randomHex(8);
    const startTime = args.startTime ?? Date.now();
    const endTime = args.endTime ?? startTime;

    const attributes: OtlpAttribute[] = [
      attr("langfuse.trace.name", args.traceName ?? args.name),
      attr("langfuse.user.id", args.userId),
      attr("langfuse.session.id", args.sessionId),
      attr("langfuse.trace.tags", args.tags),
      attr("langfuse.release", args.release),
      attr("langfuse.observation.type", type),
      attr("langfuse.observation.input", args.input !== undefined ? JSON.stringify(args.input) : undefined),
      attr("langfuse.observation.output", args.output !== undefined ? JSON.stringify(args.output) : undefined),
      attr("langfuse.observation.model.name", args.model),
      attr("langfuse.observation.level", args.level ?? "DEFAULT"),
      attr("langfuse.observation.status_message", args.statusMessage),
      ...(args.inputTokens !== undefined || args.outputTokens !== undefined
        ? [
            attr(
              "langfuse.observation.usage_details",
              JSON.stringify({
                input_tokens: args.inputTokens ?? 0,
                output_tokens: args.outputTokens ?? 0,
              }),
            ),
          ]
        : []),
      ...flattenMetadata("langfuse.trace.metadata", args.traceMetadata),
      ...flattenMetadata("langfuse.observation.metadata", args.metadata),
    ].filter((a): a is OtlpAttribute => a !== null);

    await this.exportSpan({
      traceId,
      spanId,
      name: args.name,
      startTimeUnixNano: String(startTime * 1_000_000),
      endTimeUnixNano: String(endTime * 1_000_000),
      attributes,
    });

    await ctx.runMutation(this.component.lib.recordTrace, {
      traceId,
      name: args.traceName ?? args.name,
      userId: args.userId,
      sessionId: args.sessionId,
      tags: args.tags,
      metadata: args.traceMetadata ? JSON.stringify(args.traceMetadata) : undefined,
      release: args.release,
    });

    await ctx.runMutation(this.component.lib.recordObservation, {
      observationId: spanId,
      traceId,
      type,
      name: args.name,
      input: args.input !== undefined ? JSON.stringify(args.input) : undefined,
      output: args.output !== undefined ? JSON.stringify(args.output) : undefined,
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      level: args.level ?? "DEFAULT",
      statusMessage: args.statusMessage,
      metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
      startedAt: startTime,
      endedAt: endTime,
    });

    return { traceId, observationId: spanId };
  }

  /** Log a completed LLM call (model, input, output, token usage) as a Langfuse generation. */
  async logGeneration(
    ctx: GenericActionCtx<GenericDataModel>,
    args: LogObservationArgs,
  ): Promise<LogObservationResult> {
    return await this.logObservation(ctx, "generation", args);
  }

  /** Log a non-LLM step (a tool call, a retrieval, a chain step) as a Langfuse span. */
  async logSpan(
    ctx: GenericActionCtx<GenericDataModel>,
    args: LogObservationArgs,
  ): Promise<LogObservationResult> {
    return await this.logObservation(ctx, "span", args);
  }

  /** Attach an evaluation score to a trace, via Langfuse's Scores API. */
  async recordScore(
    ctx: GenericActionCtx<GenericDataModel>,
    args: { traceId: string; name: string; value: number; comment?: string },
  ): Promise<{ scoreId: string }> {
    const scoreId = randomHex(16);

    const res = await fetch(`${this.baseUrl()}/api/public/scores`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: scoreId,
        traceId: args.traceId,
        name: args.name,
        value: args.value,
        comment: args.comment,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to record Langfuse score: ${res.status} ${await res.text()}`);
    }

    await ctx.runMutation(this.component.lib.recordScore, {
      scoreId,
      traceId: args.traceId,
      name: args.name,
      value: args.value,
      comment: args.comment,
    });

    return { scoreId };
  }

  async getTrace(ctx: RunQueryCtx, args: { traceId: string }) {
    return await ctx.runQuery(this.component.lib.getTrace, args);
  }

  async listTracesByUser(ctx: RunQueryCtx, args: { userId: string; limit?: number }) {
    return await ctx.runQuery(this.component.lib.listTracesByUser, args);
  }

  async listTracesBySession(ctx: RunQueryCtx, args: { sessionId: string; limit?: number }) {
    return await ctx.runQuery(this.component.lib.listTracesBySession, args);
  }

  async listObservations(ctx: RunQueryCtx, args: { traceId: string }) {
    return await ctx.runQuery(this.component.lib.listObservations, args);
  }

  async listScores(ctx: RunQueryCtx, args: { traceId: string }) {
    return await ctx.runQuery(this.component.lib.listScores, args);
  }
}

type RunQueryCtx = {
  runQuery: GenericActionCtx<GenericDataModel>["runQuery"];
};
