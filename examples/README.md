# Examples

Six folders. Each one is a real job, done for real - not a walkthrough
of the file format.

Copy the one you want into your own repository and it works. Nothing
here is a placeholder, and no task prints "building..." while doing
nothing.

| Folder | What it does | What you need |
|---|---|---|
| [GitChores](GitChores/) | The git jobs you do every week, as tasks you press play on | nothing |
| [NodeService](NodeService/) | A real TypeScript project. `npm ci`, 25 tests, a build, and two pipelines | Node |
| [AiCodeReview](AiCodeReview/) | The agent reviews your branch, you read it, then it posts | GitHub Copilot |
| [ReleaseNotes](ReleaseNotes/) | Your commits become a changelog entry you approve before it lands | GitHub Copilot |
| [CallAService](CallAService/) | Calling an HTTP endpoint and an MCP tool, without writing a shell command | nothing |
| [SpecWalkthrough](SpecWalkthrough/) | One feature taken through every spec phase, with the real documents | nothing - it is for reading |

## Where to start

**Never used it before?** [GitChores](GitChores/). One file, no install,
works in any repository you already have.

**Want to see what it does with a real build?**
[NodeService](NodeService/). Open the folder, press play on **Verify**,
and one click installs, typechecks and tests in the right order.

**Here for the AI part?** [AiCodeReview](AiCodeReview/). It is the whole
idea in one file: the model proposes, a person approves, a plugin
executes.

**Here for spec-driven development?**
[SpecWalkthrough](SpecWalkthrough/). Nothing to install - it is four
finished documents and an explanation of what each phase did.

## How to copy one

Every example keeps its files in a `.local-workflows/` folder. Copy that
folder into the root of your own repository:

```
examples/GitChores/.local-workflows/tasks.yml
  ->  <your repo>/.local-workflows/tasks.yml
```

Open the repository in VS Code and the tasks appear in the Local
Workflows sidebar.

- `tasks.yml` is a library of things you press play on one at a time.
- `workflows/*.yml` is one pipeline with a start and an end, where the
  order is the point.
- `settings.json` is the machine's settings - which AI provider, which
  MCP servers. Only [CallAService](CallAService/) ships one.

## What each example is there to show

Between them these cover every part of the format worth knowing, once
each rather than six times:

| Idea | Where |
|---|---|
| A gate that waits for a person | GitChores, NodeService, AiCodeReview, ReleaseNotes |
| A task that runs nothing and only groups others | GitChores, NodeService |
| Ordering with `needs:` | NodeService |
| Stages, where a failure stops everything after it | NodeService |
| Parameters the run asks you for | NodeService, AiCodeReview, ReleaseNotes |
| One AI conversation across two tasks | AiCodeReview |
| Passing data between tasks | AiCodeReview, ReleaseNotes, CallAService |
| Reading and writing files with `file@1` | ReleaseNotes |
| An HTTP call with a credential that stays out of the file | CallAService |
| An MCP tool call with no model involved | CallAService |
| A task that skips itself | AiCodeReview, CallAService |
| The whole spec-driven loop | SpecWalkthrough |

## A note on the two todo lists

[SpecWalkthrough](SpecWalkthrough/) specs a todo list.
[NodeService](NodeService/) is that todo list, built. They are the same
feature from both ends, on purpose - read the spec, then read the code
and the tests it produced.

## Not this folder

`Samples/HelloWorld` in this repository is a different thing: one file
that uses every key the format has, once each, as a smoke test. It is
for checking the engine, not for copying. Start here instead.
