import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { userKey } from "./helpers";

/**
 * Showcase reads: public feed plus per-board detail with viewer flags.
 * Authors resolve through ownerId -> users row (username preferred).
 */

export interface FeedItem {
  publicId: string;
  title: string;
  version: number;
  updatedAt: string;
  author: string;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  viewCount: number;
  liked: boolean;
  saved: boolean;
}

async function authorName(ctx: QueryCtx, ownerId?: string): Promise<string> {
  if (!ownerId) return "anonymous";
  const byHandle = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", ownerId))
    .unique();
  if (byHandle?.username) return byHandle.username;
  const byName = await ctx.db
    .query("users")
    .withIndex("by_name", (q) => q.eq("name", ownerId))
    .unique();
  return byName?.username ?? byName?.name ?? "creator";
}

/** Public showcase feed, newest first. Viewer flags need a userKey. */
export const feed = query({
  args: { limit: v.optional(v.number()), userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = args.userKey ?? (await userKey(ctx).catch(() => ""));
    const all = await ctx.db.query("boards").collect();
    const shown = all
      .filter((b) => b.showcase === true)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, Math.min(args.limit ?? 24, 100));
    const items: FeedItem[] = [];
    for (const b of shown) {
      const [like, save] = key
        ? await Promise.all([
            ctx.db
              .query("boardLikes")
              .withIndex("by_user_board", (q) => q.eq("userKey", key).eq("boardId", b._id))
              .unique(),
            ctx.db
              .query("boardSaves")
              .withIndex("by_user_board", (q) => q.eq("userKey", key).eq("boardId", b._id))
              .unique(),
          ])
        : [null, null];
      items.push({
        publicId: b.publicId,
        title: b.title,
        version: b.version,
        updatedAt: b.updatedAt,
        author: await authorName(ctx, b.ownerId),
        likeCount: b.likeCount ?? 0,
        saveCount: b.saveCount ?? 0,
        commentCount: b.commentCount ?? 0,
        viewCount: b.viewCount ?? 0,
        liked: like !== null,
        saved: save !== null,
      });
    }
    return items;
  },
});

/** Full detail for a shared board: snapshot, comments, viewer flags. */
export const boardDetail = query({
  args: { publicId: v.string(), userKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const key = args.userKey ?? (await userKey(ctx).catch(() => ""));
    const board = await ctx.db
      .query("boards")
      .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
      .unique();
    if (!board) return null;
    const [comments, like, save] = await Promise.all([
      ctx.db
        .query("boardComments")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect(),
      key
        ? ctx.db
            .query("boardLikes")
            .withIndex("by_user_board", (q) => q.eq("userKey", key).eq("boardId", board._id))
            .unique()
        : Promise.resolve(null),
      key
        ? ctx.db
            .query("boardSaves")
            .withIndex("by_user_board", (q) => q.eq("userKey", key).eq("boardId", board._id))
            .unique()
        : Promise.resolve(null),
    ]);
    return {
      board,
      author: await authorName(ctx, board.ownerId),
      comments: comments.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      liked: like !== null,
      saved: save !== null,
    };
  },
});
