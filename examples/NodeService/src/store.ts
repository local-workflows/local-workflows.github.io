/**
 * The only part of this example that touches disk.
 *
 * The file is written whole every time. A todo list is a few kilobytes,
 * so there is nothing to gain from a smarter format and plenty to lose:
 * a partial write is a corrupt list.
 */

import { readFile, writeFile, rename } from "node:fs/promises";
import { emptyState, TodoError, type TodoState } from "./todo.js";

/** Where the list lives when nothing says otherwise. */
export const DEFAULT_PATH = "todos.json";

/**
 * Read the list. A missing file is an empty list, not an error - the
 * first run has nothing to read and should still work.
 */
export async function load(path: string = DEFAULT_PATH): Promise<TodoState> {
    let text: string;

    try {
        text = await readFile(path, "utf8");
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return emptyState();
        }
        throw error;
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(text);
    } catch {
        throw new TodoError(`${path} is not valid JSON. Fix it or delete it to start over.`);
    }

    if (!isTodoState(parsed)) {
        throw new TodoError(`${path} is JSON but not a todo list. Delete it to start over.`);
    }

    return parsed;
}

/**
 * Write the list.
 *
 * Written to a temporary file and renamed over the real one. A rename
 * on the same filesystem is atomic, so a crash halfway through leaves
 * the previous list intact rather than half of the new one.
 */
export async function save(state: TodoState, path: string = DEFAULT_PATH): Promise<void> {
    const temporary = `${path}.tmp`;

    await writeFile(temporary, JSON.stringify(state, null, 4) + "\n", "utf8");
    await rename(temporary, path);
}

function isTodoState(value: unknown): value is TodoState {
    if (typeof value !== "object" || value === null) { return false; }

    const candidate = value as Record<string, unknown>;

    return typeof candidate.nextId === "number"
        && Array.isArray(candidate.items)
        && candidate.items.every(item =>
            typeof item === "object"
            && item !== null
            && typeof (item as Record<string, unknown>).id === "number"
            && typeof (item as Record<string, unknown>).title === "string"
            && typeof (item as Record<string, unknown>).done === "boolean");
}
