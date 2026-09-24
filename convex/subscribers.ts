import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { userKey } from "./helpers";

/** Mailing list, owner-scoped. AgentMail send reads listByOwner later. */

const MAX_SUBSCRIBERS = 2000;

function cleanEmail(raw: string): string {
  const email = raw.trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error("That email does not look valid.");
  }
  return email;
}

export const subscribe = mutation({
  args: { ownerId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const email = cleanEmail(args.email);
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    if (existing.some((s) => s.email === email)) return existing.find((s) => s.email === email)?._id;
    // Cap list growth: one bad actor cannot stuff a list into a spam cannon.
    if (existing.length >= MAX_SUBSCRIBERS) throw new Error("Mailing list is full.");
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
    const email = cleanEmail(args.email);
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
    // Email addresses are PII — only the list owner reads their own list.
    const key = await userKey(ctx, args.ownerId);
    if (args.ownerId !== key) throw new Error("Not your mailing list.");
    return await ctx.db
      .query("subscribers")
      .withIndex("by_owner", (q) => q.eq("ownerId", key))
      .collect();
  },
});
