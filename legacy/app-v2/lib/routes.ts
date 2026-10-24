/**
 * Route paths + username helpers. Pure logic, covered by tests/routes.test.ts.
 * Canonical routes: /new (canvas), /home (logged-in SPA), /u/:username.
 * Legacy: /create -> /new, /dashboard -> /home, /b/:id -> /share/:id.
 */

export const NEW_PATH = "/new";
export const HOME_PATH = "/home";
export const SHOWCASE_PATH = "/showcase";

export type HomeSection =
  | "home"
  | "data"
  | "mailing"
  | "history"
  | "analytics"
  | "profile";

export const HOME_SECTIONS: { id: HomeSection; label: string; short: string; blurb: string }[] = [
  { id: "home", label: "Home", short: "Home", blurb: "Boards you created" },
  { id: "data", label: "Data Sources", short: "Data", blurb: "Sources, integrations — everything data lives here" },
  { id: "mailing", label: "Mailing List", short: "Mail", blurb: "Subscribers for board drops" },
  { id: "history", label: "History", short: "History", blurb: "Versions and restores" },
  { id: "analytics", label: "Analytics", short: "Stats", blurb: "Views and shares" },
  { id: "profile", label: "Profile", short: "Profile", blurb: "Account and public page" },
];

export function sharePath(id: string): string {
  return `/share/${id}`;
}

export function profilePath(username: string): string {
  return `/u/${normalizeUsername(username)}`;
}

/** Lowercase, 3-24 chars, letters/numbers/_/-, must start alnum. */
export function isUsernameValid(name: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{2,23}$/.test(name);
}

/** Slugify anything into a username shape; falls back to guest-creator. */
export function normalizeUsername(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  if (slug.length === 0) return "guest-creator";
  if (isUsernameValid(slug)) return slug;
  const rescued = `guest-${slug}`.replace(/[-_]+$/g, "").slice(0, 24);
  if (isUsernameValid(rescued)) return rescued;
  return "guest-creator";
}
