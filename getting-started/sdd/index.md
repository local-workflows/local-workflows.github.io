# Spec-driven development

A workflow whose tasks are AI-drafted documents and human decisions:
requirements, design, plan, then implementation. Each phase runs a fixed
prompt in a clean session, and the whole process state is committed to
git. This page walks your first spec end to end, then covers the rules
underneath; the sub-pages hold the built-in style, two worked examples
with their exact prompts, and
[writing your own](https://local-workflows.github.io/getting-started/sdd/custom-style.md).

This needs an **agent sign-in**. Every phase that runs a model runs on
the `ai@1` plugin, whose default provider is `ghcp` — GitHub Copilot —
so out of the box this is the one half of the extension that needs a
Copilot sign-in. Set `provider: claude` and it needs a Claude sign-in
instead. See [Agent SDKs](https://local-workflows.github.io/getting-started/agent-sdks.md).

---

## What a spec is

A folder of Markdown under `.local-workflows/specs/`, committed alongside
your code. That is the whole artefact — no database, no service, no
hidden state. Delete the extension and the documents are still there,
still readable, still in your history.

You need no configuration to start. With no
`.local-workflows/settings.json` at all you get the built-in `custom`
style, specs under `.local-workflows/specs`, and whichever model Copilot
would have chosen. The walkthrough below assumes exactly that.

---

## 1. New Spec

Open the **Specs** view and click **＋ New Spec**. It asks a short series
of questions — what kind of spec, where the work item comes from, the one
detail that source needs (a work item id, a one-line description, or a
file picker), and a name for the spec — then creates the folder.

Two of those the settings file can answer for you: a style offering one
spec type is not asked about, and an `sdd.source` set in
`.local-workflows/settings.json` skips the second question for everyone
on the repository.

The two kinds it offers come from the style, not from the engine:

| | Phases |
|---|---|
| **Feature** | `intake` → `requirements` → `design` → `tasks` → `implement` |
| **Bug fix** | `intake` → `requirements` → `tasks` → `implement` |

Every pipeline opens with `intake` — the ask comes in the same way in
every process. Both kinds here close with `implement` too, because both
end in code, but that is this style's choice, not a rule: a style whose
last phase publishes a document instead of writing code just ends there,
with no `implement` stage at all. See [Custom styles](https://local-workflows.github.io/getting-started/sdd/custom-style.md#2-the-input-gate-is-not-yours-to-place-the-output-gate-is-yours-to-choose).

`intake` runs no model: ＋ New Spec writes `intake.md` from your answers,
copies in any files you picked, opens the document for editing, and the
spec is ready. Everything after it is AI.

`intake.md` is short on purpose. It records **where the ask lives** — the
work item, the issue, the copied files — rather than summarising it, so
the next phase reads the original instead of somebody's paraphrase of it.
Add whatever the pickers could not capture while it is open.

Pick **Feature**. A bug fix skips design, because a one-line fix does not
need a design document and a process that demands one teaches people to
write a paragraph of nothing to get past the gate.

---

## 2. Requirements

The panel offers **requirements**. Click it, and the engine runs the
phase and waits for it: a fresh session whose whole seed is `intake.md`
and the material the ask brought with it.

Because `intake.md` only says where the ask lives, this phase goes and
reads it — the files copied into the spec folder, or the work item and
its comment thread through your own Azure DevOps or GitHub MCP server —
and the repository around it, before it drafts a line.

The moment `requirements.md` lands, the panel shows it and offers the next
phase. Read it. If it is wrong, **Revise** re-runs this same phase over
the document it already wrote, and what you type goes to it as the note.

---

## 3. Design — and notice there is no Approve button

The panel offers **design**. Click it.

**Starting the next phase is the approval.** There is no separate approve
step anywhere in the process, because a second thing to click that changes
nothing is a button people learn to press without reading — and a run
recording "approved" against an unread document is worse than recording
nothing.

So what you are actually deciding, when you click design, is
"`requirements.md` is good enough to build on". That gate lives on the
phase that *depends* on the document rather than on the phase that wrote
it, because depending on it is when the judgement is real.

Two things about the session that runs:

- **It is a fresh session, seeded by files.** What it gets is what the
  earlier stages of *this* spec type wrote — `intake.md` and
  `requirements.md` — plus any material the ask itself brought in. Not
  the session that wrote them, and never a document from a stage this
  pipeline has not reached: handing `tasks.md` back to `design` would
  invert the pipeline.
- **What crosses a phase boundary is a file on disk, never a
  conversation.** That is what makes this portable: a teammate pulls the
  folder and carries on from exactly where you left off, because there was
  never any context living in your chat history for them to be missing.

Read `design.md` when it lands. If it is wrong, this is the cheap moment.

### `spec.json` — giving one spec its own reference files

Some specs need something the documents have no room for: the API
contract this feature extends, a house rule that only applies here, a
paragraph pasted from a conversation that happened somewhere else.

Put a `spec.json` in the spec folder, beside `intake.md`:

```json
{
  "spec": 1,
  "attachments": [
    { "file": "docs/api/contract.md", "desc": "the API contract this feature extends" },
    { "file": "notes.md", "desc": "what the customer actually asked for" }
  ]
}
```

**Every phase of that spec gets these, and every revise too.** No other
spec does — that is the point of the file. Reference the whole style
should have goes in the style's own `attachments:` instead.

- **`file`** — a bare name is a file in the spec folder; anything else is
  relative to your workspace root. Nothing is copied, so a repository
  document stays the one copy everybody edits.
- **`desc`** — what the file is, in your words. It is what the phase is
  told about it, and nothing else could say it.

A file that is not there yet is skipped and written to the log, so a
half-written `spec.json` never blocks a phase. A key that is not `file`
or `desc` is refused outright, because a typo that quietly does nothing
is how you find out months later that the model never saw your contract.

Only files you declare here reach a phase. A stray file dropped in the
spec folder is not sent anywhere.

---

## 4. The plan

Click **tasks**. It writes `tasks.md`: a numbered plan (`1`, `1.1`) with a
dependency graph between tasks expressed as ordered **waves**. Tasks in
one wave may run at the same time; a wave begins only when every task in
every earlier wave is finished and ticked.

The rule that decides where the boundaries fall is worth knowing before
you read it, because it is not the obvious one:

**Every task ends green.** The repository builds and its tests pass at the
end of each task, not just at the end of the plan. So an interface and its
implementation are *one* task. A changed signature and every caller it
breaks: one task. A behaviour and the test that proves it: one task.
Splitting any of them would leave the tree red in between, and a plan you
cannot stop half-way through is a script rather than a plan.

### The documents point at each other

Every task that implements behaviour ends with a **citation** — the
criteria it answers for:

```markdown
    - [Requirements : 1.2, 3.1](requirements.md)
```

In `tasks.md` it is an ordinary markdown link, so it works wherever the
spec is read: click it on GitHub or in a pull request and you get the
file. In `requirements.md` and `design.md` the same citation is written
the way the real Kiro tool writes it — `_Requirements: 1.2_`, and
`**Validates: Requirements 1.2, 3.1**` under a correctness property — so
those two documents stay readable by Kiro's own validator. See
[Kiro compatibility](https://local-workflows.github.io/getting-started/sdd/kiro.md#kiro-compatibility).

**The panel treats all three the same.** Rest the pointer on any of them
and a card shows the criterion itself, so you can check what `1.2` says
without leaving the plan. Click it and the panel opens that document and
marks every criterion the citation names.

And a number the target document does not have is **struck through**.
That is the one thing worth knowing: a revise that renumbers the
requirements leaves the plan citing criteria that have moved, and this is
what makes that visible instead of silent.

Citations are not only between phases. A requirement can cite the PRD it
came from, a design can cite an ADR — any `.md` file in the repository,
with the path written relative to the document you are in. The ids are
whatever that document calls its own: `1.2` here, `G11` in a gap
analysis, `FR-1` in a Spec Kit spec.

---

## 5. Implement

This phase is different in a way that matters: **the engine does not wait
here, and it never finishes.** There are no artifacts to satisfy it.

The panel's implement lens hands tasks to an agent session and returns
straight away. **Start** on a row hands over one task; **Start all** hands
over everything still unticked in a single chat, wave by wave. The engine
writes documents; it does not write your code. Git is the record, and a
ticked checkbox in `tasks.md` is the definition of done.

There is no gate on this phase either — the plan was approved by starting
its first task. Whether anybody watches the session is your choice.

---

## 6. The one thing that should stop you

### A phase can ask you, mid-draft

Something a phase truly cannot go on without is **asked**, once, rather
than guessed at. The question appears in that phase's **AI Session** tab,
the tab is marked while it waits, and your answer goes into the document
under `## Assumptions` as a decision you made — because the point of
writing specs this way is recorded deviation, and a decision that lives
only in a chat window is invisible to whoever reads the spec next.

A phase you start from the panel can ask, because the panel says somebody
is watching. An `ai@1` task in a workflow file is told nobody is there
unless it says
[`interactive: true`](https://local-workflows.github.io/getting-started/plugins.md#when-the-agent-asks-you-something).
Either way an unanswered question costs an assumption, not the run: the
phase takes a reasonable one, writes it down, and carries on.

### What is left over

A phase that could not settle something writes it under `## Open
Questions`, first in the document, before anything else.

**Nothing stops you starting the next phase anyway.** No button is
disabled and no check runs. The document is on screen, the questions are
at the top of it, and you are the one deciding whether to build on it.

Answer them in the document and run the phase again, or decide they do
not matter and carry on. Either way the section is in git, so whoever
reads the spec next sees what was open and what was done about it.

---

## What you now have

Look at `git status`. Four Markdown files under
`.local-workflows/specs/<your-spec>/` — `intake.md`, plus the three the
phases drafted — and the process state alongside them. All of it
reviewable in a pull request. A fifth if you wrote a `spec.json`, which
travels with them.

That is the part that compounds. The judgement about what was required,
what the design should be, and how the work was cut up stops living in one
person's chat history and becomes a file the team inherits.

`Samples/HelloWorld/.local-workflows/specs/` has spec folders with their
requirements already written — read them without running anything, or
point the extension at one and it picks up at design.

---

## Existing specs are read, not just written

Point the extension at a repository full of specs somebody else made and
it works out which style wrote each folder from the documents in it, then
picks up at the right phase. There is no import step.

This falls out of one rule: **a stage whose artifacts already exist is
satisfied.** A spec folder that already contains `requirements.md` starts
at design without visiting requirements — whether that file was drafted
five minutes ago or arrived in a colleague's commit last month.

---

## The panel, tab by tab

One spec at a time: the phases run down a rail on the left, and the tabs
beside it change with the phase you have selected.

| Tab | What it is | When it is there |
|---|---|---|
| **Doc** | the phase's document, rendered — read it, edit it, leave notes on it | a phase whose document exists |
| **Tasks** | the plan as a dashboard, one row per task, **Start** on any of them — see [Implement](#5-implement) | the implement phase |
| **Logs** | what the phase printed while it ran | always |
| **AI Session** | the same lines read as the conversation they were, and where a question from the agent appears | always |
| **Prompt** | the fixed instruction this phase runs on. Read-only here: the file belongs to the style and is shared by every spec using it | a phase that runs a prompt |
| **Revise** | run this phase again over the document it already wrote | a document phase that can be re-run |
| **Problems** | about the whole spec rather than the phase in front of you | while a spec is being validated |

A phase whose document is not written yet lands you on **Logs**, which is
where its drafting will appear.

### Reading and editing a document

The Doc tab's bar is what you reach for while reading: text size, an
outline, full screen (Escape leaves), and a reload for when something
other than the panel wrote the file.

**Edit** opens the whole document as text — `Ctrl+S` saves,
`Ctrl+Enter` saves and closes, `Esc` leaves and asks first if there is
unsaved text. A single block can also be edited in place without opening
the whole file. Either way it is the same draft and the same Save, and a
revise reads the document **from disk**, so save before you run one.

A block the last run of this phase changed is marked. The comparison is
against a copy taken before that run, kept in your profile under
`~/.local-workflows/history/<workspace>/<spec>/` — never in the spec
folder, so no snapshot of a draft ever turns up in your diff.

### Review notes

Leave a note on any block. The notes rail opens from the same bar, and
the Doc tab carries the number still open.

Notes are stored in **`review.json` in the spec folder, and that file is
meant to be committed.** What a room full of people said about a document
has to reach the next person who opens the spec — on another machine, or
reading the pull request. The document each note points at is stored
relative to the workspace root so it survives that trip.

A note is anchored to **the text it was written against**, not to a line
number. A revise moves every line in the document, which is exactly when
the notes matter: one whose text has moved re-anchors silently, and one
whose text is gone is reported as orphaned and shown apart from the
document — not deleted, and not guessed at.

**Send N notes to Revise** collects every open note into the Revise box
as one instruction, and you read it back before it goes. Resolving a note
keeps it, marked, rather than deleting it: the document's review history
is part of the spec.

---

## The list in the sidebar

Specs are listed A-Z by folder name. The **Specs** title bar carries one
icon — **Sort Specs by Recently Changed** / **Sort Specs A-Z**, also in
the Command Palette. Recently changed reads the newest document in each
spec folder, not the folder itself, so a spec whose `design.md` was
rewritten this morning goes to the top even though nothing was added to
it. The choice is saved per workspace and written nowhere in your
repository.

---

## Choosing a style

A **style** is the process: which phases exist, what each writes, where
the gates are, and the prompts behind them.

One ships, and two more are worked examples on this site — real,
complete styles, genuinely different shapes rather than the same one
renamed, that you copy in rather than switch on:

| | Phases | Shape | |
|---|---|---|---|
| **Custom** | `intake` → `requirements` → `design` → `tasks` → `implement` | three documents, a gate between each; Bug fix skips design — see [Kiro](https://local-workflows.github.io/getting-started/sdd/kiro.md), the same process phase by phase | built in, the default |
| [**Kiro**](https://local-workflows.github.io/getting-started/sdd/kiro.md) | `intake` → `requirements` → `design` → `tasks` → `implement` | the same shape as Custom, under an id that matches the real Kiro tool's own document validator | worked example, copy it in |
| [**Spec Kit**](https://local-workflows.github.io/getting-started/sdd/spec-kit.md) | `intake` → `specify` → `plan` → `tasks` → `implement` | one phase writes several documents; a flat `T001` task list | worked example, copy it in |

The built-in `custom` style runs with no configuration at all, and its
shape is the smaller idea to learn first. Pick Spec Kit instead if your
team already writes in that shape, or Kiro specifically if you need the
literal id `kiro` — existing specs already tagged `style: kiro`, say, or
a document validator that expects it by name.

You are not limited to those three.
[Writing your own style](https://local-workflows.github.io/getting-started/sdd/custom-style.md)
is a YAML file and a folder of instructions; no code changes, and your style
appears in the ＋ New Spec menu beside the built-in. The exact prompts
every one of the three runs are published verbatim —
[Custom's](https://local-workflows.github.io/getting-started/sdd/custom-prompts.md),
[Kiro's](https://local-workflows.github.io/getting-started/sdd/kiro-prompts.md) and
[Spec Kit's](https://local-workflows.github.io/getting-started/sdd/spec-kit-prompts.md).

---

## Configuration

Everything is optional. With no configuration at all, `custom` runs on
whichever model Copilot would have chosen. Change that in
`.local-workflows/settings.json`:

```json
{
  "sdd": {
    "styles": ["custom"],
    "source": "ado"
  },
  "ai": {
    "ai@1": { "provider": "ghcp", "model": "auto" }
  }
}
```

That is every phase. A setting for **one** phase — design on a bigger
model, say — lives on the stage in the style's `style.yml`, not in
settings.json, because only a style knows which of its phases is the
hard one:

```yaml
stages:
  - id: design
    ai:
      model: claude-opus-5
      reasoningEffort: high
```

There is no `sdd.stages` in settings.json; a file that has one is
refused, naming the stage's `ai:` as the place. See
[custom styles](https://local-workflows.github.io/getting-started/sdd/custom-style.md#a-stage-entry).

Every key, its default, and every error the file can raise:
[`settings.json`](https://local-workflows.github.io/getting-started/settings.md#sdd).

---

## The engine knows nothing about SDD

The runner walks a graph of tasks: resolve the args, run the task,
record what happened, stop at the gates. SDD is a layer *above* that — a
folder of prompts, a config file, and a purpose-built panel — expressed
entirely in terms the engine already had.

That is not an implementation detail you can ignore. It is the reason a
style is a YAML file you can replace, rather than a feature you have to
wait for someone to build. Every phase of every process is a stage with
a prompt and a gate, and nothing in the engine knows what "requirements"
means.
