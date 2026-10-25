const app = new MicroboardApp(
  { name: "Microboard", version: "0.1.0" },
  {},
  { autoResize: true }
);

const root = document.getElementById("root");
const status = document.getElementById("status");

const state = {
  view: null,
  proposal: null,
  busy: false,
  error: null,
  message: null,
  connected: false,
  displayMode: "inline",
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function textContent(result) {
  if (!result || !Array.isArray(result.content)) return "";
  return result.content
    .filter((item) => item && item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function structured(result) {
  if (!result) return null;
  if (result.structuredContent) return result.structuredContent;
  return parseJson(textContent(result));
}

function resultError(result) {
  const value = structured(result);
  if (value && typeof value.error === "string") return value.error;
  return textContent(result) || "Tool failed.";
}

async function callTool(name, args) {
  const result = await app.callServerTool({ name, arguments: args || {} });
  if (result && result.isError) throw new Error(resultError(result));
  return structured(result) || {};
}

function humanError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/Version conflict/i.test(message)) {
    return `${message} Refresh the board, then ask the agent to re-propose.`;
  }
  return message;
}

function normalizeView(value) {
  if (!value || typeof value !== "object" || !value.board) return null;
  const board = value.board;
  const summary = value.summary || {
    id: board.id,
    title: board.title,
    version: board.version,
    rows: board.data && board.data.cleaned ? board.data.cleaned.length : 0,
    columns: board.data ? board.data.columns : [],
    steps: Array.isArray(board.steps) ? board.steps.length : 0,
    widgets: board.widgets ? Object.keys(board.widgets).length : 0,
    locks: Array.isArray(board.locks) ? board.locks : [],
  };
  const widgets = Array.isArray(value.widgets) ? value.widgets : [];
  const columns = Array.isArray(value.columns) ? value.columns : summary.columns || [];
  const sampleRows = Array.isArray(value.sampleRows)
    ? value.sampleRows
    : board.data && Array.isArray(board.data.cleaned)
      ? board.data.cleaned.slice(0, 5)
      : [];
  const steps = Array.isArray(value.steps)
    ? value.steps
    : Array.isArray(board.steps)
      ? board.steps
      : [];
  const boardWidgetCount =
    board.widgets && typeof board.widgets === "object" ? Object.keys(board.widgets).length : 0;
  return {
    board: {
      id: board.id,
      title: board.title,
      version: board.version,
      meta: board.meta,
    },
    summary,
    widgets,
    steps,
    columns,
    sampleRows,
    rows: typeof value.rows === "number" ? value.rows : summary.rows || 0,
    needsSvg: !Array.isArray(value.widgets) && boardWidgetCount > 0,
  };
}

function applyStructured(value) {
  const view = normalizeView(value);
  if (!view) return false;
  state.view = view;
  render();
  if (view.needsSvg && state.connected) void refresh(false);
  return true;
}

async function handleToolResult(params) {
  if (!params) return;
  state.busy = false;
  if (params.isError) {
    state.error = resultError(params);
    render();
    return;
  }
  const value = params.structuredContent || parseJson(textContent(params));
  if (!value) {
    render();
    return;
  }
  if (value.proposalId && (value.kind === "transform" || value.kind === "widget")) {
    state.proposal = {
      id: value.proposalId,
      baseVersion: value.baseVersion,
      kind: value.kind,
      detail: value.step || value.widget || null,
      preview: value.preview || null,
    };
    state.message = null;
    state.error = null;
    render();
    if (state.connected) void refresh(false);
    return;
  }
  if (applyStructured(value)) return;
  render();
}

async function reload() {
  const value = await callTool("get_board_view");
  const view = normalizeView(value);
  if (view) state.view = view;
}

async function refresh(showLoading) {
  if (showLoading) {
    state.busy = true;
    state.error = null;
    render();
  }
  try {
    await reload();
  } catch (error) {
    state.error = humanError(error);
  } finally {
    if (showLoading) state.busy = false;
    render();
  }
}

async function action(fn) {
  state.busy = true;
  state.error = null;
  state.message = null;
  render();
  try {
    const message = await fn();
    state.message = message || null;
  } catch (error) {
    state.error = humanError(error);
  } finally {
    state.busy = false;
    render();
  }
}

function approveProposal() {
  const proposal = state.proposal;
  if (!proposal) return;
  void action(async () => {
    await callTool(proposal.kind === "transform" ? "apply_transform" : "add_widget", {
      proposalId: proposal.id,
      expectedVersion: proposal.baseVersion,
    });
    state.proposal = null;
    await reload();
    return proposal.kind === "transform" ? "Transform applied." : "Widget added.";
  });
}

function rejectProposal() {
  const proposal = state.proposal;
  if (!proposal) return;
  void action(async () => {
    await callTool("reject_proposal", { proposalId: proposal.id });
    state.proposal = null;
    return "Proposal rejected.";
  });
}

function toggleLock(widget) {
  const version = state.view && state.view.board ? state.view.board.version : undefined;
  if (typeof version !== "number") return;
  void action(async () => {
    await callTool("lock_widget", {
      widgetId: widget.id,
      expectedVersion: version,
      locked: !widget.locked,
    });
    await reload();
    return widget.locked ? "Widget unlocked." : "Widget locked.";
  });
}

function toggleFullscreen() {
  const context = app.getHostContext();
  const current = (context && context.displayMode) || state.displayMode;
  const target = current === "fullscreen" ? "inline" : "fullscreen";
  if (!context || !Array.isArray(context.availableDisplayModes) || !context.availableDisplayModes.includes(target)) {
    return;
  }
  void action(async () => {
    const result = await app.requestDisplayMode({ mode: target });
    state.displayMode = result.mode;
    return null;
  });
}

function notice(kind, message) {
  const node = el("div", `notice ${kind}`, message);
  node.setAttribute("role", kind === "error" ? "alert" : "status");
  return node;
}

function statsText(view) {
  if (!view) return "Interactive board surface";
  const summary = view.summary;
  const locks = Array.isArray(summary.locks) ? summary.locks.length : 0;
  return `v${summary.version}  ·  ${summary.rows} rows  ·  ${summary.steps} steps  ·  ${summary.widgets} widgets  ·  ${locks} locked`;
}

function renderTop() {
  const top = el("header", "top");
  const titleWrap = el("div");
  const view = state.view;
  titleWrap.append(el("p", "eyebrow", "Microboard"));
  titleWrap.append(el("h1", "", view && view.board ? view.board.title : "Microboard"));
  titleWrap.append(el("p", "stats", statsText(view)));

  const toolbar = el("div", "toolbar");
  const refreshButton = el("button", "button ghost", state.busy ? "Refreshing…" : "Refresh");
  refreshButton.type = "button";
  refreshButton.disabled = state.busy;
  refreshButton.addEventListener("click", () => void refresh(true));
  toolbar.append(refreshButton);

  const context = app.getHostContext();
  const canFullscreen =
    context && Array.isArray(context.availableDisplayModes) && context.availableDisplayModes.includes("fullscreen");
  if (canFullscreen) {
    const currentMode = context.displayMode || state.displayMode;
    const fullscreenButton = el(
      "button",
      "button ghost",
      currentMode === "fullscreen" ? "Exit full screen" : "Full screen"
    );
    fullscreenButton.type = "button";
    fullscreenButton.disabled = state.busy;
    fullscreenButton.addEventListener("click", toggleFullscreen);
    toolbar.append(fullscreenButton);
  }

  top.append(titleWrap, toolbar);
  return top;
}

function proposalDetailText(proposal) {
  const detail = proposal.detail || {};
  if (proposal.kind === "transform") {
    const preview = proposal.preview || {};
    const rows =
      typeof preview.rowsBefore === "number" && typeof preview.rowsAfter === "number"
        ? `${preview.rowsBefore} → ${preview.rowsAfter} rows`
        : "";
    return [detail.type || "transform", detail.description || "", rows].filter(Boolean).join(" · ");
  }
  const widget = detail;
  const bindings = [widget.x, widget.y].filter(Boolean).join(" → ");
  return [widget.type || "widget", widget.title || "", bindings].filter(Boolean).join(" · ");
}

function renderProposal() {
  const proposal = state.proposal;
  const section = el("section", "proposal");
  const head = el("div", "proposal-head");
  head.append(el("span", "badge", "Pending"));
  head.append(el("strong", "", proposal.kind === "transform" ? "Transform proposal" : "Widget proposal"));
  section.append(head);
  section.append(
    el(
      "p",
      "proposal-meta",
      `Proposal ${proposal.id.slice(0, 8)}  ·  base v${proposal.baseVersion}`
    )
  );
  section.append(el("p", "proposal-detail", proposalDetailText(proposal)));

  if (proposal.preview && proposal.preview.svg) {
    const preview = el("div", "proposal-preview");
    preview.innerHTML = proposal.preview.svg;
    section.append(preview);
  }

  const detail = el("details");
  detail.append(el("summary", "", "Parameters"));
  detail.append(el("pre", "", JSON.stringify(proposal.detail || {}, null, 2)));
  section.append(detail);

  const actions = el("div", "actions");
  const approve = el("button", "button primary", state.busy ? "Working…" : "Approve");
  approve.type = "button";
  approve.disabled = state.busy;
  approve.addEventListener("click", approveProposal);
  const reject = el("button", "button danger", "Reject");
  reject.type = "button";
  reject.disabled = state.busy;
  reject.addEventListener("click", rejectProposal);
  actions.append(approve, reject);
  section.append(actions);
  return section;
}

function emptyState(title, message) {
  const box = el("div", "empty");
  box.append(el("strong", "", title));
  box.append(el("span", "", message));
  return box;
}

function sampleTable(columns, rows) {
  const names = columns.slice(0, 6).map((column) => (typeof column === "string" ? column : column.name));
  const wrap = el("div", "table-wrap");
  const table = el("table");
  const thead = el("thead");
  const headRow = el("tr");
  for (const name of names) headRow.append(el("th", "", name));
  thead.append(headRow);
  table.append(thead);
  const tbody = el("tbody");
  for (const row of rows) {
    const tr = el("tr");
    for (const name of names) {
      const value = row[name];
      tr.append(el("td", "", value === null || value === undefined ? "—" : String(value)));
    }
    tbody.append(tr);
  }
  table.append(tbody);
  wrap.append(table);
  return wrap;
}

function renderInspect(view) {
  const details = el("details", "inspect");
  details.append(
    el("summary", "", `Recipe · ${view.steps.length} steps · ${view.columns.length} columns · ${view.rows} rows`)
  );
  const grid = el("div", "inspect-grid");

  const stepsSection = el("section");
  stepsSection.append(el("h3", "", "Steps"));
  if (view.steps.length === 0) {
    stepsSection.append(el("p", "muted", "No steps yet. The board shows raw data."));
  } else {
    const list = el("ol", "steps");
    for (const step of view.steps) {
      const item = el("li");
      item.append(document.createTextNode(step.type || "step"));
      if (step.description) item.append(el("span", "", step.description));
      list.append(item);
    }
    stepsSection.append(list);
  }
  grid.append(stepsSection);

  const columnsSection = el("section");
  columnsSection.append(el("h3", "", "Columns"));
  if (view.columns.length === 0) {
    columnsSection.append(el("p", "muted", "No columns."));
  } else {
    const chips = el("ul", "chips");
    for (const column of view.columns) {
      const name = typeof column === "string" ? column : column.name;
      const type = typeof column === "string" ? "" : column.type;
      const nulls = typeof column === "string" ? 0 : column.nulls;
      const chip = el("li", "", name);
      if (type) {
        const meta = el("em", "", ` ${type}${nulls ? ` · ${nulls} null` : ""}`);
        chip.append(meta);
      }
      chips.append(chip);
    }
    columnsSection.append(chips);
  }
  grid.append(columnsSection);

  const sampleSection = el("section", "wide");
  sampleSection.append(el("h3", "", "Sample rows"));
  if (view.sampleRows.length === 0) {
    sampleSection.append(el("p", "muted", "No rows."));
  } else {
    sampleSection.append(sampleTable(view.columns, view.sampleRows));
  }
  grid.append(sampleSection);

  details.append(grid);
  details.append(el("p", "footer", `Board ${view.board.id} · JSON is the source of truth.`));
  return details;
}

function renderBoard() {
  const view = state.view;
  const wrap = el("div");
  if (view.widgets.length === 0) {
    wrap.append(
      emptyState(
        view.rows > 0 ? "No widgets yet" : "No data yet",
        view.rows > 0
          ? "Ask the agent to propose a chart, then approve it above."
          : "Ask the agent to call load_data, then propose a chart."
      )
    );
  } else {
    const grid = el("div", "grid");
    for (const widget of view.widgets) {
      if (!widget.svg) continue;
      const card = el("section", widget.locked ? "card locked" : "card");
      const span = widget.w >= 6 ? 3 : widget.w >= 4 ? 2 : 1;
      card.style.setProperty("--span", String(span));

      const chart = el("div", "chart");
      chart.innerHTML = widget.svg;
      card.append(chart);

      const lock = el("button", widget.locked ? "lock on" : "lock", widget.locked ? "Locked" : "Lock");
      lock.type = "button";
      lock.title = widget.locked ? "Unlock widget" : "Lock widget against agent edits";
      lock.setAttribute("aria-pressed", String(Boolean(widget.locked)));
      lock.disabled = state.busy;
      lock.addEventListener("click", () => toggleLock(widget));
      card.append(lock);
      grid.append(card);
    }
    wrap.append(grid);
  }
  wrap.append(renderInspect(view));
  return wrap;
}

function render() {
  root.replaceChildren();
  const shell = el("main", "shell");
  shell.append(renderTop());

  if (state.error) shell.append(notice("error", state.error));
  else if (state.message) shell.append(notice("success", state.message));

  if (state.proposal) shell.append(renderProposal());

  if (!state.connected && !state.view) {
    shell.append(el("div", "loading", "Connecting to the host…"));
  } else if (!state.view) {
    shell.append(emptyState("No board yet", "Ask the agent to load data, then propose a chart."));
  } else {
    shell.append(renderBoard());
  }

  root.append(shell);
  if (status) status.textContent = state.error || state.message || "";
}

function applyHostContext(context) {
  if (!context) return;
  if (context.theme) {
    try {
      MicroboardTheme(context.theme);
    } catch {
      /* host theme is optional */
    }
  }
  if (context.styles && context.styles.variables) {
    try {
      MicroboardStyles(context.styles.variables);
    } catch {
      /* host styles are optional */
    }
  }
  if (context.displayMode) state.displayMode = context.displayMode;
}

app.onhostcontextchanged = (context) => {
  applyHostContext(context);
  render();
};

app.ontoolresult = (params) => {
  void handleToolResult(params);
};

app.ontoolinput = () => {
  state.busy = true;
  render();
};

app.ontoolcancelled = () => {
  state.busy = false;
  state.error = "Tool call cancelled.";
  render();
};

async function main() {
  render();
  try {
    await app.connect(new MicroboardTransport(window.parent, window.parent));
    state.connected = true;
    applyHostContext(app.getHostContext());
    render();
    await refresh(false);
  } catch (error) {
    state.connected = true;
    state.error = humanError(error);
    render();
  }
}

void main();
