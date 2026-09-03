# Variables

**Every name a `${{ }}` expression can resolve, on one page.**

The set is closed. An unknown name is an error that lists what exists —
never an empty string, never the literal text passed through. How the
blocks are *declared* is on
[Values and templating](https://local-workflows.github.io/getting-started/tasks.md#values-and-templating);
this page is the read side: what is built in, and where each name is
readable.

---

## The whole set

| Expression | What it is | Declared |
|---|---|---|
| `${{ workspaceFolder }}` | where the editor opened, or where a CLI was invoked | built in |
| `${{ workspaceConfig }}` | `workspaceFolder`'s own `.local-workflows/` | built in |
| `${{ cwd }}` | the working directory the resolved thing runs in | built in |
| `${{ home }}` | the person's home directory | built in |
| `${{ params.NAME }}` | what the run was asked for at start | a workflow's `params:` |
| `${{ vars.NAME }}`, `${{ vars.NAME.key }}` | the file's own template values | `vars:` at file or task level |
| `${{ env.NAME }}` | declared env, readable over the machine's | `env:` / `dotenv:` — or the machine |
| `${{ run.context.NAME }}`, `${{ run.context.NAME.key }}` | what an earlier task stored with `artifact: NAME` | a task's `artifact:` |

Anything else — `${{ github.sha }}`, `${{ secrets.X }}`,
a misspelled anchor — is an error naming the available set. This is not
GitHub Actions' namespace.

---

## The four anchors

Always available, in every field of every file.

| Anchor | Resolves to |
|---|---|
| `${{ workspaceFolder }}` | where the editor opened, or where a CLI was invoked. Stable for a whole run |
| `${{ workspaceConfig }}` | `<workspaceFolder>/.local-workflows` — where the workspace's settings, specs and plugins live |
| `${{ cwd }}` | where the task will run. Inside a `cwd:` expression it means the **inherited** value, so `cwd: ${{ cwd }}/dist` appends to the parent's |
| `${{ home }}` | `os.homedir()` — constant for the whole process; nothing a file declares can move it |

`home` is the one anchor that is not about the work: the other three
name somewhere inside the run at hand, `home` names where the *person*
keeps things — for a file that follows them between repositories.

---

## `params.NAME`

What the run was asked for before it started — declared in a workflow's
`params:` block, answered at run start, frozen for the whole run.

- **Workflows only.** `tasks.yml` has no `params:` block, so
  `${{ params.X }}` there errors with *"params are
  not available here"* rather than blaming the name.
- Values are strings. There is no `params.NAME.key`.
- Known before anything else resolves, so a `vars:` value can be built
  out of one.

---

## `vars.NAME`

The file's own constants. Declarable at file or task level; nearer wins,
merged per key.

- **Typed**: a value that is *nothing but* one expression keeps its YAML
  type — `retries: ${{ vars.n }}` hands over a
  number. Inside a larger string it is stringified.
- A var whose value is a map is addressed one level deep:
  `${{ vars.NAME.key }}`. No deeper.
- May read the anchors, `params:` and sibling vars — in any declaration
  order. **Never `env:`**: vars are the file's stable constants, and a
  constant that depends on the machine's environment is not one.

---

## `env.NAME`

What `${{ env.NAME }}` *reads* is the declared
`env:` (with `dotenv:` files layered under it) merged **over** the real
process environment — so `${{ env.PATH }}` resolves
even though no file declares `PATH`. A typo is still caught: a name in
neither map is an error.

What gets *exported* to a spawned process is narrower — declared `env:`
and `dotenv:` values only, layered onto the process's own environment by
the runner. The whole machine environment is never copied into a
sandboxed plugin's map.

**An agent child is narrower still.** A `run:` task's process inherits
the machine's environment; an `ai@1` session's does not. It gets a fixed
baseline of process plumbing, whatever a grant list names, and the task's
own `env:` — nothing else, credentials included. See
[the environment the CLI child gets](https://local-workflows.github.io/getting-started/agent-sdks.md#the-environment-the-cli-child-gets).

- No `env.NAME.key` — env vars are flat text, coerced to string.
- May read the anchors and `vars:`. Resolved after vars, so a `vars:`
  value cannot read `env:` — asking gets the error that explains the
  order.

---

## `run.context.NAME`

Run variables — what a task's `artifact:` stores, read by any later task.

```yaml
draft:
  uses: ai@1
  args:
    prompt: Draft the notes.
  artifact: NOTES

publish:
  needs: draft
  run: ./publish.ps1 -Notes "${{ run.context.NOTES.summary }}"
```

- A plugin declaring exactly **one** artifact makes
  `${{ run.context.NAME }}` that single value;
  anything else stores the whole map, addressed as
  `${{ run.context.NAME.key }}`.
- The `context` segment is mandatory — `run` stays a namespace, so a
  flat `run.NOTES` is an error.
- Flat and run-scoped: they cross stage boundaries for free.
- Readable from `cwd:`, `run:` and a task's `args:` — those resolve when
  the task is reached, by which point earlier tasks have produced
  theirs. Not from `vars:` or `env:`, which resolve before any task has
  run.

---

## Resolution order

Strictly one-directional, so no namespace can chase its own tail:

1. **Anchors and `params:`** — known before anything runs
2. **`vars:`** — may read 1 and each other
3. **`dotenv:` files, then `env:`** — may read 1–2
4. **`cwd:`, `run:`, task `args:`** — may read everything, plus `run.context.*`

An expression that reaches for a later stage does not silently resolve
to nothing — the error says which stage the namespace belongs to.

---

## Grammar

- One form: `${{ name }}` or `${{ namespace.NAME }}` — word characters
  and dots only. No functions, no operators, no defaults.
- Depth is capped at what the tables above show: `vars.NAME.key` and
  `run.context.NAME.key` are the deepest expressions there are.
- A name only resolves when a file actually **declares** it —
  `${{ vars.toString }}` is an unknown var, not a JavaScript accident.
- An unresolvable expression fails the task immediately, naming the
  expression and the value it sits in — it is never passed through as
  literal text to surface later as a cryptic `ENOENT`.

**Casing**: camelCase for `vars:` and `params:` (like the anchors),
UPPER_SNAKE for `env:` (like the operating system) and `artifact:` names —
so a glance tells you where a name lives.

---

## The same notation in `settings.json`

`${{ }}` works in
[`settings.json`](https://local-workflows.github.io/getting-started/settings.md) and in a
style's `style.yml` too — same spelling, same anchors, same
`${{ env.NAME }}`. It used to be a different
dialect there (`${env:VAR}`, MCP declarations only); that form is gone
and using it is an error naming the replacement.

What differs is not the notation but the **gate**. An env read inside
`ai.mcpServers` is handed to a third-party server process, so it must
be granted a name —
[the env gate](https://local-workflows.github.io/getting-started/settings.md#env--the-gate-on-mcp-env-reads).
Everywhere else, including this page's task files, an env read needs no
grant and only `env.denied` vetoes it.

Not readable in those two files: `vars`, `params` and
`${{ run.context.NAME }}`. They belong to a run,
and a configuration file is read before there is one.
