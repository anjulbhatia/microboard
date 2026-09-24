import { query } from "./_generated/server";
import { v } from "convex/values";

/** Zero-arg liveness probe for scripts and load balancers. */
export const ping = query({
  args: {},
  returns: v.object({ ok: v.literal(true) }),
  // No wall-clock here: Date.now()/ISO time in a query breaks reactivity
  // (every read re-executes). Callers timestamp on receipt if they need it.
  handler: async () => ({ ok: true as const }),
});
