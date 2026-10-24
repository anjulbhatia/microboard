/**
 * AgentMail templates — builders over agentmail/*.html sources.
 * HTML is inlined at build time (bun run agentmail:build) into
 * compiled.ts, because Convex functions cannot read the filesystem.
 * Pure builders, zero deps.
 */
import { CUSTOM_HTML, MAGIC_LINK_HTML, SHARE_BOARD_HTML } from "./compiled";

export interface MailTemplate {
  subject: string;
  text: string;
  html: string;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Fill {{TITLE}} {{PREHEADER}} {{BODY}} — values pre-escaped by callers. */
export function render(source: string, vars: { title: string; preheader: string; body: string }): string {
  return source
    .replace("{{TITLE}}", vars.title)
    .replace("{{PREHEADER}}", vars.preheader)
    .replace("{{BODY}}", vars.body);
}

function cta(href: string, label: string): string {
  return `<div style="margin:16px 0;"><a href="${href}" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:10px;">${escapeHtml(label)}</a></div>`;
}

function linkRow(href: string): string {
  return `<p style="font-size:12px;color:#8a8784;word-break:break-all;">Or paste this link:<br><a href="${href}" style="color:#6d28d9;">${escapeHtml(href)}</a></p>`;
}

/** Passwordless sign-in. Link should expire (~15 min) — enforced by caller. */
export function magicLinkTemplate(args: { url: string; username?: string }): MailTemplate {
  const who = args.username ? ` for <strong>${escapeHtml(args.username)}</strong>` : "";
  const body = `Tap below to sign in${who}. This link expires in 15 minutes — if you did not ask for it, ignore this mail.${cta(args.url, "Sign in")}${linkRow(args.url)}`;
  return {
    subject: "Sign in to Microboard",
    text: `Sign in to Microboard${args.username ? ` as ${args.username}` : ""}:\n\n${args.url}\n\nThis link expires in 15 minutes. If you did not ask, ignore this mail.`,
    html: render(MAGIC_LINK_HTML, {
      title: "Sign in to Microboard",
      preheader: "Your 15-minute sign-in link.",
      body,
    }),
  };
}

/** A board shared with a subscriber. */
export function shareBoardTemplate(args: {
  url: string;
  boardTitle: string;
  from?: string;
  stats?: string;
}): MailTemplate {
  // Subject rides in mail headers — strip CR/LF (header injection) and cap.
  const safeTitle = args.boardTitle.replace(/[\r\n]+/g, " ").trim().slice(0, 120) || "Untitled board";
  const from = args.from ? ` shared by <strong>${escapeHtml(args.from)}</strong>` : "";
  const stats = args.stats ? `<p style="font-size:12px;color:#8a8784;">${escapeHtml(args.stats)}</p>` : "";
  const body = `A Microboard dashboard${from} is waiting for you.${stats}${cta(args.url, "Open board")}${linkRow(args.url)}`;
  return {
    subject: `Microboard: ${safeTitle}`,
    text: `${safeTitle}${args.from ? ` (shared by ${args.from})` : ""} is shared with you:\n\n${args.url}${args.stats ? `\n\n${args.stats}` : ""}`,
    html: render(SHARE_BOARD_HTML, {
      title: escapeHtml(safeTitle),
      preheader: `A Microboard dashboard was shared with you${args.from ? ` by ${args.from}` : ""}.`,
      body,
    }),
  };
}

/** Free-form board drop with a title, intro lines, and one CTA. */
export function customTemplate(args: {
  subject: string;
  title: string;
  lines: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  preheader?: string;
}): MailTemplate {
  const body = args.lines.map((l) => `<p style="margin:0 0 12px;">${escapeHtml(l)}</p>`).join("");
  const action = args.ctaUrl ? cta(args.ctaUrl, args.ctaLabel ?? "Open") + linkRow(args.ctaUrl) : "";
  return {
    subject: args.subject,
    text: [args.title, "", ...args.lines, ...(args.ctaUrl ? ["", args.ctaUrl] : [])].join("\n"),
    html: render(CUSTOM_HTML, {
      title: escapeHtml(args.title),
      preheader: args.preheader ?? args.lines[0] ?? args.title,
      body: body + action,
    }),
  };
}

export const TEMPLATES = {
  magicLink: magicLinkTemplate,
  shareBoard: shareBoardTemplate,
  custom: customTemplate,
} as const;

export type TemplateName = keyof typeof TEMPLATES;
