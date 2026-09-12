import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TopBanner() {
  const dashboardUrl = useQuery(api.example.getDashboardUrl);

  return (
    <div className="banner">
      This example logs to Langfuse using <code>LANGFUSE_PUBLIC_KEY</code> and{" "}
      <code>LANGFUSE_SECRET_KEY</code> (set via <code>npx convex env set</code>, from the same
      Langfuse project — plus <code>LANGFUSE_BASE_URL</code> if you're not on the EU Cloud
      region).{" "}
      {dashboardUrl && (
        <>
          Traces logged here show up at{" "}
          <a href={dashboardUrl} target="_blank" rel="noreferrer">
            {dashboardUrl}
          </a>
          .
        </>
      )}
    </div>
  );
}
