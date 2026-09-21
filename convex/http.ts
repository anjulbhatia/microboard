import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { components } from "./_generated/api";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { AgentMail } from "@agentmail/convex";
import { internal } from "./_generated/api";

const http = httpRouter();

// AgentMail inbox webhook (Svix-signed). Served under /api — see
// convex.config.ts httpPrefix. Verification + dispatch live in inbox.ts.
const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.inbox.onMessageReceived,
  onEvent: internal.inbox.onEvent,
});
http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => agentmail.handleWebhook(ctx, req)),
});

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Static frontend owns the root; SPA fallback serves index.html so
// client-side routes (/create, /showcase, /share/:id) work on reload.
registerStaticRoutes(http, components.staticHosting);

export default http;
