import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "../../src/component/schema.js";

const modules = import.meta.glob("./**/*.ts");
const componentModules = import.meta.glob("../../src/component/**/*.ts");

function initConvexTest() {
  const t = convexTest(schema, modules);
  t.registerComponent("convexLangfuse", schema, componentModules);
  return t;
}

test("getTrace returns null for unknown traceId", async () => {
  const t = initConvexTest();
  const result = await t.query(api.example.getTrace, { traceId: "trace_unknown" });
  expect(result).toBe(null);
});

test("listTracesByUser returns empty array for unknown user", async () => {
  const t = initConvexTest();
  const result = await t.query(api.example.listTracesByUser, { userId: "user_unknown" });
  expect(result).toEqual([]);
});
