/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

type ObservationType =
  | "span"
  | "generation"
  | "event"
  | "embedding"
  | "agent"
  | "tool"
  | "chain"
  | "retriever"
  | "guardrail"
  | "evaluator";

type Level = "DEBUG" | "DEFAULT" | "WARNING" | "ERROR";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      getTrace: FunctionReference<
        "query",
        "internal",
        { traceId: string },
        null | {
          _creationTime: number;
          _id: string;
          createdAt: number;
          metadata?: string;
          name: string;
          release?: string;
          sessionId?: string;
          tags?: Array<string>;
          traceId: string;
          updatedAt: number;
          userId?: string;
        },
        Name
      >;
      listObservations: FunctionReference<
        "query",
        "internal",
        { traceId: string },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          endedAt: number;
          input?: string;
          inputTokens?: number;
          level: Level;
          metadata?: string;
          model?: string;
          name: string;
          observationId: string;
          output?: string;
          outputTokens?: number;
          startedAt: number;
          statusMessage?: string;
          traceId: string;
          type: ObservationType;
        }>,
        Name
      >;
      listScores: FunctionReference<
        "query",
        "internal",
        { traceId: string },
        Array<{
          _creationTime: number;
          _id: string;
          comment?: string;
          createdAt: number;
          name: string;
          scoreId: string;
          traceId: string;
          value: number;
        }>,
        Name
      >;
      listTracesBySession: FunctionReference<
        "query",
        "internal",
        { limit?: number; sessionId: string },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          metadata?: string;
          name: string;
          release?: string;
          sessionId?: string;
          tags?: Array<string>;
          traceId: string;
          updatedAt: number;
          userId?: string;
        }>,
        Name
      >;
      listTracesByUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          metadata?: string;
          name: string;
          release?: string;
          sessionId?: string;
          tags?: Array<string>;
          traceId: string;
          updatedAt: number;
          userId?: string;
        }>,
        Name
      >;
      recordObservation: FunctionReference<
        "mutation",
        "internal",
        {
          endedAt: number;
          input?: string;
          inputTokens?: number;
          level: Level;
          metadata?: string;
          model?: string;
          name: string;
          observationId: string;
          output?: string;
          outputTokens?: number;
          startedAt: number;
          statusMessage?: string;
          traceId: string;
          type: ObservationType;
        },
        string,
        Name
      >;
      recordScore: FunctionReference<
        "mutation",
        "internal",
        {
          comment?: string;
          name: string;
          scoreId: string;
          traceId: string;
          value: number;
        },
        string,
        Name
      >;
      recordTrace: FunctionReference<
        "mutation",
        "internal",
        {
          metadata?: string;
          name: string;
          release?: string;
          sessionId?: string;
          tags?: Array<string>;
          traceId: string;
          userId?: string;
        },
        string,
        Name
      >;
    };
  };
