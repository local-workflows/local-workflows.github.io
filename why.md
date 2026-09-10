# Compared with alternatives

---

There is no shortage of task runners, no shortage of CI, and by 2026 no
shortage of spec-driven development tools. What follows is the one thing
that is actually different in each comparison, and the places where
something else is the better choice.

All of it follows from the two rules on the
[home page](https://local-workflows.github.io/index.md): **the smaller the task the cleaner the
context**, and **AI produces data, a human-authored file decides what
happens to it.** Every comparison below is really a comparison of those
two against a different trust model.

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
| Plugin UI | a plugin ships its own page, drawn in the panel | no | no | no |
| Your npm scripts | listed beside everything else | no | — | auto-detected |

If you want a fast local task runner and nothing else, **Task is
excellent and you should use it.** It is more mature here, and a
dependency graph in a terminal is not a worse dependency graph.

What you get instead is the *run experience CI gives you*, locally: the
pipeline drawn live, each task's log one click away, status that
survives closing the tab. And a place for AI tasks that is not "pipe a
prompt into `curl`".

The last row is the one with no equivalent anywhere else on it. A
[plugin can ship a page of its own](https://local-workflows.github.io/getting-started/plugin-apps.md)
— your HTML, drawn as a tab beside Logs and Artifacts, with its own
database and its own back end. That is where a run that needs a choice
made first gets a real picker instead of a prompt.

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
| Configuration | one committed `settings.json`, plus a personal one | in the product's own settings |
| Review | a pull request | rarely reviewed in practice |
| Runs | on your machine | cloud or self-hosted server |
| Integrations | first-party plus your own JavaScript | hundreds to thousands |
| Custom UI | a plugin's own page — it can start a run, never define one | the canvas is where the workflow is built |
| Unattended | no | yes |

n8n's agent node lets the model *choose* which tool to call. That is the
opposite trust model, and it is not a bug in their product — it is the
premise of it. If you want an agent that decides at runtime, use n8n; it
does that well and this deliberately does not do it at all.

The custom-UI row is the same rule again, one level down. A
[plugin app](https://local-workflows.github.io/getting-started/plugin-apps.md) can draw whatever
picker your team needs and start a run with the answers already filled
in — but it can only start runs the YAML already declares, and the
values it passes are checked against the `params:` in that file. The
page is a nicer way to answer the file's questions. It is not a second
place the work gets defined. The same goes for
[`settings.json`](https://local-workflows.github.io/getting-started/settings.md): one committed
file for the team, one personal file for you, merged per key, both
readable in a diff.

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

Both `kiro` and `spec-kit` run as
[styles](https://local-workflows.github.io/getting-started/sdd/index.md) — the phases, the artifacts,
the gates, the prompt for each — documented as worked examples rather
than switched on by default. You can read
[every prompt the extension sends](https://local-workflows.github.io/getting-started/sdd/custom-prompts.md)
verbatim, and change any one of them by dropping a single file into your
repository. Each phase has its own instruction file, so replacing one
replaces that whole instruction — there is no hidden intro underneath it
that you keep inheriting.

| | Local Workflows | AWS Kiro | GitHub Spec Kit |
|---|---|---|---|
| Shape | VS Code extension | a separate IDE (Code OSS fork) | a CLI toolkit |
| Process | pluggable — Kiro's and Spec Kit's are worked examples, copy either in | its own | its own |
| Change one prompt | drop one file in your repo | no | fork the templates |
| Write a new process | [a `style.yml` and a prompt folder](https://local-workflows.github.io/getting-started/sdd/custom-style.md) | no | template surgery |
| Gates | every phase waits for a person to press Start, and an unanswered question blocks the next one | in the product | in the agent's instructions |
| Which agent runs it | `provider:` — Copilot, Claude, or anything speaking ACP | Kiro's own | whichever agent you run it in |
| Which editor | VS Code only | no — it *is* the editor | any, it's a CLI |

**Where they win:** Spec Kit is a CLI and MIT-licensed, so if you are not
in VS Code it is the portable choice — that is the one gap here, and it
is a real one. Kiro is a complete, opinionated environment with
EARS-notation requirements, and if you want the whole thing decided for
you, that is a real advantage.

**Where this wins:** the process is a file you own rather than a product
behaviour you accept. Two worked-example styles that genuinely differ in
shape both run on the same engine as the built-in default, which is the
evidence that the fourth one — yours — will too.

---

## Against coding agents

Claude Code, Cursor, Copilot agent mode, Aider.

This one is about
[spec-driven development](https://local-workflows.github.io/getting-started/sdd/index.md) specifically.
That is the half of the product an agent overlaps with.

Different job. An agent writes code; SDD decides what is allowed to happen
around the writing. They compose — the implement phase hands each task to
an agent session rather than trying to replace it.

Which agent that is, is one line. `provider:` on the task picks it:
[Copilot and Claude](https://local-workflows.github.io/getting-started/agent-sdks.md) ship as
built-in providers on their vendors' own SDKs, and anything else —
Kiro included — comes in through
[the Agent Client Protocol](https://local-workflows.github.io/getting-started/acp.md).

Three differences worth naming:

**Context, across phases.** An agent session is one long conversation that
accumulates everything, including its own wrong turns. Each SDD phase
instead runs in a fresh session seeded only by the documents before it.
What crosses a phase boundary is a file on disk, never a transcript —
which is also why a teammate can pull the folder and carry on.

**Every decision is written down.** When a phase has to settle something
you did not tell it, the answer does not stay in the chat. A decision
you make mid-draft is written into the document under `## Assumptions`.
Something the phase could not settle at all goes under `## Open
Questions`, first in the document, and until somebody answers it the
next phase will not start. In a chat session both of those are a
sentence somebody scrolled past.

**Durability.** An agent session is ephemeral and personal. A spec is a
folder of Markdown in git, and a workflow is a file in a pull request.
Uninstall the extension and both are still there.

---

## The short version

Across every comparison above, four things are genuinely different, and
they are one idea rather than four features:

1. **The trust model is inverted** — AI produces data, the file decides
   the plugin.
2. **The source of truth is a committed, diffable file** — reviewable in
   a pull request, not a canvas or a vanished chat session.
3. **Context is isolated per task** — the conversation never carries
   forward, so no task inherits another's dead ends. A wrong *output*
   still travels: it stops at the next gate you placed, not on its own.
4. **Deviation is recorded** — when something is decided that the
   documents did not cover, it is written into the document, not left in
   a transcript. The next person reads the decision instead of guessing
   there was one.

If none of the four is worth a change of tool to you, the incumbent in
your row above is the right answer. That is a real outcome of this page,
not a failure of it.

Ready? [Install it](https://local-workflows.github.io/getting-started/install.md), then
[build your first `tasks.yml`](https://local-workflows.github.io/getting-started/tasks.md).
