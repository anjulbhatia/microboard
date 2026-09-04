import { MICRO_FAMILIES, MICRO_REGISTRY } from "@/widgets/charts/micro/registry";
import type { MicroDef } from "@/widgets/charts/micro/types";

function ChartCard({ def }: { def: MicroDef }) {
  const Body = def.Component;
  return (
    <div className="flex flex-col rounded-xl border bg-card p-4">
      <div className="flex min-h-20 flex-1 items-center justify-center py-2">
        <div className="w-full max-w-55">
          <Body {...def.sample} />
        </div>
      </div>
      <h3 className="mt-2 font-semibold">{def.title}</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">{def.blurb}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Use: </span>
        {def.use}
      </p>
      <pre className="mt-2 overflow-x-auto rounded-md bg-muted/60 p-2 font-mono text-[11px] text-muted-foreground">
        {def.dataShape}
      </pre>
    </div>
  );
}

export function ChartsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Micro charts</h1>
        <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
          33 word-sized abstracts. Pure functions of data, theme-aware, no dependencies.
          Humans pick them, agents specify them as JSON — see <span className="font-mono">docs/ChartMicro.md</span>.
        </p>
      </div>
      {MICRO_FAMILIES.map((family) => (
        <section key={family}>
          <h2 className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">{family}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(MICRO_REGISTRY)
              .filter((d) => d.family === family)
              .map((d) => (
                <ChartCard key={d.id} def={d} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
