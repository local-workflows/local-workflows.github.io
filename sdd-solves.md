# What spec-driven development solves

AI writes the spec. People check it. Then AI builds it.
Here is what goes wrong, and who handles it best.

Kiro and Spec Kit facts are from their own docs, checked on
**2026-09-23**, except where a cell says *our use*: that is what we saw
running Kiro ourselves. [Sources](#sources) at the bottom.

---

## At a glance

| # | Problem | Local Workflows | Kiro | Spec Kit | Winner |
|---|---|---|---|---|---|
| 1 | [Long chats get worse](#1-long-chats-get-worse) | New chat per phase; one per wave | One session for all phases; own context per task | Your open chat for everything | **Local Workflows** for phases, **Kiro** for tasks |
| 2 | [Specs approved unread](#2-specs-approved-unread) | Stops after each phase | Stops after each phase | Stops only in its workflow runner | **Local Workflows, Kiro** |
| 3 | [AI decides silently](#3-ai-decides-silently) | Open question blocks the next phase | No block found | Told to stop; not checked | **Local Workflows** |
| 4 | [Can't see what a revise changed](#4-cant-see-what-a-revise-changed) | Red/green diff, review notes | Updates later docs for you | Report only | **Local Workflows** to review, **Kiro** to update |
| 5 | [Everyone runs a different prompt](#5-everyone-runs-a-different-prompt) | Phases and prompts are files | Steering files only | Templates can be overridden | **Local Workflows, Spec Kit** |
| 6 | [Docs fall out of step](#6-docs-fall-out-of-step) | Broken citations struck through | Links, no check found | AI-made report | **Local Workflows** |
| 7 | [Parallel agents collide](#7-parallel-agents-collide) | One by one; same-file wave refused by code | In parallel; same-file kept apart | `[P]` mark, not checked | **Kiro** for speed, **Local Workflows** for safety |
| 8 | [Progress lives in a chat](#8-progress-lives-in-a-chat) | Checkboxes in git | Checkboxes in git | Checkboxes in git | **Tie** |
| 9 | [Agent stops half-way](#9-agent-stops-half-way) | Notifies when a chat stops; resumes | Alerts | Resumes a workflow step | **Tie** |
| 10 | [Small changes get the full process](#10-small-changes-get-the-full-process) | Define your own lighter types | Quick Spec, plain chat | Bug-fix flow, no spec | **Kiro** built in, **Local Workflows** by config |
| 11 | [Spec and code get out of sync](#11-spec-and-code-get-out-of-sync) | No check | Ticks tasks from code | Adds tasks from code | **Kiro, Spec Kit** |
| 12 | [Locked to one agent or editor](#12-locked-to-one-agent-or-editor) | Copilot, Claude, OpenCode, Gemini CLI, Codex…; VS Code and Open VSX editors | Own agent, own IDE | ~40 agents, any editor | **Spec Kit** |

Local Workflows runs Kiro's and Spec Kit's processes as
[styles](https://local-workflows.github.io/getting-started/sdd/index.md#choosing-a-style), and
runs unchanged inside the Kiro IDE. This is not a "switch tools" page.

---

## Who does it

Every cell below ends with a tag:

| Tag | Means |
|---|---|
| *tool* | The tool itself does it. |
| *prompt* | The AI is told to do it. It usually does. Nothing checks it. |
| *not in docs* | Their docs don't say. |
| *our use* | Not in their docs. What we saw using it. |

---

## 1. Long chats get worse

Every failed attempt stays in the chat. Answers get worse as it grows.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Spec phases** (requirements, design, plan) | A new chat for each phase. Only files cross over. *tool* | One session for every phase, unless you delete it. *our use* | Whatever chat you have open. *tool* |
| **Implementation** | One chat per wave of tasks. *tool* | Own context for each task. *tool* | Whatever chat you have open. *tool* |
| **Shows how full the context is** | Yes, in every chat. *tool* | Yes, and compacts near the limit. *tool* | Up to your agent. |

Spec Kit's `specify workflow run` starts a new session per step, if you
use it instead of the chat commands.

**Winner: Local Workflows for phases. Kiro for tasks** — its unit is
smaller than a wave.

---

## 2. Specs approved unread

Hundreds of lines arrive at once. People scroll and approve.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **One document per phase** | Yes. *tool* | Yes. *tool* | No. `/plan` writes several. *prompt* |
| **Stops before the next phase** | Yes. Pressing Start on the next phase is the approval. *tool* | Yes. You approve in chat. Quick Spec does not stop. *tool* | Chat commands: no, you run the next one. Its workflow runner: yes, with review gates. *tool* |
| **Stops before implementation** | Yes. Starting a task is the approval. *tool* | Yes. You click **Start Task** or **Run all Tasks**. *tool* | Only if a checklist is unticked. *prompt* |

**Winner: Local Workflows and Kiro.** Spec Kit stops only if you run it
through its workflow runner.

---

## 3. AI decides silently

The ask didn't say. The AI picks something. Nobody knows.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Asks you while drafting** | Yes, with "keep open" as the default. *prompt* | Quick Spec asks up front. Requirements analysis asks after. *tool* | Up to 3 in `/specify`, up to 5 in `/clarify`. *prompt* |
| **Where the answer goes** | In the document, with your name and time. *prompt* | *not in docs* | A Clarifications section in the spec. *prompt* |
| **AI's own guesses** | Listed under Assumptions, marked as guesses. *prompt* | *not in docs* | *not in docs* |
| **An open question blocks the next phase** | Yes. *tool* | *not in docs* | `/plan` is told to stop. Skipping `/clarify` only warns. *prompt* |

**Winner: Local Workflows.** The only one where an open question
actually blocks.

---

## 4. Can't see what a revise changed

Nobody can tell what moved. Reviewers re-read it all, or stop reading.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **See what changed** | Removed in red, added in green, changed words picked out. *tool* | *not in docs* | *not in docs* |
| **Review comments** | Notes stay on their text and are committed. One click puts them all in the chat box. *tool* | *not in docs* | Community extensions only. |
| **Update the later documents** | You revise each one. A ready "previous doc changed" sentence helps. *tool* | **Refine** / **Sync Files** updates the ones affected. *tool* | You update them. `/analyze` reports where docs disagree. *prompt* |

**Winner: Local Workflows to review a change. Kiro to carry it into later
documents.**

---

## 5. Everyone runs a different prompt

Same kind of work, different prompt per person, different result.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Prompts shared through the repo** | Yes. *tool* | Steering files only. *tool* | Yes. *tool* |
| **Change one phase's prompt** | Drop one file in your repo. *tool* | *not in docs* | Override its template. *tool* |
| **Change the phases themselves** | Yes, one YAML file. *tool* | *not in docs* | Yes, a workflow YAML file: your own steps, gates, even shell steps. *tool* |
| **Read every prompt it sends** | [Published word for word](https://local-workflows.github.io/getting-started/sdd/custom-prompts.md). | *not in docs* | In your repo. |

**Winner: Local Workflows and Spec Kit.** Spec Kit's workflow file can
do more kinds of step. Local Workflows publishes every prompt it sends.

---

## 6. Docs fall out of step

Requirements get renumbered. The plan still points at the old numbers.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Tasks cite requirements** | Yes. *prompt* | Yes. *tool* | No. Tasks cite user stories. *prompt* |
| **Read a cited requirement in place** | Hover to read, click to jump. *tool* | *not in docs* | *not in docs* |
| **Broken citations flagged** | Struck through. *tool* | *not in docs* | `/analyze` reports gaps. *prompt* |

**Winner: Local Workflows.**

---

## 7. Parallel agents collide

Two agents edit the same file. One overwrites the other.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Tasks in one wave run at the same time** | No. One chat works through them. *tool* | Yes. *tool* | *not in docs* |
| **Same-file tasks kept apart** | A wave with a shared file won't start. *tool* | Kiro says they never run together. *tool* | `[P]` marks tasks on different files. *prompt* |
| **Waves in different repositories** | Run side by side. The tool reads the first folder of each file path as the repository, so this is meant for a workspace with one folder per repository. *tool* | *not in docs* | *not in docs* |

**Winner: Kiro for speed.** It runs a wave's tasks at the same time.
Local Workflows does them one after another.

**Winner: Local Workflows for safety.** Its same-file check is code.
Kiro's docs don't say how theirs is checked, and a
[public bug report](https://github.com/kirodotdev/Kiro/issues/8402) says
parallel builds and tests can clash. It was closed as "not planned".

---

## 8. Progress lives in a chat

How far the work got is in one person's chat window.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Where progress is kept** | Checkboxes in `tasks.md`. *tool* | Checkboxes in `tasks.md`. *tool* | Checkboxes in `tasks.md`. *prompt* |
| **How a box gets ticked** | The agent calls a tool that changes only that box. *tool* | Kiro ticks it when the task finishes. *tool* | The agent edits the file. *prompt* |
| **A teammate carries on** | Pull the folder. Chats stay on your machine. *tool* | Pull `.kiro/specs/`. *tool* | Pull the folder. *tool* |

**Winner: tie.**

---

## 9. Agent stops half-way

The agent stops without saying so. Someone finds out later.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Tells you it stopped** | A notification when a document phase fails, and when a task chat stops — naming any unticked task. If an agent's process crashes, it may not notify. *tool* | Alerts on failure, input needed, task done. *tool* | `/implement` stops and reports. *prompt* |
| **Resume** | Press ▶. Starts from the first unticked box. *tool* | Roll back to a checkpoint. *tool* | `specify workflow resume` restarts the failed step. *tool* |
| **Retry on errors** | AI service errors retried twice while writing a document. Not in implementation. *tool* | *not in docs* | *not in docs* |
| **Stall timer** | No. | *not in docs* | *not in docs* |

**Winner: tie.**

---

## 10. Small changes get the full process

A three-line fix gets requirements, a design and a plan.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Lighter flow** | Define your own types, with only the phases you need. The built-in Bug fix type skips the design. *tool* | Bugfix flow, and Quick Spec writes all three docs in one go. *tool* | Bug-fix flow: assess, fix, test. *tool* |
| **No spec at all** | No. | Plain chat. *tool* | The bug-fix flow writes no spec. *tool* |
| **All docs in one go, no stops** | No. | Quick Spec. *tool* | *not in docs* |
| **Who picks the flow** | A person. | A person. | A person. |

**Winner: Kiro built in. Local Workflows by config** — you write the
lighter type once in the style file, and the whole team gets it.

---

## 11. Spec and code get out of sync

The plan is done, every box ticked. Weeks later someone changes the code
by hand. The spec no longer says what the code does. Can the tool
compare the two and tell you?

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Compare code with the tasks** | No. | **Sync Files** ticks tasks already done. *tool* | `/converge` adds tasks for what's missing. *prompt* |
| **Update the spec from the code** | No. | *not in docs* | No. It never edits the spec. |

**Winner: Kiro and Spec Kit.**

---

## 12. Locked to one agent or editor

Part of the team can't use it.

| | Local Workflows | Kiro | Spec Kit |
|---|---|---|---|
| **Agents** | Copilot (default), Claude, and [Agent Client Protocol](https://local-workflows.github.io/getting-started/acp.md) agents: OpenCode, Gemini CLI, Codex, Cursor, Kiro and more. | Its own agent, with many models. | About 40 agents. |
| **Editors** | VS Code, and editors that install from [Open VSX](https://local-workflows.github.io/getting-started/install.md#kiro-vscodium-and-other-code-oss-builds) — Kiro, VSCodium, Cursor, Windsurf. Tested in Kiro. | Kiro IDE, command line, web. | Any, through a command line tool. |

**Winner: Spec Kit.** It runs from a terminal beside any editor,
JetBrains included. Local Workflows needs a VS Code-family editor.

---

## What it costs you

| Cost | Detail |
|---|---|
| AI sign-in | Copilot by default, or Claude, or an ACP agent. |
| A person starts every phase | Slower than one prompt. On purpose. |
| Editor | VS Code, or an editor that installs from Open VSX. |
| No server | Runs while your editor is open. Not otherwise. |

---

## Is it worth it?

| Worth it | Not worth it |
|---|---|
| Work takes more than a day | A one-line change — use a chat |
| More than one developer | Solo, throwaway work |
| Specs are reviewed before code | You want ask-to-merge with nobody reading |
| Team wants the same prompts | Your team is not on a VS Code-family editor |
| Decisions must live in files | |

---

## Where to go next

| | |
|---|---|
| **Try it** | [Spec-driven development](https://local-workflows.github.io/getting-started/sdd/index.md) — your first spec |
| **Change the process** | [Writing your own style](https://local-workflows.github.io/getting-started/sdd/custom-style.md) |
| **Read the prompts** | [The built-in prompts](https://local-workflows.github.io/getting-started/sdd/custom-prompts.md) |
| **Compare the products** | [Compared with alternatives](https://local-workflows.github.io/why.md) |

---

## Sources

Checked on 2026-09-23.

**Kiro:**
[Specs](https://kiro.dev/docs/specs/),
[Quick Spec](https://kiro.dev/docs/specs/quick-spec/),
[Best practices](https://kiro.dev/docs/specs/best-practices/),
[Analyze requirements](https://kiro.dev/docs/specs/analyze-requirements/),
[Using specs](https://kiro.dev/docs/guides/learn-by-playing/05-using-specs-for-complex-work/),
[Steering](https://kiro.dev/docs/steering/),
[Models](https://kiro.dev/docs/models/),
[Compaction](https://kiro.dev/docs/compaction/),
[Notifications](https://kiro.dev/docs/ide/chat/notifications/),
[Checkpoints](https://kiro.dev/docs/checkpoints/),
[Run all tasks](https://kiro.dev/blog/run-all-tasks/),
[Faster, smarter specs](https://kiro.dev/blog/faster-smarter-specs/),
[Introducing Kiro](https://kiro.dev/blog/introducing-kiro/).

**Spec Kit:**
[README](https://github.com/github/spec-kit),
[Customization](https://github.github.io/spec-kit/guides/customization.html),
[Integrations](https://github.github.io/spec-kit/reference/integrations.html),
[Bug-fix guide](https://github.com/github/spec-kit/blob/main/docs/guides/bugfix.md),
[Workflows](https://github.github.io/spec-kit/reference/workflows.html),
[command prompts](https://github.com/github/spec-kit/tree/main/templates/commands).
