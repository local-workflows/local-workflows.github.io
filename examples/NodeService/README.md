# NodeService

A real, small TypeScript project with real tasks. `npm ci` really
installs, `vitest` really runs 25 tests, `tsc` really writes `dist/`.

The project is a todo list with add, complete, filter and a file it
saves to. The same feature is written up as a complete spec in the
**SpecWalkthrough** example next door - read that to see what came
before the code.

## Use it

Open this folder in VS Code. The tasks appear in the Local Workflows
sidebar. Press play on **Verify**.

That one click installs dependencies, typechecks, and runs the tests -
because `verify` needs `typecheck` and `test`, and both of those need
`install`. You never have to remember the order.

To copy it into your own project, take the `.local-workflows/` folder
and change the commands to match your `package.json`.

## What is in it

```
NodeService/
  package.json          typescript + vitest, nothing else
  tsconfig.json
  src/
    todo.ts             the list. Plain functions over plain data
    store.ts            the only file that touches disk
    cli.ts              the command line
    todo.test.ts        19 tests
    store.test.ts       6 tests
  .local-workflows/
    tasks.yml           install, typecheck, test, build, demo, watch, clean
    workflows/
      pr-check.yml      everything CI runs, run locally
      release.yml       verify, version, build, then wait for a human
```

## The tasks

| Task | What it does |
|---|---|
| **Install** | `npm ci` |
| **Typecheck** | `tsc --noEmit` |
| **Test** | `vitest run` |
| **Build** | compiles into `dist/` |
| **Verify** | typecheck and test, in one click |
| **Try the CLI** | adds two todos, completes one, prints the list |
| **Test in watch mode** | keeps running until you press Stop |
| **Clean** | deletes `dist/`. Waits for you first |

## The two workflows

**PR check.** Four stages: install, verify, build, review. A stage only
starts when the whole stage before it has passed, so a failing test
stops the run before anything is built. The last stage shows the diff
and the commits - what a reviewer is about to see.

**Release.** Verify, set the version, build, then **stop**. The tag task
says `trigger: manual`, so the run parks there and shows you the
resolved command - the real version number, not `${{ params.version }}`.
Pushing the tag is a second gate, because that is the step you cannot
take back.

## Why a workflow and not more tasks

A `tasks.yml` is a library of things you press play on one at a time.
A `workflows/*.yml` is one pipeline with a start and an end.

Use the first for *build this*, *run the tests*, *clean up*. Use the
second when the order is the point - when you want a failing test to
stop everything downstream, and a human to look before the last step.

## Notes

`env: NO_COLOR: "1"` at the top of every file is there because Node
prints colour codes only when it thinks it is talking to a terminal. It
is talking to the run panel instead, and the codes arrive as unreadable
characters.

`npm ci` rather than `npm install`: it installs exactly what
`package-lock.json` says, so it is faster and it cannot drift.

The release workflow refuses to run on a dirty working tree. A release
built from uncommitted changes cannot be rebuilt later.
