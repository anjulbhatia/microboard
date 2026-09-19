import { Markdown } from "@/features/widgets/components/markdown";
import type { Widget } from "@/features/board/types";

export function TextboxWidget({ widget }: { widget: Widget }) {
  const text = String(widget.props?.text ?? "Add some text…");
  return <Markdown text={text} />;
}
