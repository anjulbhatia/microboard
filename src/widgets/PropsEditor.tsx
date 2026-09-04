import type { Widget } from "@/types/board";
import { WIDGET_REGISTRY } from "@/widgets/registry";

const inputCls =
  "w-full rounded-md border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function PropsEditor({
  widget,
  onChange,
}: {
  widget: Widget;
  onChange: (props: Record<string, string | number>) => void;
}) {
  const meta = WIDGET_REGISTRY[widget.type];
  if (meta.fields.length === 0) return null;

  const set = (key: string, value: string | number) =>
    onChange({ ...widget.props, [key]: value });

  return (
    <div className="space-y-2 border-t pt-3">
      {meta.fields.map((field) => {
        const value = widget.props?.[field.key] ?? meta.defaults.props[field.key] ?? "";
        if (field.type === "textarea") {
          return (
            <div key={field.key} className="space-y-1">
              <label className="font-mono text-xs text-muted-foreground">{field.label}</label>
              <textarea
                value={String(value)}
                onChange={(e) => set(field.key, e.target.value)}
                rows={3}
                className={inputCls}
              />
            </div>
          );
        }
        if (field.type === "select" || field.type === "icon") {
          return (
            <div key={field.key} className="space-y-1">
              <label className="font-mono text-xs text-muted-foreground">{field.label}</label>
              <select value={String(value)} onChange={(e) => set(field.key, e.target.value)} className={inputCls}>
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          );
        }
        if (field.type === "color") {
          return (
            <div key={field.key} className="space-y-1">
              <label className="font-mono text-xs text-muted-foreground">{field.label}</label>
              <div className="flex gap-1.5">
                {field.options?.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    title={o.label}
                    aria-label={o.label}
                    onClick={() => set(field.key, o.value)}
                    className={`size-7 rounded-md border-2 transition-transform hover:scale-110 ${
                      value === o.value ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: o.value }}
                  />
                ))}
              </div>
            </div>
          );
        }
        if (field.type === "number") {
          return (
            <div key={field.key} className="space-y-1">
              <label className="font-mono text-xs text-muted-foreground">{field.label}</label>
              <input
                type="number"
                value={Number(value)}
                onChange={(e) => set(field.key, Number(e.target.value))}
                className={inputCls}
              />
            </div>
          );
        }
        return (
          <div key={field.key} className="space-y-1">
            <label className="font-mono text-xs text-muted-foreground">{field.label}</label>
            <input
              value={String(value)}
              onChange={(e) => set(field.key, e.target.value)}
              className={inputCls}
            />
          </div>
        );
      })}
    </div>
  );
}
