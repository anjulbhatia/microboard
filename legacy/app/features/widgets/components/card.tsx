import { Markdown } from "@/features/widgets/components/markdown";
import type { Widget } from "@/features/board/types";

export function CardWidget({ widget }: { widget: Widget }) {
  const title = String(widget.props?.title ?? "Card title");
  const body = String(widget.props?.body ?? "Add a short description here.");
  const stat = String(widget.props?.stat ?? "");
  return (
    <div className="space-y-2">
      {stat && <p className="text-3xl font-bold tracking-tight">{stat}</p>}
      <h4 className="font-semibold">{title}</h4>
      <Markdown text={body} className="text-muted-foreground" />
    </div>
  );
}
