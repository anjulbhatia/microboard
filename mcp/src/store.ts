import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createBoard, type Board } from "@microboard/core";

export function boardFilePath(): string {
  const configured = process.env.MICROBOARD_BOARD_PATH;
  return configured ? resolve(configured) : resolve(process.cwd(), ".microboard", "board.json");
}

function assertBoard(value: unknown, path: string): Board {
  if (!value || typeof value !== "object") throw new Error(`Board file is not an object: ${path}`);
  const board = value as Partial<Board>;
  if (typeof board.id !== "string" || typeof board.title !== "string") {
    throw new Error(`Board file is malformed (missing id/title): ${path}`);
  }
  if (!Number.isFinite(board.version)) throw new Error(`Board file is malformed (bad version): ${path}`);
  if (!board.data || !Array.isArray(board.data.columns)) {
    throw new Error(`Board file is malformed (bad data): ${path}`);
  }
  if (!Array.isArray(board.steps) || !Array.isArray(board.layout) || !Array.isArray(board.locks)) {
    throw new Error(`Board file is malformed (bad steps/layout/locks): ${path}`);
  }
  if (!board.widgets || typeof board.widgets !== "object") {
    throw new Error(`Board file is malformed (bad widgets): ${path}`);
  }
  return board as Board;
}

export async function loadBoard(): Promise<Board> {
  const path = boardFilePath();
  try {
    const text = await readFile(path, "utf8");
    return assertBoard(JSON.parse(text), path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return createBoard();
    throw error;
  }
}

export async function saveBoard(board: Board): Promise<void> {
  const path = boardFilePath();
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(board, null, 2)}\n`, "utf8");
  await rename(tmp, path);
}

let queue: Promise<unknown> = Promise.resolve();

/** Serialize read-modify-write cycles so parallel tool calls cannot clobber. */
export function withBoardLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
