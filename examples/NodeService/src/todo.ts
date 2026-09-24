/**
 * The todo list itself. No disk, no console, no clock it does not own -
 * everything here is a plain function over plain data, which is what
 * makes it testable without a temp folder.
 *
 * The feature this implements is written up as a full spec in the
 * SpecWalkthrough example, next door.
 */

/** The longest title we accept. Long enough for a real task, short enough to read in a list. */
export const MAX_TITLE_LENGTH = 200;

export interface Todo {
    /** Stable for the life of the item. Never reused, even after a delete. */
    id: number;
    title: string;
    done: boolean;
    /** ISO 8601, in UTC. */
    createdAt: string;
}

/** What `list` can be asked for. */
export type Filter = "all" | "active" | "done";

/** The whole file on disk, and the whole in-memory state. */
export interface TodoState {
    /** The id the next added item gets. Only ever goes up. */
    nextId: number;
    items: Todo[];
}

/** Thrown for anything the caller did wrong. The CLI turns it into a message and exit code 1. */
export class TodoError extends Error {}

export function emptyState(): TodoState {
    return { nextId: 1, items: [] };
}

/**
 * Add an item. The title is trimmed first, so "  " is empty and is
 * rejected rather than stored as a blank row nobody can identify.
 */
export function add(state: TodoState, title: string, now: Date = new Date()): TodoState {
    const trimmed = title.trim();

    if (trimmed.length === 0) {
        throw new TodoError("A todo needs a title.");
    }

    if (trimmed.length > MAX_TITLE_LENGTH) {
        throw new TodoError(`A title can be at most ${MAX_TITLE_LENGTH} characters. That one was ${trimmed.length}.`);
    }

    const item: Todo = {
        id: state.nextId,
        title: trimmed,
        done: false,
        createdAt: now.toISOString()
    };

    return { nextId: state.nextId + 1, items: [...state.items, item] };
}

/**
 * Mark an item done, or open again. Setting it to what it already is
 * succeeds and changes nothing - so running the same command twice is
 * never an error.
 */
export function setDone(state: TodoState, id: number, done: boolean): TodoState {
    if (!state.items.some(item => item.id === id)) {
        throw new TodoError(`There is no todo ${id}.`);
    }

    return {
        ...state,
        items: state.items.map(item => (item.id === id ? { ...item, done } : item))
    };
}

/** Delete an item. Its id is not reused - `nextId` only ever goes up. */
export function remove(state: TodoState, id: number): TodoState {
    if (!state.items.some(item => item.id === id)) {
        throw new TodoError(`There is no todo ${id}.`);
    }

    return { ...state, items: state.items.filter(item => item.id !== id) };
}

/** Items matching the filter, in the order they were added. */
export function list(state: TodoState, filter: Filter = "all"): Todo[] {
    switch (filter) {
        case "active":
            return state.items.filter(item => !item.done);
        case "done":
            return state.items.filter(item => item.done);
        case "all":
            return [...state.items];
    }
}

/** True when the string is one of the filters. Used to check what the CLI was given. */
export function isFilter(value: string): value is Filter {
    return value === "all" || value === "active" || value === "done";
}
