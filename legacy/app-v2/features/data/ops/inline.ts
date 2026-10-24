/** Inline form: `op_name --key value --key "quoted value" --n 5 --flag`. */

export interface InlineCall {
  name: string;
  args: Record<string, unknown>;
}

function coerce(raw: string): unknown {
  if (/^(true|false)$/.test(raw)) return raw === "true";
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (/^[{[].*[}\]]$/.test(raw)) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export function parseInline(cmd: string): InlineCall {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3]);
  }
  if (tokens.length === 0) throw new Error("Empty command.");
  const name = tokens[0];
  const args: Record<string, unknown> = {};
  let i = 1;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (!tok.startsWith("--")) throw new Error(`Expected --key, got "${tok}".`);
    const key = tok.slice(2);
    const next = tokens[i + 1];
    if (next == null || next.startsWith("--")) {
      args[key] = true;
      i += 1;
    } else {
      args[key] = coerce(next);
      i += 2;
    }
  }
  return { name, args };
}

/** Function form is native: runOp("get_data", { type: "csv", text }) — see index. */
export function toInline(name: string, args: Record<string, unknown>): string {
  const parts = [name];
  for (const [k, v] of Object.entries(args)) {
    const s = typeof v === "string" && /\s/.test(v) ? `"${v}"` : JSON.stringify(v) ?? String(v);
    parts.push(`--${k} ${typeof v === "string" && !/\s/.test(v) ? v : s}`);
  }
  return parts.join(" ");
}
