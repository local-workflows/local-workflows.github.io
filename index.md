# AI quality is decided by the context you feed it

Local Workflows is a VS Code extension built on one idea: **the
smaller the task, the cleaner the context — and the cleaner the
context, the better the AI**{: .text-green-100 }. So you declare the
work as small units in a file, the extension runs each one in its own
clean context, and that same file decides what happens to each unit's
output.

One engine, two ways to use it. A **pipeline
runner**{: .text-blue-100 }: your dev commands and whole pipelines,
drawn stage by stage in your editor, run without pushing to CI. And
**spec-driven development**{: .text-purple-000 }: AI drafts each
phase, you approve it before the next builds on it, and every prompt
is a file in your repository. Your pipelines, your specs, your files.

[Get started](https://local-workflows.github.io/getting-started/index.md){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Compared with alternatives](https://local-workflows.github.io/why.md){: .btn .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/local-workflows){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## The problem

You know this session. It started as "add the endpoint", then a test
failed, then you pasted a stack trace, then you asked about a rename
while you were at it. Twenty minutes in, the answers are getting
worse — and it is not the model. Every failed tool call, every dead
end, every side discussion is still sitting in the context, and the
model is reasoning over all of it.

Vague prompt, long session, three jobs in one chat: quality decays.
The fix is not a better model. It is a cleaner context.

---

## The fix

Cut the work into the **smallest unit that can stand
alone**{: .text-green-100 }, and run each unit as its own AI task.
Each task starts from a context that contains only what the previous,
human-approved step produced. The failed attempts and the detours
never travel forward.

Two things fall out of that:

- **Consistent quality.** Same task, same clean context, same output
  quality — for every developer on the team, every time, instead of
  depending on how disciplined each person's chat session was that
  day.
- **A gate a human can actually use.** Small output is output someone
  really reads. AI produces **data**{: .text-green-100 }; **a
  human-authored file**{: .text-green-100 } decides what happens to
  it — and that file lives in your repository, reviewed in pull
  requests like any other code.

---

## How it works

### A **pipeline runner**{: .text-blue-100 } that lives in your editor

- Declare your dev commands in two files next to your code:
  `.local-workflows/tasks.yml`, a library of commands each runnable on
  its own, and `.local-workflows/workflows/*.yml`, whole pipelines of
  stages, jobs, and tasks.
- Run a library task alone, or a workflow as a whole, from a native
  sidebar — one click, no commit, no push, no waiting on a CI queue.
- Watch it in a live run panel: per-task logs, status, and a dependency
  graph of what runs after what.
- Extend it with first-party plugins or any JavaScript you write.
- No server of ours, nothing to sign up for, no telemetry of your runs.
  Your commands run on your machine. The one thing that leaves it is an
  AI task, which goes to the provider you named — and that provider's
  sign-in is the only account involved.

[Build your first `tasks.yml`](https://local-workflows.github.io/getting-started/tasks.md)
— about five minutes.

### **Spec-driven development**{: .text-purple-000 } where every phase starts clean

A spec is a folder of Markdown committed next to your code — one
document per phase, each drafted by AI and read by a human before the
next phase builds on it:

```
.local-workflows/specs/dark-mode/
├── intake.md          # the ask, and where it came from — written without a model
├── requirements.md    # what to build — drafted from the ask
├── design.md          # how — seeded by the documents before it, nothing else
└── tasks.md           # the plan implementation follows, task by task
```

Look at that third line again. The design phase never sees the session
that produced the requirements — not the failed tool calls, not the
detours, only the finished file. That is the clean context, made out
of files. A bad inference cannot slip past unseen: each phase reads a
document sitting in your editor, and the next phase does not start
until a person clicks to start it.

- The prompt that drives each phase is a file in your repository. You
  edit it, version it, and review it in pull requests like any other
  code — instead of re-pasting the same mega-prompt into a chat window
  and hoping everyone on the team uses the same one.
- The implement phase adds no fourth document — the work happens in
  your repository, and a ticked checkbox in `tasks.md` is the
  definition of done.
- No separate toolkit to install, no service to sign up for. The same
  engine that runs your pipelines runs your specs.

[Write your first spec](https://local-workflows.github.io/getting-started/sdd/index.md).

### Not every task needs AI

Take "publish a release". Two different jobs hide inside it: drafting
the notes — a job for a model — and publishing — a deterministic
action that needs no model at all. Running the action through AI adds
nothing but risk. So the AI task writes the notes into a run
variable, and the action is an ordinary task wired by hand in a YAML
file a teammate reviewed — behind a manual gate, so a human reads
what the AI wrote before anything fires.

```yaml
# .local-workflows/workflows/release.yml

plugins:
  ai:
    uses: ai@1
    args:
      provider: ghcp         # which vendor runs it is also a line in the file

# ...stages: release: tasks:

- name: Draft the notes
  uses: ai
  args:
    prompt: Draft release notes from the commits on this branch.
  artifact: NOTES             # a value, not a decision

- name: Publish
  trigger: manual            # a human reads the resolved args first
  run: ./publish.ps1 -Body "${{ run.context.NOTES.summary }}"
```

`ai` here is a name you declare, not a built-in — it points at
[`ai@1`](https://local-workflows.github.io/getting-started/plugins.md#the-six-that-ship), the agent plugin, with
the vendor as one of its arguments. Two ship: `ghcp` — GitHub Copilot,
the default — and `claude`. So AI tasks and specs need a sign-in with
whichever one you name; everything else works without either.

For the full argument — and how this differs from task runners, CI,
n8n, Kiro, and Spec Kit — see
[Compared with alternatives](https://local-workflows.github.io/why.md).

---

## Is this for you?

**Yes, if:**

- Your AI sessions start sharp and end sloppy, and you suspect the
  session, not the model.
- You re-run the same handful of commands all day and want them drawn as
  a graph, with per-task logs and status, without a commit or a push.
- You want AI in the loop but never choosing what executes.
- You want that judgement reviewed in a pull request instead of living in
  one person's head.
- You want spec-driven development but want to own the prompts.

**No — close the tab if:**

- **You need unattended or scheduled runs.** There is no server. Close
  the laptop and nothing runs.
- **You need hundreds of SaaS connectors.** There are first-party plugins
  and whatever JavaScript you write. That is the whole ecosystem, and it
  is not growing into a marketplace.
- **You want the model to decide what runs.** Structurally refused.
- **You want a no-code canvas.** It is YAML, reviewed in pull requests,
  by people who read YAML.
- **Your whole need is aliases for three shell commands.** A plain task
  runner like `just` is lighter. This tool earns its keep when you want
  the graph, the logs, the AI steps, or the specs.
- **You are not in VS Code.** The one item on this list that is a *not
  yet* rather than a decision.

---

## Where to go

| | |
|---|---|
| **Wondering why not just use X** | [Compared with alternatives](https://local-workflows.github.io/why.md) — task runners, CI, n8n, Kiro, Spec Kit, coding agents |
| **Never used it** | [Install](https://local-workflows.github.io/getting-started/install.md), then [Tasks](https://local-workflows.github.io/getting-started/tasks.md) and [Workflows](https://local-workflows.github.io/getting-started/workflows.md) — a five-minute walkthrough opens each |
| **Here for spec-driven development** | [Spec-driven development](https://local-workflows.github.io/getting-started/sdd/index.md) — phases, prompts, and gates |
| **Anything else — a feature, a key, a default** | [Getting started](https://local-workflows.github.io/getting-started/index.md) — one page per feature, walkthrough and full reference on the same page |
| **Something is broken** | [Troubleshooting](https://local-workflows.github.io/troubleshooting.md) |

---

## Everything is a file you own

There is no hidden state, and no service or account of ours — the only
sign-in anywhere is your AI provider's. A workflow is a
YAML file in your repository; a spec is a folder of Markdown committed
alongside it. Your teammates review these files in pull requests — the
extension runs them, humans review them. Uninstall the extension and
everything you wrote is still there, still readable, still in your
history.

Ready? [Install it](https://local-workflows.github.io/getting-started/install.md), then
[build your first `tasks.yml`](https://local-workflows.github.io/getting-started/tasks.md).
