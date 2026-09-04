import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";

export function HeaderIsland() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 140);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={false}
      animate={show ? { y: 0, opacity: 1 } : { y: -90, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="fixed inset-x-0 top-4 z-50 mx-auto flex w-2/5 min-w-fit items-center justify-between gap-4 rounded-full border bg-background/70 py-2 pr-2 pl-5 shadow-lg backdrop-blur-xl"
    >
      <Link to="/" aria-label="Microboard home" className="font-display text-base tracking-[0.2em]">
        MICROBOARD
      </Link>
      <div className="flex items-center gap-2">
        <Link
          to="/create"
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Create new
        </Link>
        <button
          type="button"
          title="Sign in (soon)"
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={UserIcon} size={14} strokeWidth={1.5} />
          Sign in
        </button>
      </div>
    </motion.header>
  );
}
