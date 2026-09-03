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

**Check `autoApprove`.** Present, it is an allowlist — a tool not named
there is not offered. `disabledTools` wins over it.

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

**A `command: npx` server can lose a race that looks like it never
connected.** The first spawn of a not-yet-cached package is `npx`
resolving and installing it over the network, which can run longer than
the vendor CLI's own fixed handshake timeout — the session starts
anyway, silently missing that server, and rerunning the same task can
succeed once `npx`'s own cache is warm. This is not an auth problem even
when it looks like one (a server that opens a browser to sign in races
the same clock). Add `"requiresWarmStartup": true` to that server's
declaration in `ai.mcpServers` — see
[`settings.json`](https://local-workflows.github.io/getting-started/settings.md#requireswarmstartup)
— so the engine pays that cold-start cost once, before the session
starts, instead of racing it every time.

---

## An `ai@1` task sits at Running and never finishes

It is probably waiting on a permission. Nothing approves on your behalf,
so a tool the agent needs permission for leaves the request pending in
the conversation.

Select the task and open the session from the log header — the request is
there, in context, and answering it lets the turn carry on. The run panel
does not yet mark *which* task is waiting, so a task that has been at
Running with no new output for a while is the one to open.
