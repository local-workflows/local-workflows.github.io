# The Spec Kit instructions

Every file behind the Spec Kit process. It ships with nothing — this page
is the whole of it, so copy from here to run it.

This is a worked example, kept by hand. It is not regenerated from
anything and it is not what the extension runs — see
[the Custom instructions](https://local-workflows.github.io/getting-started/sdd/custom-prompts.md)
for that. It exists to show the style layer running a genuinely different
shape: a stage with several artifacts, documents written only when the
work calls for them, and a flat `T001` task dialect.

---

## `style.yml`

One spec type, and a single `stages:` entry — because `specify` writes
`spec.md` rather than `specify.md`, which is the one thing no convention
could have guessed.

```yaml
schema: 1

id: spec-kit

name: Spec Kit
desc: Specify, plan, tasks, implement. One phase emits several documents, and the plan is a flat numbered list.

# A question a phase wrote down and nobody answered stops the phase
# after it. Written out rather than left to the default so a reader of
# this file can see the gate is on.
blockOnOpenQuestions: true

# Written as a worked example for a reason beyond covering another
# team's habits: a style layer that only ever ran one shape would not
# be a style layer. This one differs from the built-in style where it
# counts - a stage with several artifacts, a research document that is
# written only sometimes, different filenames, and a flat plan whose
# task ids are T001 rather than 1.1. Everything it needed, the model
# already had, except the plan dialect - see instructions/tasks.md.

# One type. Spec Kit draws no distinction between a feature and a fix -
# the same four commands run either way - and a single entry means ＋ New
# Spec asks nothing. Add your own and it appears in the menu.
#
# The input gate opens it and the output gate closes it, as in every style:
# the ask comes in through one and the work goes out through the other.
# Neither is listed, because neither is optional - what a style lists is the
# middle, and here that is three of Spec Kit's own commands.
specTypes:
  - id: feature
    label: Feature
    stages: [specify, plan, tasks, implement]

stages:

  # `/specify` writes `spec.md`, not `specify.md` - the stage id is the
  # Spec Kit command and the document is Spec Kit's. Everything else in
  # this style is the default.
  - id: specify
    produces: [spec.md]

# Two Spec Kit commands are deliberately absent, and neither is a gap.
#
# `/clarify` edits spec.md in place rather than writing a document of
# its own. A stage producing an artifact an earlier stage already wrote
# would be satisfied the moment it was reached, and skipped - so it
# could never be a phase here. Editing spec.md by hand is the whole of
# it, and the panel saves what you type.
#
# `/analyze` reads the three documents and reports; it writes nothing.
# A stage that leaves no artifact can never be satisfied, so the walk
# would park on it forever. Both belong to the surface, not the
# pipeline.
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
| [`plan.md`](#planmd) | The `plan` stage, which writes `plan.md`. |
| [`specify.md`](#specifymd) | The `specify` stage, which writes `spec.md`. |
| [`tasks-implement.md`](#tasks-implementmd) | The `implement` stage, which every pipeline ends on, reached from `tasks`. It writes no document of its own - the work lands in the repository, and git is its record. |
| [`tasks.md`](#tasksmd) | The `tasks` stage, which writes `tasks.md`. |

---

## `plan.md`

The `plan` stage, which writes `plan.md`.

````markdown
# Write the implementation plan

Write `plan.md` from the approved `spec.md` named below - read it first: the
technical approach, the structure, and the decisions with their
reasons.

Alongside it, write **only the documents this feature actually needs**:

- `research.md` when something had to be investigated to choose.
- `data-model.md` when the feature has entities worth naming.
- `contracts/` when it exposes an interface others call.
- `quickstart.md` when someone will need to run it.

A data model for a CLI flag and contracts for a refactor are pages
nobody reads. Writing one because the phase can is how a spec folder
becomes archaeology.

**Can the code answer it? Read the code.** Anything about how this
repository already behaves is yours to find out, not a person's to
explain.

**Is it about intent - what they want, which of two ways they would
rather have? Ask, once, and wait.** Ask with your ask-the-user tool
(`AskUserQuestion` on Claude) and wait for the reply. One question at a
time, with the choices you can see. Someone is at the panel and the
answer comes back inside this run. Record it under
`## Answered Questions` with its `**Qn**` id and an `A:` line - it is a
decision a person made, not an assumption you took. If the tool answers
that no one is there, do not ask again.

Where nobody stated something and no answer is needed, proceed on a
reasonable assumption and record it under `## Assumptions`.

Only a blocker still unanswered goes under `## Open Questions`, which
stops the next phase until a human answers it.

Follow the attached `grammar`.

---

# The shape of this document

Everything above is what to do. What follows is what the document
must look like, and it wins over anything implied above.

## Open Questions        (only when something genuinely blocks tasks)

## Technical Context

(language, framework, storage, and the constraints that are fixed)

## Approach

(how it will be built, in dependency order)

## Decisions

### Decision 1: (short name)

**Choice.** (what was decided)
**Why.** (the reason, and what it cost)
**Rejected.** (the alternative, and why not)

## Structure

(the files and modules this adds or changes)

## Testing

## Answered Questions

## Assumptions
```

- Every decision carries its rejected alternative. A decision without
  one is a preference, and six months on nobody can tell which it was.
- Reference requirements by their `FR-N` id where the plan satisfies
  one. That reference is what makes the spec traceable.

## The companion documents

Write one only when the feature needs it:

- **`research.md`** - what was investigated and what it concluded.
  Findings, not a reading list.
- **`data-model.md`** - entities, their fields, and the relationships.
  Skip it when the feature has no entities of its own.
- **`contracts/`** - one file per interface: endpoints, payloads,
  errors. Skip it when nothing external calls this.
- **`quickstart.md`** - how to run it. Skip it when nothing changes
  about running the project.

## Heading levels

- `#` H1: the document title, exactly one, the first line of the file.
- `##` H2: every section. Sections are never H1.
- `###` H3: items inside a section.

A reader scanning for what is unresolved looks for `## Open Questions`
and stops at the next `##`; a stray `# Something` after the questions
swallows the rest of the document into that section.

## Open Questions and Answered Questions

`## Open Questions`, immediately after the title, so the person who has
to answer sees it before anything else. One list item per question:
`- **Qn** one clear question`. Ids are allocated once and never
renumbered.

An answer is an `A:` line indented under its question. A question with
one is answered; a question without one is not.

`## Answered Questions` at the end holds the ones that have been
answered, id and answer intact. Move them there on your next pass over
this document. Never delete a question or an answer.

An unanswered question stops the next phase. Ask it now, while someone
is at the panel to answer, rather than leaving it in the document.

## Markdown hygiene

- UTF-8. LF or CRLF both work.
- No trailing whitespace.
- Pure markdown - no raw HTML.
- No "generated by" lines and no notes to the reader. The document is
  the deliverable.
````

## `specify.md`

The `specify` stage, which writes `spec.md`.

````markdown
# Write spec.md

**`intake` is your source.** It is in your context: what was asked, and
where it came from. Turn it into the spec - what the feature must do and
why, never how - without adding scope nobody asked for and without
losing anything that was said.

**Read what it points at before you draft.** `intake.md` is deliberately
thin - a record of the ask, not a summary of it - so the material it
names is the real input:

- **Files** it lists are in the spec folder. Open every one, in full.
- **A work item or issue** it names: read it and its comment thread
  through the MCP server for that provider - the Azure DevOps one or the
  GitHub one.
- **A description** alone means that is all there is. Work from it and
  the repository.

Nobody has read that material yet. Intake recorded where it is and
stopped, so that you read the original rather than a paraphrase.

Read the repository too. A spec written without looking at it describes
a system nobody has.

**Write no frontmatter.** `intake.md` holds the spec's `type:` and its
provenance, and that is the file the engine reads them from - a second
copy here was a duplicate that could drift from the original and be
believed instead of it.

Intake settled what is being asked and recorded what it could not settle
under its own `## Open questions`. Carry those forward as
`[NEEDS CLARIFICATION]` where they still block; do not invent new ones
because the ask left room for them.

**Can the code answer it? Read the code.** Anything about how this
repository already behaves is yours to find out, not a person's to
explain.

**Is it about intent - what they want, which of two ways they would
rather have? Ask, once, and wait.** If one of those carried-forward
questions stops you writing the spec at all, ask with your ask-the-user
tool (`AskUserQuestion` on Claude) and wait for the reply. One question
at a time, with the choices you can see. Someone is at the panel and the
answer comes back inside this run. Record it under
`## Answered Questions` with a `**Qn**` id and an `A:` line, and drop
its `[NEEDS CLARIFICATION]`. If the tool answers that no one is there,
do not ask again - take a reasonable assumption, record it under
`## Assumptions`, and leave the marker.

## Revising

On a later pass the current `spec.md` is in your context, with
whatever a human has since edited into it - including any `A:` lines
they wrote under `## Open Questions`. Their edits are decisions, not
drafts: fold them in, move each answered question into
`## Answered Questions` with its id and its answer, and leave everything
they did not touch exactly as it is. Never delete a question or an
answer.

**A `## What to change` section in the ask is what the person typed when
they asked for this pass.** It is the specific thing they want done, and
it is about this run alone - everything above still holds around it, and
nothing it does not mention is an invitation to change something else.
When there is no such section, the document's own edits are the whole of
the instruction.

Follow the attached `grammar`.

---

# The shape of this document

Everything above is what to do. What follows is what the document
must look like, and it wins over anything implied above.

## Open Questions        (only when something genuinely blocks the plan)

## Overview

(the problem, who has it, and what changes for them)

## User Scenarios

### Scenario 1: (short name)

**Given** ... **When** ... **Then** ...

## Requirements

- **FR-1**: The system MUST ...
- **FR-2**: The system MUST ...

## Out of Scope

## Answered Questions

## Assumptions
```

- Requirements are numbered `FR-N`, one behaviour each, phrased as MUST
  or SHOULD. Later documents reference them by that id.
- **No implementation.** No file names, no library choices, no schema.
  Every one of those is a plan decision, and fixing it here removes the
  choice before anyone has read the requirement.
- `## Out of Scope` is worth writing even when it feels obvious - it is
  the section that stops a plan growing.

## Heading levels

- `#` H1: the document title, exactly one, the first line of the file.
- `##` H2: every section. Sections are never H1.
- `###` H3: items inside a section.

A reader scanning for what is unresolved looks for `## Open Questions`
and stops at the next `##`; a stray `# Something` after the questions
swallows the rest of the document into that section.

## Open Questions and Answered Questions

`## Open Questions`, immediately after the title, so the person who has
to answer sees it before anything else. One list item per question:
`- **Qn** one clear question`. Ids are allocated once and never
renumbered.

An answer is an `A:` line indented under its question. A question with
one is answered; a question without one is not.

`## Answered Questions` at the end holds the ones that have been
answered, id and answer intact. Move them there on your next pass over
this document. Never delete a question or an answer.

An unanswered question stops the next phase. Ask it now, while someone
is at the panel to answer, rather than leaving it in the document.

## Markdown hygiene

- UTF-8. LF or CRLF both work.
- No trailing whitespace.
- Pure markdown - no raw HTML.
- No "generated by" lines and no notes to the reader. The document is
  the deliverable.
````

## `tasks-implement.md`

The `implement` stage, which every pipeline ends on, reached from `tasks`. It writes no document of its own - the work lands in the repository, and git is its record.

```markdown
# Implement the named tasks

You are implementing tasks from the approved `tasks.md` - **exactly the
ones named in your instructions, nothing else**: not a related task, not
an improvement you spotted.

- Read `spec.md`, `plan.md` and `tasks.md` before writing any code, plus
  whatever else the plan phase left in the spec folder.
- Implement only what the task describes, the way the plan says. If it
  cannot be implemented as written, stop and say why - that is a finding
  for the human, not a licence to redesign.
- **A true blocker: ask the person, once, and wait.** If one answer
  would settle it, ask with your ask-the-user tool (`AskUserQuestion` on
  Claude) and wait for the reply. One question at a time, with the
  choices you can see. Say in your summary what you asked and what was
  decided, so the next reader knows the code followed a decision rather
  than a guess. If the tool answers that no one is there, do not ask
  again - stop and report the blocker, which is the rule above.
- Include the task's tests. Run what can be run.

## Working in parallel

Tasks marked `[P]` in the same phase touch disjoint files and may run at
once, one sub-agent each. **Before fanning out, check the file names in
their titles actually are disjoint** - the marker is a claim, and it is
the one thing that makes this safe. If two overlap, or you cannot tell,
run them one at a time.

Never start a later phase until every task in the current one is
finished and ticked. **You own `tasks.md`; sub-agents never write to
it** - they report, you tick.

## The checkbox is the contract

A task is not complete until its box is ticked (`- [x]`). It is the
signal progress is read from, and the completion state every teammate's
machine reads from git.

For each task, in order: run its tests, tick exactly that task's box
changing nothing else in the file, and summarize what you changed in one
short paragraph.

If you could not finish, leave the box unticked, say plainly what
blocked you, and **stop** - do not move on over a blocked task. An
honest unticked box is correct; a ticked box over unfinished work breaks
the plan for everyone.

## The plan - checkbox grammar

`tasks.md` is a **flat** list. There are no sub-tasks and no group
numbering; `##` phase headings group the work instead.

1. A task is `- [ ] T001 Title` - dash, space, `[`, space, `]`, space,
   the id, space, title.
2. Ids are `T` and three digits, numbered from `T001` across the whole
   file. They never restart per phase.
3. Done is `- [x]`. Nothing else means done.
4. `[P]` immediately after the id marks a task that may run at the same
   time as the other `[P]` tasks in its phase: `- [ ] T004 [P] Title`.
   **Two tasks carry `[P]` together only if they touch disjoint files** -
   this is an instruction to work in parallel, and two agents editing
   one file corrupt it. When in doubt, leave `[P]` off.
5. Name the file a task touches in its title, in backticks. It is what
   makes rule 4 checkable by the agent about to fan out.
6. Detail lines are indented two spaces and **never carry a checkbox** -
   a checkbox is what makes a line a task, and a detail with one becomes
   a row nobody can complete.
```

## `tasks.md`

The `tasks` stage, which writes `tasks.md`.

````markdown
# Write the task list

Turn the approved plan into `tasks.md` - a flat, ordered list of tasks a
coding agent can pick up one at a time, in dependency order.

Every task is actionable and single-concern, names the files it touches
in backticks, and is small enough to finish and verify. Tests belong
with the task that needs them.

Mark `[P]` only where a task touches files no other `[P]` task in its
phase touches. That marker is what lets several agents run at once, and
two of them editing one file is the single way this scheme fails. A
sequential plan is slow; a corrupted file is a lost afternoon.

The `current` document named below, if there is one, is the previous
plan **with its done marks** - the inventory of what already exists in
the code. Work that has to be undone is a task, not a deletion from the
list.

Follow the attached `grammar`.

---

# The shape of this document

Everything above is what to do. What follows is what the document
must look like, and it wins over anything implied above.

## Phase 1: Setup

- [ ] T001 Add the module skeleton in `src/thing/index.ts`
- [ ] T002 [P] Add the config type in `src/thing/config.ts`

## Phase 2: Implementation

- [ ] T003 Implement parsing in `src/thing/parse.ts`
  - reads the config type from T002
  - [spec : FR-1, FR-2](spec.md)

## Phase 3: Verification

- [ ] T010 Run the full suite and report
```

- Phases are `##` headings and group the work; task ids run `T001`
  upward across the **whole file** and never restart per phase.
- Order tasks so that following the list top to bottom always works.
- Name every file a task touches, in backticks. It is what makes `[P]`
  checkable by the agent that fans out.
- `[spec : FR-1](spec.md)` on the last detail line of any task that
  implements behaviour. A task satisfying no requirement should not be
  in the plan.
- End with a verification phase. A plan that finishes without running
  anything has not finished.

## Heading levels

- `#` H1: the document title, exactly one, the first line of the file.
- `##` H2: every section. Sections are never H1.
- `###` H3: items inside a section.

A reader scanning for what is unresolved looks for `## Open Questions`
and stops at the next `##`; a stray `# Something` after the questions
swallows the rest of the document into that section.

## Open Questions and Answered Questions

`## Open Questions`, immediately after the title, so the person who has
to answer sees it before anything else. One list item per question:
`- **Qn** one clear question`. Ids are allocated once and never
renumbered.

An answer is an `A:` line indented under its question. A question with
one is answered; a question without one is not.

`## Answered Questions` at the end holds the ones that have been
answered, id and answer intact. Move them there on your next pass over
this document. Never delete a question or an answer.

**Can the code answer it? Read the code.** Anything about how this
repository already behaves is yours to find out, not a person's to
explain.

**Is it about intent - what they want, which of two ways they would
rather have? Ask, once, and wait.** Ask with your ask-the-user tool
(`AskUserQuestion` on Claude) and wait for the reply. One question at a
time, with the choices you can see. Someone is at the panel and the
answer comes back inside this run. Record it under
`## Answered Questions` with its `**Qn**` id and an `A:` line. If the
tool answers that no one is there, do not ask again.

An unanswered question stops the plan from being started. Ask it now,
while someone is here to answer, rather than leaving it in the document.

## Markdown hygiene

- UTF-8. LF or CRLF both work.
- No trailing whitespace.
- Pure markdown - no raw HTML.
- No "generated by" lines and no notes to the reader. The document is
  the deliverable.

## The plan - checkbox grammar

`tasks.md` is a **flat** list. There are no sub-tasks and no group
numbering; `##` phase headings group the work instead.

1. A task is `- [ ] T001 Title` - dash, space, `[`, space, `]`, space,
   the id, space, title.
2. Ids are `T` and three digits, numbered from `T001` across the whole
   file. They never restart per phase.
3. Done is `- [x]`. Nothing else means done.
4. `[P]` immediately after the id marks a task that may run at the same
   time as the other `[P]` tasks in its phase: `- [ ] T004 [P] Title`.
   **Two tasks carry `[P]` together only if they touch disjoint files** -
   this is an instruction to work in parallel, and two agents editing
   one file corrupt it. When in doubt, leave `[P]` off.
5. Name the file a task touches in its title, in backticks. It is what
   makes rule 4 checkable by the agent about to fan out.
6. Detail lines are indented two spaces and **never carry a checkbox** -
   a checkbox is what makes a line a task, and a detail with one becomes
   a row nobody can complete.
````

