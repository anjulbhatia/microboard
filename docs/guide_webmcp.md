# WebMCP ops guide — data

> Every operation below runs three identical ways. Pick one; the JSON is
> the contract the other two compile to.
>
> - **Inline:** `get_data --type csv --text "a,b\n1,2"`
> - **In-function:** `runOp("get_data", { type: "csv", text: "a,b\n1,2" })`
> - **JSON:** `{ "op": "get_data", "args": { "type": "csv", "text": "a,b\n1,2" } }`
>
> Dataset wire type: `{ "columns": [...], "rows": [{...}, ...] }`.
> Chain by feeding one op's output `Dataset` into the next op's `data`.

## get_data

Load from anywhere. `file` (a `File` object) works in-function only.

Inline:

```sh
get_data --type sample
get_data --type csv --text "month,visitors\nJan,1860"
get_data --type clipboard --text "month\tvisitors\nJan\t1860"
get_data --type clipboard --sep semicolon --text "month;visitors\nJan;1860"
get_data --type gsheet --url "https://docs.google.com/spreadsheets/d/ABC123/edit"
```

In-function:

```ts
import { runOp } from "@/lib/transform";

const d = await runOp("get_data", { type: "sample" });
// { columns: ["month","channel","visitors","signups"], rows: [...] (12) }
```

JSON:

```json
{ "op": "get_data", "args": { "type": "clipboard", "sep": "tab", "text": "a\tb\n1\tx" } }
```

## transform_data

Verbs: `filter | select | rename | dropNulls | sort | groupBy | derive | header | dropDuplicates | fill | flashfill`.

Inline:

```sh
transform_data --op filter --column visitors --cond ">" --value 1000
transform_data --op select --columns "month,visitors"
transform_data --op rename --column visitors --to hits
transform_data --op dropNulls --column __all__
transform_data --op sort --column visitors --dir desc
transform_data --op groupBy --column channel --agg sum --target visitors
transform_data --op derive --into double --column signups --fn "*" --right 2
transform_data --op header
transform_data --op dropDuplicates
transform_data --op dropDuplicates --columns "month,channel"
transform_data --op fill --column visitors --mode value --value 0
transform_data --op fill --column visitors --mode down
transform_data --op flashfill --column month --into short --example "J"
transform_data --op replace --column month --find "Jan" --with "January"
```

Note: every inline call also needs `--data '{...}'` with the input dataset
(use `toInline(name, args)` to serialize). In-function form:

```ts
const d0 = await runOp("get_data", { type: "sample" });

const filtered = await runOp("transform_data", {
  data: d0, op: "filter", column: "visitors", cond: ">", value: "1000",
}); // 6 rows

const grouped = await runOp("transform_data", {
  data: d0, op: "groupBy", column: "channel", agg: "sum", target: "visitors",
});
// [{ channel: "organic", sum_visitors: 9020 }, ...]

const derived = await runOp("transform_data", {
  data: d0, op: "derive", into: "dbl", column: "signups", fn: "*", right: "2",
});
```

JSON:

```json
{
  "op": "transform_data",
  "args": { "op": "groupBy", "column": "channel", "agg": "sum", "target": "visitors" }
}
```

(`data` travels alongside in real calls; omitted here for brevity.)

Param keys: `data*`, `op*`, `column`, `cond` (==|!=|contains|>|<|>=|<=),
`value`, `columns` (comma list), `to`, `dir` (asc|desc), `agg`
(sum|count|average|min|max), `target`, `into`, `fn` (+|-|*|/), `right`
(column name or number). `*` required.

## inspect_data

Inline:

```sh
inspect_data --sample 2
```

In-function:

```ts
const report = await runOp("inspect_data", { data: d0, sample: 2 });
// summary rows (column, type, nulls, rows) + first 2 data rows
```

## Chained recipe (JSON)

```json
[
  { "op": "get_data", "args": { "type": "sample" }, "as": "d0" },
  { "op": "transform_data", "args": { "op": "filter", "column": "visitors", "cond": ">", "value": "1000" }, "in": "d0", "as": "d1" },
  { "op": "transform_data", "args": { "op": "groupBy", "column": "channel", "agg": "sum", "target": "visitors" }, "in": "d1", "as": "d2" },
  { "op": "inspect_data", "args": { "sample": 3 }, "in": "d2" }
]
```

`as`/`in` are recipe-level bindings (runner sugar, not op params).
Each step's output is a plain `Dataset` — paste it into the next call.
