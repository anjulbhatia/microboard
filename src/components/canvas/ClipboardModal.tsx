import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ClipboardIcon } from "@hugeicons/core-free-icons";
import { CSelect } from "@/components/canvas/controls";
import { clipboardFromText, detectSep, toRecords, type ClipSep } from "@/lib/data-providers";

const SEPS: { value: ClipSep | "auto"; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "tab", label: "Tab" },
  { value: "comma", label: "Comma" },
  { value: "semicolon", label: "Semicolon" },
  { value: "colon", label: "Colon" },
  { value: "space", label: "Space" },
];

export function ClipboardModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (records: Record<string, string>[]) => void;
}) {
  const [text, setText] = useState("");
  const [sep, setSep] = useState<ClipSep | "auto">("auto");
  const [error, setError] = useState("");

  const readSystemClipboard = async () => {
    setError("");
    try {
      const pasted = await navigator.clipboard.readText();
      if (!pasted) {
        setError("Clipboard is empty.");
        return;
      }
      setText(pasted);
    } catch {
      setError("Clipboard access denied — paste manually instead.");
    }
  };

  const submit = () => {
    try {
      const t = clipboardFromText(text, sep === "auto" ? undefined : sep);
      onImport(toRecords(t));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse pasted text.");
    }
  };

  const detected = text.trim() ? detectSep(text) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Paste data"
    >
      <div
        className="w-full max-w-2xl rounded-xl border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={ClipboardIcon} size={18} strokeWidth={1.5} className="text-primary" />
            <h2 className="font-semibold">Paste data</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void readSystemClipboard()}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              Read from clipboard
            </button>
            <CSelect
              label="Separator"
              value={sep}
              onChange={(v) => setSep(v as ClipSep | "auto")}
              options={SEPS.map((s) => ({ value: s.value, label: s.label }))}
            />
            {detected && <span className="font-mono text-xs text-muted-foreground">detected: {detected}</span>}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"month\tvisitors\nJan\t1860\n…"}
            rows={10}
            className="w-full rounded-md border bg-background px-2 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {error && <p className="font-mono text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Import paste
          </button>
        </div>
      </div>
    </div>
  );
}
