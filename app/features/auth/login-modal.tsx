import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/store/session";
import { HOME_PATH, isUsernameValid, normalizeUsername } from "@/lib/routes";

interface LoginModalProps {
  /** Where to go after sign-in. Defaults to /home. */
  next?: string;
  onDone?: () => void;
}

/**
 * Login / signup modal. Demo today: pick a username, get a local session.
 * Email OTP via AgentMail slots into this same modal later.
 */
export function LoginModal({ next = HOME_PATH, onDone }: LoginModalProps) {
  const signIn = useSession((s) => s.signIn);
  const [raw, setRaw] = useState("");
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const preview = normalizeUsername(raw || "Guest Creator");
  const valid = raw.trim().length === 0 || isUsernameValid(preview);

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    signIn(preview);
    onDone?.();
    navigate(next, { replace: true });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log in or sign up"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-xl">
        <h2 className="text-lg font-bold tracking-tight">Log in / Sign up</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Demo login for the hackathon. Email OTP arrives with AgentMail.
        </p>
        <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor="login-username">
          Username — your public page will be /u/{preview}
        </label>
        <input
          id="login-username"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="guest-creator"
          autoFocus
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none"
        />
        {touched && !valid && (
          <p className="mt-1 font-mono text-xs text-destructive">
            Use 3–24 chars: lowercase, numbers, _ or -.
          </p>
        )}
        <button
          type="button"
          onClick={submit}
          className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Continue as {preview}
        </button>
      </div>
    </div>
  );
}
