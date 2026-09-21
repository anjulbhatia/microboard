import { defineApp } from "convex/server";
import { v } from "convex/values";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import firecrawl from "@firecrawl/firecrawl-convex/convex.config";
import agentmail from "@agentmail/convex/convex.config";

// App HTTP routes (convex/http.ts) are served under /api so the
// static site can own the root on *.convex.site.
const app = defineApp({
  httpPrefix: "/api",
  env: {
    // Public site origin used in shared links, e.g. https://<app>.convex.site
    SITE_URL: v.optional(v.string()),
    FIRECRAWL_API_KEY: v.optional(v.string()),
    FIRECRAWL_WEBHOOK_SECRET: v.optional(v.string()),
  },
});

app.use(staticHosting, { httpPrefix: "/" });

app.use(firecrawl, {
  // Webhook route for durable crawls: /api/firecrawl/webhook
  httpPrefix: "/firecrawl/",
  env: {
    FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY,
    FIRECRAWL_WEBHOOK_SECRET: app.env.FIRECRAWL_WEBHOOK_SECRET,
  },
});

app.use(agentmail);

export default app;
