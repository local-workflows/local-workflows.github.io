# The Kiro style

Three documents, with a human gate between each. A worked example, not
shipped with the extension — see [Trying it](#trying-it) to copy it in.

---

## The shape

```
intake.md  ->  requirements.md  ->  design.md  ->  tasks.md  ->  implement
```

＋ New Spec writes `intake.md` itself — no model runs there. Requirements,
design and tasks are each drafted by the engine from what came before.
Implementation happens in an agent chat you can join, with a ticked
checkbox as the definition of done.

This is exactly the shape the built-in `custom` style ships with — the
two are the same process, byte for byte, under two different ids. This
page keeps its original name and its worked-example status because two
things about it are worth knowing on their own: it is what `custom` was
built from, and it is deliberately compatible with the real Kiro tool's
own document validator, in the section below.

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

If you have written no `.local-workflows/settings.json` at all, the
process you are running is `custom` — the built-in style this page's
process was copied from. Copy this folder in under the id `kiro` (see
[Trying it](#trying-it)) if you specifically want that id, for example
because you already have specs tagged `style: kiro`.

---

## Kiro compatibility

This style is named for Kiro, and the three documents it writes are
**valid against Kiro's own document validator**. A team can run both
tools over the same spec folder, and a team moving off Kiro brings its
existing specs with nothing to rewrite.

What that means concretely, in each direction:

**What we write.** The shapes Kiro checks, we match exactly — the
`# Requirements Document` title, `### Requirement N:` and its
`#### Acceptance Criteria`, design's required sections and
`### Property N:` with `**Validates: Requirements 1.2, 3.1**` beneath
it, and in `tasks.md` the checkbox grammar plus a
`## Task Dependency Graph` holding a non-empty `waves` array — which
Kiro treats as an error when it is missing.

**What we read.** More than we write, on purpose. Kiro's citation
spelling (`_Requirements: 1.2_`), all four of its checkbox states
(`[ ]`, `[x]`, `[~]`, `[-]`), and its escaped optional marker
(`- [ ]\* 1.`). Point the panel at a folder Kiro wrote and every task
row, every citation and every hover card works untouched.

Two places the styles differ, both deliberate and neither one Kiro
checks:

- **`tasks.md` citations are links** — `[Requirements : 1.2, 3.1](requirements.md)`.
  Kiro's validator never reads a detail line, so this costs nothing
  there and buys a citation that works on GitHub.
- **A citation may point outside the spec** — at a PRD, an ADR, any
  `.md` file in the repository. Kiro has no form for that, so there is
  nothing to be compatible with.

Everything else we add — `## Assumptions`, `## Open Questions`, EARS
keywords, the Glossary's underscored terms — sits in territory the
validator does not inspect.

---

## Trying it

This does not ship with the extension, so there is no **Eject Style**
entry for it. Copy it in by hand:

1. Create `.local-workflows/styles/kiro/style.yml` (workspace scope) or
   `~/.local-workflows/styles/kiro/style.yml` (profile scope, applies to
   every repository you open).
2. Copy `style.yml` and every instruction file from
   [The Kiro instructions](https://local-workflows.github.io/getting-started/sdd/kiro-prompts.md)
   into that folder, keeping the same filenames
   (`instructions/requirements.md`, `instructions/design.md`,
   `instructions/tasks.md`, `instructions/tasks-implement.md`). A stage
   reads `instructions/<stage id>.md` from its own style folder, so the
   folder name and the filenames are what make each phase find its file.
   That page holds the whole example — it is not carried anywhere else in
   the repository.
3. Put a `grammar.md` beside `style.yml`. It is the document grammar
   every phase is handed, it belongs to the style folder, and a style
   without one runs with no grammar at all — while its prompts still say
   *"Follow the `grammar` above"*. The quickest source is the built-in
   one: run **Local Workflows: Eject Style** on `custom`, then copy the
   `grammar.md` it writes into your `kiro` folder. Edit it from there.
4. Set `{ "sdd": { "styles": ["kiro"] } }` in
   `.local-workflows/settings.json`.
5. ＋ New Spec — Kiro is in the menu.

See [Writing your own style](https://local-workflows.github.io/getting-started/sdd/custom-style.md)
for what each key does, and for using this as a starting point for
something of your own rather than running it as is.
