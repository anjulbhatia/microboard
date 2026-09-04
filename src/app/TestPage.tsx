import { WIDGET_REGISTRY } from "@/widgets/registry";
import { ICON_CHOICES } from "@/widgets/icons";
import type { Widget, WidgetType } from "@/types/board";

let n = 0;
const fake = (type: WidgetType, props: Record<string, string | number> = {}, title = ""): Widget => ({
  id: `test-${n++}`,
  type,
  title: title || WIDGET_REGISTRY[type].label,
  size: "1x1",
  props: { ...WIDGET_REGISTRY[type].defaults.props, ...props },
});

const ORDER: WidgetType[] = ["textbox", "heading", "shape", "icon", "image", "board", "card"];

export function TestPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Widget packages</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">test route · content / media / board kinds</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {ORDER.map((type) => {
          const meta = WIDGET_REGISTRY[type];
          const Body = meta.render;
          return (
            <div key={type} className="col-span-12 rounded-xl border bg-card p-4 sm:col-span-6 lg:col-span-4">
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">{meta.label}</p>
              <Body widget={fake(type)} />
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">icon choices</p>
        <div className="flex flex-wrap gap-4">
          {Object.keys(ICON_CHOICES).map((name) => {
            const meta = WIDGET_REGISTRY.icon;
            const Body = meta.render;
            return (
              <div key={name} className="flex w-16 flex-col items-center gap-1">
                <Body widget={fake("icon", { icon: name, size: 28 })} />
                <span className="font-mono text-[10px] text-muted-foreground">{name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 rounded-xl border bg-card p-4 lg:col-span-6">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">board · 3:4</p>
          {(() => {
            const Body = WIDGET_REGISTRY.board.render;
            return <Body widget={fake("board", { ratio: "3:4", label: "Portrait board" })} />;
          })()}
        </div>
        <div className="col-span-12 rounded-xl border bg-card p-4 lg:col-span-6">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">image · with src</p>
          {(() => {
            const Body = WIDGET_REGISTRY.image.render;
            return <Body widget={fake("image", { src: "https://picsum.photos/seed/microboard/640/360", fit: "cover" })} />;
          })()}
        </div>
      </div>
    </div>
  );
}
