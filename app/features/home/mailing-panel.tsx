import { useMemo, useState } from "react";
import {
  MAILING_KEY,
  addSubscriber,
  loadMailing,
  removeSubscriber,
} from "@/features/mailing";

/**
 * Mailing List — local subscribers today (localStorage), Convex
 * subscribers table mirrors the same shape for AgentMail send later.
 */
export function MailingPanel() {
  const [list, setList] = useState(() => {
    try {
      return loadMailing((k) => localStorage.getItem(k));
    } catch {
      return loadMailing(() => null);
    }
  });
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const count = useMemo(() => list.length, [list]);

  const persist = (next: typeof list) => {
    setList(next);
    try {
      localStorage.setItem(MAILING_KEY, JSON.stringify(next));
    } catch {
      // Private mode — session-only list.
    }
  };

  const add = () => {
    const res = addSubscriber(list, email);
    if (res.error) {
      setError(res.error);
      return;
    }
    setError("");
    setEmail("");
    persist(res.list);
  };

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mailing List</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} subscriber{count === 1 ? "" : "s"} · board drops send here after AgentMail.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="ada@example.com"
          inputMode="email"
          aria-label="Subscriber email"
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add
        </button>
      </div>
      {error && <p className="font-mono text-xs text-destructive">{error}</p>}
      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          No subscribers yet. Add the first email above.
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {list.map((s) => (
            <li key={s.email} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{s.email}</span>
              <button
                type="button"
                onClick={() => persist(removeSubscriber(list, s.email))}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
