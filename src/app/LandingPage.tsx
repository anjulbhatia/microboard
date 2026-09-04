import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BotIcon,
  ChartColumnIcon,
  CleanIcon,
  SparklesIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { DitherButton } from "@/components/dither-kit/button";
import { HeaderIsland } from "@/app/landing/HeaderIsland";
import { DeviceMockup } from "@/app/landing/DeviceMockup";
import { LandingFooter } from "@/app/landing/LandingFooter";

const FEATURES = [
  { icon: Upload01Icon, title: "Any source", body: "CSV, Excel, Google Sheets, or type it in — landed in seconds." },
  { icon: CleanIcon, title: "Deterministic steps", body: "Filter, group, sort. Every transform replayable, versioned." },
  { icon: ChartColumnIcon, title: "Dithered charts", body: "Area, bar, micro sparklines with ordered-dither fills." },
  { icon: BotIcon, title: "Agent loop", body: "Propose, approve, apply — human keeps final authority." },
];

const STEPS = [
  { n: "01", title: "Load data", body: "Drop a file or paste a sheet link. Columns detected instantly." },
  { n: "02", title: "Clean it", body: "Stack deterministic steps. Replay the same result every time." },
  { n: "03", title: "Chart it", body: "KPI, tables, dithered area and bar widgets on a live canvas." },
  { n: "04", title: "Share it", body: "Export JSON or publish a live link for anyone to open." },
];

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end end"] });

  const mockX = useTransform(scrollYProgress, [0, 1], ["14vw", "-16vw"]);
  const mockY = useTransform(scrollYProgress, [0, 1], ["20vh", "0vh"]);
  const mockScale = useTransform(scrollYProgress, [0, 1], [0.9, 1.3]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const textX = useTransform(scrollYProgress, [0, 0.45], ["0vw", "-8vw"]);

  return (
    <div className="min-h-svh bg-background">
      <HeaderIsland />

      <div ref={heroRef} className="relative h-[220svh]">
        <div className="sticky top-0 flex h-svh items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-12 items-center gap-6 px-6">
            <motion.div style={{ opacity: textOpacity, x: textX }} className="col-span-5">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs text-muted-foreground">
                <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={1.5} />
                data-to-dashboard
              </span>
              <h1 className="mt-4 text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-5xl">
                Clean data. Craft microcharts. <span className="text-primary">Ship dashboards.</span>
              </h1>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                You and your agent build on the same live canvas. Propose, approve, apply.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Link to="/create">
                  <DitherButton color="purple" variant="gradient" className="px-6 py-2.5 text-sm">
                    Start creating
                  </DitherButton>
                </Link>
                <Link to="/share">
                  <DitherButton color="grey" variant="solid" className="px-6 py-2.5 text-sm">
                    View shared
                  </DitherButton>
                </Link>
              </div>
            </motion.div>

            <div className="col-span-7">
              <motion.div style={{ x: mockX, y: mockY, scale: mockScale }}>
                <DeviceMockup flat large />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">features</p>
        <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight md:text-4xl">
          Everything between raw data and <span className="text-primary">a shipped board</span>
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-xl border bg-card p-4"
            >
              <HugeiconsIcon icon={f.icon} size={22} strokeWidth={1.5} className="text-primary" />
              <h3 className="mt-2 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">how it works</p>
          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <p className="font-display text-4xl text-primary">{s.n}</p>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/create">
              <DitherButton color="purple" variant="gradient" className="px-8 py-3 text-sm">
                Open the canvas
              </DitherButton>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
