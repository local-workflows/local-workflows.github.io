<!-- GENERATED FILE - DO NOT EDIT.
     Source: resources/styles/custom/
     Regenerate: ruby scripts/gen-style-prompts.rb -->

# The Custom instructions

Every instruction file behind the Custom process, exactly as the extension sends it. This page is generated from `resources/styles/custom/`, so it cannot drift from the source it was built from.

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

```markdown
# Design: <Feature Name>

<!-- Fill rules: cite acceptance criteria, never restate them. Omit anything the
repo can answer for itself (paths, signatures, field lists, payloads). A
decision nobody has made is an open question, not an omission. Target: 2 pages.

A requirement that cannot be satisfied as written is a blocker - raise it as an
open question, never design around it silently. A principles or standards file
attached to this phase wins over your own preferences. Research is context, not
an artifact: what you look up shapes the design and is cited inline next to the
decision it justifies - no `research.md`, no notes file; `code-findings.md` is the
only side file, and only for code facts.

Do not write this file until the pre-write gate is cleared: unknowns asked,
proposed deviations agreed. Silent assumptions are the failure mode, not slow
drafts. -->

**Requirements:** `requirements.md`

## Decisions Requiring Sign-off

<!-- The review. 3-7 decisions. Only decisions an architect could reasonably have
made differently. Driving factor precedence: NFR/steering > existing codebase
pattern > industry standard.

A feature shipping behind a flag records that as a Dec-<n> here, not in
requirements.md — a flag is a rollout mechanism, not behavior: record the key,
default state, and rollback. -->

### Dec-1: <short title>

- **Decision:** <one line>
- **Alternative rejected:** <one line>
- **Driving factor:** <NFR / pattern in `X` / standard>
- **Reversible after ship?:** <Yes / No — why>

## Proposed Deviations

<!-- Where the requested approach, or what the codebase does today, conflicts with
design standards or an NFR. Max 3, agreed with the requester before this file was
written. Cite the standard — a preference is not a deviation. Omit if none. -->

### Dev-1: <short title>

- **Proposal:** <one line>
- **Conflicts with:** <requested approach / existing pattern in `X`>
- **Standard/NFR cited:** <the standard or NFR>
- **Agreed?:** <Yes/No — by whom, when>

## Overview

<3-5 sentences: the approach, and which requirements it satisfies, cited as
[Requirements : 1, 2](requirements.md).>

**Non-goals:** <max 4 bullets. Adjacent work the implementer will be tempted to
pick up. Mark anything deferred-not-rejected and name the follow-up.>

## Non-Functional Requirements

<!-- One feature-specific fact per applicable category - performance, scale,
resilience/availability, security (including whether a security/threat review
is triggered), observability, cost, compatibility/legacy surfaces, operability,
code coverage, accessibility (any new UI surface), localization (translation
policy for changed strings), automation/test scope - never restated
methodology. Security, performance, and code coverage always get a line - no
feature is exempt from those three.

Every line traces to a source: an obligation the inputs state, or one a human
gives when asked. Part of the pre-write gate: ask - with your ask tool, in this
run - whether there are NFR obligations to add, inviting free-text; interpret
whatever comes back into the line shape below, write it here, and record it as
an answered question (who, when). A valid performance line is "no obligation
stated - none applies": never invent a target, bound, or measurement nobody
asked for. Consider the rest and omit any with nothing feature-specific to say.
How each obligation is met and verified belongs to the sections that follow -
this section records only the obligations. -->

- Security: <RBAC/tenant isolation/PII handling for this feature; any
  logging the criteria require masks personal data>
- Performance: <target, e.g. "p95 < 400ms at 200 concurrent requests" -
  or "no obligation stated - none applies">
- Code coverage: <delta vs. baseline for new/changed code>
- <other applicable category>: <the fact>

## Architecture

<Component diagram (`flowchart`), max 10 nodes: what is new, what is
modified, what is deliberately untouched.>

**Repo scope** — one line per repo, literal github name; state "single repo" if so:

- `<repo-name>` — <role in this feature>; <new module/service/package, or modified>

**Entry points:** <sync request / cron / queue consumer / user action — and what triggers it>

## Components and Interfaces

<!-- One entry per component this feature adds or changes. A component is a service,
module, handler, client, job or UI surface — not a file, and not a class list: the
file-level breakdown belongs to tasks.md. Keep the heading and write "no new
component — existing ones change internally only" where that is true. -->

- **`<component>`** in `<repo>` — <new or modified>; <the operation it exposes or
  the behaviour it gains, in one line>; <who calls it>

## Runtime Flow

<`sequenceDiagram` of the primary flow per entry point — who calls whom, in
what order, sync vs async — including the failure branch that matters. More
than one entry point with genuinely different flows: one `###` per flow,
one diagram each. Omit the section only when the flow is a single
in-process call the Architecture diagram already shows.>

## Data Models

<!-- Omit only for UI-only features. "No schema change" is itself a decision — say it.
Add an `erDiagram` of created/altered entities and their relationships — omit it
for no schema change or a single added column. -->

- **Entities:** <created vs. altered, by real schema names>
- **Nature of change:** <new fields, repurposed fields, new relationships, changed
  constraints. Name a field only where its semantics drive the design.>
- **Nullability/defaults:** <only where a wrong choice changes behavior for existing rows>
- **Access patterns:** <the queries this must serve, and any index the design depends on>
- **Retention/PII:** <what is personal or regulated, and what that implies>

## Migration

<!-- Keep the heading and write "none — no schema change" where that is true. -->

- **Migration:** <none / additive / requires backfill> 
- **Order:** <migrate-then-deploy
  or deploy-then-migrate>
- **Rollback:** <can this be reverted after ship; if not, why>

## Consistency & Concurrency

<!-- Usually the section that catches the real bug. Do not skip; say "N/A — single
in-process write, no concurrent callers" if that is true. -->

- **Transaction boundary:** <what is atomic; what can end up half-applied>
- **Invariants:** <what must always hold, and which component enforces it>
- **Shared predicates:** <every term this feature branches on - "onsite", "final",
  "in scope", "eligible" - written once as a single predicate, with every component
  that evaluates it and the fields each one needs to do so. Two components deciding
  the same term by different tests is the defect this bullet exists to catch, so
  list the evaluation sites even where they agree, and name any field a site cannot
  read yet. "N/A - this feature branches on no shared term" if so>
- **Concurrent callers:** <what happens on simultaneous or duplicate requests>
- **Idempotency & ordering:** <required or not; the key used; whether ordering matters>
- **Work outliving its trigger:** <every call left unawaited, backgrounded, or
  fire-and-forget: the mechanism that keeps it alive past the request that
  started it, and what it does not survive — "unawaited" is not a mechanism.
  "N/A — nothing is backgrounded" if so>

## Cross-Boundary Contracts

<!-- Another repo, external customer, published SDK/CLI, webhook, emitted event.
Keep the heading and write "no cross-boundary surface" if none. Two cases need it:
more than one Target Code Repo calling across a boundary between them; or one repo
exposing a public API an external customer integration calls directly, alongside or
instead of a UI. The second applies to single-repo features too. -->

### `<capability>`

- **Producer → consumer(s):** `<repo>` → `<repo>` / External customer integration
- **Operation:** <semantic, one line — "consumer submits a batch and polls for completion">
- **Compatibility:** <additive / breaking — versioning, deprecation window, who is
  notified. Breaking an external customer contract needs explicit architect sign-off.>
- **Auth:** <which principal, which mechanism, what the producer authorizes>
- **Failure semantics:** <retryable vs. terminal for the consumer>
- **Rollout order:** <which side ships first; behavior between the two deploys>
- **Naming mismatch:** <both real names in one line, if the requirements glossary flagged one>

## Security & Authorization

- **Who may act:** <roles, permissions, scopes>
- **Enforcement point:** <which component checks; whether existing enforcement is relied on>
- **Tenancy isolation:** <how cross-tenant/org/user access is prevented>
- **Sensitive data:** <logged, masked, encrypted, or deliberately not persisted>

## Performance & Scale

<!-- When Non-Functional Requirements states no performance obligation,
Constraint is "none applies" and the other two lines are omitted - never
invent a measurement (a p95 comparison, a load test) nobody asked for; an
invented verification is scope creep, not rigor. -->

- **Constraint:** <the number to design against, citing the NFR — or "none applies", and why>
- **Impact:** <expected load, payload size, or latency delta this change introduces>
- **Decision & verification:** <what the design does about it, and how that is proven>

## Error Handling

<`stateDiagram-v2` when the feature introduces or changes an entity's status
lifecycle — states and legal transitions. Omit when no lifecycle changes.>

- **Failure modes:** <what can fail, and what the user or calling system sees for each>
- **Detection & recovery:** <how it surfaces and how it is recovered; cite the
  error-related criteria, e.g. [Requirements : 2.3](requirements.md)>
- **Blast radius:** <what else degrades if this is wrong>

## Observability

- **Instrumentation:** <max 5 bullets — what must be logged, metered, or traced for this
  to be operable, and any alert the design assumes exists>

## Correctness Properties

<!-- The design's invariants as numbered properties - deduplication, ordering,
bounds, never-blocks guarantees - not restated criteria. An invariant stated in
prose elsewhere in this document moves here and is cited from there by its id.
A property holds across every valid execution: if you cannot write "for any", it
is an example, not a property - it belongs in Testing Strategy. Name no
property-testing framework and no iteration count; how a property is verified is
Testing Strategy's business. -->

### Property 1: <short descriptive name>

*For any* <universally quantified input>, THE <component> SHALL
<guaranteed outcome>, regardless of <what does not matter>.

**Validates: Requirements 1.2, 2.4**

## Testing Strategy

<!-- Every acceptance criterion gets exactly one primary level. Cite criteria as
link citations grouped by level - never restate their text. Give a reason only
where the choice isn't obvious; Manual always gets its reason. This section is
what QA's sign-off covers. -->

- **Unit:** [Requirements : 1.4, 1.6](requirements.md) — <the pure logic covered here>
- **Integration:** [Requirements : 1.9](requirements.md) — <the real boundaries
  covered here; name any test infrastructure that must be built first>
- **E2E/automation:** [Requirements : 1.5](requirements.md) — <the few journeys
  worth automating end to end - not a re-run of what lower levels cover>
- **Manual:** [Requirements : 3.6](requirements.md) — <always with the reason it
  cannot be automated>
- **Pyramid check:** <every requirement has at least one criterion above unit
  level - name any that doesn't and why that's acceptable>
- **Existing tests affected:** <tests this change breaks or supersedes, and the
  decision for each: update, migrate, or retire>
- **Hard to test:** <what, why, and how it will be handled>
- **Load/perf testing:** <approach, if there is a performance NFR — else omit>
- **Configuration variants:** <where behavior is driven by configuration rather
  than a name or a type, the configured variants to verify - including at least
  one that must not change - else omit>
- **Persona scenarios needing dedicated cases:** <cited as
  [Requirements : 2.3](requirements.md)>

## Glossary

<!-- One line per system or term this design names. Requirements only ever say
THE SYSTEM, so this is where a PO or QA reader learns what each name is. Plain
words, no architecture. -->

- **<System/term>** - <what it is, in one plain sentence>

## Open Questions

<!-- Say what a question blocks (a criterion citation or a Dec-<n>) in the
question line. "None." if none. -->

- **Q1** <question - what it blocks, who decides>

## Answered Questions

- **Q<n>** <question>
  **A:** <the decision>
  **By:** <name> - <datetime UTC>

## Assumptions

<!-- Anything the author had to assume to finish. Surviving sign-off = approved. -->

- <assumption> — **if false:** <what changes>

## Sign-off

<!-- All three required before tasks.md. -->

- **Developer (peer review):** <name> — <UTC>
- **Lead:** <name> — <UTC>
- **QA:** <name> — <UTC>
```

## `requirements.md`

The `requirements` stage, which writes `requirements.md`.

```markdown
# Requirements Document
Feature : <Feature Name>

<!-- The H1 is the literal words `# Requirements Document`, never the
feature's name: Kiro's validator matches that line exactly.

Your source is `intake.md` when the spec has one: what was asked and
where it came from. Read what it points at before you draft - every file
it lists (they sit in the spec folder), and any work item or issue it
names, through the MCP server for that provider, comments included. A
description alone means that is all there is: work from it and the
repository, and invent nothing. Do not re-open the ask: intake settled
what is being asked; carry its own open questions forward where they
still block, and add no scope because the ask left room for it. Intake's
`type` shapes the framing - a `bug` states the wrong behaviour and the
right one, a `feature` states capability the system should gain - but
the sections, numbering and EARS forms are the same either way. -->

> Standalone template - everything needed to draft and record these
> requirements is in this file.
- **Approved by (PO):** <name - filled at approval>
- **Approved (UTC):** <datetime - filled at approval>

## Introduction

A few sentences on the feature, its purpose, and the problem it solves -
not a design summary or a restatement of the requirements below.

## Glossary

Only where artifacts genuinely name one thing differently. One line
per term: "Customer (canonical) - the mock-ups say 'Client'; the DB
table is `account`." When a field this feature writes is also
written by other flows, say so - a reader must not assume it holds
only this feature's value. A multi-word term is written with
underscores - `Scheduled_Appointment` - and then written that way
everywhere in this document, criteria included, so a defined term is
one greppable token. Omit the section when there's nothing to
record.

## Personas

Only when an audience beyond the user stories' own roles needs
distinct verification - an integration caller that authenticates
differently, a participant who sees data a requirement exposes. One
line per persona: who they are and what makes their path different.
Omit when the user stories' roles cover everyone.

- **<Persona>** - <what makes their path distinct>

## Requirements

Each requirement is one clear capability, stated as the PO would state
it: a user story plus the complete acceptance criteria that verify it.
Group by what a reader verifies together, never by system or repo - a
requirement is an outcome, not a component's work list. Requirements
are not deployment units: no requirement here carries release
mechanics or dependency ordering. A requirement that documents
existing behavior for verification only says so in one italic line
under its heading - it implies no new build work, only tests. Each
requirement must read on its own, criteria written out in full - no
resolving other documents to know what to build.

A requirement is one thing a PO can approve or reject whole. Where its
criteria fall into groups that need their own headings or labels to
stay readable, the cut is wrong and those groups are separate
requirements - a label inside the criteria list is the signal, never
the remedy, because a reader signs the requirement and nobody scans
dozens of criteria for the one that is missing.

Three cases go missing by default, so state or consciously exclude each
one per requirement: the identifier that resolves to nothing; the
multi-item operation where one item fails and the others must still
succeed; and the dependency that is unreachable rather than merely
returning an error. Where one genuinely does not apply, say so in the
test notes - an absence nobody explains reads as an oversight, and
usually is one.

### Requirement 1: <Short title>

**User Story:** As a <role>, I want <capability>, so that <benefit>.

#### Acceptance Criteria

State WHAT the system observably does - HOW it's built and
tested (repos, endpoints, test levels) belongs to design.md. Write
every line in the product's language the PO can sign: a line that
needs a service name, endpoint, header, transaction, or storage type
is carrying a design fact - move the fact to design.md and restate the
line in product terms. Include
at least one criterion that exercises a real boundary (a persisted
save, a call across a service, a full user action), not just
logic/validation. State when the action must NOT apply - the entity
states or conditions under which nothing is recorded or changed.
Every surface the changed data reaches - reports, exports, emails,
templates/merge fields, APIs - appears in some criterion. Name the
concrete limit where one exists; a testable number beats an
abstraction. Persona- or flag-specific behavior is its own
criterion (the WHERE form) - for flag-gated work, state the flag-OFF
behavior ("as today") as a criterion too, in product terms, never
naming the flag key: the key and rollout mechanics are design's
Dec-<n>. An NFR measurable as a single trigger/response (e.g. a
response-time target) is a numbered criterion here; cross-cutting NFR
facts belong to design's Non-Functional Requirements section - never
a section here.

1. WHEN <trigger> THEN THE SYSTEM SHALL <behaviour>.
2. IF <error/edge condition> THEN THE SYSTEM SHALL <behaviour>.
3. WHERE <context/persona/configuration> THE SYSTEM SHALL
   <behaviour>.

**Test notes** (optional) - only when there's something real to say:
data or situations worth testing, anything only checkable by hand and
why, or a persona whose path needs separate verification.

### Requirement 2: <Short title>

**User Story:** As a <role>, I want <capability>, so that <benefit>.

#### Acceptance Criteria

1. WHEN <trigger> THEN THE SYSTEM SHALL <behaviour>.
2. WHEN <trigger> THEN THE SYSTEM SHALL <behaviour>.

## Out of Scope

Concrete exclusions a reviewer could otherwise reasonably assume were
in scope - a functional variant, persona, legacy surface, or
integration. Ground each in the inputs - the PRD, the code, an
answered question - don't invent them here. State permanent boundary or
deferred phase - never ambiguous - and the consequence the product
lives with (e.g. "no criterion can be written for it, so there is no
test for it either").

- **<Excluded item, e.g. "Portal v1">** - <why>. <Permanent, or
  "planned for a future phase - <link or 'not yet scheduled'>">.
  <The consequence the product lives with.>

## Open Questions

Questions raised while drafting these requirements. Name the
requirement a question blocks, if any.

- **Q1** <question>

## Answered Questions

- **Q<n>** <question>
  **A:** <the decision>
  **By:** <name> - <datetime UTC>

## Assumptions

What you decided for yourself and proceeded on - a guess, said so.
Surviving PO sign-off makes it approved. Omit when empty.

- <assumption> - **if false:** <what changes>

## Sign-off

- **Approved by (PO):** <name> - <UTC>
```

## `tasks-implement.md`

The `implement` stage, which every pipeline ends on, reached from `tasks`. It writes no document of its own - the work lands in the repository, and git is its record.

```markdown
# Implement the named tasks

You are implementing tasks from the approved `tasks.md` of this
feature - **exactly the ones named in your instructions, nothing else**:
not a related task, not an improvement you spotted.

## Scope

- Read `requirements.md`, `design.md` (when the spec has one) and
  `tasks.md` from the spec folder before writing any code. A document stamped
  `> STALE:` is not implementable - stop and say so.
- Implement only what the named task describes, the way the design
  says. If the task references requirements, satisfy exactly those.
- A task's anchors are file paths plus symbols. An anchor that does not
  resolve is one of two things, and they are not handled the same way.
  Where the file exists elsewhere under an obviously equivalent path,
  or the symbol has moved within the repo, that is drift: re-resolve
  it, record the correction in `code-findings.md`, and carry on. Where
  nothing in the repo carries that symbol at all, the anchor was never
  right: stop, and report it as a defect in `tasks.md` rather than a
  change in the code. Never guess a replacement in either case.
- Include the task's tests. Run what can be run.
- Touch only the files the task requires. If a task cannot be
  implemented as written, stop and say why instead of improvising -
  that is a finding for the human, not a licence to redesign.
- **A true blocker: check `decisions.md`, then ask the person once only
  if it has no answer.** Update that question-and-answer pair with their
  answer. If nobody answers, stop and report - never proceed on a guess.
- Never commit, push, or open a pull request unless explicitly told to.

## Waves - what may run at the same time

`tasks.md` ends with a `## Task Dependency Graph`: a `waves` array
saying which tasks are safe to run concurrently, built from each task's
`Files:` line so that tasks sharing a wave touch disjoint files. Read
those lines before fanning out; if two tasks in the wave name the same
path, work those two one after the other.

- If you can delegate to sub-agents, do - one sub-agent per task, one
  task each, told to stay inside its task's files. If you cannot, work
  them one at a time.
- **Never start a later wave until every task in the current wave is
  finished and ticked.** Waves are a barrier, not a suggestion.
- **You own `tasks.md`. Sub-agents never write to it.** They report
  back; you tick each box yourself after each reports success.
- The same ownership applies to `code-findings.md`: check it before
  searching the repository, and append what a task's work uncovers -
  one line per fact: repo, file or symbol, the fact. Sub-agents report
  findings back; you append them.
- If a task in a wave fails: tick the ones that succeeded, leave the
  failed one unticked, say what broke, and **stop** - never roll into
  the next wave.

## Every task ends green

The repository builds and its tests pass at the end of every task - not
at the end of the plan. With the feature flag off, behavior is exactly
today's at every stopping point: a half-wired path is unreachable, never
broken. When several tasks share a wave, the guarantee lands when the
wave completes.

The final verification group records real outcomes per suite - a result
is what actually ran, never an assumption. Anything unrunnable in this
environment is named for CI, not reported green.

## When done - the checkbox is the contract

A task is not complete until its checkbox in `tasks.md` is ticked
(`- [x]`). In order, as the final acts of each task:

1. Verify what you built - run the task's tests.
2. Call the `task_done` tool with the task's id (`1.2`). It ticks
   exactly that box and changes nothing else. Never open or edit
   `tasks.md` to tick a box - not the text, not the numbering, not the
   graph; the tool is the only way a box gets ticked.
3. Summarize what changed and why, in one short paragraph, and name
   every file you created or edited for it - the same list your final
   `## Changed` section gathers up across all the tasks you were handed.
   The panel reads that list; it is how a person sees what the wave
   touched without opening the chat.

If a task could not be completed, leave its box unticked, state what
blocked you, and stop there. An honest unticked box is correct; a
ticked box over unfinished work breaks the plan for everyone.

## The plan's shape

The attached grammar owns the checkbox spacing, tick marks and the
`## Task Dependency Graph` fence - the implement lens parses those
lines. Keep every line you touch to that shape.
```

## `tasks.md`

The `tasks` stage, which writes `tasks.md`.

```markdown
# Implementation Plan: <Feature Name>

## How to cut tasks

Applied when writing this file; never copied into the generated
document.

Tasks implement the approved requirements, in requirement order,
using the design's decisions. Nothing is decided here: a task that needs a
decision the design doesn't carry is a design gap - raise it, never
invent it. When the spec has no `design.md` (a bug fix), derive the
breakdown from the requirements alone and cite only those.

Only work that satisfies a requirement belongs in the plan - no
"nice to have" tasks nobody asked for. Only coding work belongs in the
plan: every task must be completable by writing, changing or testing
code, or by opening a pull request. User acceptance testing, gathering
feedback, deploying to an environment, collecting metrics, walking the
application by hand, training, user documentation and business process
changes are not tasks, however much the feature needs them - a plan that
carries one has a checkbox no agent can ever tick, and the ticked
checkbox is the only completion signal this pipeline has. Work that is
genuinely skippable is marked optional (`- [ ]* N.M`) and `## Notes`
says what skipping it costs.

Every task leaves the system runnable and testable: the build compiles,
every existing test still passes, and the behavior the task adds is
exercised by a test in the same task - tests travel with the code they
verify, never in a later task. Work in vertical increments behind the
flag: at any stopping point between tasks, flag-off behavior is exactly
today's, and a half-wired path is unreachable rather than broken. A
task that changes a contract updates every caller of that contract in
the same task.

A task is one sitting of work with one concern - a task that cannot
end green in one sitting is split before this file is signed,
scaffolding and test-infrastructure work included. Its detail lines
locate work by code anchor - repo, path from that repo's root, and the
symbol, key, or string inside the file - never by line number: position
rots between writing and execution, names survive edits, and an anchor
that no longer exists at execution time is a staleness signal to
re-check the design, never a licence to guess. A codebase fact a task
relies on - a cache, a constraint, an existing converter - cites the
design decision, or the `code-findings.md` line, that established it;
folklore doesn't ship. A task that says *every*, *all*, or *each* of a set of call
sites, endpoints, keys, or strings names the set in full and states how
many there are; the set comes from a search run while writing the task,
never from recall and never from a prose summary in an earlier document
- a summary naming three of something is a claim to re-run, not a list
to copy. A question
answered or an assumption made while cutting tasks is recorded in this
document, in the grammar's question and assumption sections - the
conversation does not survive, the document must; assumptions already
recorded in earlier documents are read from there, never restated
here. The second to last
detail line is `Files:` - the paths the task creates or edits, from the
design and from reading the code, written down rather than worked out
in your head, because the wave graph is built from it and the engine
reads it before letting two tasks run at once. A task no agent should
do - update an environment, create a branch, get a review - carries a
`Run:` detail line after `Files:` saying who does it instead: `by hand`,
one command in backticks, or a workflow's name with its params; the
grammar has the exact shapes, and a task that changes code never has
one. The last detail
line cites the criteria the task implements and the design ids it
follows. A group is one requirement, in the requirements' order.

On a revise, work already done that is no longer wanted gets a
compensating task - if 3.1 added `ISomething` and it is no longer
required, the task is "Remove `ISomething` and its implementations".
Never assume version control will revert anything.

Three closing groups follow the requirement groups, in this order. Verification
runs lint, build, and the test suites per repo and records real
outcomes; every suite it names is read from that repo's own solution or
project files rather than recalled, because a verification step that
names a project which does not exist fails on the first run; anything
unrunnable in the current environment is flagged for CI by name, never
assumed green. Documentation updates what this feature
actually changed and nothing else - a repo with nothing to update
records the reason, and a steering or team-doc addition is proposed with
its target file confirmed by a human before anything is written. Pull
requests open one per repo touched, each carrying the verification
outcomes recorded above, the flag key and its rollback, and anything
still blocked - opened for review, never merged. Rollout order is
expressed inside a group's task ordering and the wave graph, never by
reordering groups - the deploy sequence itself lives in design's
Cross-Boundary Contracts.

**Before you stop, call the `check_plan` tool.** It reads the file you
wrote the way the implement phase will and lists every problem by
line - a row it cannot read, a task in no wave, two tasks of one wave
on the same file. Fix each one in the file and call it again, until it
reports no problems. A problem left in the plan is a task nobody will
run.

## Shape

One group per requirement, hierarchical dialect, `## Task Dependency Graph`
at the end - the grammar file owns all three shapes. The generated
document carries the headings below, in this order.

## Overview

<two or three sentences: the order the work is built in and why that
order, and anything a reader needs before the first task>

## Tasks

- [ ] 1. <Requirement 1 title>
  - [ ] 1.1 <task - one concern, ends green>
    - <implementation detail, located by code anchor>
    - [Design : Dec-1](design.md)
    - Files: `<repo-relative path>`, `<repo-relative path>`
    - _Requirements: 1.1, 1.2_
  - [ ] 1.2 <task>
    - <implementation detail, located by code anchor>
    - Files: `<repo-relative path>`
    - _Requirements: 1.5_

- [ ] 2. <Requirement 2 title>
  - [ ] 2.1 <task>
    - <implementation detail, located by code anchor>
    - [Design : Dec-6](design.md)
    - Files: `<repo-relative path>`
    - _Requirements: 3.1_

- [ ] 3. Verification
  - [ ] 3.1 <one task per repo touched: lint, build, unit and
    integration suites - the recorded result, pass or fail, per suite>

- [ ] 4. Documentation
  - [ ] 4.1 <one task per repo whose documented behavior changed - what
    to update, or the reason it needs nothing>
  - [ ] 4.2 <the steering or team-doc addition this feature earned,
    target file confirmed with a human first - or the reason there is
    none>

- [ ] 5. Pull requests
  - [ ] 5.1 <one task per repo touched: branch, the repo's own PR
    template, the recorded verification outcomes, the flag key and its
    rollback - opened for review, never merged>

## Notes

- <what holds across groups rather than inside one task: ordering that
  is load-bearing, anything optional and why, a convention every task
  follows>

## Sign-off

- **Lead:** <name> - <UTC>
```

