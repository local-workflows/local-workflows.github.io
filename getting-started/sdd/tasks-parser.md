# How the tasks parser reads tasks.md

This page is about one file: `src/sdd/documents/parsePlan.ts`. It reads
`tasks.md` and turns it into rows the implement phase can run.
If a plan is written in a shape this parser does not match, the
implement phase does not see the task. Not "sees it wrong" — does not
see it at all.

Use this page to check a style's prompts against what the parser
actually accepts, line by line.

---

## Why order matters: tasks before implement

Every spec pipeline ends the same way: a `tasks` phase writes
`tasks.md`, then the `implement` phase reads it. `implement` never
writes a document and never runs a model of its own — it hands rows
from `tasks.md` to a coding session, one task or one wave at a time.

So `implement` has nothing to do until `tasks.md` exists and this
parser can read it. There is no separate check that "tasks" ran before
"implement" — the pipeline just does not offer `implement` as the next
phase until `tasks.md` is on disk (see `src/sdd/walk/walk.ts`). But
having the file is not enough. A `tasks.md` that exists but does not
match the shapes below still produces `problems`, and any task the
parser could not read is a task the implement phase will never run,
even though it is sitting right there in the file.

This is why a style's `tasks` prompt has to match this parser exactly,
not just look like a task list to a person reading it.

---

## Step 1: pick the dialect

The parser reads the whole file and picks one of two dialects. It never
mixes them.

- If any line matches the **flat** pattern (`- [ ] T001 ...`), the whole
  file is read as **flat**.
- Otherwise the whole file is read as **hierarchical** (`- [ ] 1. ...`
  with `- [ ] 1.1 ...` under it).

There is no per-line dialect and no declared dialect in frontmatter.
One matching flat line flips the entire document to flat rules, so
never write a stray `T001`-style line inside an otherwise hierarchical
plan.

Text inside a fenced code block (three backticks) is ignored for this
and for everything else below. An example task shown inside a fence in
your prompt is safe — it will never be read as a real task.

---

## Step 2: the exact line shapes

### Hierarchical

```
- [ ] 1. Group title
  - [ ] 1.1 An actionable, single-concern task
    - an implementation detail
    - [Requirements : 1.2, 3.1](requirements.md)
```

The exact rule, as a regex: `^(\s*)-\s\[(state)\]\\?(\*?)\s+(\d+(\.\d+)?)\.?\s+(.*)$`

Read in plain words:

- Any leading spaces, then `- [`, one state character, `]`.
- An optional literal backslash right after the `]` is allowed and
  silently thrown away — so `- [x]\* 1.2 Title` (a markdown-escaped
  asterisk) reads exactly the same as `- [x]* 1.2 Title`. Don't rely on
  this on purpose; it exists because some tools escape `*` and the
  parser shouldn't lose the task over it.
- An optional `*` right after that, no space before it — this marks
  an optional task.
- One or more spaces, then the number: either `1` (a group) or `1.1`
  (a task inside group `1`). Never a third level like `1.1.1`.
- An optional `.` after the number, then a space, then the title —
  everything else on the line.

A number with no dot (`1`) is a **group**. A number with one dot (`1.1`)
is a **task**, and it must belong to a group with that first number —
`1.1` needs a `1.` line somewhere in the file, or the parser reports a
missing group.

A group line that is indented is flagged as a problem: a top-level task
starts at column 1; only its sub-tasks are indented.

Detail lines — the plain bullets under a task, including the citation —
carry no checkbox at all: `    - some detail`. A detail line that
somehow grows a checkbox looks like a broken task to the parser (see
[Problems](#problems-the-parser-reports) below), not like a detail.

### Flat

```
## Phase 1: Setup

- [ ] T001 Add the module skeleton in `src/thing/index.ts`
- [ ] T002 [P] Add the config type in `src/thing/config.ts`
```

The exact rule: `^(\s*)-\s\[(state)\]\s+(T\d+)\.?\s*(\[P\])?\s+(.*)$`

- `- [ ] T` then digits — `T001`, `T042`, any number of digits.
- An optional `[P]` right after the id (with normal spacing) marks a
  task that may run alongside the other `[P]` tasks under the same `##`
  heading.
- Whatever `##` heading appears above a task in the file becomes that
  task's `phase`. A task with no `##` above it has no phase.
- No hierarchy here. `T001`, `T002`, `T003` are all independent — there
  is no `T001.1`.

### The checkbox state

Both dialects accept four characters inside the brackets: space, `x`,
`X`, `~`, and `-`. Only `x` or `X` means **done**. `~` and `-` both mean
**not done** — they exist because Kiro's own tools write those marks
for "in progress" or "abandoned", and this parser has to read a plan
Kiro wrote without losing rows. Anything else inside the brackets does
not match at all, and the line is not read as a task.

---

## Step 3: citations

A task's last detail line can cite the requirements it satisfies. Two
spellings are accepted, and both can appear in the same file:

```
- [Requirements : 1.2, 3.1](requirements.md)
```

or, Kiro's own italic form:

```
_Requirements: 1.2, 3.1_
```

Either way, whatever ids are listed (comma-separated) get attached to
the **task above the citation line** — the parser walks backwards from
the citation to the nearest task it already read. The path inside the
link and the word before the colon are not checked here at all; only
the ids are pulled out. Write the link form for new plans — the italic
form is read-only compatibility, never written by this parser's own
callers.

---

## Step 4: the wave graph (parallel tasks)

The parser always produces a list of **waves** — groups of task ids
that may run at the same time — but it gets them from different places
depending on dialect.

**Flat plans:** waves are *derived*, never declared. The parser walks
the task list in order. Consecutive tasks marked `[P]` and sharing the
same `##` phase become one wave. A task without `[P]`, or a `[P]` task
whose phase differs from the run before it, starts a new wave of its
own. So the `[P]` marks and the phase headings *are* the whole
schedule — there is no separate graph to write for a flat plan.

**Hierarchical plans:** waves come from a fenced JSON block at the end
of the file, under a heading written exactly like this:

```
## Task Dependency Graph
```

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "3.1"] }
  ]
}
```

Rules the parser enforces:

- If there are several fenced ```json``` blocks in the file, the
  **last one** is read as the graph.
- The block must parse as JSON and have a `waves` array, or it is a
  problem, not a silently-empty schedule.
- Every id inside `waves` must be a real task id in the file (not a
  group id). An id that does not exist, or that names a group instead
  of a task, is reported.
- Every real task must appear in exactly one wave. A task in no wave is
  reported — the plan would never reach it.
- The parser does not check that two tasks in the same wave actually
  touch different files. That judgment call has to be made when the
  plan is written, not when it is read.

A hierarchical plan with no such heading at all is fine — it just has
no wave graph, and the implement lens then runs the tasks one at a
time, in list order.

---

## Problems the parser reports

The parser never throws away the whole document over one bad line. It
keeps reading, and collects a list of `problems` (line number plus
message) that the panel shows. Here is exactly what triggers one:

| What's wrong | When it's reported |
|---|---|
| A checkbox line the grammar could not match at all | The line has `- [` + a valid state + `]`, but nothing after it fits the id/title shape — usually a detail line that grew a checkbox, or nesting past `1.1` |
| A group line that is indented | `1.` (no dot) written with leading spaces |
| A task whose group doesn't exist | `1.1` with no `1.` line anywhere (hierarchical only) |
| Two tasks with the same id | Same `1.1` or `T001` appears twice |
| The JSON dependency graph is not valid JSON | Parse error in the fenced block |
| The JSON has no `waves` array | Block parses, but wrong shape |
| A wave names a ghost id | Id in `waves` is not a real task |
| A wave names a group | Id in `waves` is a group heading, not a task |
| A task is in no wave | Real task id missing from every wave (hierarchical only, and only when a graph exists) |
| No tasks at all | The whole file matched neither dialect anywhere |

None of these stop the implement phase from running the tasks it
*could* read. They only mean the tasks with a problem attached will not
run, or the file's schedule cannot be trusted, until the problem is
fixed.

---

## What this means for a style's prompts

If you are writing or fixing a `tasks` prompt so an AI reads it
correctly, check it against this list:

1. **Pick one dialect and hold it everywhere in the prompt's own
   examples.** One stray flat-style example line in an otherwise
   hierarchical prompt (even inside a fence — check the fence is
   closed) risks flipping detection for a plan the AI drafts loosely.
2. **Spacing is exact, not "close enough."** `- [ ] 1.1 Title` — one
   space after the dash-bracket, no period after `1.1`, four leading
   spaces (not two, not a tab) for a detail line.
3. **Numbers are permanent and never restart.** `T001, T002, ...`
   across the whole file; `1`, `1.1`, `1.2`, `2`, `2.1` — never
   renumbered on a revise, or every existing citation to that id goes
   stale.
4. **Every citation is on its own last detail line**, one of the two
   exact spellings above, with a real, existing id from
   `requirements.md`.
5. **The wave graph heading is spelled exactly** `## Task Dependency
   Graph`, and every id inside it matches a task id character for
   character — the parser does no fuzzy matching.
6. **Every task ends up in exactly one wave** (hierarchical) or is
   marked `[P]` correctly under the right `##` phase (flat). A task the
   prompt forgets to schedule is a task nobody will run.

The full prose version of these rules — written for the AI drafting
the document, not for reading the parser's code — ships as the
`grammar` attachment every phase gets:
`resources/styles/custom/grammar.md`. This page is the
parser's side of the same contract; when the two disagree on the shape
of a line, the parser (this page) is what actually runs.
