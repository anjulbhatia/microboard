// Tables: boards + links for sharing, plus ingests (Firecrawl), mailEvents
// (AgentMail webhook log), and suggestions (AI Gateway outputs). Board JSON
// travels as a string snapshot so the versioned document stays the single
// source of truth on both sides.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  boards: defineTable({
    publicId: v.string(),
    title: v.string(),
    snapshot: v.string(), // JSON.stringify(Board)
    version: v.number(),
    showcase: v.optional(v.boolean()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_publicId", ["publicId"]),

  links: defineTable({
    slug: v.string(),
    boardId: v.id("boards"),
    createdAt: v.string(),
  }).index("by_slug", ["slug"]),

  // One row per Firecrawl scrape imported as board data. Only an excerpt is
  // stored; the full document stays in the Firecrawl component tables.
  ingests: defineTable({
    url: v.string(),
    title: v.optional(v.string()),
    excerpt: v.string(), // truncated markdown, max ~4000 chars
    createdAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),

  // AgentMail webhook deliveries. Metadata only — never message content,
  // addresses, or display names.
  mailEvents: defineTable({
    eventId: v.string(),
    type: v.string(),
    threadId: v.optional(v.string()),
    receivedAt: v.string(),
  }).index("by_eventId", ["eventId"]),

  // AI Gateway outputs (transform / widget suggestions). Model id is the
  // provider/model string sent to the gateway.
  suggestions: defineTable({
    kind: v.string(), // "transform" | "widget"
    input: v.string(), // goal + board excerpt sent to the model
    output: v.string(), // model text
    model: v.string(),
    createdAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),
});
