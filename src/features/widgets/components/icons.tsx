import { HugeiconsIcon } from "@hugeicons/react";
import {
  BotIcon,
  ChartColumnIcon,
  CleanIcon,
  Grid2X2Icon,
  Shield01Icon,
  SparklesIcon,
  Sun03Icon,
  Table01Icon,
  Tick02Icon,
  Upload01Icon,
  ZapIcon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import type { Widget } from "@/types/board";

export const ICON_CHOICES = {
  Sparkles: SparklesIcon,
  Chart: ChartColumnIcon,
  Table: Table01Icon,
  Grid: Grid2X2Icon,
  Bot: BotIcon,
  Upload: Upload01Icon,
  Clean: CleanIcon,
  Zap: ZapIcon,
  Shield: Shield01Icon,
  Globe: Globe02Icon,
  Check: Tick02Icon,
  Sun: Sun03Icon,
} as const;

export type IconChoice = keyof typeof ICON_CHOICES;

export function IconsWidget({ widget }: { widget: Widget }) {
  const name = String(widget.props?.icon ?? "Sparkles") as IconChoice;
  const size = Number(widget.props?.size ?? 32);
  const icon = ICON_CHOICES[name] ?? SparklesIcon;
  return (
    <div className="flex items-center justify-center py-2 text-primary">
      <HugeiconsIcon icon={icon} size={Number.isFinite(size) ? size : 32} strokeWidth={1.5} />
    </div>
  );
}
