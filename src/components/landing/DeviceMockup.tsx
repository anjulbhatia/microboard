import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartColumnIcon } from "@hugeicons/core-free-icons";

const BARS = [38, 62, 45, 80, 56, 92, 70, 50, 76, 64];

/** Isometric device sleeve — placeholder for the real interface shot. */
export function DeviceMockup({ large, flat }: { large?: boolean; flat?: boolean }) {
  return (
    <motion.div
      animate={flat ? undefined : { y: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{ perspective: 1200 }}
      className={large ? "mx-auto w-full max-w-2xl" : "mx-auto w-full max-w-md"}
    >
      <div
        className="rounded-2xl border bg-card p-3 shadow-2xl shadow-primary/10"
        style={{ transform: flat || large ? "none" : "rotateX(52deg) rotateZ(-38deg)", transformStyle: "preserve-3d" }}
      >
        <div className="rounded-xl border bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-muted-foreground/40" />
              <span className="size-2.5 rounded-full bg-muted-foreground/40" />
              <span className="size-2.5 rounded-full bg-muted-foreground/40" />
            </div>
            <div className="h-5 flex-1 rounded-md bg-muted/60" />
          </div>
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-dashed p-3">
            <HugeiconsIcon icon={ChartColumnIcon} size={22} strokeWidth={1.5} className="text-primary" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-32 rounded bg-muted-foreground/30" />
              <div className="h-2 w-20 rounded bg-muted-foreground/20" />
            </div>
          </div>
          <div className="flex h-28 items-end gap-1.5">
            {BARS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-primary/70"
                style={{ height: `${h}%`, opacity: 0.45 + (h / 100) * 0.55 }}
              />
            ))}
          </div>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            interface preview
          </p>
        </div>
      </div>
    </motion.div>
  );
}
