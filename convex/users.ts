import { internalMutation, query } from "./_generated/server";
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
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.provider.profile.username,
      createdAt: new Date().toISOString(),
    });
  },
});

/** Public lookup for u/[username]. Returns null when unknown. */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_name", (q) => q.eq("name", args.username))
      .unique();
  },
});
