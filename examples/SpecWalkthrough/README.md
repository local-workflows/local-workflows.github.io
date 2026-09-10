# SpecWalkthrough

One feature, taken through every phase of spec-driven development, with
the real documents each phase produced.

**Nothing here runs.** You do not need the extension to read it. This
example exists so you can see what the loop actually produces before you
decide whether you want it.

The feature is a todo list. The code that came out the other end is the
**NodeService** example next door - the same `add`, `complete`, `filter`
and `save to a file` this spec describes.

## The four documents

```
SpecWalkthrough/
  .local-workflows/specs/todo-list/
    intake.md         what was asked, recorded and not interpreted
    requirements.md   what the system must do, and why
    design.md         how it is built, and what was rejected
    tasks.md          the plan, ticked off
```

Read them in that order. Each one is the input to the next.

## How it works

You start a spec, and the extension writes `intake.md` from what you
were asked. Then there are three phases. Each phase is one agent
session, and each one ends at a gate: the document appears in the panel,
you read it, you approve it or you send it back with a note.

Nothing moves to the next phase until you approve. The agent is never
asked to judge its own work.

The prompts are fixed and public. They are not written per run, and they
are not something the agent chooses - you can read the exact text every
phase is sent at
<https://local-workflows.github.io/getting-started/sdd/kiro-prompts/>.

This is the **Kiro** style. There is a second built-in style, Spec Kit,
with different phases and different filenames, and you can write your
own.

---

## Phase 0: intake

**File:** [intake.md](.local-workflows/specs/todo-list/intake.md)

Written by the extension, not by a model. It records what you were asked
and where it came from - a description you typed, a file you handed
over, or an Azure DevOps or GitHub work item.

Intake is deliberately thin. It is a record of the ask, not a summary of
it. If the ask was a work item, intake writes down *which* work item, and
the requirements phase goes and reads the original rather than working
from somebody's paraphrase.

The `## Open questions` section in this one is the part worth noticing.
Two things were genuinely unsettled when the spec was created - where
the file lives, and what happens when it is broken by hand. They are
written down instead of guessed at, and both are answered by requirement
5.

Edit this file freely before you run the next phase. It is the whole
context that phase starts from.

---

## Phase 1: requirements

**File:** [requirements.md](.local-workflows/specs/todo-list/requirements.md)

Six requirements, 26 acceptance criteria.

**Criteria are written in EARS.** Five forms and no others: `WHEN`,
`IF`, `WHERE`, `WHILE`, and a bare `THE ... SHALL`. `SHALL` for an
obligation, `SHALL NOT` for a prohibition. Never "should" or "must" -
those are wishes, and a wish cannot be tested.

Look at 1.4:

> IF a title is longer than 200 characters once whitespace is removed
> THEN THE todo list SHALL refuse to add it and report both the limit
> and the length given.

Someone who has never seen the code can tell whether that holds.

**Every criterion names its component**, not "the system". 4.4 says
`THE command line SHALL`, not `THE todo list` - and that turns out to
matter, because the design splits those into two files and the criterion
survives the split.

**`1.4` means requirement 1, criterion 4.** That is the id scheme the
whole spec traces through, and it is why requirements are never
renumbered by a later pass. Add at the end; leave the numbers alone.

**The `## Assumptions` section is the honest part.** Nobody said 200
characters. Rather than stopping to ask, the phase picked a number and
wrote down that it picked it. You can disagree with it in one line.

---

## Phase 2: design

**File:** [design.md](.local-workflows/specs/todo-list/design.md)

Two sections carry the weight.

**`### Design Decisions`** is the only place the design records what it
*rejected*. One row per choice a reader could reasonably have made
differently, and a rationale that names the alternative and why it lost:

> **Ids count up and are never reused** - The alternative, filling the
> gaps, means an id printed yesterday can mean a different item today.

Six months later this table is the only thing standing between a
maintainer and re-opening a question someone already thought through.

**`## Correctness Properties`** is where traceability closes. A property
is a claim that holds across every valid run - not an example:

> *For any* sequence of additions and deletions, THE todo list SHALL
> give each new Todo_Item an id greater than every id it has issued
> before, regardless of how many Todo_Items have been deleted.
>
> **Validates: Requirements 1.1, 3.2**

That last line is the link back. Fifteen properties between them name
all 26 criteria, so nothing asked for is left uncovered. A criterion no
property validates is a hole in the design, and it is visible.

---

## Phase 3: tasks

**File:** [tasks.md](.local-workflows/specs/todo-list/tasks.md)

The plan. Every task ends with a citation:

```
- [Requirements : 1.1, 1.2, 1.3, 1.4, 1.5](requirements.md)
```

An ordinary markdown link, so it works in the editor, on GitHub and in a
pull request. In the panel it does more: the criteria it names are
resolved against `requirements.md`, and any id that no longer exists is
struck through. A revision that renumbered requirements would show up
immediately instead of six weeks later.

**The rule the plan is split on:** the repository builds and its tests
pass at the end of *every* task - not at the end of the plan. That is
what decides where the boundaries go. An interface and the code that
implements it are one task, however separate they look, because
splitting them leaves the tree red and a plan you can only run to the
end is not a plan.

**The dependency graph** at the bottom says what can run at the same
time:

```json
{ "id": 1, "tasks": ["1.2", "3.1"] }
```

Two tasks share a wave only when they touch different files. `1.2` edits
`src/todo.ts` and `3.1` creates `src/store.ts`, so they are safe
together. `4.1` and `4.2` both edit `src/cli.ts`, so they are in
different waves even though nothing else forces the order.

---

## What this is worth

The spec is longer than the code. That is the trade, and it is worth
naming rather than hiding.

What you get for it: 26 criteria a person agreed to before anything was
written, a record of what was rejected and why, and a plan where every
task says which criteria it answers. What you avoid: the fourth
conversation about whether the title limit was ever agreed.

For a one-line fix, this is too much. For a feature two people have to
agree on, the writing happens anyway - in a pull request comment, in a
meeting, or in the rework when it turns out nobody agreed. This puts it
somewhere it can be read.

## See also

- **NodeService** - the code this spec describes, with real tests
- <https://local-workflows.github.io/getting-started/sdd/> - the whole
  feature, including how to write your own style
