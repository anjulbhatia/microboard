import type { Widget } from "@/types/board";

export function TextboxWidget({ widget }: { widget: Widget }) {
  const text = String(widget.props?.text ?? "Add some text…");
  return <p className="text-sm whitespace-pre-wrap">{text}</p>;
}
