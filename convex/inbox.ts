import { action, internalMutation, mutation, query } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { AgentMail } from "@agentmail/convex";
import { v } from "convex/values";

// Webhook event log. Metadata only — never message content, addresses,
// or display names (see hackathon.md privacy rule).
export const recordEvent = internalMutation({
  args: {
    eventId: v.string(),
    type: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mailEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("mailEvents", {
      ...args,
      receivedAt: new Date().toISOString(),
    });
  },
});

// Fired by the AgentMail component for each inbound message via the
// webhook mounted in http.ts.
export const onMessageReceived = internalMutation({
  args: {
    message: v.any(),
    thread: v.any(),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = args.thread as { id?: unknown } | null;
    const threadId = typeof thread?.id === "string" ? thread.id : undefined;
    await ctx.runMutation(internal.inbox.recordEvent, {
      eventId: args.eventId,
      type: "message.received",
      threadId,
    });
  },
});

// Fired for every other webhook event (sent, delivered, bounced, ...).
export const onEvent = internalMutation({
  args: { event: v.any() },
  handler: async (ctx, args) => {
    const event = args.event as { id?: unknown; type?: unknown };
    if (typeof event.id !== "string" || typeof event.type !== "string") return;
    await ctx.runMutation(internal.inbox.recordEvent, {
      eventId: event.id,
      type: event.type,
      threadId: undefined,
    });
  },
});

// Give the board its own inbox. The inbox id is public routing metadata;
// the address value itself is never written to the log.
export const createBoardInbox = action({
  args: { displayName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const mail = new AgentMail(components.agentmail);
    return await mail.createInbox(ctx, {
      displayName: args.displayName ?? "Microboard",
    });
  },
});

// Email a public board link through the board inbox.
export const sendBoardLink = mutation({
  args: {
    inboxId: v.string(),
    to: v.string(),
    boardPublicId: v.string(),
    boardTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const mail = new AgentMail(components.agentmail);
    const site = process.env.SITE_URL ?? "";
    return await mail.sendMessage(ctx, args.inboxId, {
      to: args.to,
      subject: `Microboard: ${args.boardTitle}`,
      text: `A Microboard dashboard was shared with you: ${args.boardTitle}\n\nOpen it here: ${site}/share/${args.boardPublicId}`,
    });
  },
});

export const recentEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mailEvents").order("desc").take(20);
  },
});
