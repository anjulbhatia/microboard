import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Board logic, owner-scoped. ownerId is the users row id (string).
 * Optional today so demo/local boards work; required once auth lands.
 * Security: every read/write filters by ownerId except public share/showcase.
 */

export const save = mutation({
  args: {
    publicId: v.string(),
    ownerId: v.optional(v.string()),
    title: v.string(),
    snapshot: v.string(),
    version: v.number(),
    showcase: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("boards")
      .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
      .unique();
    if (existing) {
      if (existing.ownerId !== undefined && existing.ownerId !== args.ownerId) {
        throw new Error("Not your board.");
      }
      await ctx.db.patch(existing._id, {
        ownerId: args.ownerId ?? existing.ownerId,
        title: args.title,
        snapshot: args.snapshot,
        version: args.version,
        showcase: args.showcase ?? existing.showcase,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("boards", {
      publicId: args.publicId,
      ownerId: args.ownerId,
      title: args.title,
      snapshot: args.snapshot,
      version: args.version,
      showcase: args.showcase,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getByPublicId = query({
  args: { publicId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boards")
      .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
      .unique();
  },
});

export const listByOwner = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
  },
});

export const listShowcase = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("boards").collect();
    return all.filter((b) => b.showcase === true);
  },
});
