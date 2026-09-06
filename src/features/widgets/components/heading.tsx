import type { Widget } from "@/types/board";

const LEVELS: Record<string, string> = {
  "1": "text-3xl font-bold tracking-tight",
  "2": "text-2xl font-bold tracking-tight",
  "3": "text-xl font-semibold",
};

export function HeadingWidget({ widget }: { widget: Widget }) {
  const text = String(widget.props?.text ?? "Heading");
  const level = String(widget.props?.level ?? "2");
  const cls = LEVELS[level] ?? LEVELS["2"];
  if (level === "1") return <h1 className={cls}>{text}</h1>;
  if (level === "3") return <h3 className={cls}>{text}</h3>;
  return <h2 className={cls}>{text}</h2>;
}
