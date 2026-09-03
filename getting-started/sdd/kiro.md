# The Kiro style

Three documents, with a human gate between each. The default.

---

## The shape

```
intake.md  ->  requirements.md  ->  design.md  ->  tasks.md  ->  implement
```

＋ New Spec writes `intake.md` itself — no model runs there. Requirements,
design and tasks are each drafted by the engine from what came before.
Implementation happens in an agent chat you can join, with a ticked
checkbox as the definition of done.

---

## The two kinds of spec

＋ New Spec asks which one you want:

| | Phases |
|---|---|
| **Feature** | `intake` → `requirements` → `design` → `tasks` → `implement` |
| **Bug fix** | `intake` → `requirements` → `tasks` → `implement` |

A bug fix skips design. A one-line fix does not need a design document,
and a process that demands one teaches people to write a paragraph of
nothing to get past the gate.

That skip is declared once, in the style's `specTypes:` list — not as a
conditional inside a stage, and not as a branch inside a prompt. The
phases a spec type visits *are* its list.

---

## Phase by phase

### `requirements`

The first phase a model runs, seeded by `intake.md` — the ask, and a
pointer at where the ask came from — plus whatever the ask itself
brought into the folder.

`intake.md` is deliberately thin: it records *where* the material is
rather than paraphrasing it. So this phase opens what it names — the
files ＋ New Spec copied into the spec folder, or the work item and its
comment thread through your own Azure DevOps or GitHub MCP server — and
reads the original before it drafts. Nobody has read that material yet,
which is the point.

### `design`

A new session, seeded only by `requirements.md`.

The gate that matters for requirements lives *here*, on the next phase,
not on the one that wrote the file. What a human approves is
"`requirements.md` is good enough to build on" — and that is a judgement
you make when you are about to depend on it.

### `tasks`

Produces `tasks.md`: a numbered plan (`1`, `1.1`) carrying a dependency
graph between tasks, expressed as ordered **waves**. Tasks in the same
wave may run at the same time; a wave begins only once every task in
every earlier wave is finished and ticked. Two tasks share a wave only
when they touch different files.

**Every task ends green.** The repository builds and its tests pass at
the end of each task, not just at the end of the plan. That is what
decides where the boundaries go, and it is a stronger rule than "one
concern per task" — an interface and its implementation, a changed
signature and every caller it breaks, a behaviour and the test that
proves it are each *one* task. Splitting any of them leaves the tree red
in between, and a plan you cannot stop half-way through is a script
rather than a plan.

There is no `requires:` key anywhere in the style file. What a stage
needs is whatever the prior stages of *this spec type* produced — for a
Feature that is `requirements.md` and `design.md`; for a Bug fix, which
has no design stage, just `requirements.md`. Writing it out by hand would
state the pipeline twice and eventually get one of the two wrong.

### `implement`

**The engine does not wait here.** This is the `implement` stage — the
output gate, terminal, so it produces nothing and is never satisfied.
Intake is the gate at the other end, and it is the mirror image: it
leaves a document but runs no model, where this one runs a model and
leaves no document.

The panel's implement lens hands tasks to an agent session and returns
straight away — the same plugin every drafting phase runs on, so the
session lands on whatever `provider:` the `implement` stage is
configured with. **Start** on a row hands over that one task; **Start
all** hands over every remaining task in one chat, wave by wave. Either
way the chat is yours to watch or ignore, git is the record, and the
ticked checkbox in `tasks.md` is the completion signal.

Two presses of **Start all** would be two agents let loose on the same
list, so the panel asks before adding a second chat to work something a
chat is already working.

No gate, either — the plan is approved by starting its first task.

---

## Checkpoints

`checkpoints: required` (the default) puts checkpoint tasks into the
plan — a top-level task that runs the full test suite and confirms it
passes. Set `sdd.checkpoints` to `optional` or `none` in
`.local-workflows/settings.json`.

**A checkpoint verifies; it does not ask.** It never waits for a human,
and a passing one is not a decision point — the plan carries straight on
into the tasks after it. Whoever started the plan asked for it to be
carried out; stopping halfway to ask whether to continue answers a
question they already answered.

A failing checkpoint is usually work rather than a wall:

| The broken test | What happens |
|---|---|
| written by this spec's tasks, or broken by them | fixed, re-run, ticked, plan continues |
| already red before the plan started, in code this spec does not touch | reported, plan continues |
| a failure that cannot be fixed | the plan stops there, checkpoint left unticked |

Checkpoints sit after a top-level task, never after a sub-task.

---

## What each phase is handed

Not the whole folder, and not a conversation:

- **its own prompt** — what to do, and what the document must look
  like. One file per phase, so replacing it replaces the whole
  instruction rather than half of one.
  The implement prompt carries the checkbox rules too — an agent that
  ticks a box needs them as much as the phase that writes them.
- **the documents from prior stages** — as files.

---

## Files it produces

| File | Written by |
|---|---|
| `intake.md` | ＋ New Spec, from what you picked — no model |
| `requirements.md` | `requirements` |
| `design.md` | `design` |
| `tasks.md` | `tasks` |

Files picked as the source are copied into the spec folder beside them,
so the ask travels with the spec in git.

All under `.local-workflows/specs/<spec>/`, all committed.

Kiro is the default, so if you have written no
`.local-workflows/settings.json` at all, this is the process you are
running.
