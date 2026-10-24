import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
      >
        <HugeiconsIcon icon={Sun03Icon} size={20} strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
    >
      <HugeiconsIcon
        icon={Sun03Icon}
        size={20}
        strokeWidth={1.5}
        className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      <HugeiconsIcon
        icon={Moon02Icon}
        size={20}
        strokeWidth={1.5}
        className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
    </button>
  );
}
