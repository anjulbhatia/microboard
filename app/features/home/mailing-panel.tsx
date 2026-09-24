import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { Card, Empty, IconBtn, SectionHead } from "@/features/home/section";
import {
  MAILING_KEY,
  addSubscriber,
  loadMailing,
  removeSubscriber,
} from "@/features/mailing";

/**
 * Mailing List — subscribers as a table. Local today (localStorage),
 * Convex subscribers table mirrors the same shape for AgentMail send.
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
    <div className="flex max-w-3xl flex-col gap-5">
      <SectionHead
        title={`${count} subscriber${count === 1 ? "" : "s"}`}
        blurb="Board drops send here once AgentMail is keyed."
      />

      <Card>
        <label className="text-xs font-bold" htmlFor="mailing-email">
          Add a subscriber
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="mailing-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="ada@example.com"
            inputMode="email"
            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.97]"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2} />
            Add
          </button>
        </div>
        {error && <p className="mt-2 font-mono text-xs text-destructive">{error}</p>}
      </Card>

      {list.length === 0 ? (
        <Empty
          title="The list is empty"
          body="Add the first email above — every board drop starts with one subscriber."
        />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Joined</th>
                  <th className="w-20 px-4 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.email} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="max-w-48 truncate px-4 py-2.5 font-mono text-xs">{s.email}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <IconBtn label={`Remove ${s.email}`} onClick={() => persist(removeSubscriber(list, s.email))} icon={Delete02Icon} danger />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
