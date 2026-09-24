import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ActivitySparkIcon,
  ArtboardIcon,
  ChartAnalysisIcon,
  ChartAreaIcon,
  ChartBarBigIcon,
  ChartLineIcon,
  ClipboardCopyIcon,
  CursorTextIcon,
  Database02Icon,
  File01Icon,
  GaugeIcon,
  GoogleSheetIcon,
  Heading01Icon,
  Image01Icon,
  Layout01Icon,
  Link01Icon,
  PieChart01Icon,
  ShapesIcon,
  SparklesIcon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import { useBoard } from "@/store/board";
import { WIDGET_REGISTRY, clampSpan } from "@/features/widgets/registry";
import { MICRO_IDS, MICRO_REGISTRY } from "@/features/widgets/micro/registry";
import { applySteps, inferColumns, toNumber } from "@/features/data/lib/data-utils";
import { useDataLoader } from "@/features/data/use-data-loader";
import { useUploads } from "@/hooks/use-uploads";
import type { Upload } from "@/features/board/types";
import type { WidgetType } from "@/features/board/types";

interface ToolboxProps {
  columns: string[];
  hasData: boolean;
  gridCols: number;
}

const ELEMENTS: { type: WidgetType; icon: typeof SparklesIcon }[] = [
  { type: "textbox", icon: CursorTextIcon },
  { type: "heading", icon: Heading01Icon },
  { type: "shape", icon: ShapesIcon },
  { type: "icon", icon: SparklesIcon },
  { type: "image", icon: Image01Icon },
  { type: "board", icon: ArtboardIcon },
  { type: "card", icon: Layout01Icon },
];

const CHARTS: { type: WidgetType; icon: typeof SparklesIcon }[] = [
  { type: "kpi", icon: GaugeIcon },
  { type: "spark", icon: ActivitySparkIcon },
  { type: "micro", icon: ChartAnalysisIcon },
  { type: "table", icon: Table01Icon },
  { type: "dither-area", icon: ChartAreaIcon },
  { type: "dither-bar", icon: ChartBarBigIcon },
  { type: "dither-line", icon: ChartLineIcon },
  { type: "dither-pie", icon: PieChart01Icon },
];

/** First column for X, first numeric column for Y. */
function defaultXY(): { x: string; y: string } {
  const b = useBoard.getState().board;
  const cleaned = applySteps(b.data.raw, b.steps);
  const cols = inferColumns(cleaned).map((c) => c.name);
  const x = cols[0] ?? "";
  const numeric = cols.find((c) => cleaned.some((r) => toNumber(r[c] ?? "") != null)) ?? cols[0] ?? "";
  return { x, y: numeric };
}

function Section({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="border-b border-border/60 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`toolbox-${id}`}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {title}
        </span>
        <span className={`font-mono text-xs text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}>
          ⌄
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`toolbox-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Tile({
  label,
  icon,
  disabled,
  active,
  onClick,
  title,
}: {
  label: string;
  icon: typeof SparklesIcon;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className={`flex flex-col items-center gap-1 rounded-md px-1 py-2 transition-colors disabled:opacity-40 ${
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} />
      <span className="max-w-full truncate text-[11px]">{label}</span>
    </button>
  );
}

/**
 * Canvas toolbox: Elements, Charts and Uploads as icon blocks.
 * No selects — tiles add with sensible defaults, settings refine.
 */
export function ToolboxSidebar({ columns, hasData, gridCols }: ToolboxProps) {
  const addWidget = useBoard((s) => s.addWidget);
  const [open, setOpen] = useState({ elements: true, charts: true, uploads: false });
  const [microOpen, setMicroOpen] = useState(false);
  const toggle = (k: keyof typeof open) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const addElement = (type: WidgetType) => {
    const meta = WIDGET_REGISTRY[type];
    const span = clampSpan(type, meta.defaultSpan, gridCols);
    addWidget({ type, title: meta.defaults.title, w: span.w, h: span.h, props: { ...meta.defaults.props } });
  };

  const addChart = (type: WidgetType, chart?: string) => {
    if (!hasData) return;
    const meta = WIDGET_REGISTRY[type];
    const span = clampSpan(type, meta.defaultSpan, gridCols);
    const { x, y } = defaultXY();
    addWidget({
      type,
      title: chart ? `${MICRO_REGISTRY[chart]?.title ?? meta.label} · ${y || x}` : `${meta.label} · ${y || x}`,
      dataX: x || undefined,
      dataY: y || undefined,
      x: x || undefined,
      y: y || undefined,
      w: span.w,
      h: span.h,
      props: { ...meta.defaults.props, ...(chart ? { chart } : {}) },
    });
  };

  return (
    <div className="flex h-full flex-col">
      <Section id="elements" title="Elements" open={open.elements} onToggle={() => toggle("elements")}>
        <div className="grid grid-cols-3 gap-1.5">
          {ELEMENTS.map(({ type, icon }) => (
            <Tile
              key={type}
              label={WIDGET_REGISTRY[type].label}
              icon={icon}
              onClick={() => addElement(type)}
            />
          ))}
        </div>
      </Section>

      <Section id="charts" title="Charts" open={open.charts} onToggle={() => toggle("charts")}>
        {!hasData ? (
          <p className="rounded-md bg-muted/50 px-2 py-2 text-[11px] text-muted-foreground">
            Upload data to chart — pick a source below.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {CHARTS.map(({ type, icon }) =>
              type === "micro" ? (
                <Tile
                  key={type}
                  label="Micro"
                  icon={icon}
                  onClick={() => setMicroOpen((v) => !v)}
                  title="Micro charts — pick one"
                />
              ) : (
                <Tile
                  key={type}
                  label={WIDGET_REGISTRY[type].label.replace("Dither ", "")}
                  icon={icon}
                  onClick={() => addChart(type)}
                />
              )
            )}
          </div>
        )}
        <AnimatePresence initial={false}>
          {microOpen && hasData && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="overflow-hidden"
            >
              <p className="pt-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Micro · {columns.length} cols
              </p>
              <div className="grid grid-cols-2 gap-1 pt-1.5">
                {MICRO_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => addChart("micro", id)}
                    title={MICRO_REGISTRY[id].blurb}
                    className="truncate rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {MICRO_REGISTRY[id].title}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <UploadsSection />
    </div>
  );
}

const UPLOAD_TILES: { kind: "file" | "paste" | "sheet" | "api" | "sample"; label: string; icon: typeof SparklesIcon }[] = [
  { kind: "file", label: "File", icon: File01Icon },
  { kind: "paste", label: "Paste", icon: ClipboardCopyIcon },
  { kind: "sheet", label: "Sheet", icon: GoogleSheetIcon },
  { kind: "api", label: "API", icon: Link01Icon },
  { kind: "sample", label: "Sample", icon: Database02Icon },
];

function UploadsSection() {
  const [kind, setKind] = useState<(typeof UPLOAD_TILES)[number]["kind"] | null>(null);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, error, loadFile, loadPaste, loadSheet, loadApi, loadSample } = useDataLoader();
  const { uploads, addUploads } = useUploads();
  const addWidget = useBoard((s) => s.addWidget);

  const pick = (k: typeof kind) => {
    setKind((cur) => (cur === k ? null : k));
    if (k === "sample") {
      if (loadSample()) setKind(null);
    }
  };

  const submit = async () => {
    const ok =
      kind === "paste" ? loadPaste(text) : kind === "sheet" ? await loadSheet(url) : await loadApi(url);
    if (ok) {
      setKind(null);
      setText("");
      setUrl("");
    }
  };

  return (
    <Section id="uploads" title="Uploads" open={true} onToggle={() => {}}>
      <div className="grid grid-cols-3 gap-1.5">
        {UPLOAD_TILES.slice(0, 3).map(({ kind: k, label, icon }) => (
          <Tile key={k} label={label} icon={icon} onClick={() => pick(k)} active={kind === k} />
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {UPLOAD_TILES.slice(3).map(({ kind: k, label, icon }) => (
          <Tile key={k} label={label} icon={icon} onClick={() => pick(k)} active={kind === k} />
        ))}
      </div>

      <AnimatePresence initial={false}>
        {kind === "file" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="mt-1.5 w-full rounded-lg border border-dashed px-2 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
            >
              {busy ? "Reading…" : "Choose .csv or .xlsx"}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  void (async () => {
                    if (await loadFile(e.target.files)) setKind(null);
                  })();
                }}
              />
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 w-full rounded-lg border border-dashed px-2 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              Add images
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addUploads(e.target.files);
                  e.target.value = "";
                }}
              />
            </button>
          </motion.div>
        )}
        {kind === "paste" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"month,visitors\nJan,1860"}
              rows={4}
              spellCheck={false}
              aria-label="Pasted rows"
              className="mt-1.5 w-full rounded-lg border bg-background px-2 py-1.5 font-mono text-xs focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={submit}
              className="mt-1.5 w-full rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Load rows
            </button>
          </motion.div>
        )}
        {(kind === "sheet" || kind === "api") && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={kind === "sheet" ? "Public sheet link…" : "https://api…/rows"}
              spellCheck={false}
              aria-label="Source URL"
              className="mt-1.5 w-full rounded-lg border bg-background px-2 py-1.5 font-mono text-xs focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="mt-1.5 w-full rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Loading…" : "Connect"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="mt-1.5 font-mono text-[11px] text-destructive">{error}</p>}

      {uploads.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 pt-2">
          {uploads.map((u: Upload) => (
            <button
              key={u.id}
              type="button"
              title={`Place ${u.name}`}
              onClick={() => addWidget({ type: "image", title: u.name, w: 4, h: 3, props: { src: u.url, fit: "cover" } })}
              className="group relative overflow-hidden rounded-lg border transition-transform hover:scale-[1.03] active:scale-[0.97]"
            >
              <img src={u.url} alt={u.name} className="aspect-square w-full object-cover" />
              <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-xs font-medium text-white group-hover:flex">
                Place
              </span>
            </button>
          ))}
        </div>
      )}
    </Section>
  );
}
