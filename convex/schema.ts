import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Identity: functions key people by a userKey string — the Convex Auth
 * subject when signed in, the demo id otherwise. Keeps demo working
 * and real auth working with zero migration. Harden with ctx.auth
 * checks once OTP lands (see docs/convex.md).
 */

export default defineSchema({
  // One row per account. username is the public handle (u/[username]).
  users: defineTable({
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_username", ["username"]),

  // Board snapshots. ownerId is a userKey (see above).
  // Counters denormalize like/save/comment/view rows for fast reads.
  boards: defineTable({
    publicId: v.string(),
    ownerId: v.optional(v.string()),
    title: v.string(),
    snapshot: v.string(),
    version: v.number(),
    showcase: v.optional(v.boolean()),
    likeCount: v.optional(v.number()),
    saveCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
    viewCount: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_publicId", ["publicId"])
    .index("by_owner", ["ownerId"]),

  links: defineTable({
    slug: v.string(),
    boardId: v.id("boards"),
    createdAt: v.string(),
  }).index("by_slug", ["slug"]),

  // Mailing list per owner. Send via AgentMail slots in later.
  subscribers: defineTable({
    ownerId: v.string(),
    email: v.string(),
    createdAt: v.string(),
  }).index("by_owner", ["ownerId"]),

  // Showcase engagement. One row per (board, user); counters on boards.
  boardLikes: defineTable({
    boardId: v.id("boards"),
    userKey: v.string(),
    createdAt: v.string(),
  })
    .index("by_board", ["boardId"])
    .index("by_user_board", ["userKey", "boardId"]),

  boardSaves: defineTable({
    boardId: v.id("boards"),
    userKey: v.string(),
    createdAt: v.string(),
  })
    .index("by_board", ["boardId"])
    .index("by_user_board", ["userKey", "boardId"]),

  boardComments: defineTable({
    boardId: v.id("boards"),
    userKey: v.string(),
    username: v.optional(v.string()),
    text: v.string(),
    createdAt: v.string(),
  }).index("by_board", ["boardId"]),
});
