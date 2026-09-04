import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartColumnIcon } from "@hugeicons/core-free-icons";

/** Isometric device sleeve — placeholder for the real interface shot. */
export function DeviceMockup({ large, flat }: { large?: boolean; flat?: boolean }) {
  return (
    <motion.div
      animate={flat ? undefined : { y: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{ perspective: 1500 }}
      className={large ? "mx-auto w-full max-w-3xl" : "mx-auto w-full max-w-md"}
    >
      <img src={"/proto.png"} className="w-full rounded-3xl border border-border" />
    </motion.div>
  );
}
