# Tasks

Short commands you run all day: build, lint, reset the database. You keep
them in one file, `.local-workflows/tasks.yml`, and you run them from the
sidebar. This page is the whole feature — a five-minute build-up first,
then every key and rule. Read it top to bottom to learn it, or jump to
[the reference](#reference-tasksyml) to look something up.

A `tasks.yml` is a **library of commands**, each runnable on its own. The
other format, one pipeline run as a whole, is
[Workflows](https://local-workflows.github.io/getting-started/workflows.md).

---

## 1. Create the file

Local Workflows reads one folder: `.local-workflows/`, next to your code.
Create a file in it called `tasks.yml`:

```yaml
version: 1

tasks:
  hello: echo Hello World
```

That is a complete, valid pipeline. `tasks:` is a map keyed by task id,
and a bare string is shorthand for `run:` — so `hello` is a task that
runs one command.

You can skip the typing: open the **Local Workflows** view with no
workflow files present and its empty state offers to create exactly this,
as does the **Local Workflows: Initialize tasks.yml** command.

`version: 1` is optional in a `tasks.yml` and worth writing anyway. It is
what lets a future build migrate your file instead of guessing at its
shape.

---

## 2. Run it

Click the **Local Workflows** icon in the Activity Bar. Your file appears,
expandable into its tasks.

Click the `hello` row. **Nothing runs.** Clicking only ever *opens* —
the panel shows you what would run, step by step, before you commit
to it. Starting a run is always the explicit ▶ icon on the row, or the
**Run** button in the panel.

Hit ▶. The run panel streams the output, one row per command, with the
task turning green when it exits 0.

A task can be a database reset or a destructive cleanup, so an
accidental click must never start one. That is why clicking opens and
only ▶ runs. The **Tasks** row above your tasks has no ▶ at all — there
is no "run the whole file", by design.

---

## 3. Add a second task, and an order

One task is not a pipeline. Add a second, and declare that it depends on
the first:

```yaml
version: 1

tasks:

  setup: echo Restoring dependencies...

  build:
    name: Build
    desc: Compiles the app
    needs: setup
    run: echo Compiling...
```

`needs:` is the whole ordering model. It takes one id or a list of them.

Now run `build` on its own. **`setup` runs first** — running any task
pulls in its full transitive `needs:` chain, and only that subset. Tasks
are composable *and* independently runnable; there is no separate
"job" concept to learn, and nothing in the file runs on its own until
you ask for it.

`name:` is the label in the tree, `desc:` is its tooltip. Both optional;
without `name:`, the id is shown.

---

## 4. Branch it

Dependencies form a graph, not a chain. Two tasks that both `needs:
setup` are declaring only that each needs `setup` first — nothing about
each other:

```yaml
version: 1

tasks:

  setup: echo Restoring dependencies...

  build:
    name: Build
    needs: setup
    run: echo Compiling...

  lint:
    name: Lint
    needs: setup
    run: echo Linting...

  test:
    name: Test
    needs: [build, lint]
    run: echo Running tests...
```

Run `test`. The panel lists the steps in dependency order — `setup`,
then `build`, then `lint`, then `test` — and colours each row as it
finishes. Click any row to open its log in the side panel.

**Execution is one task at a time, always.** `needs:` declares ordering
constraints, not concurrency: a CI job runs beside its siblings because
it gets its own machine and its own workspace, and that isolation is
the entire reason two things overlapping is safe. This engine runs
everything on one machine, in one working tree — two tasks overlapping
there is a footgun (both touching `node_modules`, both writing the same
folder), not a feature. What the graph buys you instead is composition:
`build` and `lint` stay independently runnable, and a failure in one
skips only its own dependents.

---

## 5. Know which shell you are in

A task with no `shell:` runs through whatever the OS already provides —
`cmd` on Windows, `bash` elsewhere. **Never `pwsh` by default.**

So the moment you write PowerShell syntax — `$env:NAME`,
`Get-Location`, a `.ps1` invocation — say so:

```yaml
  build:
    name: Build
    needs: setup
    shell: pwsh
    run: echo "Compiling in $env:BUILD_CONFIGURATION configuration..."
```

This is the single most common first-run failure: a `$env:` reference
that silently comes back empty because the task ran in `cmd`.

---

## 6. Add values

Two blocks, and they are deliberately not one:

- **`vars:`** — values to substitute into *this file*. Never exported to
  anything you spawn. Typed: a number stays a number.
- **`env:`** — the environment a process is spawned with. Exported.
  Strings only.

Put a value in `vars:` when you want to *use* it, and in `env:` only when
something you run needs to *read* it. Both can be set at the file level
and overridden per task.

Substitution is `${{ }}`, and four directory anchors are always
available: `${{ workspaceFolder }}` (where the editor opened),
`${{ workspaceConfig }}` (that folder's own `.local-workflows`),
`${{ cwd }}` (where this command actually runs), and `${{ home }}` (your
home directory, for files that are yours rather than the
project's).

The set is closed. A name outside it - `${{ root }}`, say - fails
with the list of what is available rather than resolving to somewhere on
the machine.

```yaml
version: 1

vars:
  platform: linux-x64
  artifact: myapp-${{ vars.platform }}    # a var may read a sibling var

env:
  BUILD_CONFIGURATION: Release
  ARTIFACT_NAME: ${{ vars.artifact }}     # env: may read vars

tasks:

  setup: echo Restoring dependencies...

  build:
    name: Build
    needs: setup
    shell: pwsh
    env:
      BUILD_CONFIGURATION: Debug          # overrides the file-level value
    run: echo "Compiling $env:ARTIFACT_NAME in $env:BUILD_CONFIGURATION..."

  package:
    name: Package
    needs: build
    shell: pwsh
    cwd: ${{ cwd }}/dist
    run: echo "Packaging from $(Get-Location)..."
```

Resolution runs one way only, so nothing can chase its own tail: anchors,
then `vars:`, then `env:`, then `cwd:` and `run:`. `vars:` cannot read
`env:` — vars are the file's own constants, env is machine-dependent, and
letting constants depend on the environment inverts which of the two is
stable.

**You rarely need an anchor for your own files.** A task in a
`.local-workflows/` folder *starts* in the project that folder belongs to -
not in the folder the file sits in. So `scripts/build.ps1` means the same
thing from `tasks.yml` and from `workflows/deploy.yml`, and
`packages/api/.local-workflows/tasks.yml` starts its tasks in
`packages/api`. No `../`, and no anchor.

---

## 7. Break it on purpose

Add a task that fails, and run it:

```yaml
  error-demo:
    name: Error Demo
    shell: pwsh
    run: |
      echo 'About to fail on purpose...'
      exit 1
```

The node turns red, the error surfaces in the panel, and anything that
`needs:` it is marked **Skipped** rather than run. A failed prerequisite
stops its dependents; it does not stop unrelated branches.

Try a typo, too — `nees: setup`. It fails **before anything executes**,
naming the unknown key. The same is true of an unresolvable
`${{ }}`: it is caught by pre-run validation, not
discovered halfway through a build.

That is the whole loop: **edit `tasks.yml` → click a task → hit ▶ →
watch it run locally, instantly.** Everything below is the reference for
what a task can carry.

The repository's `Samples/HelloWorld/.local-workflows/tasks.yml`
exercises every feature in one file, with a comment on each explaining
what it is there to demonstrate.

---

## Every task runs a plugin

A task declares what it runs in one of two ways, and they are the same
thing: a plain string (or `run:`) is sugar for the `shell@1`
[plugin](https://local-workflows.github.io/getting-started/plugins.md) with the command as its
`script:`. `uses:` names any other plugin, and `args:` is what that
plugin consumes. There is no second execution path underneath — which is
why even a `run:` task's stdout and exit code can be captured with
`artifact:` like any other plugin's.

`run:` and `uses:` on one task is an error: *a task runs one thing.*

---

## Reference: `tasks.yml`

Lives at `.local-workflows/tasks.yml`. The top-level key must be
`tasks:` — a file keyed on anything else parses into no tasks, with no
error.

### Top-level keys

| Key | Type | Default | Meaning |
|---|---|---|---|
| `version` | `1` | `1` when absent | Schema version. Optional here; a wrong value is an error. |
| `name` | `string` | | Never shown anywhere. Leave it out. |
| `vars` | map | | See [Values and templating](#values-and-templating). |
| `env` | map | | See [Values and templating](#values-and-templating). |
| `dotenv` | `string` \| `string[]` | | See [Values and templating](#values-and-templating). |
| `plugins` | map | | File-local plugin aliases — see [Naming a plugin once](#naming-a-plugin-once). |
| `tasks` | map | | The tasks, keyed by id. The id is what `needs:` names, and the shown name when a task has no `name:`. |

### A task

A plain string value is shorthand for `run:` in the OS default shell.
The task level is a **closed set** — an unknown key is a hard error.
`run:` and `uses:` are mutually exclusive. A task with neither is legal:
it succeeds and logs `Task has nothing to run`.

| Key | Type | Default | Meaning |
|---|---|---|---|
| `name` | `string` | the task's id | Shown in the panel and tree. |
| `desc` | `string` | | One line, shown as the tooltip. |
| `needs` | `string` \| `string[]` | | Task ids that must finish first. The only ordering a `tasks.yml` has. Running a task runs its transitive `needs:` chain first. |
| `run` | `string` | | A command line (block scalar for multiline). Desugars to `shell@1`. |
| `uses` | `string` | | `id@version`, or a bare name declared in `plugins:`. |
| `args` | map | | Everything the plugin consumes. Plugin inputs never sit at task level. |
| `shell` | `pwsh` \| `cmd` \| `bash` | OS default | OS default is `cmd` on Windows, `bash` elsewhere. `pwsh` is never the default and must be named. |
| `session` | `string` | | Names an AI conversation. Tasks sharing the name share one thread, in order. Run-scoped. |
| `trigger` | `auto` \| `manual` | `auto` | `manual` stops the run until a human approves in the run panel. Survives closing the editor. |
| `artifact` | `string` | | Stores the task's outputs as run variable `NAME`. Read later as `${{ run.context.NAME.key }}`; a plugin with exactly one artifact reads as `${{ run.context.NAME }}`. |
| `if` | `string` \| `boolean` \| `number` | | Runs the task only when true. False is a skip, not a failure. See [`if:` grammar](#if-grammar). The literal `always()` marks a cleanup task: it still runs after a failure, a rejected gate, or a Stop — see [Cleanup that always runs](https://local-workflows.github.io/getting-started/workflows.md#cleanup-that-always-runs). |
| `continueOnError` | `boolean` | `false` | Run carries on past this task's failure. Task still reports Failed. Does not excuse a rejected gate or a duplicate `artifact:` name. |
| `timeout` | `number` \| `string` | none | Bare number = seconds. `500ms`, `30s`, `5m`, `1h` accepted. A timeout counts as a retryable failure. |
| `retries` | `integer` | `0` | Extra attempts: `retries: 1` = two runs total. |
| `cwd` | `string` | file's project folder | Relative to the file's own folder unless absolute. |
| `vars` / `env` / `dotenv` | | | Per-task overrides, merged over the file's. |

There is no whole-file run — a `tasks.yml` is a library, not a
pipeline. For one runnable entry that covers the file, write a task
whose `needs:` names what it should cover.

### Complete example

```yaml
version: 1

vars:
  config: Release

tasks:
  setup: npm ci                        # bare string = run: in the OS default shell

  build:
    needs: setup
    shell: pwsh
    run: ./build.ps1 -Configuration ${{ vars.config }}

  draft-notes:
    uses: ai@1
    args:
      prompt: Summarise the commits since the last tag.
    artifact: NOTES

  all:                                 # pure composition node - runs its needs: chain
    needs: [build, draft-notes]
```

---

## Values and templating

Shared by both file formats — everything here means the same thing in a
[workflow](https://local-workflows.github.io/getting-started/workflows.md). Declarable at file
and task level only — a workflow's `stages:` carry no `vars:`/`env:` of
their own — and nearer wins, merged per key.

| Block | Exported to spawned processes? | Typed? | Meaning |
|---|---|---|---|
| `vars` | no | yes — a whole-value `${{ vars.x }}` keeps its YAML type | Template values for this file only. May read anchors and sibling vars, **never** `env:`. |
| `env` | yes | no — coerced to text | The process environment. May read anchors and `vars:`. |
| `dotenv` | yes | no | One `.env` path or a list, resolved relative to the file, layered **under** `env:`. Later file wins; declared `env:` wins over both. A missing file is skipped with a log line, never an error. |

**Resolution order** (one-directional, no cycles):

1. Directory anchors — `workspaceFolder`, `workspaceConfig`, `cwd`, `home`
2. `vars:` — may read anchors and each other
3. `dotenv:` files, then `env:` — may read anchors and `vars`
4. `cwd:`, `run:`, task `args:` — may read everything plus `run.context.*`

**Casing convention**: camelCase for `vars:` and `params:` — the same
case the built-in anchors use, so the template side reads alike.
`env:` names are UPPER_SNAKE, because that is the operating system's
own convention (`PATH`, `HOME`) and an env var is read by processes
outside this file. `artifact:` names are UPPER too (`NOTES`,
`run.context.NOTES.content`), so a value that crossed a task boundary
stands out from a local var at a glance. The case tells you where a
name lives.

### Directory anchors

The set is closed; any other name is an error listing what exists.

| Anchor | Resolves to |
|---|---|
| `${{ workspaceFolder }}` | where the editor opened |
| `${{ workspaceConfig }}` | `workspaceFolder`'s own `.local-workflows/` |
| `${{ cwd }}` | where this task runs; inside a `cwd:` expression it means the inherited value, so `cwd: ${{ cwd }}/dist` works |
| `${{ home }}` | the user's home directory; constant for the whole run |

A file inside `.local-workflows/` starts its tasks in the folder
**holding** `.local-workflows/`, however deep it sits. A profile-level
definition starts in the open workspace.

### Typed values

A value that is *nothing but* one `${{ }}` expression keeps its type;
inside a larger string it is stringified. `retries: ${{ vars.n }}` hands
over a number; `tag: v${{ vars.n }}` a string.

### `if:` grammar

Resolved first, then evaluated as text. A value alone is true unless
empty, `false` or `0`. `==` and `!=` compare two sides; a leading `!`
negates; quotes optional. **No `&&`, no functions.** A condition that
cannot be resolved fails the task; a false one skips it. A skipped task
never opens its gate.

### `run.context`

`artifact: NOTES` on one task → `${{ run.context.NOTES }}` or
`${{ run.context.NOTES.key }}` in a later one — in a workflow, across
stage barriers included. The `context` segment is mandatory. Two tasks
declaring the same `artifact:` name: validation warns, and if both run,
the second to write **fails**.

### File inputs

Any built-in plugin arg also accepts a whole-value `${{ }}` expression or
a file input:

```yaml
args:
  prompt: { file: prompts/draft.md }          # required; missing file fails, naming the path
  notes:  { file: notes.md, optional: true }  # missing resolves to ""
```

---

## Naming a plugin once

A `plugins:` map gives a `uses:` reference plus default args a local
name:

```yaml
plugins:
  announce:
    uses: pwsh@1
    args:
      script: Write-Output 'Announcing...'

tasks:
  notify:
    uses: announce                # the alias's defaults
  notify-loud:
    uses: announce
    args:
      script: Write-Output 'LOUDLY!'   # the task's arg wins
```

An entry accepts only `uses:` and `args:`; the task's own `args:` win per
key. An alias may not point at another alias, and an entry name must not
contain `@` — a bare name is what tells an alias apart from a real
`id@version` where it is used. Two entries may name the same plugin with
different defaults, which is how one file runs `ai@1` on two providers.

---

## The list in the sidebar

Tasks are listed in the order you wrote them. The **Tasks** heading
carries one icon — **Sort Tasks A-Z** / **Sort Tasks in File Order**,
also in the Command Palette. A-Z sorts by the shown label (`name:`, else
the id), case-insensitively, across every scope at once; equal labels
keep file order. The choice is saved per workspace and written nowhere in
your repository.

Every `.local-workflows/tasks.yml` in the tree counts, however deep — a
monorepo keeps one beside each package it builds. Tasks also come from
the workspace and your profile: see
[the three scopes](https://local-workflows.github.io/getting-started/workspaces.md). When more
than one scope has tasks, rows sit under **Folder / Workspace / Profile**
headings, narrowest first, and a wider task is hidden when a narrower one
claims the same id.

---

## Errors and silent failures

| | |
|---|---|
| Top-level key not `tasks:` | parses to zero tasks, **no error** |
| Unknown task key | hard error |
| The same alias declared twice in `plugins:` | hard error |
| Unquoted scalar containing `": "` | parses as a nested map |
| Task with no `run:`/`uses:` | legal; logs `Task has nothing to run` |
| Task with no `run:`/`uses:`/`needs:` | warning |
| Failed task | dependents skipped transitively |
| Duplicate `artifact:` name, both tasks run | the second to write fails; validation warned |
| Unresolvable `${{ }}` expression | fails immediately, naming the expression |
| `shell: cmd` off Windows | validation error before running |

