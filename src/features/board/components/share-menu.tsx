import { useState } from "react";
import { FileIcon } from "@untitledui/file-icons";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, Copy01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { useBoard } from "@/lib/board-store";
import { useSession } from "@/lib/session";
import { exportBoardImage, type BoardImageFormat } from "@/lib/export-board";

const FORMATS: { id: BoardImageFormat; label: string; icon: string }[] = [
  { id: "jpg", label: "JPG image", icon: "jpg" },
  { id: "png", label: "PNG image", icon: "png" },
  { id: "svg", label: "SVG vector", icon: "svg" },
  { id: "pdf", label: "PDF document", icon: "pdf" },
];

export function ShareMenu({ onClose }: { onClose: () => void }) {
  const board = useBoard((s) => s.board);
  const { user, signIn } = useSession();
  const { resolvedTheme } = useTheme();
  const [busy, setBusy] = useState<BoardImageFormat | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(false);
  const iconTheme = resolvedTheme === "dark" ? "dark" : "light";

  const download = async (format: BoardImageFormat) => {
    setError("");
    setBusy(format);
    try {
      await exportBoardImage(format, board.title);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${board.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link.");
    }
  };

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${board.id}`;

  return (
    <div className="w-72 rounded-lg border bg-popover p-2 shadow-xl ring-1 ring-border">
      <p className="px-2 pt-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Download</p>
      <div className="flex items-stretch gap-1 px-1 py-1">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => void download(f.id)}
            disabled={busy != null}
            title={f.label}
            className="flex flex-1 flex-col items-center gap-1 rounded-md px-1 py-2 transition-colors hover:bg-muted disabled:opacity-50"
          >
            <FileIcon type={f.icon} size={34} theme={iconTheme} />
            <span className="font-mono text-[10px] font-semibold tracking-wider uppercase">
              {busy === f.id ? "…" : f.id}
            </span>
          </button>
        ))}
      </div>

      <div className="my-1.5 h-px bg-border" aria-hidden />

      <p className="px-2 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Share via link</p>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="group mt-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted"
      >
        <HugeiconsIcon icon={copied ? CheckmarkBadge01Icon : Link01Icon} size={20} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-xs">{shareUrl}</span>
          <span className="block text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {copied ? "Copied!" : "Click to copy url"}
          </span>
        </span>
        {!copied && <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />}
      </button>

      <div className="my-1.5 h-px bg-border" aria-hidden />

      {user ? (
        <button
          type="button"
          onClick={() => setPublished(true)}
          className="w-full rounded-md bg-primary px-2 py-2.5 text-center text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-opacity hover:opacity-90"
        >
          {published ? "Published" : "Publish"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            signIn();
            onClose();
          }}
          className="w-full rounded-md bg-primary px-2 py-2.5 text-center text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-opacity hover:opacity-90"
        >
          Sign in to publish
        </button>
      )}
      {error && <p className="px-2 pt-1 font-mono text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
