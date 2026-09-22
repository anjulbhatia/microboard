import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { getConvexUrl } from "@/lib/backend";
// Static _generated import lives here (not in main) so fresh clones
// without `npx convex dev` still build. Loaded lazily, only when configured.
import { api } from "../../convex/_generated/api";

let client: ConvexReactClient | null = null;

/** Authed Convex tree. Render only when VITE_CONVEX_URL is set. */
export function ConvexShell({ children }: { children: ReactNode }) {
  const url = getConvexUrl();
  if (!url) return <>{children}</>;
  client ??= new ConvexReactClient(url);
  return (
    <ConvexProvider client={client}>
      <ConvexAuthProvider
        client={client}
        api={{ refreshSession: api.auth.refreshSession, signOut: api.auth.signOut }}
      >
        {children}
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}
