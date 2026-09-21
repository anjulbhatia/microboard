import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create the user row for a new password account and return its id.
 * Called once per account, the first time the provider sees it.
 */
export const createUser = internalMutation({
  args: {
    provider: v.object({
      name: v.literal("password"),
      accountId: v.string(),
      profile: v.object({ username: v.string() }),
    }),
  },
  returns: v.id("users"),
  handler: async (ctx) => {
    return await ctx.db.insert("users", {});
  },
});
