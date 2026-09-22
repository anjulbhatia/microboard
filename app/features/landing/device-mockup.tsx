import { motion } from "motion/react";

/** Isometric device sleeve — placeholder for the real interface shot. */
export function DeviceMockup({ large, flat }: { large?: boolean; flat?: boolean }) {
  return (
    <motion.div
      animate={flat ? undefined : { y: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{ perspective: 1500 }}
      className={large ? "mx-auto w-full max-w-3xl" : "mx-auto w-full max-w-md"}
    >
      <img
        src={"/proto.png"}
        className="corner-brackets w-full rounded-3xl border border-border shadow-2xl ring-1 ring-foreground/10"
      />
    </motion.div>
  );
}
