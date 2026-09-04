import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { DitherButton } from "@/components/dither-kit/button";
import { HeaderIsland } from "@/app/landing/HeaderIsland";
import { DeviceMockup } from "@/app/landing/DeviceMockup";
import { LandingFooter } from "@/app/landing/LandingFooter";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const, delay: i * 0.12 },
  }),
};

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background">
      <HeaderIsland />

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-40 -right-24 size-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto grid min-h-svh max-w-6xl items-center gap-10 px-6 pt-24 pb-16 md:grid-cols-2">
          <div className="text-center md:text-left">
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs text-muted-foreground">
                <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={1.5} />
                data-to-dashboard workspace
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-5 text-5xl leading-[1.02] font-bold tracking-tight md:text-7xl"
            >
              Clean data.
              <br />
              Craft microcharts.
              <br />
              <span className="text-primary">Ship dashboards.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mx-auto mt-5 max-w-md text-lg text-muted-foreground md:mx-0"
            >
              You and your agent build on the same live canvas. Propose, approve,
              apply — every step deterministic, every chart earned.
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-7 flex items-center justify-center gap-3 md:justify-start"
            >
              <Link to="/create">
                <DitherButton color="purple" variant="gradient" className="px-7 py-3 text-sm">
                  Start creating
                </DitherButton>
              </Link>
              <Link to="/share">
                <DitherButton color="grey" variant="solid" className="px-7 py-3 text-sm">
                  View shared
                </DitherButton>
              </Link>
            </motion.div>
            <motion.a
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              href="#emerge"
              className="mt-10 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.5} className="animate-bounce" />
              scroll for the canvas
            </motion.a>
          </div>

          <DeviceMockup />
        </div>
      </section>

      <section id="emerge" className="relative mx-auto max-w-5xl scroll-mt-20 px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">one canvas</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            The board emerges <span className="text-primary">front and center</span>
          </h2>
          <div className="mt-10">
            <DeviceMockup large />
          </div>
        </motion.div>
      </section>

      <LandingFooter />
    </div>
  );
}
