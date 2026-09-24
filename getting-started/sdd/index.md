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
with no `implement` stage at all. A style can also mark its plan
`actionable` and leave `implement` unlisted — same work, no separate
phase of its own. See [Custom styles](https://local-workflows.github.io/getting-started/sdd/custom-style.md#2-the-input-gate-is-not-yours-to-place-the-output-gate-is-yours-to-choose).

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
phase. Read it. If it is wrong, say so in the phase's chat and send it:
the same phase runs again over the document it already wrote, with what
you typed as the note. There is no separate Revise button — see
[Revising a document](#revising-a-document).

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

Click **tasks**. It writes `tasks.md`: a numbered plan (`1`, `1.1`, as deep as the work needs) with a
dependency graph between tasks expressed as ordered **waves**. Tasks in
one wave may run at the same time; a wave begins only when every task in
every earlier wave is finished and ticked.

Every sub-task carries a `Files:` line — the paths it creates or edits.
The waves are built from those lines: two tasks share a wave only when
their `Files:` lines have no path in common. The panel reads the same
lines before it opens a wave's chat and refuses a wave whose tasks share
a path — nothing starts, and the message names the tasks and the file.
When a wave's chat stops, the panel logs `git status --short` beside the
agent's own `## Changed` list, so you see what the tree holds from both
sides.

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
criteria it answers for — written the way the real Kiro tool writes it,
just under the task's `Files:` line:

```markdown
    - Files: `src/thing/index.ts`, `src/thing/__tests__/index.test.ts`
    - _Requirements: 1.2, 3.1_
```

`design.md` cites the same way under a correctness property, in bold:
`**Validates: Requirements 1.2, 3.1**`. These two lines are the only ones
spelled like this, so both documents stay readable by Kiro's own
validator — see
[Kiro compatibility](https://local-workflows.github.io/getting-started/sdd/kiro.md#kiro-compatibility).
Everywhere else — an assumption, a design decision, a question — a
citation is an ordinary markdown link,
`[Requirements : 1.2, 3.1](requirements.md)`, so it works wherever the
spec is read: click it on GitHub or in a pull request and you get the
file.

**The panel treats all three the same** — in a rendered document, and
in the detail lines under a task on the **Tasks** tab. Rest the pointer
on any of them and a card shows the criterion itself, so you can check
what `1.2` says without leaving the plan. Click it and the panel opens
that document, scrolls to the cited block, pins it, and marks every
criterion the citation names; the outline moves to it too.

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
here, and it never finishes.** There are no artifacts to satisfy it. (A
style that marks its plan `actionable` instead of listing `implement`
gets no step of its own for it — the work starts from the Tasks page
and its chats show on the Tasks tabs. Everything below applies either
way.)

The panel hands tasks to agent sessions, **one chat per wave** of the
plan's dependency graph. ▶ on a row hands over that one task. **Next:
Implementation** hands over every wave that still has an unticked task.

**Which chats are open at once is decided by repositories.** Every wave
is a lane. The repository a task touches is the first segment of each
path on its `Files:` line — `orders-api/src/a.ts` is `orders-api`. A
lane starts the moment no running lane touches one of its repositories;
so waves in different repositories run side by side, each in its own
chat, and waves in one repository take turns in the plan's order,
because two agents in one working tree build on top of each other. A
task with no `Files:` line said nothing about where it goes, so its lane
waits for every lane before it and holds every lane after it — the plain
one-at-a-time order a plan without `Files:` lines always had. In a
single repository that is what you get: a wave's chat, then the next.

When a chat goes idle the panel reads `tasks.md`. Every task of the wave
ticked means the lane is done and its repositories are free, and the
lanes waiting on them start. A wave that ends with a task unticked ends
its lane there — the panel says which task — and the lanes waiting on
that repository do not start; lanes in other repositories carry on.
Press ▶ or Next again once it is sorted and work resumes from the
unticked box, because the checkboxes are the only position there is.

The Tasks tab shows a strip of the waves — ticked count, which one an
agent is in, and a **session** link back to the chat that worked it. The
engine writes documents; it does not write your code. Git is the record,
and a ticked checkbox in `tasks.md` is the definition of done.

The agent ticks a box by calling the **`task_done`** tool with the
task's id, not by editing `tasks.md`. The engine flips that one
character and nothing else - the plan never goes through the model to
change a box, which is what used to cost a whole document of tokens per
task. The judgement stays the agent's: a task it could not finish is
left alone, and it says why.

**You can also work the plan from its own page.** On the Tasks phase's
Doc tab every checkbox row carries a live box and, on each unit of work,
the same ▶ — start a task from the line it is on without changing phase.
Clicking a box ticks or unticks it in `tasks.md`; that is the one write
the panel ever makes into a plan on its own, and it flips exactly that
mark and nothing else. If the document holds unsaved edits, the tick
joins them and Save writes both. A row an agent is working shows `…`
until its box ticks, a row waiting for a repository another chat holds
shows `⏳`, and a row that has a chat shows a **chat** link to reopen
it. A ▶ pressed while other chats are open adds a lane; a ▶ on a task a
chat is already working asks first.

With several chats open, **each one is its own row in the sessions
pane**, named by its wave or task. The **Logs** tab shows one lane at a
time from a picker at its top right: one entry per lane (`wave:2`,
`1.4`), plus **common** — the panel's own account of what started and
what stopped short.

**You can type into a chat while its agent is working.** An agent that
has misread the plan is put right in the thread where you saw it happen,
rather than by stopping the wave and starting it again. A chat that has
gone idle shows no box, because nobody is listening — ▶ on the task is
the way back in. **+** on a chat stops it and hands the same wave to a
fresh one.

While any lane is open the plan cannot be revised from the panel: a
person rewriting `tasks.md` while an agent ticks it is two writers on the
one file everything reads progress from. **Stop** ends every lane — no
further wave starts; the chats already open stay yours to close.

There is no gate on this phase either — the plan was approved by starting
its first task. Whether anybody watches the session is your choice.

---

## 6. The one thing that should stop you

### A phase can ask you, mid-draft

When a phase needs a decision only a person can make — what you want,
not what the code already says — the built-in prompts tell it to
**ask**, rather than guess. The question appears in that phase's chat,
with **Keep open** as the default choice and room to type your own
answer. The point of writing specs this way is recorded deviation: a
decision that lives only in a chat window is invisible to whoever reads
the spec next. So each outcome is written into the document:

- **You answer.** The answer goes under the question as an `**A:**`
  line, with a `**By:**` line naming who decided and when. On the next
  pass the pair moves to `## Answered Questions`. Answers are also kept
  in `decisions.md` in the spec folder, so a document written again does
  not ask the same question twice.
- **You keep it open, or nobody answers.** The question goes under
  `## Open Questions` — see below.
- **The phase decides something on its own.** That is a guess, not a
  decision, and it goes under `## Assumptions`, with what changes if the
  guess is wrong.

A phase you start from the panel can ask, because the panel says somebody
is watching. An `ai@1` task in a workflow file is told nobody is there
unless it says
[`interactive: true`](https://local-workflows.github.io/getting-started/plugins.md#when-the-agent-asks-you-something).

### What is left over

A phase that could not settle something writes it under `## Open
Questions`, near the end of the document, just above
`## Answered Questions`.

```markdown
## Open Questions

- **Q1** Should a signed-out user see the setting at all?
  **A:** No - hide it until they sign in.
- **Q2** Does the old flag still need to work?
```

**A question with no answer stops the next phase.** Here `Q2` has no
`**A:**` line, so the next phase's button refuses to start, and so do
**Start** on the plan and the per-task controls. The message names the
document and the question ids. Every drafting document is checked, not
only the one in front of you; `intake.md` is not, because no model
writes it.

To go on, type an `**A:**` line under each question, indented under it,
and save. The block lifts the moment the answer is saved; you do not
have to run the phase again first. If the answer changes the document,
send a message in the phase's chat so it writes it in.

Either way the section is in git, so whoever reads the spec next sees
what was open and what was decided about it.

A style can switch this off with `blockOnOpenQuestions: false` in its
`style.yml`. The questions are still written and still committed;
nothing stops on them. See
[custom styles](https://local-workflows.github.io/getting-started/sdd/custom-style.md#top-level).

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

One spec at a time. The panel has three parts:

1. **The phases, across the top.** A row of steps beside the spec's
   name — `requirements › design › tasks › implement` — each with the
   disc that says done, drafting, current or not started. Click one to
   read it. On a narrow panel the steps wrap onto a second line rather
   than dropping any names.
2. **The tabs, below them.** They change with the step you picked.
3. **The sessions pane, on the right.** Every conversation the spec has
   had — see [The sessions pane](#the-sessions-pane). Drag the divider
   between the two to give either side more room; the width is kept per
   workspace.

| Tab | What it is | When it is there |
|---|---|---|
| **Doc** | the phase's document, rendered — read it, edit it, leave notes on it, see what the last run changed | a phase whose document exists |
| **Tasks** | the plan as a dashboard, one row per task, **Start** on any of them — see [Implement](#5-implement) | the implement phase |
| **Logs** | what the phase printed while it ran | always |
| **Prompt** | the fixed instruction this phase runs on. Read-only here: the file belongs to the style and is shared by every spec using it | a phase that runs a prompt |
| **Problems** | about the whole spec rather than the phase in front of you | while a spec is being validated |
| **AI Session** | the phase's conversation as a tab under it, in place of the pane | only with the sessions pane switched off |

A phase whose document is not written yet lands you on **Logs**, which is
where its drafting will appear.

**There is no Revise tab and no Revise button.** Revising is typing into
the phase's chat — see [Revising a document](#revising-a-document).

A message in the **Logs** tab longer than three lines is folded to its
first three, with an **N more lines** button that opens it and folds it
back. A long build log is one line of the tab rather than the whole of
it. `features.liveToolOutput` puts a running command's output under its
row as it arrives instead of when the call ends — see
[`features`](https://local-workflows.github.io/getting-started/settings.md#features--the-switches).

### The sessions pane

Every conversation the spec has had is in one pane on the right — every
phase, and every run of every phase. Its top row is the word
**Sessions**, how many there are, a dot for how the one on screen is
doing, a dropdown of all of them, and **+**.

The dropdown groups them by phase, in pipeline order, newest first
inside a phase. Each one reads `#<run> · <what it was about>`:

- An implementation chat is named by its work — `Wave 2`, `Task 1.4`.
- A run you started by typing a note is named by the note's first line.
- Anything else by when it started.

A session still working says `· working`, one with a question waiting
says `· waiting for you`, one that failed says `· failed`, and **every
run but the newest says `(Read Only)`** — so you can see which sessions
you can still talk to before you pick one, not after.

Picking a session **moves the steps at the top to its phase** as well, so
the document on the left and the conversation on the right are always
about the same phase. The pane shows the selected phase's sessions only.

**+** starts a new conversation for the phase on screen. On a document
phase the next message you send begins a fresh session instead of
carrying this one on; on an implementation chat it stops that chat and
hands the same wave to a new one. Either way what was said stays in the
dropdown as an earlier run. When it cannot be used it is **disabled with
the reason on it** rather than missing — the agent is still working,
this is an earlier run, nothing has been said here yet.

This is on a switch. `features.sessionsPane` off puts the conversation
back in an **AI Session** tab under each phase, one phase at a time — see
[`features`](https://local-workflows.github.io/getting-started/settings.md#features--the-switches).

### Revising a document

There is no Revise button. **The compose box at the foot of the session
is the revise.** Type what you want changed and send it:

- The phase's session is still open → your text is the next turn of it.
- It has finished → the same phase runs again over the document, with
  your text as the note.

A revise reads the document **from disk**, so save your edits first.

The box carries a **presets menu** of starting sentences — the style's
own when it declares any, two built-in ones when it does not. With notes
open it also offers **Revise (With N notes)**, which fills the box with
every open note as one instruction so you read it back before it goes.

Beside the box is the **runtime and model picker** for that phase: which
agent runs it and which model, with Copilot's premium-request multiplier
after the name (`4.1 · free`, `Claude Sonnet 4.5 · 1x`) and a
**Custom…** entry for a model id the list does not carry. It is not
drawn on an implementation chat: a message there goes into a
conversation already running on the runtime that started it.

Next to it is the **permissions** dropdown:

| Choice | What happens when the agent asks to use a tool |
|---|---|
| **Allow all** (default) | Allowed once, without asking, as long as it stays inside the allowed folders. |
| **Manual approvals** | Each request shows up as a card in the thread, and the agent waits for your click: allow once, for this session, for this workspace, always, or deny. See [approving each request yourself](https://local-workflows.github.io/getting-started/plugins.md#approving-each-request-yourself). |

1. One setting for the whole workspace, like the runtime pick. It is
   kept by the editor, not in `settings.json`.
2. It applies from the next turn, and that includes a chat that is
   already open.
3. It is drawn on implementation chats too.
4. **Manual only works on Copilot for now.** On another runtime it shows
   as *Manual approvals (Copilot only)* and cannot be picked.

### What a session has cost

A small button on the right of the compose box reads
`Context 11% of 967k`, with a bar that goes louder past 75% and again
past 90%. A runtime that has not reported a window yet says `Usage`
instead.

Click it for the card behind it:

| Section | What it says |
|---|---|
| **Cost** / **Usage** | the last turn, this session's total, every run of this phase added up, and the whole spec |
| **By model** | what each model charged, with the tokens it read and wrote — a session that switched models part way has a row each |
| **Context window** | used against the size, then the categories the runtime named, then what is free |

**Every figure is one the runtime reported.** Claude reports dollars and
asks its CLI for a context report, Copilot reports credits and premium
requests plus its window buckets, an ACP agent reports its own currency
and a used/size pair. A section nothing was reported for is left out
rather than shown as zero, because a zero reads as "this was free".

Re-running a phase or starting a new session takes the old lines off the
screen but not their bill — **Total in this phase** covers every run of
it.

Money is on a switch, and the tokens and the window are not.
`features.sessionCost` off hides the dollars; Copilot's credits and
premium requests show either way, because an allowance against a seat is
not a sum anybody is charged. The figures are recorded either way too,
so turning the flag on shows the whole history back — see
[`features`](https://local-workflows.github.io/getting-started/settings.md#features--the-switches).

### Reading and editing a document

The Doc tab's bar is what you reach for while reading: text size, an
outline, what changed, full screen (Escape leaves), and a reload for
when something other than the panel wrote the file.

**Edit** opens the whole document as text — `Ctrl+S` saves,
`Ctrl+Enter` saves and closes, `Esc` leaves and asks first if there is
unsaved text. A single block can also be edited in place without opening
the whole file. Either way it is the same draft and the same Save, and a
revise reads the document **from disk**, so save before you run one.

### What changed

After a revise, you do not have to read the document again to find what
moved. **What changed** in the Doc tab's bar shows the document as a
before and after — what went away in red, what arrived in green, and
everything that stayed as it was. Inside a paragraph that was reworded,
only the words that actually differ are picked out, so a four-word edit
in a long paragraph reads as four words rather than as two blocks of
prose to compare by eye.

The button appears only when there is something to show, and says how
many blocks moved. Press it again for the document.

The comparison is against a copy of the document taken **just before
the phase last ran**, so it answers "what did that run do", not "what
has happened since my last commit". Git is not involved, and a folder
with no repository works the same.

Those copies are kept in your profile under
`~/.local-workflows/history/<workspace>/<spec>/` — never in the spec
folder, so no snapshot of a draft ever turns up in your diff. Only the
most recent copy of each document is kept: taking a new one drops the
one before it. So you can always see what the last run changed, and
never what the run before that changed.

This is on a switch. `features.docDiff` in a
`settings.json` turns it off — see
[`features`](https://local-workflows.github.io/getting-started/settings.md#features--the-switches).
Off, the button is not offered and nothing else marks what changed: the
margin bar this replaced was taken out with it.

**Local Workflows: Clear Spec History** in the Command Palette throws
away every stored copy for the workspace. It asks first. Use it for
specs you have deleted, whose copies nothing will visit again — until
each phase runs once more, its document will have nothing to compare
against.

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

**Revise (With N notes)** in the compose box's presets menu collects
every open note into one instruction, and you read it back before it
goes. Resolving a note keeps it, marked, rather than deleting it: the
document's review history is part of the spec.

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
