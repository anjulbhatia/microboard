/**
 * Backend env helper — Convex accommodation seam.
 *
 * No `convex` package imported here, ever. The frontend stays fully local
 * until `VITE_CONVEX_URL` exists; then `features/share` dynamic-imports
 * `convex/react` at publish time. Static imports would break the build
 * before you run `npm i convex` — don't add them.
 */

export function getConvexUrl(): string | null {
  const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
  return url && url.length > 0 ? url : null;
}

export function isBackendConfigured(): boolean {
  return getConvexUrl() !== null;
}
