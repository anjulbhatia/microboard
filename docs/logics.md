# Logics — data layer

> Living doc. Updated as the logic layer grows. UI stays in
> `src/components/*`, route composition in `src/pages/*`.

## 1. Map

```text
src/lib/data-providers/   ingest: wherever the data is, we retrieve it
  types.ts                TabularData { columns, rows }, CellValue, toRecords()
  csv.ts                  comma CSV text → TabularData
  clipboard.ts            pasted text → TabularData (tab/comma/semicolon/colon/space, auto-detected)
  excel.ts                .xlsx File → TabularData (read-excel-file, first sheet)
  sheet.ts                public Google Sheets link → CSV export → TabularData
  manual.ts               in-app grid ({headers, grid}) → TabularData
  index.ts                providerForFile(name), re-exports

src/lib/transform/         JSON-reproducible operations (human + agent share these)
  types.ts                Dataset { columns, rows }, OpDef, cleanValue/cleanRows
  get_data.ts             get_data op (all providers)
  transform_data.ts       transform_data op (Arquero engine)
  inspect_data.ts         inspect_data op (types, nulls, samples)
  inline.ts               inline string form: `op --key value`
  index.ts                runOp(name, args), runInline(cmd), opSpecs()

src/lib/data-utils.ts     UI-side replay (filter/select/rename/dropNulls/sort/groupBy)
                          + SAMPLE_CSV + downloadJSON. Works today; migrates
                          onto dataops (same semantics) when the UI needs
                          derive/Arquero power.
```

## 2. Providers

Every provider returns `TabularData` — `{ columns: string[], rows: CellValue[][] }`
where `CellValue = string | number | boolean | null`. Empty cells are `null`,
never `""`. `toRecords()` converts to the string records the board store keeps.

| Provider | Entry | Notes |
| -------- | ----- | ----- |
| csv | `csvFromText(text)` | quote-aware comma parse |
| clipboard | `clipboardFromText(text, sep?)` | auto-detects tab `,` `;` `:` whitespace runs; numerics become numbers |
| excel | `excelFromFile(file)` | first sheet; header row + data rows; `Date` → ISO |
| gsheet | `sheetFromUrl(url)` | `docs.google.com/spreadsheets/d/{id}` → CSV export; throws if not public |
| manual | `manualFromGrid(headers, grid)` | trims empty trailing rows/cols |
| sample | `SAMPLE_CSV` | 12-row demo set |

File-type routing: `providerForFile(name)` → `csv | excel`, else throws.
A dedicated upload modal (all providers in one place) is still to come.

## 3. Ops (`dataops`)

One registry, two spellings, identical JSON semantics:

```ts
runOp("get_data", { type: "csv", text })          // in-function form
runInline('get_data --type csv --text "..."')     // inline form
```

- `Dataset` is the wire type: `{ columns, rows }`. Serializable, replayable.
- `runOp` / `runInline` live in `src/lib/dataops/index.ts`; `opSpecs()`
  exposes every op's name, description, and params for agents.
- `get_data` params: `type` (csv|clipboard|excel|gsheet|manual|sample),
  `text`, `sep`, `url`, `headers`, `grid`, `file`. `file` (a `File` object)
  is in-function only — it cannot travel as inline/JSON.
- `transform_data` params: `data`, `op`
  (filter|select|rename|dropNulls|sort|groupBy|derive), plus per-op keys:
  `column`, `cond` (==|!=|contains|>|<|>=|<=), `value`, `columns`, `to`,
  `dir`, `agg` (sum|count|average|min|max), `target`, `into`, `fn` (+|-|*|/),
  `right` (column or number).
- `inspect_data` params: `data`, `sample` (default 5). Returns a summary
  table (column, type, nulls, rows) followed by sample rows.

## 4. Engine: Arquero + custom

`transform_data` runs on [Arquero](https://uwdata.github.io/arquero/)
(`aq.from` → verbs → `.objects()`):

| Op | Arquero | Custom |
| -- | ------- | ------ |
| filter | `filter` + `escape` predicates | condition compiler (`cond` → predicate) |
| select | `select` | — |
| rename | `rename` | — |
| dropNulls | `filter` + `escape` | null/empty semantics |
| sort | `orderby` / `orderby(desc())` | — |
| groupBy | `groupby` + `rollup` | temp-column funnel (rollup bodies are AST-parsed, so dynamic member access is illegal — target funnels through `__v__`, then a literal is used) |
| derive | `derive` + `escape` | arithmetic compiler (`fn`, column-or-number `right`) |

Entry normalization (`cleanValue`): `""` → `null`, numeric strings →
numbers (documented tradeoff: `"001"` becomes `1`). Arquero then infers
real column types, so sorts and aggregations behave.

Custom code owns everything Arquero cannot express: separators, File/URL
fetching, grid trimming, condition/arithmetic compilers, inline parsing.

## 5. Reproducibility contract

- Same `Dataset` in → same `Dataset` out. No wall-clock, no randomness.
- Every op validates args and throws `Error` with an actionable message.
- The board store keeps string records; ops speak `unknown` values.
  Convert at the boundary (`toRecords` / coercion), never inside verbs.
- `docs/guide_webmcp.md` is the runnable catalog: every op with inline,
  in-function, and JSON forms.
