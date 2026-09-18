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

The exact rule, as a regex: `^(\s*)-\s\[(state)\]\\?(\*?)\s+(\d+(\.\d+)*)\.?\s+(.*)$`

Read in plain words:

- Any leading spaces, then `- [`, one state character, `]`.
- An optional literal backslash right after the `]` is allowed and
  silently thrown away — so `- [x]\* 1.2 Title` (a markdown-escaped
  asterisk) reads exactly the same as `- [x]* 1.2 Title`. Don't rely on
  this on purpose; it exists because some tools escape `*` and the
  parser shouldn't lose the task over it.
- An optional `*` right after that, no space before it — this marks
  an optional task.
- One or more spaces, then the number: `1`, `1.1`, `1.1.3` — any
  depth, dots between the levels.
- An optional `.` after the number, then a space, then the title —
  everything else on the line.

**A row with rows under it is a group; a row with none is a unit of
work.** That is the whole rule, at every depth: `1` above `1.1` is a
group, and so is `1.2` above `1.2.1`, while a `2` with nothing under it
is a unit like any `1.1`. Units are what an agent is handed, what a
wave names, and what carries a `Files:` line; a group is a heading for
them. Every dotted id needs its parent — `1.2.3` needs a `1.2`, which
needs a `1` — or the parser reports the task as belonging to nothing.

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

### How a box gets ticked

The box is the definition of done, and four things write it:

1. **The agent, through the `task_done` tool.** Every implementation
   chat carries it; the agent calls it with the task's id and the engine
   flips that one `[ ]` to `[x]` in the file, nothing else. The shipped
   instructions tell the agent never to edit `tasks.md` to tick a box.
2. **You, on the Tasks phase's Doc tab** — every checkbox row is live.
3. **You, on the implement lens** — every row there carries the same
   live box, so a task done by hand is ticked without leaving the lens.
4. **Anyone, in an editor.** It is a markdown file.

Whichever way, the panel reads the file again and the row, the wave
strip and the next lane's start all follow from the mark on disk. There
is no other record of done.

---

## Step 3: citations

A task's last detail line can cite the requirements it satisfies. Two
spellings are accepted, and both can appear in the same file. Kiro's
italic form, which is what the shipped `tasks` instructions write:

```
_Requirements: 1.2, 3.1_
```

or a markdown link, which older plans carry and which the shipped
grammar still uses everywhere except this line:

```
- [Requirements : 1.2, 3.1](requirements.md)
```

Either way, whatever ids are listed (comma-separated) get attached to
the **task above the citation line** — the parser walks backwards from
the citation to the nearest task it already read. The path inside the
link and the word before the colon are not checked here at all; only
the ids are pulled out.

### The `Files:` line

Just above the citation, a task names the files it will create or
edit:

```
    - Files: `src/thing/index.ts`, `src/thing/__tests__/index.test.ts`
```

The rule: `^\s*-\s*Files:\s*(.*)$`, case-insensitive. Only what sits in
backticks counts as a path — anything outside them is prose, so
`- Files: none` reads as no files. Backslashes are turned into forward
slashes, so the same file written two ways in two tasks still matches.
Like a citation, the line belongs to the nearest task above it. A task
with no `Files:` line simply has no files; the parser reports nothing.

The list is what the panel checks before it opens a wave: two tasks in
one wave that name the same path are a conflict, and the wave does not
start until the plan is fixed. A task with no `Files:` line conflicts
with nothing, because it said nothing — which is why the shipped
grammar tells the `tasks` phase to give such a task a wave of its own.

### The `Run:` line

A task that is not an agent's — an environment to update, a branch to
create, a review to get — says who does it on one more detail line:

```
    - Run: by hand
    - Run: `git switch -c feature/4711`
    - Run: story-start story=4711 branch="feature/4711 retries"
```

The rule: `^\s*-\s*Run:\s*(.*?)\s*$`, case-insensitive, under the
nearest task above it. Three shapes:

| Value | Meaning | What the row shows |
|---|---|---|
| `by hand`, or nothing | a person does it and ticks the box | the box and a *by hand* mark |
| one command in backticks | run in the editor's integrated terminal, exactly as written | a `>_` button |
| a name, then `key=value` pairs | the workflow `.local-workflows/workflows/<name>.yml`, started with those params | ▶, or a red `?` when no file has that name |

The same three controls appear on the implement lens's rows, so a
`Run:` row is worked from either screen. A task with a `Run:` line is
**never handed to an agent** — not by its own ▶, not by Start. The engine also never ticks it: whichever way it
was done, the box is the person's to click. A workflow started from a
row is given what the row knows — `spec` (the spec folder), `task`,
`taskTitle`, `group` (the `##` heading above the row), `files` and
`repos` (the first segment of every `Files:` path) — for any of those
names its `params:` declares, plus the `key=value` pairs on the line.
Anything else it declares is asked at start, prefilled as usual. A
plain markdown reader, and Kiro, see an ordinary sub-bullet.

---

## Step 4: what the implement phase is handed

A row's ▶, or **Next: Implementation**, hands the agent the **units** —
the rows with nothing under them — and each one goes into the prompt
whole:

```
- 1.1 Add the retry header (wave 0) - plan line 12
    - Files: `src/http/client.ts`
    - [Design : Dec-1](design.md)
    - _Requirements: 1.2, 3.1_
```

The detail lines are the plan's own, verbatim, so the citations and the
`Files:` line are in front of the agent rather than in a file it has
to open; `plan line 12` is where to look for anything around the task.
A group is never handed over — only what is under it. A row with a
`Run:` line is never handed over at all.

**Which chats may be open at once** is decided by repositories. The
repository of a task is the first segment of each `Files:` path
(`orders-api/src/a.ts` → `orders-api`). Every wave is a lane; a lane
starts when no running lane touches one of its repositories, so waves
in different repositories run side by side and waves in one repository
take turns. A task with no `Files:` line is taken to touch everything
and keeps the plain one-at-a-time order — which is what a single
repository gets whichever way it writes its paths.

---

## Step 5: the wave graph (parallel tasks)

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
  touch different files. The panel does, from their
  [`Files:` lines](#the-files-line), at the moment it starts the wave —
  and it refuses a wave with a shared path. A plan whose tasks carry no
  `Files:` line gets no such check at all.

A hierarchical plan with no such heading at all is fine — it just has
no wave graph, and the implement lens then runs the tasks one at a
time, in list order.

---

## Problems the parser reports

The phase that writes the plan can see this list before it stops: its
session carries a **`check_plan`** tool that runs this parser over the
draft and returns the problems by line, plus the one check the panel
adds (two tasks of one wave naming the same file). The shipped `tasks`
instructions tell the agent to call it until it reports none.

The parser never throws away the whole document over one bad line. It
keeps reading, and collects a list of `problems` (line number plus
message) that the panel shows. Here is exactly what triggers one:

| What's wrong | When it's reported |
|---|---|
| A checkbox line the grammar could not match at all | The line has `- [` + a valid state + `]`, but nothing after it fits the id/title shape — usually a detail line that grew a checkbox |
| A group line that is indented | `1.` (no dot) written with leading spaces |
| A task whose parent doesn't exist | `1.1` with no `1` line, or `1.2.3` with no `1.2` (hierarchical only) |
| Two tasks with the same id | Same `1.1` or `T001` appears twice |
| The JSON dependency graph is not valid JSON | Parse error in the fenced block |
| The JSON has no `waves` array | Block parses, but wrong shape |
| A wave names a ghost id | Id in `waves` is not a real task |
| A wave names a group | Id in `waves` is a row with rows under it, not a unit of work |
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
7. **Every unit of work carries a `Files:` line**, paths in backticks,
   just above the citation, with the repository as the first path
   segment when the plan spans more than one. Without it, two tasks in
   one wave can edit the same file and nothing will stop them — and
   nothing runs beside it, since a task that names no files is taken
   to touch everything.
8. **Nest as deep as the work needs and no deeper.** A row with rows
   under it is a group and is never handed over; only the leaves are.
   A level exists to hold several tasks, never one.
9. **Have the phase call `check_plan` before it stops.** The tool
   returns exactly the problems this page describes, by line, so the
   plan is fixed before anyone presses ▶.

The full prose version of these rules — written for the AI drafting
the document, not for reading the parser's code — ships as the
`grammar` attachment every phase gets:
`resources/styles/custom/grammar.md`. This page is the
parser's side of the same contract; when the two disagree on the shape
of a line, the parser (this page) is what actually runs.
