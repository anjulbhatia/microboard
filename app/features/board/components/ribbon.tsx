import { useRef, useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ActivitySparkIcon,
  ArtboardIcon,
  ChartAnalysisIcon,
  ChartAreaIcon,
  ChartBarBigIcon,
  ChartColumnIcon,
  ChartLineIcon,
  ClipboardCopyIcon,
  CursorTextIcon,
  Database02Icon,
  Download01Icon,
  File01Icon,
  GoogleSheetIcon,
  GridIcon,
  Heading01Icon,
  Image01Icon,
  Layout01Icon,
  Link01Icon,
  PieChart01Icon,
  PlusSignIcon,
  ShapesIcon,
  SparklesIcon,
  Table01Icon,
} from "@hugeicons/core-free-icons";
import { useBoard } from "@/store/board";
import { BOARD_GRID, type WidgetType } from "@/features/board/types";
import { WIDGET_REGISTRY, clampSpan } from "@/features/widgets/registry";
import { MICRO_IDS, MICRO_REGISTRY } from "@/features/widgets/micro/registry";
import { applySteps, inferColumns, toNumber } from "@/features/data/lib/data-utils";
import { useDataLoader } from "@/features/data/use-data-loader";
import { useShare } from "@/features/share/use-share";
import { exportBoardImage, type BoardImageFormat } from "@/features/board/lib/export-board";
import { SaveStatus } from "@/features/board/components/controls";

/**
 * EXPERIMENTAL ribbon (Excel-style). May be rolled back — everything lives
 * here plus two lines in CreateLayout. Tabs: Home, Insert, Data, Share.
 */

type TabId = "home" | "insert" | "data" | "share";
const TABS: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "insert", label: "Insert" },
  { id: "data", label: "Data" },
  { id: "share", label: "Share" },
];

function defaultXY(): { x: string; y: string } {
  const b = useBoard.getState().board;
  const cleaned = applySteps(b.data.raw, b.steps);
  const cols = inferColumns(cleaned).map((c) => c.name);
  const x = cols[0] ?? "";
  const numeric = cols.find((c) => cleaned.some((r) => toNumber(r[c] ?? "") != null)) ?? cols[0] ?? "";
  return { x, y: numeric };
}

function addElement(type: WidgetType): void {
  const { addWidget } = useBoard.getState();
  const meta = WIDGET_REGISTRY[type];
  const span = clampSpan(type, meta.defaultSpan, BOARD_GRID.cols);
  addWidget({ type, title: meta.defaults.title, w: span.w, h: span.h, props: { ...meta.defaults.props } });
}

function addChart(type: WidgetType, chart?: string): void {
  const { addWidget } = useBoard.getState();
  const meta = WIDGET_REGISTRY[type];
  const span = clampSpan(type, meta.defaultSpan, BOARD_GRID.cols);
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
}

/** Excel-style ribbon button: icon over a short label, native tooltip. */
function RibbonBtn({
  label,
  tip,
  icon,
  onClick,
  disabled,
  active,
}: {
  label: string;
  tip: string;
  icon: typeof SparklesIcon;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tip}
      aria-label={tip}
      className={`flex w-14 shrink-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 transition-colors disabled:opacity-40 ${
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} />
      <span className="max-w-full truncate text-[10px] leading-none">{label}</span>
    </button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col">
      <div className="flex items-start gap-0.5">{children}</div>
      <p className="mt-1 text-center font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

/** Dropdown caret wrapper: popover menu under any ribbon button. */
function Menu({ label, tip, icon, children }: { label: string; tip: string; icon: typeof SparklesIcon; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={tip}
        aria-label={tip}
        aria-expanded={open}
        className={`flex w-14 flex-col items-center gap-1 rounded-md px-1 py-1.5 transition-colors ${
          open ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <span className="flex items-center gap-0.5">
          <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} />
          <span className={`font-mono text-[9px] transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
        </span>
        <span className="max-w-full truncate text-[10px] leading-none">{label}</span>
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-30" onClick={close} aria-hidden />
          <span className="absolute top-full left-0 z-40 mt-1 max-h-64 w-48 overflow-y-auto rounded-lg border bg-popover p-1 shadow-xl">
            {children(close)}
          </span>
        </>
      )}
    </div>
  );
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
  { type: "kpi", icon: ChartColumnIcon },
  { type: "spark", icon: ActivitySparkIcon },
  { type: "table", icon: Table01Icon },
  { type: "dither-area", icon: ChartAreaIcon },
  { type: "dither-bar", icon: ChartBarBigIcon },
  { type: "dither-line", icon: ChartLineIcon },
  { type: "dither-pie", icon: PieChart01Icon },
];

const SHAPES = ["square", "circle", "rounded rect", "rect", "arrow", "ellipse", "line"];

export function Ribbon({ onPanelToggle }: { onPanelToggle: () => void }) {
  const [tab, setTab] = useState<TabId>("home");
  const board = useBoard((s) => s.board);
  const { addPage, reset } = useBoard();
  const { busy, loadFile, loadPaste, loadSheet, loadApi, loadSample } = useDataLoader();
  const { status: publishStatus, publish } = useShare();
  const [dlBusy, setDlBusy] = useState<BoardImageFormat | null>(null);
  const [dlError, setDlError] = useState("");
  const [paste, setPaste] = useState("");
  const [url, setUrl] = useState("");
  const [urlKind, setUrlKind] = useState<"sheet" | "api" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasData = (board.data.raw?.length ?? 0) > 0;

  const download = async (format: BoardImageFormat) => {
    setDlError("");
    setDlBusy(format);
    try {
      await exportBoardImage(format, board.title);
    } catch (e) {
      setDlError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setDlBusy(null);
    }
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/share/${board.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      setDlError("Could not copy link.");
    }
  };

  return (
    <div className="shrink-0 rounded-2xl border bg-card px-3 pt-1.5 pb-2 shadow-sm">
      <div role="tablist" aria-label="Ribbon tabs" className="flex items-center gap-0.5 border-b border-border/60 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === t.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-2 hidden font-mono text-[9px] tracking-[0.14em] text-muted-foreground/70 uppercase sm:block">
          Experimental
        </span>
      </div>

      <div className="flex items-start gap-4 overflow-x-auto pt-1.5">
        {tab === "home" && (
          <>
            <Group label="Board">
              <RibbonBtn label="Sidebar" tip="Toggle components sidebar" icon={Layout01Icon} onClick={onPanelToggle} />
              <RibbonBtn label="Page" tip="Add a new canvas page" icon={PlusSignIcon} onClick={addPage} />
              <RibbonBtn
                label="Reset"
                tip="Reset board (clears widgets, steps, data)"
                icon={GridIcon}
                onClick={() => {
                  if (window.confirm("Reset this board? Widgets, steps and data are cleared.")) reset();
                }}
              />
            </Group>
            <Group label="Status">
              <span className="flex h-[52px] items-center px-2">
                <SaveStatus version={board.version} />
              </span>
            </Group>
          </>
        )}

        {tab === "insert" && (
          <>
            <Group label="Elements">
              {ELEMENTS.map(({ type, icon }) => (
                <RibbonBtn
                  key={type}
                  label={WIDGET_REGISTRY[type].label}
                  tip={`Insert ${WIDGET_REGISTRY[type].label}`}
                  icon={icon}
                  onClick={() => addElement(type)}
                />
              ))}
              <Menu label="Shapes" tip="Insert a shape" icon={ShapesIcon}>
                {(close) => (
                  <>
                    {SHAPES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        title={`Insert ${s} shape`}
                        onClick={() => {
                          const meta = WIDGET_REGISTRY.shape;
                          useBoard.getState().addWidget({
                            type: "shape",
                            title: "Shape",
                            w: meta.defaultSpan.w,
                            h: meta.defaultSpan.h,
                            props: { ...meta.defaults.props, shape: s },
                          });
                          close();
                        }}
                        className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs capitalize hover:bg-muted"
                      >
                        {s}
                      </button>
                    ))}
                  </>
                )}
              </Menu>
            </Group>
            <Group label="Charts">
              {CHARTS.map(({ type, icon }) => (
                <RibbonBtn
                  key={type}
                  label={WIDGET_REGISTRY[type].label.replace("Dither ", "")}
                  tip={hasData ? `Insert ${WIDGET_REGISTRY[type].label}` : "Upload data first (Data tab)"}
                  icon={icon}
                  disabled={!hasData}
                  onClick={() => addChart(type)}
                />
              ))}
              <Menu label="Micro" tip={hasData ? "Insert a micro chart" : "Upload data first (Data tab)"} icon={ChartAnalysisIcon}>
                {(close) => (
                  <>
                    {MICRO_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        title={MICRO_REGISTRY[id].blurb}
                        disabled={!hasData}
                        onClick={() => {
                          addChart("micro", id);
                          close();
                        }}
                        className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted disabled:opacity-40"
                      >
                        {MICRO_REGISTRY[id].title}
                      </button>
                    ))}
                  </>
                )}
              </Menu>
            </Group>
          </>
        )}

        {tab === "data" && (
          <>
            <Group label="Sources">
              <RibbonBtn label="File" tip="Upload .csv or .xlsx" icon={File01Icon} disabled={busy} onClick={() => fileRef.current?.click()} />
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  void loadFile(e.target.files);
                  e.target.value = "";
                }}
              />
              <RibbonBtn label="Sample" tip="Load the 12-row demo set" icon={Database02Icon} disabled={busy} onClick={() => void loadSample()} />
              <RibbonBtn label="Sheet" tip="Connect a public Google Sheet" icon={GoogleSheetIcon} disabled={busy} active={urlKind === "sheet"} onClick={() => setUrlKind((k) => (k === "sheet" ? null : "sheet"))} />
              <RibbonBtn label="API" tip="Connect a JSON endpoint" icon={Link01Icon} disabled={busy} active={urlKind === "api"} onClick={() => setUrlKind((k) => (k === "api" ? null : "api"))} />
            </Group>
            <Group label="Paste">
              <span className="flex items-start gap-1.5">
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  placeholder="month,visitors&#10;Jan,1860"
                  rows={2}
                  spellCheck={false}
                  aria-label="Pasted rows"
                  className="w-44 rounded-md border bg-background px-2 py-1 font-mono text-[11px] focus-visible:outline-none"
                />
                <RibbonBtn label="Load" tip="Load pasted rows" icon={ClipboardCopyIcon} onClick={() => {
                  if (loadPaste(paste)) setPaste("");
                }} />
              </span>
            </Group>
            {urlKind && (
              <Group label={urlKind === "sheet" ? "Sheet link" : "Endpoint"}>
                <span className="flex items-start gap-1.5">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={urlKind === "sheet" ? "Public sheet link…" : "https://api…/rows"}
                    spellCheck={false}
                    aria-label="Source URL"
                    className="w-52 rounded-md border bg-background px-2 py-1 font-mono text-[11px] focus-visible:outline-none"
                  />
                  <RibbonBtn
                    label="Go"
                    tip={urlKind === "sheet" ? "Connect sheet" : "Connect endpoint"}
                    icon={Link01Icon}
                    disabled={busy}
                    onClick={() => void (async () => {
                      const ok = urlKind === "sheet" ? await loadSheet(url) : await loadApi(url);
                      if (ok) {
                        setUrl("");
                        setUrlKind(null);
                      }
                    })()}
                  />
                </span>
              </Group>
            )}
          </>
        )}

        {tab === "share" && (
          <>
            <Group label="Download">
              {(["jpg", "png", "svg", "pdf"] as BoardImageFormat[]).map((f) => (
                <RibbonBtn
                  key={f}
                  label={dlBusy === f ? "…" : f.toUpperCase()}
                  tip={`Download board as ${f.toUpperCase()}`}
                  icon={Download01Icon}
                  disabled={dlBusy !== null}
                  onClick={() => void download(f)}
                />
              ))}
            </Group>
            <Group label="Link">
              <RibbonBtn label="Copy" tip="Copy share link" icon={Link01Icon} onClick={() => void copyLink()} />
              <RibbonBtn
                label={publishStatus === "publishing" ? "…" : "Publish"}
                tip="Publish board to a live link"
                icon={PlusSignIcon}
                disabled={publishStatus === "publishing"}
                onClick={() => void publish().catch(() => {})}
              />
            </Group>
            {dlError && <p className="self-center font-mono text-[11px] text-destructive">{dlError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
