# Compared with alternatives

---

There is no shortage of task runners, no shortage of CI, and by 2026 no
shortage of spec-driven development tools. What follows is the one thing
that is actually different in each comparison, and the places where
something else is the better choice.

All of it follows from the one rule on the
[home page](https://local-workflows.github.io/index.md): **AI produces data, a human-authored
file decides what happens to it.** Every comparison below is really a
comparison of that inversion against a different trust model.

If you are looking for the short list of cases where this is simply the
wrong tool, that is [on the home page](https://local-workflows.github.io/index.md#is-this-for-you)
rather than here.

---

## Against local task runners

Task (`go-task`), `just`, `make`, npm scripts, `tasks.json`.

| | Local Workflows | Task / just / make | npm scripts | VS Code `tasks.json` |
|---|---|---|---|---|
| Definition | YAML in your repo | YAML / justfile / Makefile | `package.json` | `.vscode/tasks.json` |
| Dependency graph | `needs:`, in `tasks.yml` | yes (Task), limited elsewhere | no | no |
| Run visualisation | live pipeline, per-task logs, status | terminal output | terminal output | terminal output |
| Human gates | `trigger: manual`, persisted | no | no | no |
| AI tasks | first-class, fenced | no | no | no |
| Your npm scripts | listed beside everything else | no | — | auto-detected |

If you want a fast local task runner and nothing else, **Task is
excellent and you should use it.** It is more mature here, and a
dependency graph in a terminal is not a worse dependency graph.

What you get instead is the *run experience CI gives you*, locally: the
pipeline drawn live, each task's log one click away, status that
survives closing the tab. And a place for AI tasks that is not "pipe a
prompt into `curl`".

---

## Against CI

GitHub Actions, GitLab CI, and `act` for running them locally.

CI is the right place for anything that must run on a server, on a
schedule, or on someone else's push. Nothing here replaces that.

The difference is the loop. CI's is commit → push → wait → read a log.
This one is edit → click → watch. No commit, no push, no runner queue.
That matters most in the inner loop, where you run the thing twenty times
an hour.

`act` closes some of that gap, and if your pipeline is already a
`workflow.yml` you should try it first. It is also emulating a server on
your laptop; the mental model stays "CI, but local", not "a thing that
belongs to my dev loop".

**Where CI wins outright:** unattended runs, matrix builds, anything
triggered by a push, anything that must not depend on your machine being
awake.

---

## Against automation platforms

n8n, Zapier, Make.

This is the comparison that matters most, and it comes down to one row.

| | Local Workflows | n8n / Zapier / Make |
|---|---|---|
| Who picks the plugin | the file, always | the model may, at runtime |
| Source of truth | committed YAML, diffable | canvas / hosted JSON |
| Review | a pull request | rarely reviewed in practice |
| Runs | on your machine | cloud or self-hosted server |
| Integrations | first-party plus your own JavaScript | hundreds to thousands |
| Unattended | no | yes |

n8n's agent node lets the model *choose* which tool to call. That is the
opposite trust model, and it is not a bug in their product — it is the
premise of it. If you want an agent that decides at runtime, use n8n; it
does that well and this deliberately does not do it at all.

**Where they win outright:** the connector ecosystem, and running while
your laptop is shut. Neither is on the roadmap. A few hundred SaaS
connectors is not a gap to close when the scope is your dev loop.

---

## Against spec-driven development tools

AWS Kiro, GitHub Spec Kit, and agent-native workflows in Claude Code.
By 2026 this is a crowded and fast-moving space:
[Spec Kit](https://github.com/github/spec-kit) is among the most-starred
developer tools on GitHub, and Kiro is a whole IDE.

Here the honest framing is unusual: **these are not really competitors,
because we run their processes.**

Both `kiro` and `spec-kit` ship as
[styles](https://local-workflows.github.io/getting-started/sdd/index.md) — the phases, the artifacts,
the gates, the prompt for each. You can read
[every prompt verbatim](https://local-workflows.github.io/getting-started/sdd/kiro-prompts.md) and
change any one of them by dropping a single file into your repository.

| | Local Workflows | AWS Kiro | GitHub Spec Kit |
|---|---|---|---|
| Shape | VS Code extension | a separate IDE (Code OSS fork) | a CLI toolkit |
| Process | pluggable — ships Kiro's and Spec Kit's | its own | its own |
| Change one prompt | drop one file in your repo | no | fork the templates |
| Write a new process | a `style.yml` and a prompt folder | no | template surgery |
| Gates | `gate: manual`, in the file | in the product | in the agent's instructions |
| Switch editors | VS Code today, more to come | no — it *is* the editor | yes, agent-agnostic |

**Where they win:** Spec Kit is agent-agnostic and MIT-licensed, so today,
if you are not on Copilot or not in VS Code, it is the portable choice.
Kiro is a complete, opinionated environment with EARS-notation
requirements, and if you want the whole thing decided for you, that is a
real advantage.

**Where this wins:** the process is a file you own rather than a product
behaviour you accept. Two styles that genuinely differ in shape both run
on the same engine, which is the evidence that the third one — yours —
will too.

---

## Against coding agents

Claude Code, Cursor, Copilot agent mode, Aider.

This one is about
[spec-driven development](https://local-workflows.github.io/getting-started/sdd/index.md) specifically.
That is the half of the product an agent overlaps with.

Different job. An agent writes code; SDD decides what is allowed to happen
around the writing. They compose — the implement phase hands each task to
a Copilot chat rather than trying to replace it. Copilot is what ships
today, and which agent runs is a `uses:` line, so more to come there.

Two differences worth naming:

**Context, across phases.** An agent session is one long conversation that
accumulates everything, including its own wrong turns. Each SDD phase
instead runs in a fresh session seeded only by the documents before it.
What crosses a phase boundary is a file on disk, never a transcript —
which is also why a teammate can pull the folder and carry on.

**Durability.** An agent session is ephemeral and personal. A spec is a
folder of Markdown in git, and a workflow is a file in a pull request.
Uninstall the extension and both are still there.

---

## The short version

Across every comparison above, three things are genuinely different, and
they are one idea rather than three features:

1. **The trust model is inverted** — AI produces data, the file decides
   the plugin.
2. **The source of truth is a committed, diffable file** — reviewable in
   a pull request, not a canvas or a vanished chat session.
3. **Context is isolated per task** — the conversation never carries
   forward, so no task inherits another's dead ends. A wrong *output*
   still travels: it stops at the next gate you placed, not on its own.

If none of the three is worth a change of tool to you, the incumbent in
your row above is the right answer. That is a real outcome of this page,
not a failure of it.

Ready? [Install it](https://local-workflows.github.io/getting-started/install.md), then
[build your first `tasks.yml`](https://local-workflows.github.io/getting-started/tasks.md).
