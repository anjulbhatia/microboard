import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSignInWithPassword,
  useSignUpWithPassword,
} from "@convex-dev/auth/providers/password/react";
import { useSession } from "@/store/session";
import { HOME_PATH } from "@/lib/routes";
// Static codegen import is safe here: this module lazy-loads only when
// the backend is configured, which implies `npx convex dev` ran.
import { api } from "../../../convex/_generated/api";

interface ConvexLoginProps {
  next?: string;
  onDone?: () => void;
}

/**
 * Real account form (Convex Auth, username + password). Rendered only
 * when the backend is configured — the provider guarantees context.
 */
export function ConvexLogin({ next = HOME_PATH, onDone }: ConvexLoginProps) {
  const { signIn, pending: inPending } = useSignInWithPassword(api.auth.signInWithPassword);
  const { signUp, pending: upPending } = useSignUpWithPassword(api.auth.signUpWithPassword);
  const linkRemote = useSession((s) => s.linkRemote);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const busy = inPending || upPending;

  const done = () => {
    linkRemote(username.trim().toLowerCase());
    onDone?.();
    navigate(next, { replace: true });
  };

  const submit = async () => {
    const clean = username.trim().toLowerCase();
    if (!clean || !password) {
      setError("Username and password needed.");
      return;
    }
    setError("");
    const result =
      mode === "signIn"
        ? await signIn({ username: clean, password })
        : await signUp({ username: clean, password });
    if (result.status === "complete") {
      done();
      return;
    }
    const code = result.userError.error;
    setError(
      code === "INVALID_CREDENTIALS" || code === "USER_NOT_FOUND"
        ? "Wrong username or password."
        : code === "USERNAME_TAKEN"
          ? "Username taken — try signing in."
          : code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG"
            ? "Password needs 8–72 characters."
            : code === "RATE_LIMITED"
              ? "Too many tries — wait a minute."
              : "Auth failed — try again."
    );
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Account mode">
        {(["signIn", "signUp"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
              mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {m === "signIn" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-xs font-medium text-muted-foreground" htmlFor="convex-username">
        Username
      </label>
      <input
        id="convex-username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none"
      />
      <label className="mt-2 block text-xs font-medium text-muted-foreground" htmlFor="convex-password">
        Password
      </label>
      <input
        id="convex-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit();
        }}
        autoComplete={mode === "signIn" ? "current-password" : "new-password"}
        className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none"
      />
      {error && <p className="mt-2 font-mono text-xs text-destructive">{error}</p>}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy}
        className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {busy ? "Working…" : mode === "signIn" ? "Sign in" : "Create account"}
      </button>
    </div>
  );
}
