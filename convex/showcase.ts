// DRAFT — not compiled (convex/ excluded from tsconfig). Your job: adjust
// after `npx convex dev` generates convex/_generated/.

import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db.query("boards").order("desc").take(24);
    return boards
      .filter((b) => b.showcase !== false)
      .map((b) => ({
        publicId: b.publicId,
        title: b.title,
        version: b.version,
        updatedAt: b.updatedAt,
      }));
  },
});
