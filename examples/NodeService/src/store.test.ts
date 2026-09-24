import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { load, save } from "./store.js";
import { add, emptyState, TodoError } from "./todo.js";

let folder: string;
let file: string;

beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), "todo-store-"));
    file = join(folder, "todos.json");
});

afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
});

describe("load", () => {

    it("returns an empty list when the file is not there", async () => {
        expect(await load(file)).toEqual(emptyState());
    });

    it("returns what save wrote", async () => {
        const state = add(emptyState(), "Buy milk", new Date("2026-01-01T09:00:00.000Z"));
        await save(state, file);

        expect(await load(file)).toEqual(state);
    });

    it("says so when the file is not valid JSON", async () => {
        await writeFile(file, "{ not json", "utf8");

        await expect(load(file)).rejects.toThrow(/not valid JSON/);
    });

    it("says so when the file is JSON but the wrong shape", async () => {
        await writeFile(file, JSON.stringify({ hello: "world" }), "utf8");

        await expect(load(file)).rejects.toThrow(TodoError);
    });
});

describe("save", () => {

    it("leaves no temporary file behind", async () => {
        await save(emptyState(), file);

        await expect(readFile(`${file}.tmp`, "utf8")).rejects.toThrow();
    });

    it("replaces the previous contents rather than appending", async () => {
        await save(add(emptyState(), "first", new Date()), file);
        await save(emptyState(), file);

        expect((await load(file)).items).toEqual([]);
    });
});
