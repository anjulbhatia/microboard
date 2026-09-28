import type { ReactNode } from "react";
import { useSession } from "@/store/session";
import { isBackendConfigured } from "@/lib/backend";
import { LoginModal } from "@/features/auth/login-modal";
import { AuthGate } from "@/features/auth/auth-gate";

/**
 * Gate for authed routes (/new, /home). Anonymous visitors get the
 * login modal; after sign-in they land on `next`.
 */
export function RequireAuth({ children, next }: { children: ReactNode; next?: string }) {
  const user = useSession((s) => s.user);
  if (isBackendConfigured()) return <AuthGate next={next}>{children}</AuthGate>;
  if (!user) return <LoginModal next={next} />;
  return <>{children}</>;
}
