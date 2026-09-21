import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getServiceToken } from "convex/server";
import { v } from "convex/values";

// OpenAI model id in provider/model form, served through the Convex AI
// Gateway — no provider key stored. Gateway auth needs convex 1.45+.
const MODEL = "openai/gpt-4o-mini";

export const saveSuggestion = internalMutation({
  args: {
    kind: v.string(),
    input: v.string(),
    output: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("suggestions", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

// Suggest the next transform step or widget for a board. The board snapshot
// is truncated before sending; the model never sees more than an excerpt.
export const suggestBoard = action({
  args: {
    kind: v.union(v.literal("transform"), v.literal("widget")),
    boardSnapshot: v.string(),
    goal: v.string(),
  },
  handler: async (ctx, args) => {
    const token = await getServiceToken("ai-gateway");
    const res = await fetch("https://ai-gateway.convex.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You help build data dashboards. Reply with one concrete, small suggestion: either a single data-cleaning step or a single chart widget, with exact columns. Keep it under 120 words.",
          },
          {
            role: "user",
            content: `Goal: ${args.goal}\n\nBoard (kind=${args.kind}):\n${args.boardSnapshot.slice(0, 12000)}`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const output = data.choices[0]?.message.content ?? "";
    await ctx.runMutation(internal.ai.saveSuggestion, {
      kind: args.kind,
      input: `${args.goal}\n${args.boardSnapshot.slice(0, 2000)}`,
      output,
      model: MODEL,
    });
    return { model: MODEL, output };
  },
});
