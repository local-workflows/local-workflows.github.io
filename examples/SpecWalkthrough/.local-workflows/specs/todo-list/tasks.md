# Implementation Plan: Todo list

## Overview

Three files, built bottom up: the list, then the store, then the command
line. Nothing here is behind a flag, and nothing needs a migration -
this is a new feature with no existing users.

The order comes from what each file needs. `store.ts` needs the types
`todo.ts` defines, and `cli.ts` needs both. Within `todo.ts` the split
is by rule group rather than by function, so each task ends with tests
that prove the rules it added.

Group 1 is the whole of requirements 1 to 4, and it needs no disk at
all. Group 3 is requirement 5 and is the only part that touches a file.
Group 4 is requirement 6, plus the two criteria that belong to the
command line rather than the list.

Every task leaves the repository building and its tests passing. The
two checkpoints run the full suite, which is the wider check that each
task's own tests do not make.

## Tasks

- [x] 1. The list, with no disk anywhere in it

  - [x] 1.1 The state, the id rule, and adding
    - Create `src/todo.ts` with `Todo`, `TodoState`, `Filter`, `TodoError`, `MAX_TITLE_LENGTH` and `emptyState`.
    - Write `add(state, title, now)`: trim the title, refuse it when empty, refuse it when longer than `MAX_TITLE_LENGTH` with a message naming the limit and the length given, and append a new `Todo` carrying `state.nextId`.
    - Return a new `TodoState` with `nextId` increased. Never change the state passed in - every other task in this plan relies on that.
    - Take `now` as a parameter defaulting to `new Date()`, so `createdAt` is assertable.
    - Create `src/todo.test.ts` covering: the first id is 1 and the item is not done, a title with whitespace around it is stored trimmed, a whitespace-only title is refused, a title one character over the limit is refused, a title exactly at the limit is accepted, and two additions come back in the order they were made.
    - [Requirements : 1.1, 1.2, 1.3, 1.4, 1.5](requirements.md)

  - [x] 1.2 Completing, reopening and deleting
    - Add `setDone(state, id, done)`: refuse an id no item holds, naming the id; otherwise return a new state with that item's `done` set. One function rather than a `complete` and a `reopen`, because the two differ by one value.
    - Add `remove(state, id)`: refuse an unknown id the same way, otherwise return a new state without that item. Leave `nextId` alone, which is what stops the id being reused.
    - Extend `todo.test.ts`: complete an item, reopen it, complete an already-complete item and check the state is unchanged, delete an item, delete then add and check the new item got the next id rather than the deleted one, and an unknown id for both operations.
    - [Requirements : 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3](requirements.md)

  - [x] 1.3 The filter
    - Add `list(state, filter)` returning every item for `all`, only open ones for `active`, and only completed ones for `done`, in insertion order in every case.
    - Add `isFilter(value)` as a type guard, so the command line can check a string before using it.
    - Extend `todo.test.ts`: each of the three filters against a list holding both states, an empty result, and `isFilter` rejecting a value that is not one of the three.
    - [Requirements : 4.1, 4.2, 4.3](requirements.md)

- [x] 2. Checkpoint - every rule about the list is written and tested
  - Run the full test suite and confirm it passes.
  - Confirm `src/todo.ts` imports nothing. If it imports anything, a rule that should be testable without setup is not.

- [x] 3. Reading and writing the file

  - [x] 3.1 Loading, including the two ways the file can be wrong
    - Create `src/store.ts` with `DEFAULT_PATH` and `load(path)`.
    - Return `emptyState()` when the read fails with `ENOENT`. Let every other read failure through unchanged - it is not something the person can fix by editing the file.
    - Throw a `TodoError` naming the path when the contents do not parse as JSON, and again when they parse but are not a `TodoState`. Check the shape by field types, and no further: re-running the title rules here would mean an older file could refuse to open.
    - Create `src/store.test.ts` against a real temporary folder created per test and removed after: a missing file gives an empty list, malformed JSON is refused, and JSON of the wrong shape is refused.
    - [Requirements : 5.2, 5.3, 5.4](requirements.md)

  - [x] 3.2 Saving, without ever leaving a half-written file
    - Add `save(state, path)`: write the JSON to `<path>.tmp`, then rename it over `path`. The rename is atomic on one filesystem, so a crash leaves the previous file whole.
    - Extend `store.test.ts`: what `save` wrote is what `load` returns, no `.tmp` file is left behind, and a second save replaces the first rather than appending to it.
    - [Requirements : 5.1, 5.5](requirements.md)

- [x] 4. The command line

  - [x] 4.1 Commands, arguments and printing
    - Create `src/cli.ts` handling `add`, `list`, `done`, `open` and `remove`. Each one loads the list, calls one function, saves when something changed, and prints one line.
    - Read the path from `TODO_FILE`, falling back to `DEFAULT_PATH`.
    - Check the filter with `isFilter` before using it, and refuse an unrecognised one with a message naming all, active and done.
    - Print "Nothing here." when the result holds no items, rather than printing nothing at all.
    - Print the usage for an unknown command, and for no command.
    - [Requirements : 4.4, 4.5, 5.6](requirements.md)

  - [x] 4.2 Errors and the exit status
    - Catch at the top: print a `TodoError`'s message on its own, and print any other error whole. Set the exit code to 1 in both cases.
    - Exit 0 on success, and on no command at all - asking for help is not a failure.
    - Set `process.exitCode` rather than calling `process.exit`, so anything already written is flushed before the process ends.
    - [Requirements : 6.1, 6.2, 6.3](requirements.md)

- [x] 5. Checkpoint - the whole feature works end to end
  - Run the full test suite and confirm it passes.
  - Build, then run the command line by hand: add two items, complete one, list all, list active, and ask for an id that does not exist. Confirm the last one prints one line and exits non-zero.
  - Delete the file it wrote and list again, to confirm a missing file is an empty list rather than an error.

## Notes

`src/todo.ts` importing nothing is checked at the first checkpoint
rather than asserted by a test. A test that asserts a file has no
imports is a test about the file's text, not its behaviour, and it
breaks on a formatting change.

Requirement 5.5 has no test of its own. It is verified by task 3.2's
"no `.tmp` file is left behind", which is what proves the rename is the
last step. See the Testing Strategy section of `design.md` for why a
direct test was not written.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "3.1"] },
    { "id": 2, "tasks": ["1.3", "3.2"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2"] }
  ]
}
```

Waves 1 and 2 each hold two tasks because one touches `src/todo.ts` and
the other touches `src/store.ts` - disjoint files, so they are safe to
run at the same time. `3.1` only needs the types `1.1` defined, not the
rest of the list. `4.1` and `4.2` are alone in their waves because both
edit `src/cli.ts`.
