import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Plain text stays plain; markdown renders rich. */
export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
