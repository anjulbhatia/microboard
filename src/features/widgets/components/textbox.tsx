import { Markdown } from "@/widgets/Markdown";
import type { Widget } from "@/types/board";

export function TextboxWidget({ widget }: { widget: Widget }) {
  const text = String(widget.props?.text ?? "Add some text…");
  return <Markdown text={text} />;
}
