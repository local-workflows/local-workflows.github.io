# The Kiro instructions

Every file behind the Kiro process. It ships with nothing — this page is
the whole of it, so copy from here to run it.

This process is the same one the built-in `custom` style ships with. What
you read below is a **frozen copy**, kept because the id `kiro` and the
compatibility with Kiro's own document validator are worth having on
their own. It is not regenerated from anything, so it will not follow
`custom` if that changes — see
[the Custom instructions](https://local-workflows.github.io/getting-started/sdd/custom-prompts.md)
for what the extension actually sends today.

---

## `style.yml`

The pipeline, the two spec types, and nothing else — every stage takes
its default.

```yaml
schema: 1
id: kiro
name: Kiro
desc: Requirements, design, tasks, implement. A human gate between each.

# A question a phase wrote down and nobody answered stops the phase
# after it. Written out rather than left to the default so a reader of
# this file can see the gate is on.
blockOnOpenQuestions: true

specTypes:
  - id: feature
    label: Feature
    stages: [requirements, design, tasks, implement]
  - id: bug
    label: Bug fix
    stages: [requirements, tasks, implement]

stages:
  - id: requirements
    label: Requirements
  - id: design
    label: Design
  - id: tasks
    label: Tasks
  - id: implement
    label: Implementation
  - id: intake
    label: Intake
```

---

## What a phase is actually handed

**The prompt is the ask; everything else is a file.** Prior documents
are attached rather than pasted into the prompt - a phase that inlined
its requirements and its design would be mostly reference material
with the question buried at the end.

So a phase receives its own instructions below, the earlier documents
as attachments, and one file every phase of the style gets: the
document grammar, attached as `grammar` - headings, requirement ids,
the citation link, the checkbox rows. It is `grammar.md` in the style
folder, so it is the style's to edit like anything else there.
Nothing else: there is no intro and no separate format file, so a team
replacing one instruction file replaces the whole instruction rather
than half of one and inheriting the rest from a file it cannot see.
Not the whole spec folder, and never another phase's conversation.

---

## Which instructions run where

| File | Job |
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

**The attached `grammar` is the contract** - heading levels, table
shapes, and the exact form of a correctness property. Follow it exactly.
The sections, all H2, in this order:

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

No sections beyond those, other than the `## Assumptions`,
`## Open Questions` and `## Answered Questions` sections described
below.

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

**Validates: Requirements 1.2, 3.1**
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

When you do draw one, write Mermaid that parses - the attached `grammar`
says how. The usual failure is a label the parser chokes on, so quote
every label, and every edge label, without exception. A diagram nobody
can follow at a glance has failed.

## Rules

- **One write, one path, nothing else.** The grammar's Scope section
  applies: the only permitted write in this session is `design.md`, at
  the path given below.
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
- Asking, assumptions, and open questions follow the grammar's Questions
  and assumptions section; this prompt adds nothing to it.
- Read the repository before proposing structure - the design must fit
  the code that exists, not an imagined version of it.
- **Say which files each component lives in.** The next phase splits
  this design into tasks that must not collide, and it can only do that
  if the design says what touches what.

## When revising

Your context may carry one extra document. `current` is the existing
`design.md` - this run is a revision of it, not a fresh draft. What a
revise must and must not touch, and what `## What to change` in the ask
means, is the grammar's Revising and Questions sections; the one thing
worth restating here is that property numbering is one of the things
`tasks.md` may cite, so it does not move on a revise either.

---

# The shape of this document

Everything above is what to write. The attached `grammar` is how to
write it - headings, citations, correctness properties, diagrams,
questions and assumptions, hygiene, frontmatter. What follows is the
handful of shapes that are this document's own.

## The Design Decisions table

```markdown
| Decision | Rationale |
|---|---|
| (what was decided) | (why this, and what the alternative cost) |
```

One row per decision a reader could reasonably have made differently.
The rationale names the alternative and why it lost - "chose X" with no
loser is a statement, not a decision, and belongs in Overview.

## The `Validates` line - the one place this document leaves the grammar

Write it exactly as shown here, **not** as the citation link the grammar
describes:

```markdown
**Validates: Requirements 1.2, 3.1**
```

Bold, the literal word `Requirements`, then the numbers, all inside the
bold. This is the one citation in the whole spec that another tool
reads: Kiro's validator matches `**Validates: Requirements <numbers>**`
literally and warns on a property that has no such line. A link here
passes our panel and fails theirs. Everywhere else in this document, the
grammar's link form wins.

## Data Models and Error Handling

- Data Models are tables: `Field | Type | Description`.
- Error Handling is a table per layer, `Scenario | Behaviour`, each
  followed by a `**Rationale:**` line saying why that strategy.
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

On a later pass, `current` is this file as it stands - revise it, don't
restart it. What a revise must and must not touch, and what
`## What to change` in the ask means, is the grammar's Revising and
Questions sections; this prompt adds nothing beyond it.

## Format

**The attached `grammar` is the contract.** It gives the exact shape -
heading levels, the numbering scheme, and the five EARS forms acceptance
criteria are written in. Follow it exactly; it wins over anything implied
here.

In short: `# Requirements Document`, then `## Introduction`, an optional
`## Glossary`, and `## Requirements` - each requirement an H3 carrying a
short title, a user story, and numbered EARS acceptance criteria. No
sections beyond those three, other than `## Assumptions`,
`## Open Questions` and `## Answered Questions`.

`intake.md`'s frontmatter carries `type`, the kind of spec this is. The
team decides what types exist, so do not expect a fixed list: read it,
let it shape the framing, and do not restate it here. A
`bug` states the wrong behaviour and the right one; a `feature` states
capability the system should gain. The sections, the numbering and the
EARS forms are the same either way.

## Rules

- **One write, one path, nothing else.** The grammar's Scope section
  applies: the only permitted write in this session is
  `requirements.md`, at the path given below.
- Work only from `intake` and `current` where they exist, the
  copied files intake names, and the repository itself.
- **Do not re-open the ask.** Intake settled what is being asked and
  recorded what could not be settled under its own `## Open questions`.
  Carry those forward as your own where they still block; do not invent
  new scope because the ask left room for it.
- Asking, assumptions, and open questions follow the grammar's Questions
  and assumptions section; this prompt adds nothing to it.
- Requirements state *what* and *why*, never *how*.
- **Name the component in each criterion**, not "the system", wherever
  more than one thing could be responsible. The design phase splits this
  feature into parts, and a criterion that named its owner survives the
  split.

---

# The shape of this document

Everything above is what to write. The attached `grammar` is how to
write it - headings, requirement and criterion numbering, EARS,
citations, questions and assumptions, hygiene, frontmatter. What follows
is the handful of shapes that are this document's own.

## requirements.md

```markdown
# Requirements Document

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

- **The H1 is the literal words `# Requirements Document`**, not the
  feature's name. It reads oddly for a document about one feature, and
  it is not ours to change: Kiro's validator matches that line exactly
  and reports a missing title as an error. The feature is named by the
  spec folder, by `intake.md`, and by every requirement's own title.
- Every requirement carries a **short title after the number**. `3.2` on
  its own is unreadable in a task list; "Requirement 3: Retry on
  timeout" is what makes a `[Requirements : 3.2](requirements.md)`
  citation mean anything to someone who has not just read the document.
- Requirements state *what* and *why*, never *how*.

## Glossary

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
````

## `tasks-implement.md`

The `implement` stage, which every pipeline ends on, reached from `tasks`. It writes no document of its own - the work lands in the repository, and git is its record.

```markdown
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
- **A true blocker: ask the person, once, and wait**, the way the
  grammar's Questions and assumptions section describes. Say in your
  summary what you asked and what was decided, so the next reader knows
  the code followed a decision rather than a guess. If nobody is there,
  do not ask again - stop and report the blocker, which is the existing
  rule above.

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

## Every task ends green

**The repository builds and its tests pass at the end of every task.**
Not at the end of the plan - at the end of each task in it.

That is what makes a plan safe to stop half-way through, and it is why a
task carries its own tests: a task that adds an interface nothing
implements, or changes a signature without its callers, has not finished
- it has left the tree broken for the next task to trip over.

So before you tick anything: build, and run the tests the task touches.
What you owe is that nothing you just did is red.

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

**The attached `grammar` is the checkbox spacing and the wave graph** -
exactly how a task row, a detail line, a tick, an optional marker and
the `## Task Dependency Graph` fence are written. The implement lens
parses those lines, so the spacing is not negotiable. Read it before you
tick anything, and keep every line you touch to that shape.
```

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

**The attached `grammar` is the contract** - the exact
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

- Every sub-task ID appears in exactly one wave. Group headers appear in
  none - a group is a container, not work.
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

## Rules

- **One write, one path, nothing else.** The grammar's Scope section
  applies: the only permitted write in this session is `tasks.md`, at
  the path given below.
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
- Asking, assumptions, and open questions follow the grammar's Questions
  and assumptions section; this prompt adds nothing to it, beyond that
  an open question here stops the plan from being started at all, since
  whoever runs it sees it before starting anything.

## When revising

Your context may carry one extra document. `current` is the previous
`tasks.md`, with some tasks possibly already ticked - this run is a
revision of it, not a fresh draft. What a revise must and must not
touch - keeping numbers and text of valid tasks, compensating tasks for
work no longer wanted, rebuilding the dependency graph, what
`## What to change` in the ask means - is the grammar's Revising
section; this prompt adds one example: if task 3.1 added `ISomething`
and it is no longer required, the compensating task is "Remove
ISomething and its implementations". Never assume anything can be
reverted by version control.
````

