# AI quality is decided by the context you feed it

Local Workflows is a VS Code extension for **spec-driven
development**{: .text-purple-000 }. AI writes the requirements, the
design and the plan, one document at a time. Each document is written
in a fresh session that sees only the documents before it. You read
each one before the next phase builds on it. Then AI works through the
plan, task by task, in your repository.

The specs, the prompts and the process itself are all files in your
repository. The same engine also runs your dev commands and whole
**pipelines**{: .text-blue-100 } in the editor, without pushing to CI.

[Write your first spec](https://local-workflows.github.io/getting-started/sdd/index.md){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Compared with alternatives](https://local-workflows.github.io/why.md){: .btn .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/local-workflows/local-workflows.github.io){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## The problem

You know this session. It started as "add the endpoint", then a test
failed, then you pasted a stack trace, then you asked about a rename
while you were at it. Twenty minutes in, the answers are getting
worse — and it is not the model. Every failed tool call, every dead
end, every side discussion is still sitting in the context, and the
model is reasoning over all of it.

The usual fix is a spec: have the AI write down the requirements and
the design before it writes code. That helps, until the spec arrives as
600 lines in one go. Be honest: did you read all of it, or scroll to the
bottom and approve? A spec nobody read is not a check. It only makes the
mistakes look official.

Two problems, one cause: too much at once. One chat doing every job, one
document holding every decision.

---

## The fix

Cut the work into **phases**{: .text-green-100 }. Each phase writes one
document, in a fresh AI session that is given only the documents before
it — never the chat that wrote them. The failed attempts and the side
discussions never travel forward.

Two things fall out of that:

- **Consistent quality.** Same phase, same clean context, same prompt —
  for every developer on the team, every time, instead of depending on
  how each person's chat went that day.
- **A check a person actually does.** Each document is small enough to
  read, and the next phase does not start until a person starts it. AI
  produces **documents**{: .text-green-100 };
  **a person**{: .text-green-100 } decides what gets built on them.

---

## A spec, start to finish

A spec is a folder of Markdown committed next to your code:

```
.local-workflows/specs/dark-mode/
├── intake.md          # the ask, and where it came from — written without a model
├── requirements.md    # what to build — drafted from the ask
├── design.md          # how — drafted from the documents before it, nothing else
└── tasks.md           # the plan, task by task, with a checkbox on each
```

1. **New Spec.** Answer a few questions: what kind of work, and where
   the ask lives — a work item, a one-line description, or files you
   pick. This writes `intake.md`. No model runs yet.
2. **Requirements.** A fresh session reads the ask itself — the work
   item and its comments, the files you picked — and your code, then
   writes `requirements.md`. If it is wrong, type what is wrong into
   the phase's chat: the same phase runs again with that as your note.
3. **Design.** Starting the design phase *is* the approval of the
   requirements. There is no separate Approve button, because a button
   that changes nothing is a button people press without reading. The
   design session starts clean: it reads `intake.md` and
   `requirements.md`, never the chat that wrote them.
4. **The plan.** `tasks.md` is a numbered list of tasks, grouped into
   waves. Every task names the files it will touch, and every task ends
   with the build and the tests passing — never a broken state between
   two tasks.
5. **Implement.** The panel hands the plan to your AI agent, one chat
   per wave. Waves in different repositories run side by side; waves in
   the same repository take turns. The agent ticks a task's checkbox
   when the task is done. A ticked box in `tasks.md` is the definition
   of done, and git holds the code.

[Write your first spec](https://local-workflows.github.io/getting-started/sdd/index.md) — the
full walkthrough, phase by phase.

---

## What the spec panel does for you

- **Open questions stop the next phase.** A phase that cannot settle
  something writes it under `## Open Questions`. Until someone writes an
  answer under it, the next phase will not start. A style can turn this
  off.
- **Decisions are written down, not left in a chat.** When a phase needs
  a decision from you, it asks you while it drafts. Your answer is
  written into the document with your name and the time; a question you
  leave open goes under `## Open Questions`. What the AI decided on its
  own goes under `## Assumptions`, marked as a guess. The next person
  reads the decision instead of guessing there was one.
- **See what a revise changed.** **What changed** shows the document
  before and after the last run: removed text in red, new text in green,
  and inside a reworded paragraph only the words that changed.
- **Review notes that survive a revise.** Leave a note on any block.
  Notes are saved in the spec folder and meant to be committed, so the
  next person sees them too. One click puts every open note into the
  chat box as one instruction.
- **Documents link to each other.** A task says which requirements it
  covers. Hover the link to read the requirement; click it to jump
  there. A link to a requirement that no longer exists is struck
  through, so a renumbering cannot quietly break the plan.
- **Every conversation the spec had is in one pane.** Every phase, and
  every run of a phase, listed on the right and grouped by phase. Open
  an old one to read it; the newest one is the one you can still talk
  to. There is no revise button — you type in the chat.
- **What a session cost, and how full its context is.** A bar above the
  chat box reads `Context 11% of 967k`. Click it for the last turn, the
  session, the phase and the whole spec, with the split by model. The
  money is on a switch; the tokens are not.
- **Existing specs just work.** Point it at spec folders someone else
  wrote. It works out which style made each one and starts at the right
  phase. There is no import step.

---

## Your process, not ours

- **The process is a file.** Which phases exist, what each one writes,
  and where the gates are all come from a **style**: one YAML file and
  a folder of prompts. The built-in style works with no setup. Kiro's
  and Spec Kit's processes are published as
  [worked examples](https://local-workflows.github.io/getting-started/sdd/index.md#choosing-a-style)
  you copy in. Or [write your own](https://local-workflows.github.io/getting-started/sdd/custom-style.md),
  with no code change.
- **Every prompt is yours to read and change.** Every prompt the
  extension sends is [published word for word](https://local-workflows.github.io/getting-started/sdd/custom-prompts.md).
  To change one phase's prompt, drop one file into your repository and
  review it in a pull request like any other code. The whole team then
  runs the same prompt, instead of each person pasting their own into a
  chat.
- **Any AI you already use.** One setting picks it. GitHub Copilot (the
  default) and Claude run on their vendors' own SDKs. Kiro, Gemini CLI,
  Codex, Cursor, OpenCode and more come in over the
  [Agent Client Protocol](https://local-workflows.github.io/getting-started/acp.md).
- **Your editor.** VS Code, and unchanged in Code-OSS editors such as
  Kiro and VSCodium.

---

## Also: a pipeline runner in your editor

The same engine runs your everyday dev commands, with or without AI.

- Declare commands in `.local-workflows/tasks.yml` and whole pipelines
  in `.local-workflows/workflows/*.yml`, next to your code.
- Run them from the sidebar with one click — no commit, no push, no
  waiting on a CI queue — and watch each task's log and status live.
- AI can be one step in a pipeline, but it only produces text. What runs
  next is decided by the YAML file a teammate reviewed, and a manual
  gate can make a person read the AI's output before anything fires.
  For example, in "publish a release" the AI drafts the notes, a person
  reads them, and an ordinary script publishes. See
  [`ai@1`](https://local-workflows.github.io/getting-started/plugins.md#the-eight-that-ship).
- No server of ours, no sign-up, no telemetry of your runs. Your
  commands run on your machine. The one thing that leaves it is an AI
  step, which goes to the provider you named.

[Build your first `tasks.yml`](https://local-workflows.github.io/getting-started/tasks.md)
— about five minutes.

---

## Is this for you?

**Yes, if:**

- Your AI chats start sharp and end sloppy, and you suspect the chat,
  not the model.
- You have approved an AI-written spec you did not fully read.
- You want spec-driven development, but you want to own the prompts and
  the process.
- You want every decision the AI made written into a file your team
  reviews, not lost in one person's chat history.
- You re-run the same commands all day and want them as a pipeline with
  logs and status, without a push.

**No — close the tab if:**

- **You want AI to go from a one-line ask to merged code with nobody
  reading anything in between.** Every phase here waits for a person.
- **You need unattended or scheduled runs.** There is no server. Close
  the laptop and nothing runs.
- **You need hundreds of SaaS connectors.** There are first-party plugins
  and whatever JavaScript you write. That is the whole ecosystem, and it
  is not growing into a marketplace.
- **You want the model to decide what runs.** That is refused by design.
- **You want a no-code canvas.** It is YAML and Markdown, reviewed in
  pull requests.
- **You are not in VS Code or a Code-OSS editor.** The one item on this
  list that is a *not yet* rather than a decision.

---

## Where to go

| | |
|---|---|
| **Here for spec-driven development** | [Spec-driven development](https://local-workflows.github.io/getting-started/sdd/index.md) — your first spec, phases, prompts, and gates |
| **Deciding if it is worth it** | [What spec-driven development solves](https://local-workflows.github.io/sdd-solves.md) — seven problems teams hit, what it does about each, and what Kiro and Spec Kit do |
| **Wondering why not just use X** | [Compared with alternatives](https://local-workflows.github.io/why.md) — Kiro, Spec Kit, coding agents, task runners, CI, n8n |
| **Here for pipelines** | [Install](https://local-workflows.github.io/getting-started/install.md), then [Tasks](https://local-workflows.github.io/getting-started/tasks.md) and [Workflows](https://local-workflows.github.io/getting-started/workflows.md) — a five-minute walkthrough opens each |
| **Anything else — a feature, a key, a default** | [Getting started](https://local-workflows.github.io/getting-started/index.md) — one page per feature, walkthrough and full reference on the same page |
| **Something is broken** | [Troubleshooting](https://local-workflows.github.io/troubleshooting.md) |

---

## Everything is a file you own

There is no hidden state, and no service or account of ours — the only
sign-in anywhere is your AI provider's. A spec is a folder of Markdown
in your repository; a workflow is a YAML file beside it. Your teammates
review these files in pull requests — the extension runs them, people
review them. Uninstall the extension and everything you wrote is still
there, still readable, still in your history.

Ready? [Install it](https://local-workflows.github.io/getting-started/install.md), then
[write your first spec](https://local-workflows.github.io/getting-started/sdd/index.md).
