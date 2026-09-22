import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Resolve the acting userKey: Convex Auth subject when signed in,
 * otherwise the caller-passed demo key. Central so OTP hardening
 * touches one place.
 */
export async function userKey(
  ctx: QueryCtx | MutationCtx,
  fallback?: string
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.subject) return identity.subject;
  if (fallback) return fallback;
  throw new Error("Sign in required.");
}

export function now(): string {
  return new Date().toISOString();
}
