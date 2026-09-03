# Spec-driven development

A workflow whose tasks are AI-drafted documents and human decisions:
requirements, design, plan, then implementation. Each phase runs a fixed
prompt in a clean session, and the whole process state is committed to
git. This page walks your first spec end to end, then covers the rules
underneath; the sub-pages hold the two shipped styles, their exact
prompts, and [writing your own](https://local-workflows.github.io/getting-started/sdd/custom-style.md).

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
`.local-workflows/settings.json` at all you get the `kiro` style, specs
under `.local-workflows/specs`, checkpoints on, and whichever model
Copilot would have chosen. The walkthrough below assumes exactly that.

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

Every pipeline opens with `intake` and closes with `implement` — the ask
comes in, the work goes out. What a style chooses is the middle.

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

### `context.md` — anything the documents have no place for

Drop a file called `context.md` in the spec folder and **every phase gets
it, and every revise too**. Nothing to switch on and nothing to declare;
a spec without one loses nothing and is told nothing.

It is for what the pipeline's own documents have no room for — a link to
the ticket the ask really came from, a decision taken in a meeting, an
API's quirk somebody already knows about, a paragraph pasted from a
conversation that happened somewhere else. Write it by hand, or tell a
phase to leave what it found there. Either way the next phase reads it,
and so does the one after that.

It is attached, not listed among the documents: reference to read, never
a document a phase rewrites. If your style happens to name a phase's
output `context.md`, that wins — the file is then that phase's document
and flows through the pipeline like any other.

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

It is an ordinary markdown link, so it works wherever the spec is read:
click it on GitHub or in a pull request and you get the file.

In the panel it does more. **Rest the pointer on it for two seconds** and
a card shows the criterion itself, so you can check what `1.2` says
without leaving the plan. **Click it** and the panel opens that document
and marks every criterion the citation names.

And a number the target document does not have is **struck through**.
That is the one thing worth knowing: a revise that renumbers the
requirements leaves the plan citing criteria that have moved, and this is
what makes that visible instead of silent.

Citations are not only between phases. A requirement can cite the PRD it
came from, a design can cite an ADR — any `.md` file in the repository,
with the path written relative to the document you are in. The ids are
whatever that document calls its own: `1.2` here, `G11` in a gap
analysis, `FR-1` in a Spec Kit spec.

You will also see **checkpoint** tasks — a top-level task that runs the
full test suite and confirms it passes. A checkpoint *verifies*; it does
not ask. It never waits for a human, because whoever started the plan
already asked for it to be carried out. Turn them off with
`"sdd": { "checkpoints": "none" }` in
[`settings.json`](https://local-workflows.github.io/getting-started/settings.md#sdd) if you
must.

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
reviewable in a pull request. A fifth if you wrote a `context.md`, which
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

## Choosing a style

A **style** is the process: which phases exist, what each writes, where
the gates are, and the prompts behind them.

Two ship, and they are genuinely different shapes rather than the same
one renamed:

| | Phases | Shape |
|---|---|---|
| [**Kiro**](https://local-workflows.github.io/getting-started/sdd/kiro.md) | `intake` → `requirements` → `design` → `tasks` → `implement` | three documents, a gate between each; Bug fix skips design |
| [**Spec Kit**](https://local-workflows.github.io/getting-started/sdd/spec-kit.md) | `intake` → `specify` → `plan` → `tasks` → `implement` | one phase writes several documents; a flat `T001` task list |

Pick the one your team already writes. If neither, start with Kiro —
three documents with a gate between each is the smaller idea, and
switching later costs one line of config.

You are not limited to those two.
[Writing your own style](https://local-workflows.github.io/getting-started/sdd/custom-style.md)
is a YAML file and a folder of prompts; no code changes, and your style
appears in the ＋ New Spec menu beside the built-ins. The exact prompts
the shipped styles run are published verbatim —
[Kiro's](https://local-workflows.github.io/getting-started/sdd/kiro-prompts.md) and
[Spec Kit's](https://local-workflows.github.io/getting-started/sdd/spec-kit-prompts.md).

---

## Configuration

Everything is optional. With no configuration at all, `kiro` runs on
whichever model Copilot would have chosen. Change that in
`.local-workflows/settings.json`:

```json
{
  "sdd": {
    "style": "kiro",
    "source": "ado",
    "checkpoints": "required",
    "stages": {
      "design": { "model": "claude-opus-5", "reasoningEffort": "high" }
    }
  },
  "ai": {
    "ai@1": { "provider": "ghcp", "model": "auto" }
  }
}
```

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
