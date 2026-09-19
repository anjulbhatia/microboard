// DRAFT — not compiled (convex/ excluded from tsconfig). Your job: adjust
// after `npx convex dev` generates convex/_generated/.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
  args: {
    publicId: v.string(),
    title: v.string(),
    snapshot: v.string(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("boards")
      .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        snapshot: args.snapshot,
        version: args.version,
        updatedAt: now,
      });
      return { publicId: args.publicId };
    }
    await ctx.db.insert("boards", {
      publicId: args.publicId,
      title: args.title,
      snapshot: args.snapshot,
      version: args.version,
      createdAt: now,
      updatedAt: now,
    });
    return { publicId: args.publicId };
  },
});

export const get = query({
  args: { publicId: v.string() },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
      .unique();
    return board ?? null;
  },
});
