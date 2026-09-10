# Workflows

One pipeline, run as a whole, with an order that is part of what it
means. This page is the whole feature — a five-minute build-up first,
then every key and rule. It assumes you have read
[Tasks](https://local-workflows.github.io/getting-started/tasks.md); everything you learned
there about `run:`, `env:`, `vars:`, `cwd:` and templating means the
same thing here, because both formats run through the same task
executor.

---

## Which format you want

| | `tasks.yml` | `workflows/*.yml` |
|---|---|---|
| Path | `.local-workflows/tasks.yml` | `.local-workflows/workflows/*.yml` |
| Is | a library of commands | one pipeline |
| Tasks are | a map, keyed by id | a list, in order |
| Ordering | `needs:` between tasks | `stages:`, then list order within a stage |
| `needs:` on a task | allowed | refused — hard error |
| Runs | any task, alone (plus its `needs:` chain) | the whole file |
| `version:` | optional, read as `1` | required, must be `1` |
| `name:` | ignored | the row's label |

Reach for a workflow when the **order is the point** — a release that
drafts notes, waits for a human, then publishes. Reach for `tasks.yml`
when you have a pile of commands people run individually.

---

## 1. Create the file

Workflows live one folder deeper:
`.local-workflows/workflows/`. Create `release.yml` in it:

```yaml
version: 1

name: Release
desc: Builds, then publishes.

stages:

  - name: verify
    tasks:

      - name: Compile
        run: echo Compiling...
```

Two levels: **stages** hold **tasks**, in the order they are written.
Even for one command, both levels are mandatory.

`version:` cannot be omitted because this format has no legacy to forgive.
`tasks.yml` forgives an absent version only because files written before
versions existed have none.

---

## 2. Run it

The file appears in the **Local Workflows** view beside your tasks. Click
it to open — it lands on the workflow's **runs list**, never running
anything — then hit ▶ to start one.

**There is no way to run one task on its own.** A workflow is addressed
as a whole; that is the difference from a `tasks.yml`, where every task
has its own ▶. If you want the parts individually runnable, they belong
in a `tasks.yml`.

---

## 3. Add a stage, and see the barrier

Stages are sequential, with a hard barrier between them. Nothing in stage
two starts until *everything* in stage one has finished:

```yaml
stages:

  - name: verify
    tasks:

      - name: Compile
        run: echo Compiling...

  - name: release
    tasks:

      - name: Publish the build
        run: echo Publishing...
```

Run it. The panel draws the two stages in order, and `release` sits
waiting until `verify` is green.

---

## 4. Tasks run in order, and that is all

Inside a stage, tasks are a plain list, and a list already carries its
order — the file reads exactly as it runs, top to bottom:

```yaml
  - name: verify
    desc: Two checks, one after the other.
    tasks:

      - name: Compile
        run: echo Compiling...

      - name: Analyse sources
        run: echo Linting...

      - name: Archive
        run: echo Archiving...
```

**There is no parallelism anywhere in this format.** A CI job runs
concurrently with its siblings because it gets its own machine, its own
workspace — that isolation is the entire reason two things overlapping
is safe. This engine runs everything on one machine, in one working
tree; two tasks overlapping there is a footgun (both touching
`node_modules`, both writing the same folder), not a feature. So every
task in a stage waits its turn, in the order the file names it.

---

## 5. Park the run on a human

`trigger: manual` stops the run and waits for a person:

```yaml
      - name: Publish the build
        trigger: manual
        run: echo Publishing to ${{ vars.target }}...
```

Add `vars: { target: production }` at the top of the file and run it. The
run parks, and the panel offers **Approve** and **Reject**.

Two things worth knowing about that pause:

- **What you are shown is the resolved command** — already
  `echo Publishing to production...`, not the template. Approving a
  template would be approving a promise rather than a command.
- **Nothing is executing while it waits.** No process, no timer. Close
  VS Code, reopen it, and run **Local Workflows: Show Runs Waiting for
  Approval** — the run is still there.

Reject it and the tasks after the gate are reported as **Skipped**, not
left looking like they are still to come.

### What a gate card shows

The card is the question, not the audit trail:

- **The task's name**, its plugin as a tag beside it, and where it sits —
  stage and job. A `run:` task shows no plugin: it desugars to `shell@1`,
  which you never wrote.
- **A body**, in a box: the resolved command for a `run:` task, and for a
  plugin task its one long arg — `prompt` on `ai@1`, `script` on
  `pwsh@1`. A `pwsh@1` gate resolves to five args, four of them the
  manifest's own defaults, and a card where the script is one row out of
  five is a card people approve without reading. A long body scrolls; the
  head with the buttons never moves.
- **The args you wrote yourself**, listed under it.
- **Everything a default filled in**, folded behind one line and one
  click. Nothing is dropped — and the log still prints every arg with
  where it came from.

Which arg fills the box is the plugin's own manifest saying
[`multiline`](https://local-workflows.github.io/getting-started/plugins.md#pluginjson) — the
same field that decides an arg is drawn as an editor rather than a
one-line box.

A gate rebuilt after you closed and reopened the panel lists every arg
together. The stored row keeps the merged args and not where each came
from, so the card cannot tell a default from something you wrote, and
does not pretend to.

---

## 6. Let AI draft it, and keep the decision yours

This is the shape the whole engine exists for: **a model proposes, a
human approves, a task executes.**

This step needs a GitHub Copilot sign-in. Everything above works without
one — if you have not got Copilot, you already have a working workflow and
can stop here.

Declare what runs the AI once, at the top of the file, then the whole
file:

```yaml
version: 1

name: Release
desc: Builds, drafts the notes, then waits for a person before publishing.

vars:
  target: production

plugins:
  ai:
    uses: ai@1
    args:
      provider: ghcp

stages:

  - name: verify
    desc: Two checks, one after the other.
    tasks:

      - name: Compile
        run: echo Compiling...

      - name: Analyse sources
        run: echo Linting...

  - name: release
    desc: AI drafts, a human approves, a task publishes.
    tasks:

      - name: Draft the notes
        uses: ai
        args:
          prompt: Draft release notes from the commits on this branch.
        artifact: NOTES

      - name: Approve the release
        trigger: manual
        env:
          NOTES: ${{ run.context.NOTES.summary }}   # free text goes in as env, never into the command
        shell: pwsh
        run: Write-Output "Publishing to ${{ vars.target }}"; Write-Output $env:NOTES

      - name: Announce
        run: echo Announced
```

Run it, and read the gate. It shows you the sentence the model actually
wrote, because the run variable resolved before anybody was asked.

Three lines in there are the entire argument:

- **`uses: ai`** is a name *you* declared. Swapping the vendor is one
  word at the top of the file; no task mentions a vendor or a model.
- **`artifact: NOTES`** stores what it drafted as a value. Not a
  decision — a value.
- **`trigger: manual`** is on the task that *acts*, and it is
  there because you put it there. `ai@1` enforces no gate of its own —
  it is an agent, and it can write to the repository. The publishing
  command is an ordinary `run:` you wrote and someone reviewed; all the
  model did was fill in `${{ run.context.NOTES.summary }}`.

The model drafts; a command you wrote publishes. What the model cannot
do is decide that the release goes out — that is the gate, and the gate
is a line in your file. It is a split of *authority*, not of capability.
If a session must not touch anything, say so in `excludedTools:` — see
[`ai@1`](https://local-workflows.github.io/getting-started/plugins.md#ai1).

`Samples/HelloWorld/.local-workflows/workflows/release-pipeline.yml`
exercises every shape the format can express, each case numbered and
commented. `approve-a-deploy.yml` beside it is the gate on its own, and
`ado-breakdown.yml` is a real one end to end.

---

## Cleanup that always runs

Once a task fails, a gate is rejected, or you press Stop, everything
after it is skipped — that is the barrier doing its job. But a workflow
that *started* something now leaks it: the containers stay up, the
seeded test data stays seeded. `if: always()` is the one exception to
skip-on-failure, written for exactly this:

```yaml
stages:

  - name: test
    tasks:
      - run: docker compose up -d
      - run: npm test

  - name: teardown
    if: always()
    tasks:
      - run: docker compose down
```

`teardown` runs whether `test` succeeded, failed, or was stopped. On a
stage, `always()` brings every task in it along; on a single task, only
that task outlives the failure — useful when the cleanup lives in the
same stage as the work.

Three rules keep it honest:

- A failing cleanup task fails the run like any other task. `always()`
  changes *when* a task runs, never how its result is read.
- A cleanup's success never repaints the run — a run that failed and
  then cleaned up after itself is still a failed run.
- After a **Stop**, a `trigger: manual` cleanup task is skipped rather
  than gated. A gate needs a human, and the human just said stop —
  opening a question then would hang the run on an answer that is never
  coming. After a plain failure the run is still live, so a gated
  cleanup asks as usual.

`always()` is a marker, not an expression — the condition grammar is
still closed. It works the same in `tasks.yml`: a task with
`if: always()` runs even when a task it `needs:` failed.

---

## Workflows that need no folder

Open a `.code-workspace` with five repositories in it and run a workflow
that lives beside the workspace (or in your profile) rather than inside
one repository, and you are asked which folder to run in — every run,
never remembered. That is deliberate: `git clean` is a different act in
each of those five repositories.

It is also pointless for a workflow that only calls an HTTP endpoint.
Say so at the top of the file:

```yaml
version: 1
name: Ping the API
cwd: none

stages:
  - name: ping
    tasks:
      - uses: http@1
        args:
          url: https://example.com/health
```

The question stops. The run starts in the workflow file's own project
folder, which is where it would have started anyway.

Naming a real folder does the same thing, because it answers the same
question:

```yaml
cwd: ${{ home }}/scratch
```

**Any `cwd:` you write silences the pick** — a path or `none`. A
workflow inside a repository's own `.local-workflows` was never asked in
the first place; the repository is the answer.

The same key works on a single task in a `tasks.yml`, for the same
reason — a workspace- or profile-level task is aimed before every run
unless it says where it runs.

`none` is matched whatever the casing. If you really do have a folder
called `none`, write `./none`.

---

## Reference: `workflows/*.yml`

Structure: `stages:` (ordered, each a barrier) → `tasks:` (a list;
always sequential — file order is execution order, and there is nothing
between a stage and a task).

### Top-level keys

| Key | Type | Default | Meaning |
|---|---|---|---|
| `version` | `1` | **required** | Missing or wrong is a parse error. |
| `name` | `string` | `Unnamed Workflow` | The row's label in the tree. |
| `desc` | `string` | | One line. |
| `label` | `string` | falls back to `name` | What a **run** is called, resolved once at start. May read anchors, `params:` and file-level `vars:` — not `env:`, not `run.context.*`. |
| `engine` | `string` | `default` | Which machinery runs the file. `inline` = the tasks.yml shape; anything else parses as the stages format. Rarely written. |
| `params` | map | | See [`params:`](#params). |
| `cwd` | `string` | the file's project folder | Where this file's tasks start, before any task's own `cwd:`. Relative to the folder the run starts in unless absolute. `none` means it acts on no folder — see [below](#workflows-that-need-no-folder). |
| `vars` / `env` / `dotenv` / `plugins` | | | Same as `tasks.yml` — see [Values and templating](/getting-started/tasks/#values-and-templating). |
| `stages` | list | | The stages, in order. |

This key used to be called `template:`. A file that still says `template:`
no longer loads — it fails with an error telling you to rename the key to
`engine:`. The values did not change, so renaming the key is the whole fix.

### A stage

| Key | Type | Meaning |
|---|---|---|
| `name` | `string` | Defaults to position, e.g. `stage-2`. |
| `desc` | `string` | One line. |
| `if` | condition | Runs the stage only when true. The literal `always()` marks a cleanup stage — it still runs after a failure, a rejected gate, or a Stop. See [Cleanup that always runs](#cleanup-that-always-runs). |
| `artifact` | `string` | A path this stage produces, resolved at run time (may read params). A stage whose artifact already exists on disk is **satisfied**: its tasks never run. An unresolvable artifact never counts as satisfied. |
| `tasks` | list | The tasks, in order. Always sequential — there is no `jobs:` level and no `needs:` between tasks in a workflow file. |

### A task in a workflow

Identical to a [`tasks.yml` task](https://local-workflows.github.io/getting-started/tasks.md#a-task)
with two differences:

- `needs:` is **refused** — a hard error. `needs:` exists only in
  `tasks.yml`; ordering here is the list order.
- `name` defaults to position (`task-2`), not to a map key.

### `params:`

Values the run is asked for before it starts. Workflow files only.
Param names must match `[A-Za-z_][A-Za-z0-9_]*` — a param called
`work-item` could never be read back as an expression, so it is rejected
at the declaration. Params resolve before `vars:`, so `vars:` may read
`${{ params.x }}`.

| Key | Type | Meaning |
|---|---|---|
| `desc` | `string` | Shown in the prompt. |
| `type` | `string` \| `list` \| `map` | Default `string`. The shape of the answer. A `list` is what a task's `foreach:` runs over. A `map` is read by path, `${{ params.NAME.key }}`. |
| `required` | `boolean` | Default `true` — a param exists because the file cannot supply the value; opting out is what you declare. `required: true` alongside `default:` is an error. |
| `default` | of the param's `type` | Makes the param optional. Text, or a YAML list or map for a `list` or `map` param. Must be one of `options:` (every item, for a list) when declared. |
| `options` | list | The only accepted values, offered as a pick list — pick-many for a `list`. Read as text. Not for a `map`. |

An empty declaration (`ticket:` with nothing under it) means required, no
description.

**A run only asks for what it has no answer for.** Answer once and later
runs go straight through. The run panel's **Params** tab is where an
answer lives afterwards: every declared param with its current answer, a
menu where `options:` closes the set, a text box otherwise. Clear a box
and the param is un-answered, so the next run asks again — the only
route back out of an answer. The tab never prompts; it only edits, and
is read-only while the run is going.

**A `list` or `map` param** is edited as JSON in the tab, and typed as
JSON when the run prompts for it. That is the fallback. The way meant
for those is a plugin's own page: it fetches what exists, draws the
pick, and starts the run with the answers already given —
`lw.run(undefined, { releases: [12, 15] })`. See
[Plugin apps](https://local-workflows.github.io/getting-started/plugin-apps.md#lwruntarget-params).
The run never asks mid-run: everything is answered before it starts,
and the only place it stops is a `trigger: manual` gate.

### Complete example

```yaml
version: 1
name: Release
label: "Release ${{ params.tag }}"

params:
  tag:
    desc: Version tag for this release

plugins:
  ai:
    uses: ai@1
    args:
      provider: ghcp

stages:
  - name: verify
    tasks:
      - name: Compile
        run: npm run build
      - name: Lint
        run: npm run lint

  - name: publish
    tasks:
      - name: Draft notes
        uses: ai
        args:
          prompt: Draft release notes for ${{ params.tag }}.
        artifact: NOTES
      - name: Publish
        uses: pwsh@1
        trigger: manual            # a human reads the draft first
        env:
          NOTES: ${{ run.context.NOTES.summary }}
        args:
          script: ./publish.ps1 -Tag "${{ params.tag }}" -Notes $env:NOTES
```

---

## Passing data between tasks

There is no task-level `outputs:` block, deliberately. A task names a run
variable with `artifact:`, and anything later reads it as
`${{ run.context.NAME.key }}` — run variables are
run-scoped, so they cross stage boundaries without a second mechanism.

The run panel's **Artifacts** tab lists them as they are produced — the
expression that reads each one, the task that set it, and the value. A
string renders as markdown; anything else is shown as JSON. The **Env**
tab shows what the run was given: `params:`, the file's `vars:` and
declared `env:`, and the directory anchors.

There is no Args tab. What a task was actually handed goes into that
task's own log, in the block the engine writes before the plugin runs:

```
Run ai@1
Anchors:
  ...
Args:
  [task        ] provider = "claude"
  [settings(ws)] model    = "auto"
  [manifest    ] cleanup  = false
```

One line per arg, resolved rather than the template you wrote, tagged
with where the value came from: `task` for the file's own `args:`,
`settings(ws)` or `settings(up)` for a `settings.json` default and which
scope it was read from, `manifest` for the plugin's own default. A value
too long for the column is written out in full underneath it.

A plugin may keep one arg out of that block when it logs the same value
itself in a better form — `ai@1` does, because it logs the whole prompt
it actually sent, context documents and all, and the task's shorter
`prompt:` would be the same text twice.

## The list in the sidebar

Workflows are listed A-Z by the name the row shows — `name:`, or the
filename when the file will not parse. The **Workflows** title bar
carries one icon — **Sort Workflows by Recently Changed** / **Sort
Workflows A-Z**, also in the Command Palette. Recently changed puts the
file you edited last at the top; files written at the same moment, which
is every file in a fresh clone, fall back to A-Z. The choice is saved per
workspace and written nowhere in your repository.

---

Clicking a workflow in the sidebar opens its **runs list** — every
recorded run of that file, newest first, before anything else. **Open**
gets you the run view with nothing started; **Run** starts a new one; a
row opens that run exactly as it happened, read back off its own record,
with a `← Runs` link back to the list. **Clear history** on that list
deletes the finished runs of this file and everything under them — the
editor asks first, there is no undo, and a run still going or parked at
a gate is kept: a waiting run holds nothing in memory, so those rows are
the only thing left to resume it from.

---

## A stage that runs nothing

A task declaring neither `run:` nor `uses:` is legal. It succeeds, logs
`Task has nothing to run`, and the walk carries on:

```yaml
  - name: sign-off
    tasks:
      - name: QA runs the release checklist by hand
```

This is how you say **the work for this phase happens somewhere the
engine cannot reach** — a deploy approved out of band, a manual QA pass.
A stage needs a task, so a phase that genuinely runs nothing still has
to say so.

It is safe to offer because an empty task is only ever what the author
actually wrote. A misspelled key is still a hard error: `use: pwsh@1`
fails with *unknown key 'use'* rather than quietly becoming a task that
does nothing and reports success.

---

## Errors and silent failures

Everything on the [tasks.yml list](https://local-workflows.github.io/getting-started/tasks.md#errors-and-silent-failures)
applies here too. On top of it:

| | |
|---|---|
| `version:` missing or not `1` | parse error naming what to write |
| `jobs:` in a stage | parse error — the level was removed; move its tasks up under the stage |
| `template:` at the top level | parse error — the key is now `engine:`, with the same values. Rename it |
| `needs:` on a task | hard error |
| Unknown stage/param key | hard error — both key sets are closed |
| `foreach:` on a stage | parse error — a stage does not loop; put it on the task |
| A param `type:` that is not `string`, `list` or `map` | parse error |
| A `default:` of the wrong shape for its `type:` | parse error naming the param and what it was given |
| `options:` on a `type: map` param | parse error |
| An answer of the wrong shape — text for a `list`, a list for a `map` | refused at the door, whoever supplied it: the prompt, the Params tab, or a plugin page's `lw.run` |
| A `list` or `map` param's JSON that does not parse in the Params tab | refused under its own box; nothing is saved |
| A `label:` that fails to resolve | falls back to `name:`; the validator flags it, the run still starts |
