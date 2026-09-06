import { lazy, Suspense, useRef, useState } from "react";

import { FileIcon } from "@untitledui/file-icons";
import { useTheme } from "next-themes";
import { csvRecords, excelRecords, providerForFile, sheetRecords } from "@/lib/data-providers";
import type { DataSource as BoardSource } from "@/types/board";

const ClipboardModal = lazy(() =>
  import("@/components/canvas/ClipboardModal").then((m) => ({ default: m.ClipboardModal }))
);

export function UploadPhase({ onLoad }: { onLoad: (source: BoardSource, records: Record<string, string>[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [clipOpen, setClipOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();
  const iconTheme = resolvedTheme === "dark" ? "dark" : "light";

  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : "Could not load file.");
    setBusy(false);
  };

  const loadFile = async (file: File | undefined) => {
    if (!file || busy) return;
    setError("");
    setBusy(true);
    try {
      const kind = providerForFile(file.name);
      if (kind === "csv") {
        onLoad("inline", csvRecords(await file.text()));
      } else {
        onLoad("file", await excelRecords(file));
      }
    } catch (e) {
      fail(e);
    }
  };

  const loadSheet = async () => {
    if (!sheetUrl.trim() || busy) return;
    setError("");
    setBusy(true);
    try {
      onLoad("inline", await sheetRecords(sheetUrl));
    } catch (e) {
      fail(e);
    }
  };

  return (
    <div className="slim-scroll flex h-full min-h-0 items-center justify-center overflow-y-auto bg-muted/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border bg-card p-5 shadow-xl">
        <p className="text-center font-display text-lg tracking-[0.2em]">MICROBOARD</p>
        <p className="mt-1 text-center text-sm text-muted-foreground">Drop a file to start your board.</p>

        <div
          role="button"
          tabIndex={0}
          aria-label="Drop a data file"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void loadFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter") fileRef.current?.click();
          }}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/40"
          }`}
        >
          <span className="flex items-end gap-1.5">
            <FileIcon type="csv" size={30} theme={iconTheme} />
            <FileIcon type="xlsx" size={30} theme={iconTheme} />
          </span>
          <p className="text-sm font-medium">
            {busy ? "Reading file…" : dragging ? "Drop to load" : "Drag & drop .csv / .xlsx, or browse"}
          </p>
          {error && <p className="max-w-md text-center font-mono text-xs text-destructive">{error}</p>}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => {
            void loadFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="mt-3 flex items-center gap-2 rounded-xl border px-2.5 py-2">
          <FileIcon type="spreadsheets" size={24} theme={iconTheme} />
          <input
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="Google Sheets link…"
            aria-label="Google Sheets link"
            className="min-w-0 flex-1 bg-transparent font-mono text-xs focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => void loadSheet()}
            disabled={busy || !sheetUrl.trim()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Import
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => setClipOpen(true)}
            disabled={busy}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            Paste from clipboard
          </button>
        </div>
      </div>

      <Suspense fallback={null}>
        {clipOpen && (
          <ClipboardModal onClose={() => setClipOpen(false)} onImport={(records) => onLoad("inline", records)} />
        )}
      </Suspense>
    </div>
  );
}
