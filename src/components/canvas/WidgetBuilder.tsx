import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { useBoard, WIDGET_PRESETS, WIDGET_TYPES } from "@/lib/board-store";
import { Btn, CSelect } from "@/components/canvas/controls";
import { clampSpan, WIDGET_REGISTRY } from "@/widgets/registry";
import type { WidgetBuilderProps } from "@/app/create/interface";
import type { WidgetType } from "@/types/board";

export function WidgetBuilder({ columns, hasData, chartOnly, gridCols }: WidgetBuilderProps) {
  const addWidget = useBoard((s) => s.addWidget);
  const kinds = WIDGET_TYPES.filter((t) => WIDGET_REGISTRY[t.value].needsData === chartOnly);
  const [wType, setWType] = useState<WidgetType>(kinds[0]?.value ?? "textbox");
  const [wX, setWX] = useState("");
  const [wY, setWY] = useState("");
  const [preset, setPreset] = useState(1);
  const meta = WIDGET_REGISTRY[wType] ?? WIDGET_REGISTRY.textbox;

  const pickType = (t: WidgetType) => {
    setWType(t);
  };

  const submit = () => {
    if (meta.needsData && !hasData) return;
    const x = wX || columns[0] || "";
    const y = wY || columns[0] || "";
    const span = clampSpan(wType, preset < 0 ? meta.defaultSpan : WIDGET_PRESETS[preset], gridCols);
    addWidget({
      type: wType,
      title: meta.needsData ? `${meta.label} · ${y || x}` : meta.defaults.title,
      x: meta.needsData ? x : undefined,
      y: meta.needsData ? y : undefined,
      w: span.w,
      h: span.h,
      props: { ...meta.defaults.props },
    });
  };

  return (
    <div className="space-y-2">
      <CSelect
        label="Widget type"
        value={wType}
        onChange={(v) => pickType(v as WidgetType)}
        options={kinds.map((t) => ({ value: t.value, label: t.label }))}
      />
      {meta.needsData && wType !== "table" && (
        <div className="flex gap-2">
          <CSelect
            label="X column"
            value={wX}
            onChange={setWX}
            emptyLabel="x: auto"
            options={columns.map((c) => ({ value: c, label: c }))}
          />
          <CSelect
            label="Y column"
            value={wY}
            onChange={setWY}
            emptyLabel="y: auto"
            options={columns.map((c) => ({ value: c, label: c }))}
          />
        </div>
      )}
      <CSelect
        label="Widget size"
        value={String(preset)}
        onChange={(v) => setPreset(Number(v))}
        options={[
          { value: "-1", label: `Default (${meta.defaultSpan.w}×${meta.defaultSpan.h})` },
          ...WIDGET_PRESETS.map((s, i) => ({ value: String(i), label: s.label })),
        ]}
      />
      <Btn primary onClick={submit} className="w-full">
        <span className="inline-flex items-center justify-center gap-1">
          <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} />
          Add {chartOnly ? "chart" : "widget"}
        </span>
      </Btn>
    </div>
  );
}
