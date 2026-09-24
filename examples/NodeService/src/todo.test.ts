import { describe, expect, it } from "vitest";
import { add, emptyState, isFilter, list, MAX_TITLE_LENGTH, remove, setDone, TodoError } from "./todo.js";

const AT = new Date("2026-01-01T09:00:00.000Z");

describe("add", () => {

    it("gives the first item id 1 and leaves it open", () => {
        const state = add(emptyState(), "Buy milk", AT);

        expect(state.items).toHaveLength(1);
        expect(state.items[0]).toEqual({
            id: 1,
            title: "Buy milk",
            done: false,
            createdAt: "2026-01-01T09:00:00.000Z"
        });
    });

    it("trims the title", () => {
        const state = add(emptyState(), "   Buy milk   ", AT);

        expect(state.items[0].title).toBe("Buy milk");
    });

    it("rejects a title that is only whitespace", () => {
        expect(() => add(emptyState(), "   ", AT)).toThrow(TodoError);
    });

    it("rejects a title longer than the maximum", () => {
        const tooLong = "x".repeat(MAX_TITLE_LENGTH + 1);

        expect(() => add(emptyState(), tooLong, AT)).toThrow(/at most 200/);
    });

    it("accepts a title of exactly the maximum", () => {
        const exact = "x".repeat(MAX_TITLE_LENGTH);

        expect(add(emptyState(), exact, AT).items[0].title).toBe(exact);
    });

    it("keeps items in the order they were added", () => {
        let state = add(emptyState(), "first", AT);
        state = add(state, "second", AT);

        expect(state.items.map(item => item.title)).toEqual(["first", "second"]);
    });
});

describe("setDone", () => {

    it("marks an item done", () => {
        const state = setDone(add(emptyState(), "Buy milk", AT), 1, true);

        expect(state.items[0].done).toBe(true);
    });

    it("opens a done item again", () => {
        let state = add(emptyState(), "Buy milk", AT);
        state = setDone(state, 1, true);
        state = setDone(state, 1, false);

        expect(state.items[0].done).toBe(false);
    });

    it("does nothing when the item is already in that state", () => {
        const once = setDone(add(emptyState(), "Buy milk", AT), 1, true);
        const twice = setDone(once, 1, true);

        expect(twice).toEqual(once);
    });

    it("rejects an id that does not exist", () => {
        expect(() => setDone(emptyState(), 9, true)).toThrow(/no todo 9/);
    });
});

describe("remove", () => {

    it("deletes the item", () => {
        const state = remove(add(emptyState(), "Buy milk", AT), 1);

        expect(state.items).toHaveLength(0);
    });

    it("does not reuse the deleted id", () => {
        let state = add(emptyState(), "first", AT);
        state = remove(state, 1);
        state = add(state, "second", AT);

        expect(state.items[0].id).toBe(2);
    });

    it("rejects an id that does not exist", () => {
        expect(() => remove(emptyState(), 9)).toThrow(TodoError);
    });
});

describe("list", () => {

    const seeded = (() => {
        let state = add(emptyState(), "open one", AT);
        state = add(state, "done one", AT);
        state = add(state, "open two", AT);
        return setDone(state, 2, true);
    })();

    it("returns everything by default", () => {
        expect(list(seeded).map(item => item.id)).toEqual([1, 2, 3]);
    });

    it("returns only open items for active", () => {
        expect(list(seeded, "active").map(item => item.id)).toEqual([1, 3]);
    });

    it("returns only completed items for done", () => {
        expect(list(seeded, "done").map(item => item.id)).toEqual([2]);
    });

    it("returns an empty list when nothing matches", () => {
        expect(list(emptyState(), "done")).toEqual([]);
    });
});

describe("isFilter", () => {

    it("accepts the three filters", () => {
        expect(["all", "active", "done"].every(isFilter)).toBe(true);
    });

    it("rejects anything else", () => {
        expect(isFilter("finished")).toBe(false);
    });
});
