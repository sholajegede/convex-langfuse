import { defineApp } from "convex/server";
import convexLangfuse from "../../src/component/convex.config.js";

const app = defineApp();
app.use(convexLangfuse);

export default app;
