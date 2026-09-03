<!-- GENERATED FILE - DO NOT EDIT.
     Source: resources/styles/kiro/
     Regenerate: ruby scripts/gen-style-prompts.rb -->

# The Kiro prompts

Every prompt behind the Kiro process, exactly as the extension
sends it. This page is generated from `resources/styles/kiro/`, so it
cannot drift from what actually runs.

---

## What a phase is actually handed

**The prompt is the ask; everything else is a file.** Prior documents
are attached rather than pasted into the prompt - a phase that inlined
its requirements and its design would be mostly reference material
with the question buried at the end.

So a phase receives its own prompt below, and the earlier documents as
attachments. Nothing else: there is no intro, no shared grammar and no
separate format file, so a team replacing one prompt replaces the
whole instruction rather than half of one and inheriting the rest from
a file it cannot see. Not the whole spec folder, and never another
phase's conversation.

---

## Which prompt runs where

| Prompt | Job |
|---|---|
| [`design.md`](#designmd) | The `design` stage, which writes `design.md` for Feature. |
| [`requirements.md`](#requirementsmd) | The `requirements` stage, which writes `requirements.md`. |
| [`tasks-implement.md`](#tasks-implementmd) | The `implement` stage, which every pipeline ends on, reached from `tasks`. It writes no document of its own - the work lands in the repository, and git is its record. |
| [`tasks.md`](#tasksmd) | The `tasks` stage, which writes `tasks.md`. |

---

## `design.md`

The `design` stage, which writes `design.md` for Feature.

````markdown
# Draft the design

You are drafting `design.md` for one feature, strictly from the
**approved** `requirements.md` you have been given. The repository is
context; the requirements are the contract. Write `design.md` to the
exact target path stated at the end of these instructions, and touch
nothing else.

## Format

**The grammar and format rules above are the contract** - heading
levels, table shapes, and the exact form of a correctness property.
Follow it exactly. The sections, all H2, in this order:

- **Overview** - what is being built and the shape of the solution.
- **Architecture** - how it fits the existing codebase; diagrams as
  Mermaid where they help. It closes with a `### Design Decisions`
  table: one row per choice a reader could reasonably have made
  differently, and a rationale that names the alternative and why it
  lost. This is the only record of what you rejected, and the only thing
  that stops a maintainer re-opening a settled question in six months.
- **Components and Interfaces** - each new or changed component, its
  responsibility, the file it lives in, and its interface.
- **Data Models** - types, schemas, and their fields, as tables.
- **Correctness Properties** - see below.
- **Error Handling** - what can fail and what happens when it does, as
  a table per layer with a `**Rationale:**` line.
- **Testing Strategy** - how each requirement will be verified.

No sections beyond those, other than the `## Assumptions` and
`## Open Questions` sections described below.

## Correctness Properties - this is where traceability closes

`requirements.md` numbers its acceptance criteria and `tasks.md` cites
them. Without this section the design sits between two numbered
documents carrying no numbers of its own, and nobody can tell whether it
covers what was asked.

A property is a claim that holds across **every** valid execution - not
an example, not a test case:

```markdown
### Property 1: (short descriptive name)

*For any* (universally quantified input), THE (component) SHALL
(guaranteed outcome), regardless of (what does not matter).

**Validates:** [Requirements : 1.2, 3.1](requirements.md)
```

- Number properties from 1. The `**Validates:**` line is required and
  names acceptance criteria by their `N.M` IDs.
- **Every acceptance criterion must be named by at least one property.**
  Before you finish, walk the requirements and check. A criterion no
  property validates is a hole - either write the property, or say
  plainly under `## Assumptions` why it cannot be stated as one.
- If you cannot write "for any", it is an example, not a property. Put
  it in Testing Strategy instead.

Do not name a property-testing framework, and do not prescribe iteration
counts or a testing library. A property is a claim about the design;
**how** it gets verified is Testing Strategy's business, and ordinary
tests are the normal answer.

## Diagrams

A diagram earns its place when it shows something prose cannot - a
branch, an order, a shape. Never draw one that restates a paragraph, and
never use one where a table is clearer.

When you do draw one, write Mermaid that parses. The rules below exist
because the usual failure is a label the parser chokes on:

- Fence it as ` ```mermaid `.
- **Quote every label**: `A["Caller runs greet.ps1"]`, not
  `A[Caller runs greet.ps1]`. Quoting is what makes punctuation -
  `:` `,` `(` `)` `[` `]` `-` `/` - safe inside a label. Do it always,
  even when the text looks harmless.
- **Never put `"` inside a label.** Use single quotes:
  `D["Write-Host 'Hello, X!'"]`. A double quote ends the label and the
  diagram fails to parse.
- Quote edge labels the same way: `B -->|"no"| C`.
- Node ids are short and alphanumeric (`A`, `B2`) - all the words go in
  the quoted label.
- Use `<br/>` for a line break inside a label, never a newline.
- Stick to `flowchart`, `sequenceDiagram`, `stateDiagram-v2`, and
  `erDiagram`. Anything more exotic may not render where the document is
  read.
- At most one diagram per section, and around ten nodes in it. A diagram
  nobody can follow at a glance has failed.

## Rules

- **One write, one path, nothing else.** The only permitted write in
  this session is `design.md` at the path given below. Do not create or
  edit any other file, and do not run terminal commands. Read-only
  tools are fine at any time.
- **Research is context, not an artifact.** When you need to look
  something up - a library's API, a protocol, how a version behaves -
  read it and let it shape the design. Do not write a `research.md`, a
  notes file, or a findings document: the spec folder holds exactly
  three documents, and `design.md` is where what you learned is meant
  to land. Anything load-bearing gets cited inline, next to the
  decision it justifies.
- Every design decision must trace to a requirement. If a requirement
  cannot be satisfied as written, that is a blocker - do not design
  around it silently.
- Follow the principles document if one was provided - it wins over
  your own preferences.
- **Assumptions over questions**: proceed on reasonable assumptions and
  record them under `## Assumptions` at the end. Only true blockers go
  in an `## Open Questions` section placed **first in the document**.
- Read the repository before proposing structure - the design must fit
  the code that exists, not an imagined version of it.
- **Say which files each component lives in.** The next phase splits
  this design into tasks that must not collide, and it can only do that
  if the design says what touches what.

## When revising

Your context may carry one extra document. `current` is the existing
`design.md` - this run is a revision of it, not a fresh draft.

**A `## What to change` section in the ask is what the person typed when
they asked for this pass.** It is the specific thing they want done, and
it is about this run alone - everything above still holds around it, and
nothing it does not mention is an invitation to change something else.
When there is no such section, the document's own edits are the whole of
the instruction.

The current document may contain human edits and answers written under
Open Questions. Treat those as decisions: fold them in, delete the
questions they resolve, and leave everything they do not touch
unchanged - including property numbering, which `tasks.md` may cite.

---

# The shape of this document

Everything above is what to do. What follows is what the document
must look like, and it wins over anything implied above.

## design.md

No frontmatter. Sections, all H2, in this order:

```markdown
# Design: (title)

## Overview
## Architecture
### Design Decisions
## Components and Interfaces
## Data Models
## Correctness Properties
## Error Handling
## Testing Strategy
```

### Design Decisions

An H3 table closing the Architecture section, and the only place the
design records what it *rejected*:

```markdown
| Decision | Rationale |
|---|---|
| (what was decided) | (why this, and what the alternative cost) |
```

One row per decision a reader could reasonably have made differently.
The rationale names the alternative and why it lost - "chose X" with no
loser is a statement, not a decision, and belongs in Overview. Six
months on this table is the only thing standing between a maintainer and
re-litigating a choice someone already thought through.

### Correctness Properties - where traceability closes

A property is a statement that must hold across *every* valid execution,
not an example. This is the section that carries design back to
requirements: without it, `requirements.md` and `tasks.md` both carry
numbers and `design.md` carries none.

```markdown
### Property 1: (short descriptive name)

*For any* (universally quantified input), THE (component) SHALL
(guaranteed outcome), regardless of (what does not matter).

**Validates:** [Requirements : 1.2, 3.1](requirements.md)
```

- Properties are numbered from 1.
- The `**Validates:**` line is required, is the last line of the
  property, and names acceptance criteria by their `N.M` IDs.
- **Every acceptance criterion must be named by at least one property.**
  A criterion no property validates is a hole in the design - either
  write the property or say plainly why the criterion is untestable.
- Start with the italic `*For any*` quantifier. If you cannot write
  "for any", it is an example, not a property - it belongs in Testing
  Strategy.

There is no property-based-testing framework implied here, and no
minimum iteration count. A property is a claim about the design; how it
gets verified is Testing Strategy's business, and ordinary tests are the
normal answer.

### Diagrams, tables, code

- Mermaid rules live in the design prompt. Follow them exactly - the
  panel renders these fences, and a diagram that fails to parse shows as
  an error where the picture should be.
- Data Models are **tables**: `Field | Type | Description`.
- Error Handling is **tables per layer**: `Scenario | Behaviour`,
  followed by a `**Rationale:**` line saying why that strategy.
- Fenced code blocks carry a language tag: ` ```ts `, ` ```json `.
- Tables need their separator row: `|---|---|`.

## Heading levels - the one rule everything else rests on

- `#` H1: the document title. **Exactly one per file, the first line
  after the frontmatter.**
- `##` H2: every section. Sections are never H1.
- `###` H3: numbered items inside a section - a requirement, a
  component, a property.
- `####` H4: **`#### Acceptance Criteria`, and nothing else.** It is the
  one heading that lives inside a numbered item rather than beside it.

The criteria heading is not decoration. The panel anchors a criterion
only when it sits under an explicit `Acceptance Criteria` marker - a
deliberate refusal to treat any numbered list under a requirement as
criteria, which would happily anchor a list inside a user story and send
a reader to the wrong line. Drop the marker and every citation of
`1.2` in `tasks.md` points at nothing.

H4 is what makes that safe. A requirement ends at the next heading of
H3 or shallower, so an H4 sits *inside* requirement 1 while an H3 would
end it - which is why the criteria heading is the one place the document
goes four deep.

This matters for a reason you cannot see in the markdown. A reader
scanning for what is unresolved looks for `## Open Questions` and stops
at the next `##`; a stray `# Something` after the questions swallows the
rest of the document into that section. H2 for sections, always.

## Assumptions and Open Questions

Both are H2, both are allowed in every document, and they are the only
sections a phase may add beyond the ones its prompt names.

- `## Assumptions` goes **last**, and is the normal case. Something
  nobody stated? Proceed on a reasonable assumption and record it here.
- `## Open Questions` goes **first, before the H1 is even followed by
  prose** - immediately after the title. Numbered, one clear question
  each. Nothing enforces it; the position is the point, so the person
  who has to answer sees it before anything else in the document.

Prefer an assumption to a question. A question costs a human round-trip;
an assumption costs a line they can read and correct.

## Markdown hygiene

- UTF-8. LF or CRLF both work.
- No trailing whitespace.
- One blank line between sections, never two.
- Pure markdown - no raw HTML.
- No "generated by" lines, no sign-offs, no notes to the reader about
  what you did. The document is the deliverable.
````

## `requirements.md`

The `requirements` stage, which writes `requirements.md`.

````markdown
# Write the requirements

You are writing `requirements.md` for one feature. Write it to the exact
target path stated at the end of these instructions. Write that one file
and touch nothing else.

**`intake` is your source.** It is in your context: what was asked, and
where it came from. Your job is to turn that into requirements - what
the system must do, and why - without adding scope nobody asked for and
without losing anything that was said.

**Read what it points at before you draft.** `intake.md` is deliberately
thin - it is a record of the ask, not a summary of it - so the material
it names is the real input:

- **Files** it lists are in the spec folder. Open every one, in full.
- **A work item or issue** it names: read it and its comment thread
  through the MCP server for that provider - the Azure DevOps one or the
  GitHub one. They are the user's own servers, already signed in.
- **A description** alone means that is all there is. Work from it and
  the repository, and do not invent what nobody said.

Nobody has read that material yet. Intake recorded where it is and
stopped, precisely so that you read the original rather than somebody
else's paraphrase of it.

Read the repository too. Requirements land in *this* codebase, and one
written without looking at it describes a system nobody has.

**Write no frontmatter.** `intake.md` holds the spec's `type:` and its
provenance, and that is the file the engine reads them from - a second
copy here was a duplicate that could drift from the original and be
believed instead of it.

## Revising

On a later pass a `current` document exists - this file as it stands,
with whatever the human has since edited into it, including any
answers they wrote under `## Open Questions`. Those edits are
decisions rather than drafts: fold them in, delete the questions they
resolve, and leave what they did not touch alone. **Stability** below
is the rest of what a revise owes.

**A `## What to change` section in the ask is what the person typed when
they asked for this pass.** It is the specific thing they want done, and
it is about this run alone - everything above still holds around it, and
nothing it does not mention is an invitation to change something else.
When there is no such section, the document's own edits are the whole of
the instruction.

## Format

**The grammar and format rules above are the contract.**
Between them they give the exact shape of `requirements.md` - heading
levels, the numbering scheme, and the five EARS forms acceptance
criteria are written in. Follow them exactly; they win over anything
implied here.

In short: an H1 title, then `## Introduction`, an optional
`## Glossary`, and `## Requirements` - each requirement an H3 carrying a
short title, a user story, and numbered EARS acceptance criteria. No
sections beyond those three, other than `## Assumptions` and
`## Open Questions`.

`intake.md`'s frontmatter carries `type`, the kind of spec this is. The
team decides what types exist, so do not expect a fixed list: read it,
let it shape the framing, and do not restate it here. A
`bug` states the wrong behaviour and the right one; a `feature` states
capability the system should gain. The sections, the numbering and the
EARS forms are the same either way.

## Rules

- **One write, one path, nothing else.** The only permitted write in
  this session is `requirements.md` at the path given below. Do not
  create or edit any other file, and do not run terminal commands.
  Read-only tools are fine at any time.
- Work only from `intake` and `current` where they exist, the
  copied files intake names, and the repository itself.
- **Do not re-open the ask.** Intake settled what is being asked and
  recorded what could not be settled under its own `## Open questions`.
  Carry those forward as your own where they still block; do not invent
  new scope because the ask left room for it.
- **Assumptions over questions.** Where you need something nobody has
  said, proceed on a reasonable assumption and record it under an
  `## Assumptions` section at the end. Reserve questions for true
  blockers you cannot proceed past.
- If (and only if) there are blockers, put an `## Open Questions` section
  **first in the document**, numbered, one clear question each. The
  reader answers inline and revises again.
- Requirements state *what* and *why*, never *how*.
- **Name the component in each criterion**, not "the system", wherever
  more than one thing could be responsible. The design phase splits this
  feature into parts, and a criterion that named its owner survives the
  split.

## Stability

`current` may contain human edits and answers written under Open
Questions. Treat those as decisions: fold them in, delete the questions
they resolve, and leave everything they do not touch unchanged -
including the numbering of requirements that did not change.

**Numbering is an interface.** `design.md` cites acceptance criteria in
its `**Validates:**` lines and `tasks.md` cites them on a task's last
detail line, both as citation links carrying `N.M`. A revision that
renumbers the whole document has silently repointed every one of those
references at the wrong criterion. Add new requirements at the end; when one is
genuinely dead, say so in its body rather than closing the gap.

Requirement *titles* may be improved freely - they are for readers, not
references. The numbers are the references.

A document that still carries frontmatter from an earlier pass keeps
it - it is somebody's file and deleting content on their behalf is not
what a revise is for. Simply do not add it to one that has none.

---

# The shape of this document

Everything above is what to do. What follows is what the document
must look like, and it wins over anything implied above.

## Frontmatter

None. Not here, not in `design.md`, not in `tasks.md`.

`intake.md` carries the spec's `spec:`, `type:`, `source:`, `id:`,
`url:` and `title:`, it is written by the extension rather than by a
model, and it is the file the engine reads the type from. A copy in
this document was read by nothing and could drift from the original -
a second answer to a question that already has one.

`type:` still shapes what you write, it just is not restated here. It
comes from the definition, and the team decides what types exist, so
**there is no fixed list to validate against**. What it changes is
framing, not structure: a `feature` states capability the system should
gain, a `bug` states the wrong behaviour and the right one, a `spike`
states the question being answered. Every type uses the same sections,
the same numbering, and the same EARS forms. If you are given a type
whose conventions you do not know, write it as a feature and note the
assumption.

## requirements.md

```markdown
# (title)

## Introduction

(a short paragraph: what this is and why it exists)

## Glossary

- **Term_Name**: what this term means in this document

## Requirements

### Requirement 1: (short descriptive title)

**User Story:** As a (role), I want (capability), so that (benefit).

#### Acceptance Criteria

1. WHEN (trigger) THEN THE (component) SHALL (behaviour).
2. IF (condition) THEN THE (component) SHALL (behaviour).
```

- Every requirement carries a **short title after the number**. `3.2` on
  its own is unreadable in a task list; "Requirement 3: Retry on
  timeout" is what makes a `[Requirements : 3.2](requirements.md)`
  citation mean anything to someone who has not just read the document.
- Requirements are numbered from 1 and **never renumbered by a
  revision** - every citation in `tasks.md` and every `**Validates:**`
  line in `design.md` points at these numbers.
- Acceptance criteria sit under a literal `#### Acceptance Criteria`
  heading - H4, no colon, no bold. It is what the panel finds the
  criteria by, so a requirement missing it has criteria nothing can link
  to.
- Acceptance criteria are numbered from 1 within their requirement.
- `1.2` means requirement 1, criterion 2. That is the ID scheme the
  whole spec traces through.
- Requirements state *what* and *why*, never *how*.

### Glossary

Terms this document uses in a specific sense - a domain noun, a state
name, a role, an external system. Not a dictionary: if a term means what
any reader would assume, leave it out.

```markdown
- **Scheduled_Appointment**: an appointment with a confirmed slot that
  has not yet started.
- **Cancellation_Window**: the period before a slot during which a
  cancellation is free.
```

**Multi-word terms use underscores**, and the term is then written that
way everywhere else in the document, including inside acceptance
criteria: "WHEN a Scheduled_Appointment moves outside its
Cancellation_Window, THE scheduler SHALL ...". That is the whole reason
for the underscores - it makes a defined term one greppable token, so a
reader can find every criterion that depends on the definition they just
disagreed with.

Omit the section entirely when there is nothing to define. An empty
Glossary is noise.

### EARS - the full keyword set

Acceptance criteria are written in EARS. Five forms, and no others:

| Form | Use it for |
|---|---|
| `WHEN (trigger) THEN THE (component) SHALL (behaviour).` | An event. Something happens, the system responds. |
| `IF (condition) THEN THE (component) SHALL (behaviour).` | A state that may or may not hold - typically an error or edge case. |
| `WHERE (context) THE (component) SHALL (behaviour).` | A feature or configuration that is only sometimes present. |
| `WHILE (state) THE (component) SHALL (behaviour).` | For the whole duration of a state, not at its edges. |
| `THE (component) SHALL (behaviour).` | An invariant that always holds, with no trigger at all. |

- `SHALL` for an obligation, `SHALL NOT` for a prohibition. Never
  "should", "must", or "will" - the panel highlights these words, and
  only these.
- Keywords are **UPPERCASE**. Lowercase `when` is prose and is not
  highlighted.
- **Name the component**, not "the system", wherever more than one thing
  could be responsible. "THE log writer SHALL" survives a design that
  splits into three services; "the system SHALL" does not.
- One criterion, one behaviour. Two `SHALL`s joined by "and" is two
  criteria, and they will need to be referenced separately.

## Heading levels - the one rule everything else rests on

- `#` H1: the document title. **Exactly one per file, and the first
  line of it.**
- `##` H2: every section. Sections are never H1.
- `###` H3: numbered items inside a section - a requirement, a
  component, a property.
- `####` H4: **`#### Acceptance Criteria`, and nothing else.** It is the
  one heading that lives inside a numbered item rather than beside it.

The criteria heading is not decoration. The panel anchors a criterion
only when it sits under an explicit `Acceptance Criteria` marker - a
deliberate refusal to treat any numbered list under a requirement as
criteria, which would happily anchor a list inside a user story and send
a reader to the wrong line. Drop the marker and every citation of
`1.2` in `tasks.md` points at nothing.

H4 is what makes that safe. A requirement ends at the next heading of
H3 or shallower, so an H4 sits *inside* requirement 1 while an H3 would
end it - which is why the criteria heading is the one place the document
goes four deep.

This matters for a reason you cannot see in the markdown. A reader
scanning for what is unresolved looks for `## Open Questions` and stops
at the next `##`; a stray `# Something` after the questions swallows the
rest of the document into that section. H2 for sections, always.

## Assumptions and Open Questions

Both are H2, both are allowed in every document, and they are the only
sections a phase may add beyond the ones its prompt names.

- `## Assumptions` goes **last**, and is the normal case. Something
  nobody stated? Proceed on a reasonable assumption and record it here.
- `## Open Questions` goes **first, before the H1 is even followed by
  prose** - immediately after the title. Numbered, one clear question
  each. Nothing enforces it; the position is the point, so the person
  who has to answer sees it before anything else in the document.

Prefer an assumption to a question. A question costs a human round-trip;
an assumption costs a line they can read and correct.

## Markdown hygiene

- UTF-8. LF or CRLF both work.
- No trailing whitespace.
- One blank line between sections, never two.
- Pure markdown - no raw HTML.
- No "generated by" lines, no sign-offs, no notes to the reader about
  what you did. The document is the deliverable.
````

## `tasks-implement.md`

The `implement` stage, which every pipeline ends on, reached from `tasks`. It writes no document of its own - the work lands in the repository, and git is its record.

````markdown
# Implement the named tasks

You are implementing tasks from the approved `tasks.md` of this
feature - **exactly the ones named in your instructions, nothing else**:
not a related task, not an improvement you spotted. Your instructions
say which tasks, and in what grouping.

## Scope

- Read `requirements.md`, `design.md` (if present) and `tasks.md` from
  the spec folder before writing any code.
- Implement only what the named task describes, the way the design
  says. If the task references requirements, satisfy exactly those.
- Include the task's tests. Run what can be run.
- Touch only the files this task requires. If you believe the task
  cannot be implemented as written, stop and say why instead of
  improvising - that is a finding for the human, not a licence to
  redesign.

## Waves - what may run at the same time

`tasks.md` ends with a `## Task Dependency Graph`: a `waves` array
saying which tasks are safe to run concurrently. It was built so that
**tasks sharing a wave touch disjoint files**.

When you are handed several tasks from the same wave:

- **If you can delegate to sub-agents, do** - one sub-agent per task,
  all at once. That is what the graph is for.
- If you cannot, work them one at a time. Same result, slower; nothing
  is lost.
- Give each sub-agent one task, the spec folder, and the instruction to
  stay inside the files that task needs. A sub-agent that wanders
  outside its task is the one failure mode this whole scheme has.

Two hard rules:

1. **Never start a task from a later wave until every task in the
   current wave is finished and ticked.** The waves are a barrier, not
   a suggestion - a later wave may well edit the same files an earlier
   one created.
2. **You own `tasks.md`. Sub-agents never write to it.** They report
   back; you tick the boxes yourself, one at a time, after each reports
   success. Two agents editing the plan at once corrupts the one file
   every teammate reads progress from.

If a task in a wave fails, tick the ones that succeeded, leave the
failed one unticked, say what broke, and **stop** - do not roll on into
the next wave.

## Checkpoints

A top-level task reading `Checkpoint - ...` is not work, it is a
verification: run the full test suite and report what passed.

**A passing checkpoint is not a decision point.** Tick it and carry
straight on into the tasks after it. Whoever pressed the button asked
for these tasks to be done and reviews the result; stopping in the
middle to ask whether to continue answers a question they already
answered.

**A failing checkpoint is usually work, not a wall.** Which it is
depends on whose test broke:

- **A test this spec's tasks wrote, or one your changes broke** - fix
  it. It is your own work reporting itself unfinished, and leaving it
  red contradicts the whole point of the checkpoint. Fix, re-run, tick,
  continue.
- **A test that was already failing before you started, in code this
  spec does not touch** - not yours. Say so plainly in your report, and
  carry on. A repository with one unrelated red test is not a repository
  where no plan may ever run.
- **A failure you cannot fix** - stop there. Report what broke and leave
  the checkpoint unticked; every task after it would be built on a base
  you have just proved is broken.

A checkpoint marked optional (`- [ ]*`) may be skipped if your
instructions say to skip optional tasks - but if you run it and it
fails, apply the same three rules above.

## Every task ends green

**The repository builds and its tests pass at the end of every task.**
Not at the end of the plan, not at the next checkpoint - at the end of
each one.

That is what makes a plan safe to stop half-way through, and it is why a
task carries its own tests: a task that adds an interface nothing
implements, or changes a signature without its callers, has not finished
- it has left the tree broken for the next task to trip over.

So before you tick anything: build, and run the tests the task touches.
The full suite is the checkpoint's job; yours is that nothing you just
did is red.

When several tasks share a wave and run at once, the tree is briefly
whatever the two of them make it - so the guarantee lands **when the
wave completes**. A wave holding one task is that task.

## When done — the checkbox is the contract

A task is **not complete until its checkbox in `tasks.md` is ticked**
(`- [x]`). This is not bookkeeping: the checkbox is the signal progress
is read from, and the completion state every teammate's machine reads
from git. An implemented task with an unticked box is, to the whole
system, not done.

In order, as the final acts of **each** task:

1. Verify what you built — run the task's tests.
2. Tick exactly that task's checkbox in `tasks.md`, changing nothing
   else in that file - not the text, not the numbering, not the graph.
3. Summarize what you changed and why, in one short paragraph.

If you could **not** complete a task, do NOT tick it — leave the box
unticked, state plainly what blocked you, and **stop there**: do not
move on to later tasks over a blocked one. An honest unticked box is
correct; a ticked box over unfinished work breaks the plan for
everyone.

## The plan

### Checkbox grammar - exact

The implement lens parses these lines. The spacing is not negotiable.

1. Top-level: `- [ ] N. Title` - dash, space, `[`, space, `]`, space,
   number, period, space, title.
2. Sub-task: two spaces, then `- [ ] N.M Title`. Note **no period**
   after `N.M`.
3. Detail lines: four spaces, then `- `, then the text. **Details never
   carry a checkbox** - a checkbox is what makes a line a task, and a
   detail with one becomes a phantom task row nobody can complete.
4. Done is `- [x]`. Nothing else means done.
5. Optional: `- [ ]* N.M Title` - the asterisk goes immediately after
   the closing bracket, no space. Optional tasks can be skipped for a
   faster first cut.
6. Nesting goes **exactly one level deep**. There is no `1.1.1`.
7. A citation is the last detail line of every task that implements
   behaviour: `[Requirements : 1.2, 3.1](requirements.md)` - an ordinary
   markdown link, the path relative to this file, criteria named by
   `N.M` and separated by commas. A task that satisfies no requirement
   should not be in the plan.

### The Task Dependency Graph

The last section of the file, a single fenced `json` block:

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "3.1"] }
  ]
}
```

- `waves` is ordered, `id` counts from 0.
- Tasks in the **same wave may run at the same time**. A wave begins
  only when every task in every earlier wave is finished and ticked.
- IDs are sub-task IDs (`N.M`) and match the checkbox list exactly. A
  typo here is a task that never runs.
- **Group headers and checkpoints are not in any wave.** A group is a
  container, and a checkpoint is a barrier the waves already express.
- Optional tasks (`[ ]*`) go in the last wave they legally can, so
  skipping them never strands anything.
````

## `tasks.md`

The `tasks` stage, which writes `tasks.md`.

````markdown
# Draft the implementation plan

You are drafting `tasks.md` for one feature, from the approved
`requirements.md` and, when provided, the approved `design.md`. If no
design document was provided, this run skipped the design phase - derive
the breakdown directly from the requirements. Write `tasks.md` to the
exact target path stated at the end of these instructions, and touch
nothing else.

## Format

**The grammar and format rules above are the contract** - the exact
checkbox grammar, the indentation, and the shape of the dependency
graph. The spacing there is not negotiable: the implement lens parses
these lines, and a task row it cannot read is a task nobody can start.

The document, in order:

```markdown
# Implementation Plan: (feature title)

## Overview

(what is being built, and the strategy - dependency order, flag gating)

## Tasks

- [ ] 1. (group or phase title)
  - [ ] 1.1 (an actionable, single-concern task)
    - (implementation detail)
    - [Requirements : 1.2, 3.1](requirements.md)

## Notes

## Task Dependency Graph
```

- Top-level items are **groups**: a phase, a service, a layer. They
  carry no detail lines of their own.
- Sub-tasks (`N.M`) are the real work, and the only thing an agent is
  ever handed. Exactly one level deep - there is no `1.1.1`.
- Details are indented bullets **without** checkboxes.
- `[Requirements : 1.2, 3.1](requirements.md)` is the last detail line
  of every task that implements behaviour.
- `## Notes` carries what the plan needs said once: implementation
  order rationale, what the optional tasks cost, flag scoping.

## The Task Dependency Graph

The file ends with a `json` fence declaring which tasks may run at the
same time:

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "3.1"] }
  ]
}
```

This is not documentation. The implement phase reads it and works a
whole wave at once, so getting it wrong costs real damage rather than a
confused reader.

- Every sub-task ID appears in exactly one wave. Group headers and
  checkpoints appear in none - a group is a container, and a checkpoint
  is a barrier the waves already express.
- A wave begins only when every task in every earlier wave is finished.
- IDs must match the checkbox list exactly.

**Two tasks may share a wave only if they touch disjoint files.** Work
out, from the design, which files each task writes. If two tasks both
modify `src/foo.ts` they go in **different waves** - even when nothing
about the logic forces an order, and even when that leaves a wave with
one task in it. Agents working a wave in parallel will overwrite each
other otherwise.

When you cannot tell what a task touches, put it in its own wave. A
sequential plan is merely slow.

## Checkpoints

Your context carries `checkpoints`, which is `required`, `optional`, or
`none`. It decides whether this plan gets checkpoint tasks at all:

- **`required`** - after each group, emit a top-level checkpoint task
  with no sub-tasks:

  ```markdown
  - [ ] 2. Checkpoint - (what is complete at this point)
    - Run the full test suite and confirm it passes.
  ```

  A checkpoint **verifies**; it does not ask. Whoever started the plan
  asked for it to be carried out, so a checkpoint never says "stop and
  report", "await approval", or "until a human says to". A test this
  spec wrote, or one the work broke, is fixed and the plan carries on;
  only a failure that cannot be fixed stops it.

  **After a top-level task, never after a sub-task.** Every task already
  ends with the tree building and its tests passing - see the house
  style - so a checkpoint between sub-tasks proves what is already true.

- **`optional`** - emit the same task with the optional marker,
  `- [ ]* 2. Checkpoint - ...`, so it can be skipped for a faster first
  cut.
- **`none`** - emit no checkpoint tasks. The plan runs end to end.

Checkpoints are numbered in the same top-level sequence as the groups,
and never appear in the dependency graph.

## Rules

- **One write, one path, nothing else.** The only permitted write in
  this session is `tasks.md` at the path given below. Do not create or
  edit any other file, and do not run terminal commands. Read-only
  tools are fine at any time.
- Tasks must be discrete, ordered, and individually implementable by a
  coding agent in one sitting.
- **Split on green, not on concerns.** The repository must build and its
  tests pass at the end of every task, so an interface and its
  implementation, a signature and the callers it breaks, or a behaviour
  and the test that proves it are **one task** however many concerns
  they look like. Splitting them leaves the tree red half-way through a
  plan, and a plan that can only be run to completion is a script.
- Only work that satisfies a requirement belongs in the plan. No
  "nice to have" tasks nobody asked for.
- **Only coding work belongs in the plan.** Every task must be
  completable by writing, modifying, or testing code. These are not
  tasks, however much the feature needs them: user acceptance testing
  or gathering feedback, deploying to staging or production, gathering
  performance metrics, walking the application end to end by hand
  (automated end-to-end tests are fine), user training, writing user
  documentation, business process changes. They belong wherever the
  release is tracked. A plan that carries one has a checkbox no agent
  can ever tick, and the ticked checkbox is the only completion signal
  this pipeline has.
- Cover the testing strategy: implementation tasks include their tests.
- Mark genuinely skippable work optional (`- [ ]* N.M`) and say in
  `## Notes` what skipping it costs.
- **Assumptions over questions**: proceed on reasonable assumptions and
  record them under `## Assumptions` at the end. Only true blockers go
  in an `## Open Questions` section placed **first in the document**,
  where whoever runs the plan sees it before starting anything.

## When revising

Your context may carry one extra document. `current` is the previous
`tasks.md`, with some tasks possibly already ticked - this run is a
revision of it, not a fresh draft.

**A `## What to change` section in the ask is what the person typed when
they asked for this pass.** It is the specific thing they want done, and
it is about this run alone - everything above still holds around it, and
nothing it does not mention is an invitation to change something else.
When there is no such section, the document's own edits are the whole of
the instruction.

History is forward-only. Nothing that was built gets un-built by
rewriting the plan:

- Tasks that are still valid keep their text **and their numbers**
  unchanged, so their done-state survives re-approval.
- Work that was done but is no longer needed gets a **compensating
  task** - e.g. if task 3.1 added `ISomething` and it is no longer
  required, add "Remove ISomething and its implementations". Never
  assume anything can be reverted by version control.
- New work gets new tasks, numbered after the existing ones.
- **Rebuild the dependency graph** to match the new list. A wave naming
  a task that no longer exists is worse than no graph at all, and a new
  task missing from every wave will never run.

---

# The shape of this document

Everything above is what to do. What follows is what the document
must look like, and it wins over anything implied above.

## tasks.md

No frontmatter.

```markdown
# Implementation Plan: (feature title)

## Overview

(what is being built, and the strategy - dependency order, flag gating)

## Tasks

- [ ] 1. (group or phase title)
  - [ ] 1.1 (an actionable, single-concern task)
    - (implementation detail)
    - (another detail)
    - [Requirements : 1.2, 3.1](requirements.md)

- [ ] 2. Checkpoint - (what is complete here)
  - Run the full test suite and confirm it passes.

## Notes

## Task Dependency Graph
```

## Every task ends green

**The rule a plan is split on: the repository builds and its tests pass
at the end of every task.** Not at the end of the plan - at the end of
each task in it.

This decides where the boundaries go, and it is a stronger rule than
"one concern per task". These are all one task, however many concerns
they look like:

- an interface and the code that implements it
- a changed signature and every caller it breaks
- a behaviour and the test that proves it

Split any of them and the first half leaves the tree red, which means
the plan cannot be stopped there - and a plan that can only be run to
completion is not a plan, it is a script.

A task that genuinely stands alone is still its own task. The rule
forbids splitting *broken* states apart, not splitting.

## Checkpoints

A checkpoint is a **verification** task, not an approval one. It says
"everything up to here is sound" and proves it by running the full
suite - the wider check that each task's own tests do not make.

**Checkpoints go after a top-level task, never after a sub-task.** A
sub-task already ends green by the rule above; a checkpoint between
every one of them is ceremony that proves what is already true.

**A checkpoint never waits for a human.** Someone who started the plan
asked for the plan to be carried out; stopping halfway to ask whether to
carry on is answering a question they already answered. They review the
result, not the middle.

A checkpoint that **fails** is work, not a wall: a test this spec wrote,
or one the work broke, gets fixed and the plan carries on. Only a
failure that cannot be fixed stops it, and an unrelated test that was
already red is reported rather than adopted. Passing tests are not a
decision point either way.

So a checkpoint's body says what to run and what "passing" means. It
never says "stop and report", "await approval", or "until a human says
to".

## Building the dependency graph

**The rule that makes waves safe: two tasks share a wave only if they
touch disjoint files.** This graph is an instruction to work in
parallel, and two agents editing one file at the same time corrupt it.
If two tasks both modify `src/foo.ts`, they go in different waves - even
when nothing else forces the order. When in doubt, split the wave: a
sequential plan is slow, a corrupted file is a lost afternoon.

## Heading levels - the one rule everything else rests on

- `#` H1: the document title. **Exactly one per file, the first line
  after the frontmatter.**
- `##` H2: every section. Sections are never H1.
- `###` H3: numbered items inside a section - a requirement, a
  component, a property.
- `####` H4: **`#### Acceptance Criteria`, and nothing else.** It is the
  one heading that lives inside a numbered item rather than beside it.

The criteria heading is not decoration. The panel anchors a criterion
only when it sits under an explicit `Acceptance Criteria` marker - a
deliberate refusal to treat any numbered list under a requirement as
criteria, which would happily anchor a list inside a user story and send
a reader to the wrong line. Drop the marker and every citation of
`1.2` in `tasks.md` points at nothing.

H4 is what makes that safe. A requirement ends at the next heading of
H3 or shallower, so an H4 sits *inside* requirement 1 while an H3 would
end it - which is why the criteria heading is the one place the document
goes four deep.

This matters for a reason you cannot see in the markdown. A reader
scanning for what is unresolved looks for `## Open Questions` and stops
at the next `##`; a stray `# Something` after the questions swallows the
rest of the document into that section. H2 for sections, always.

## Assumptions and Open Questions

Both are H2, both are allowed in every document, and they are the only
sections a phase may add beyond the ones its prompt names.

- `## Assumptions` goes **last**, and is the normal case. Something
  nobody stated? Proceed on a reasonable assumption and record it here.
- `## Open Questions` goes **first, before the H1 is even followed by
  prose** - immediately after the title. Numbered, one clear question
  each. Nothing enforces it; the position is the point, so the person
  who has to answer sees it before anything else in the document.

Prefer an assumption to a question. A question costs a human round-trip;
an assumption costs a line they can read and correct.

## Markdown hygiene

- UTF-8. LF or CRLF both work.
- No trailing whitespace.
- One blank line between sections, never two.
- Pure markdown - no raw HTML.
- No "generated by" lines, no sign-offs, no notes to the reader about
  what you did. The document is the deliverable.

## The plan

### Checkbox grammar - exact

The implement lens parses these lines. The spacing is not negotiable.

1. Top-level: `- [ ] N. Title` - dash, space, `[`, space, `]`, space,
   number, period, space, title.
2. Sub-task: two spaces, then `- [ ] N.M Title`. Note **no period**
   after `N.M`.
3. Detail lines: four spaces, then `- `, then the text. **Details never
   carry a checkbox** - a checkbox is what makes a line a task, and a
   detail with one becomes a phantom task row nobody can complete.
4. Done is `- [x]`. Nothing else means done.
5. Optional: `- [ ]* N.M Title` - the asterisk goes immediately after
   the closing bracket, no space. Optional tasks can be skipped for a
   faster first cut.
6. Nesting goes **exactly one level deep**. There is no `1.1.1`.
7. A citation is the last detail line of every task that implements
   behaviour: `[Requirements : 1.2, 3.1](requirements.md)` - an ordinary
   markdown link, the path relative to this file, criteria named by
   `N.M` and separated by commas. A task that satisfies no requirement
   should not be in the plan.

### The Task Dependency Graph

The last section of the file, a single fenced `json` block:

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "3.1"] }
  ]
}
```

- `waves` is ordered, `id` counts from 0.
- Tasks in the **same wave may run at the same time**. A wave begins
  only when every task in every earlier wave is finished and ticked.
- IDs are sub-task IDs (`N.M`) and match the checkbox list exactly. A
  typo here is a task that never runs.
- **Group headers and checkpoints are not in any wave.** A group is a
  container, and a checkpoint is a barrier the waves already express.
- Optional tasks (`[ ]*`) go in the last wave they legally can, so
  skipping them never strands anything.
````

