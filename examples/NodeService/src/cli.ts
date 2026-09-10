/**
 * The command line. Reads the list, does one thing to it, writes it back.
 *
 *   node dist/cli.js add "Buy milk"
 *   node dist/cli.js list active
 *   node dist/cli.js done 1
 *   node dist/cli.js open 1
 *   node dist/cli.js remove 1
 *
 * Set TODO_FILE to keep the list somewhere other than ./todos.json.
 */

import { add, isFilter, list, remove, setDone, TodoError, type Todo } from "./todo.js";
import { DEFAULT_PATH, load, save } from "./store.js";

const USAGE = [
    "Usage:",
    "  todo add <title>          add a todo",
    "  todo list [all|active|done]  show the list (default: all)",
    "  todo done <id>            mark it done",
    "  todo open <id>            mark it not done",
    "  todo remove <id>          delete it"
].join("\n");

async function main(argv: string[]): Promise<number> {
    const [command, ...rest] = argv;
    const path = process.env.TODO_FILE ?? DEFAULT_PATH;
    const state = await load(path);

    switch (command) {
        case "add": {
            const next = add(state, rest.join(" "));
            await save(next, path);
            const added = next.items[next.items.length - 1];
            console.log(`Added ${added.id}: ${added.title}`);
            return 0;
        }

        case "list": {
            const filter = rest[0] ?? "all";
            if (!isFilter(filter)) {
                throw new TodoError(`"${filter}" is not a filter. Use all, active or done.`);
            }
            print(list(state, filter));
            return 0;
        }

        case "done":
        case "open": {
            const id = readId(rest[0]);
            await save(setDone(state, id, command === "done"), path);
            console.log(`${id} is now ${command === "done" ? "done" : "open"}.`);
            return 0;
        }

        case "remove": {
            const id = readId(rest[0]);
            await save(remove(state, id), path);
            console.log(`Removed ${id}.`);
            return 0;
        }

        default:
            console.log(USAGE);
            return command === undefined ? 0 : 1;
    }
}

function readId(raw: string | undefined): number {
    const id = Number(raw);

    if (!Number.isInteger(id) || id < 1) {
        throw new TodoError(`"${raw ?? ""}" is not a todo id.`);
    }

    return id;
}

function print(items: Todo[]): void {
    if (items.length === 0) {
        console.log("Nothing here.");
        return;
    }

    for (const item of items) {
        console.log(`${item.done ? "[x]" : "[ ]"} ${item.id}  ${item.title}`);
    }
}

main(process.argv.slice(2))
    .then(code => { process.exitCode = code; })
    .catch((error: unknown) => {
        // A TodoError is something the person did wrong: say what, and
        // nothing else. Anything else is our bug, so show the stack.
        if (error instanceof TodoError) {
            console.error(error.message);
        } else {
            console.error(error);
        }
        process.exitCode = 1;
    });
