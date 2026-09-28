import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BotIcon,
  ChartColumnIcon,
  CleanIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";

/**
 * Landing — single file, single route.
 * PowerBI rules: Z-pattern (KPI top-left → trend → detail),
 * 8px grid, one accent, nothing loads except this file.
 * Canva rules: plain top bar, plain hero, plain cards. No scroll-jack.
 */

const FEATURES = [
  { icon: Upload01Icon, title: "Any source", body: "CSV, Excel, or Sheets. Columns detected on drop." },
  { icon: CleanIcon, title: "Deterministic steps", body: "Filter, group, sort. Same input, same board." },
  { icon: ChartColumnIcon, title: "Microcharts", body: "KPI, table, area, bar — one visual language." },
  { icon: BotIcon, title: "Agent loop", body: "Agent proposes, you approve. Nothing applies itself." },
] as const;

const STEPS = [
  { n: "01", title: "Load data", body: "Drop a file or paste a sheet link." },
  { n: "02", title: "Transform", body: "Stack replayable steps, no formulas." },
  { n: "03", title: "Visualize", body: "KPIs on top, trends middle, details bottom." },
  { n: "04", title: "Share", body: "Live link or JSON export. Done." },
] as const;

const KPIS = [
  { label: "Revenue", value: "$48.2k", delta: "+12.4%" },
  { label: "Orders", value: "1,284", delta: "+8.1%" },
  { label: "Churn", value: "2.1%", delta: "-0.6%" },
] as const;

const BARS = [34, 52, 44, 68, 58, 82, 74, 96, 88, 64, 78, 92];

function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
        <Link to="/" aria-label="Microboard home" className="font-display text-sm tracking-[0.2em]">
          MICROBOARD
        </Link>
        <nav aria-label="Product" className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
          <Link to="/showcase" className="transition-colors hover:text-foreground">Showcase</Link>
        </nav>
        <span className="flex-1" />
        <Link
          to="/home"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
        <Link
          to="/new"
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start creating
        </Link>
      </div>
    </header>
  );
}

function BoardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-muted-foreground/30" aria-hidden />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" aria-hidden />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" aria-hidden />
        <p className="ml-2 truncate text-xs font-medium text-muted-foreground">Q3 revenue — live board</p>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-xl bg-muted/50 p-3">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{k.label}</p>
            <p className="mt-0.5 text-lg font-bold tracking-tight tabular-nums">{k.value}</p>
            <p className="text-[11px] font-medium text-primary tabular-nums">{k.delta}</p>
          </div>
        ))}
      </div>
      <div className="px-4 pb-2">
        <div className="flex h-24 items-end gap-1.5 rounded-xl border bg-background p-3" aria-hidden>
          {BARS.map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-sm ${i === 7 ? "bg-primary" : "bg-primary/25"}`}
            />
          ))}
        </div>
      </div>
      <div className="p-4 pt-2">
        <div className="overflow-hidden rounded-xl border text-xs">
          {["Acme Corp · $12,400 · Won", "Globex · $9,850 · Review", "Initech · $7,120 · Won"].map((row, i) => (
            <p key={row} className={`px-3 py-2 font-mono tabular-nums ${i % 2 === 1 ? "bg-muted/50" : ""}`}>
              {row}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <TopBar />

      <main>
        {/* Hero — Z-pattern: message left, board right */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pt-14 pb-10 lg:grid-cols-2 lg:pt-20">
          <div>
            <p className="inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide text-muted-foreground">
              CSV → live board in minutes
            </p>
            <h1 className="mt-4 text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-5xl">
              From raw data to a board worth sharing.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Load a file, stack a few transforms, place KPIs and charts on a live
              canvas. Your agent works on the same board — you approve everything.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/new"
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Start creating — free
              </Link>
              <Link
                to="/showcase"
                className="rounded-lg border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                View showcase
              </Link>
            </div>
            <p className="mt-4 font-mono text-[11px] text-muted-foreground">
              No signup to try · deterministic transforms · live links
            </p>
          </div>
          <Reveal>
            <BoardPreview />
          </Reveal>
        </section>

        {/* Sources strip */}
        <section aria-label="Inputs" className="border-y bg-card/40">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-6 py-4 font-mono text-xs text-muted-foreground">
            <span className="uppercase tracking-widest">Inputs</span>
            <span>CSV</span>
            <span>Excel</span>
            <span>Google Sheets</span>
            <span>Paste table</span>
            <span>Agent-assisted</span>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-16">
          <Reveal>
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Features</p>
            <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight">
              Everything between raw data and a shipped board
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="h-full rounded-xl border bg-card p-4">
                  <HugeiconsIcon icon={f.icon} size={20} strokeWidth={1.5} className="text-primary" />
                  <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How */}
        <section id="how" className="border-t bg-card/40 scroll-mt-14">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <Reveal>
              <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">How it works</p>
            </Reveal>
            <div className="mt-6 grid gap-8 md:grid-cols-4">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.06}>
                  <p className="font-display text-3xl text-primary tabular-nums">{s.n}</p>
                  <h3 className="mt-2 text-sm font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </Reveal>
              ))}
            </div>
            <div className="mt-10">
              <Link
                to="/new"
                className="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Open the canvas
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center">
          <div>
            <p className="font-display text-sm tracking-[0.2em]">MICROBOARD</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              A data-to-dashboard workspace. Clean data, craft microcharts, ship dashboards.
            </p>
          </div>
          <span className="flex-1" />
          <nav aria-label="Footer" className="flex items-center gap-5 text-sm">
            <Link to="/new" className="font-medium text-primary hover:underline">Create</Link>
            <Link to="/showcase" className="text-muted-foreground transition-colors hover:text-foreground">Showcase</Link>
            <Link to="/home" className="text-muted-foreground transition-colors hover:text-foreground">Home</Link>
          </nav>
        </div>
        <p className="border-t py-4 text-center font-mono text-[11px] text-muted-foreground">
          clean data · craft microcharts · ship dashboards
        </p>
      </footer>
    </div>
  );
}
