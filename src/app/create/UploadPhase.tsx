import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CloudUploadIcon, File02Icon, Link01Icon, Table01Icon } from "@hugeicons/core-free-icons";
import { ManualSheetModal } from "@/app/create/ManualSheetModal";
import { csvRecords, excelRecords, providerForFile, sheetRecords } from "@/lib/data-providers";
import { SAMPLE_CSV } from "@/lib/data-utils";
import type { DataSource as BoardSource } from "@/types/board";

const ACCEPT = ".csv,.xlsx";

export function UploadPhase({ onLoad }: { onLoad: (source: BoardSource, records: Record<string, string>[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const btn =
    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50";
  const primaryBtn =
    "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

  return (
    <div className="slim-scroll flex h-full min-h-0 items-center justify-center overflow-y-auto p-4 md:p-8">
      <div className="w-full max-w-3xl space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Add your data</h1>
          <p className="mt-1 text-sm text-muted-foreground">Drop a CSV or Excel file to start the board.</p>
        </div>

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
          className={`flex aspect-[16/10] max-h-[46svh] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/40"
          }`}
        >
          <HugeiconsIcon icon={CloudUploadIcon} size={44} strokeWidth={1.5} className="text-muted-foreground" />
          <p className="font-medium">
            {busy ? "Reading file…" : dragging ? "Drop to load" : "Drag & drop your file here"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">.csv · .xlsx</p>
          {error && <p className="max-w-md px-4 font-mono text-xs text-destructive">{error}</p>}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            void loadFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={btn}>
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={File02Icon} size={16} strokeWidth={1.5} />
              Browse file
            </span>
          </button>
          <button type="button" onClick={() => setManualOpen(true)} disabled={busy} className={btn}>
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={Table01Icon} size={16} strokeWidth={1.5} />
              Add manual
            </span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              try {
                onLoad("sample", csvRecords(SAMPLE_CSV));
              } catch (e) {
                fail(e);
              }
            }}
            className={primaryBtn}
          >
            Load sample
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border p-3">
          <HugeiconsIcon icon={Link01Icon} size={18} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
          <input
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="Paste a public Google Sheets link…"
            aria-label="Google Sheets link"
            className="min-w-0 flex-1 bg-transparent font-mono text-xs focus-visible:outline-none"
          />
          <button type="button" onClick={() => void loadSheet()} disabled={busy || !sheetUrl.trim()} className={btn}>
            Import
          </button>
        </div>
      </div>

      {manualOpen && (
        <ManualSheetModal onClose={() => setManualOpen(false)} onImport={(records) => onLoad("inline", records)} />
      )}
    </div>
  );
}
