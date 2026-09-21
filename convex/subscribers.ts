import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Mailing list, owner-scoped. AgentMail send reads listByOwner later. */

export const subscribe = mutation({
  args: { ownerId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    if (existing.some((s) => s.email === email)) return existing.find((s) => s.email === email)?._id;
    return await ctx.db.insert("subscribers", {
      ownerId: args.ownerId,
      email,
      createdAt: new Date().toISOString(),
    });
  },
});

export const unsubscribe = mutation({
  args: { ownerId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const rows = await ctx.db
      .query("subscribers")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    for (const r of rows.filter((s) => s.email === email)) {
      await ctx.db.delete(r._id);
    }
  },
});

export const listByOwner = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscribers")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});
