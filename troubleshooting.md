# Troubleshooting

---

## Nothing here matches - where are the logs?

The Command Palette has **Local Workflows: Show Logs**. It opens the
extension's own output channel, where activation, the run database's
location, and anything that failed quietly are written with a timestamp
and a level.

It is the right place to start for anything this page does not cover,
and the right thing to attach when reporting a problem - a toast is gone
the moment it is dismissed and carries no detail.

---

## My file shows up but has no tasks

Check the top-level key. It is **`tasks:`** — not `task:`, `steps:` or
`commands:`. A file whose top-level key is anything else parses
successfully into zero tasks and appears empty, because there is
nothing there to reject.

```yaml
tasks:            # not `task:` or `steps:`
  hello: echo Hello World
```

---

## `$env:NAME` comes back empty

The task ran in the OS default shell — `cmd` on Windows, `bash`
elsewhere — not PowerShell. A task gets `pwsh` only when it asks:

```yaml
  build:
    shell: pwsh
    run: echo "Building in $env:BUILD_CONFIGURATION..."
```

---

## An `ai@1` session cannot see an environment variable

Not a bug, and not the same rule a `run:` task follows. An agent child
gets an **allowlist**: process plumbing, the home directory so its CLI
stays signed in, whatever a grant list names, and the task's own `env:`.
Nothing else — not `HTTP_PROXY`, not `JAVA_HOME`, not a credential you
exported in your shell.

Grant the name where a reviewer sees it — `env.allowed` in
[`settings.json`](https://local-workflows.github.io/getting-started/settings.md#env--the-gate-on-mcp-env-reads),
or `allowedEnv:` on the task — or set the value outright in the task's
`env:`. The full list of what arrives unasked is on
[Agent SDKs](https://local-workflows.github.io/getting-started/agent-sdks.md#the-environment-the-cli-child-gets).

`env.denied` beats every grant, so check it before assuming a grant did
not take.

---

## It asks which folder to run in, every single time

That is a workspace- or profile-level definition, and it belongs to no
repository. `git clean -fdx` means something different in each of the
five repositories a `.code-workspace` might list, so it is asked before
every run and the answer is never remembered.

It is asked even when the definition does no disk work at all — a
workflow whose only task is an `http@1` call still got the question, and
the answer was thrown away.

Say where it runs, at the top of the file:

```yaml
cwd: none
```

`none` means it acts on no folder. The run starts in the file's own
project folder, and the pick stops. Naming a real folder (`cwd: ./api`)
does the same, because it answers the same question. The key works at
the top of a workflow file, at the top of a `tasks.yml`, and on a single
task.

See [Which folder a run uses](https://local-workflows.github.io/getting-started/workspaces.md#which-folder-a-run-uses).

---

## A task silently does nothing

An unquoted YAML scalar containing `": "` parses as a nested mapping, and
the task's `run:` quietly becomes something else. Quote the whole thing:

```yaml
    run: echo "exported = $env:ARTIFACT_NAME - env read the var"
```

---

## The run stopped and half the steps say Skipped

A failed task skips everything that `needs:` it, transitively. Tasks
that do not depend on it still get their turn — one at a time, in
dependency order, since execution is always sequential. Click the
failed row and read its log in the side panel — the status on a skipped
dependent tells you nothing that the failing task's own status does not
tell you better.

The one exception to skip-on-failure is a task marked `if: always()` —
teardown that must run even after a failure or a Stop. See
[Cleanup that always runs](https://local-workflows.github.io/getting-started/workflows.md#cleanup-that-always-runs).

---

## A task failed before anything ran

Validation runs before the first command. An unregistered `uses:`, a
missing required arg, an arg the plugin does not accept, or a
`${{ vars.X }}` declared nowhere all stop the run up
front, with the message on the task that has it. Click the task's row
in the run panel to read it - a row with a problem carries a `!` mark.

That is deliberate: a pipeline that gets three tasks in before
discovering a typo has already changed things on your machine.

`ai@1` is the exception to "an arg the plugin does not accept". It hands
anything it does not declare to the runtime, so a misspelled arg there is
never reported — see below.

---

## An `ai@1` arg did nothing at all

Nothing validates it, and nothing will. `ai@1` passes every arg it does
not declare to the agent runtime under that name, because the runtime's
own session options outnumber and outpace anything this extension could
restate. An arg the runtime does not recognise either is simply dropped
by it.

So `availableTools:` works and `avilableTools:` is silence. Check the
spelling against the runtime's own option names, not against
[the `ai@1` arg table](https://local-workflows.github.io/getting-started/plugins.md#ai1) — that table is
only the handful the *engine* uses.

---

## The agent says it has no MCP tools

**Name the server in the prompt.** This is the common one. "Use the
available MCP server" is not something the agent can resolve; `use the
ado MCP server` is.

**Check where the server is declared.** Two places count, and the
editor's own `mcp.json` is neither of them:

1. `ai.mcpServers` in `.local-workflows/settings.json` — the workspace's
   or your profile's. The sidebar's **MCP Servers** view lists exactly
   what these two files declare, so if it is not in that list, no task
   will see it.
2. The Copilot CLI's own discovery files —
   `~/.copilot/mcp-config.json`, `.mcp.json`, `.github/mcp.json`. These
   are `ghcp`'s own, not the engine's — the engine hands a
   `provider: claude` session what `ai.mcpServers` declares and nothing
   from these.

A server that answers in the editor's chat panel but is in none of those
is not bridged across and does not exist for an `ai@1` task. Full
reference: [`settings.json`](https://local-workflows.github.io/getting-started/settings.md#aimcpservers).

**Check the server is not `disabled`.** A ticked-off checkbox in the MCP
view writes `"disabled": true` into the declaring file, and a disabled
server is skipped silently.

**Check the task's `mcp:`.** Present, `servers` is an allowlist — a
server not named there is not sent — and `tools` narrows each server to
the names listed. A name settings.json does not declare fails the task
outright, naming the declared ones. The `ai@1` default under
`"ai": { "ai@1": { "mcp": … } }` applies when the task says nothing, and
a task's own `mcp:` replaces it whole.

**A file still carrying `autoApprove` or `disabledTools` fails the task**
naming the key. Those two per-server keys are gone; tool choice moved to
the task's `mcp:`. Remove them.

A `mcpServers:` block in the task's args is not supported and is
removed before the session opens. The `Session options:` line in the
task log shows the config exactly as sent.

**Check `availableTools:` against wire names.** An MCP tool's wire name
is `<serverKey>-<toolName>`: a server declared as `ado` surfaces
`wit_work_item` as `ado-wit_work_item`. An allowlist entry with the
bare name matches nothing — the server connects, its tools are filtered
out, and the agent reports it has no ADO tools while the log shows the
server initialising happily. Tool names also drift between server
versions; pin the server package's version in your MCP config so they
cannot.

A remote server that signs in over OAuth may still fail. Nothing is
watching the run to complete a sign-in, so a server that has never been
authorised on this machine cannot be authorised by a task. A launched
server with a token in its `env:` works unattended and is the shape to
reach for.

**A server that "never connects" on first use is almost always waiting
on a sign-in.** ADO with `--authentication azcli`, and anything else
that opens a browser or a device-code prompt, blocks on that prompt
until the vendor CLI's handshake timeout gives up — the session then
starts without the server, and nothing in the log says why. There is
no engine-side fix for that: a task runs unattended and nobody is there
to click. Sign in once by hand on that machine (run the same command
from a terminal, or press **Start** on the server in the MCP view, which
shows the prompt), or give the server a token in its `env:` so it never
asks. There used to be a `requiresWarmStartup` key for this; it probed
the wrong cause and is gone — a file still carrying it fails the task
saying so.

---

## An `ai@1` task sits at Running and never finishes

It is probably waiting on a **question**, not a permission. A permission
request is answered for you — approved inside the session's own folders,
refused outside them — so nothing parks on one.

A question does wait. Select the task and open its **AI Session** tab:
the question is drawn there, and that tab is marked while it waits, so
you can spot the right task from the Logs tab. Answer it and the turn
carries on.

A question only waits when the task said somebody is watching
(`interactive: true`, which the spec panel sets for every phase). Without
it the agent is told nobody is there and carries on with an assumption —
so a task stuck with no question on screen is a long turn, and the
answer is the Stop button or a `timeout:`.

---

## The agent was refused a file it needs

A line like this in the log, and the agent saying it cannot reach
something:

```
Denied: ../other-repo/src/api.ts is outside the directories this session may use.
```

Working as intended. A session may read and write in the task's `cwd`
and the folders open in the editor, and nothing else — see
[where a session may read and write](https://local-workflows.github.io/getting-started/plugins.md#where-a-session-may-read-and-write).

Three honest fixes, in the order to try them:

1. **Open the folder in the editor.** In a multi-root workspace that is
   all it takes — every open folder is in scope.
2. **Point the task at the right place** with `cwd:`, if the work really
   belongs a level up.
3. **Paste the one file in** with `context:` on the task. A `context:`
   file is read by the engine before the session starts, so the limit
   does not apply to it. An `attachments:` entry does not help here — it
   only names a file the agent must then open, which is the call that
   was refused.

[`debug: true`](https://local-workflows.github.io/getting-started/settings.md#debug) in your
profile settings removes the limit entirely. That is a switch for
diagnosing something, not a fix to leave on.

---

## A file that worked last month now fails on `session:`

> Task 'draft' has an unknown key 'session'.

`session:` is gone. It named a conversation two tasks could share, and
nothing keeps a transcript in the engine any more — a provider owns its
own conversation now, and the panel reads it back from the run's events
file.

Delete the key. What one task produced still reaches the next the way
everything else does — `artifact:` on the first task, `context:` on the
second — which is a file a person can read, rather than a thread they
cannot.
