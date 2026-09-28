import type { ReactNode } from "react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { useSession } from "@/store/session";
import { LoginModal } from "@/features/auth/login-modal";

/**
 * Gate for authed routes when the backend is live. Passes with either
 * a Convex Auth session or the local demo session.
 */
export function AuthGate({ children, next }: { children: ReactNode; next?: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useSession((s) => s.user);
  if (isLoading && !user) {
    return (
      <div className="flex h-svh items-center justify-center font-mono text-xs text-muted-foreground">
        Checking session…
      </div>
    );
  }
  if (!isAuthenticated && !user) return <LoginModal next={next} />;
  return <>{children}</>;
}
