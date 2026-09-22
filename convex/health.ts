import { query } from "./_generated/server";

/** Zero-arg liveness probe for scripts and load balancers. */
export const ping = query({
  args: {},
  handler: async () => ({ ok: true as const, at: new Date().toISOString() }),
});
