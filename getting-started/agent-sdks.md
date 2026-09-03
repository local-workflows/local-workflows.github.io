# Agent SDKs

Two providers ship with this build, each built directly on its vendor's
own SDK rather than a general protocol — the tradeoff is one fewer
process in the middle, for an agent this build has a dedicated
integration for. Anything else — Kiro, or an agent you'd rather reach
through a shared protocol instead — is
[Agent Client Protocol](https://local-workflows.github.io/getting-started/acp.md).

---

## Which one runs by default

- **`ghcp`** (GitHub Copilot) is the **default** — a task that names no
  `provider:` runs on it, through GitHub's own SDK, which in turn needs
  the Copilot CLI.
- **`claude`** is the other. Say `provider: claude` on the task (or set
  it as the default in `settings.json` under `ai."ai@1".provider` — see
  [making a provider the default](https://local-workflows.github.io/getting-started/settings.md#making-a-provider-the-default)).

---

## GitHub Copilot

### Prerequisites

- Run `npm install -g @github/copilot`
- Run `Get-ChildItem "$env:APPDATA\npm\node_modules\@github" -Recurse -Filter copilot.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName`
- Run `[Environment]::SetEnvironmentVariable("COPILOT_CLI_PATH", "PASTE_THE_PATH_HERE", "User")`

### Why the CLI is not bundled

Roughly **340 MB per platform**, across eight platforms.

#### Pointing at a copy you already have

If the CLI is somewhere that is not on `PATH`, name it:

```yaml
tasks:
  draft:
    uses: ai@1
    env:
      COPILOT_CLI_PATH: D:\tools\copilot\copilot.exe
    args:
      prompt: Summarise the commits since the last tag.
```

`COPILOT_CLI_PATH` is honoured wherever an environment variable can be
set — the task's `env:`, your shell, or the machine. A copy installed
beside the SDK is found automatically, so most people never set it.

Point it at the **executable**, not at a `.js` file. Inside VS Code a
`.js` entry point gets launched through `Code.exe`, the CLI's argument
parser mistakes that for Electron, and the run dies with
`error: too many arguments. Expected 0 arguments but got 1.`

### What you do **not** need

**The GitHub Copilot VS Code extension.** Nothing here calls it. A
machine with it installed and signed in still needs the CLI; a machine
without it works fine with the CLI.

Copilot is also deliberately *not* declared as an extension dependency —
that field force-installs it, and you should not get Copilot pushed onto
you for tasks you may never write.

---

## Claude

No separate CLI install to manage — the SDK resolves and spawns its own
platform binary.

**Authentication** is whichever of these the machine already has:

- the Claude CLI's own sign-in, or
- `ANTHROPIC_API_KEY` — reaches the session only when the task's env
  gate grants it (`allowedEnv: [ANTHROPIC_API_KEY]`, or
  `env.allowed` in
  [`settings.json`](https://local-workflows.github.io/getting-started/settings.md#env--the-gate-on-mcp-env-reads)).
  An exported shell variable alone is deliberately not enough — see
  [the environment the CLI child gets](#the-environment-the-cli-child-gets).

No `COPILOT_CLI_PATH`-equivalent to set, and no `ELECTRON_RUN_AS_NODE`
workaround — both are Copilot-specific, needed only because that SDK is
spawned from inside the extension host.

---

## What `ai@1` hands to a provider

Every setting on the task is passed straight through. Neither provider
adds settings of its own, which is what makes swapping between them one
line.

| On the task | What the provider does with it |
|---|---|
| `model:` | the model the session runs on. `auto` lets the provider pick |
| `attachments:` | files handed over by **absolute** path, with `name` as what the agent sees them called - build one from `${{ home }}` or `${{ workspaceFolder }}` |
| `env:` | layered last over the allowlist the CLI child gets — see below |
| the task's `cwd` | the session's working directory. One client per session, so two tasks can work in different folders at once |
| anything else | handed to the runtime as written, under its own name — `systemMessage:`, `availableTools:`, `excludedTools:`, and whatever it grows next |

The one exception is `mcpServers:` — the engine removes it. MCP servers
are declared in `ai.mcpServers` in
[`.local-workflows/settings.json`](https://local-workflows.github.io/getting-started/settings.md),
alongside the Copilot CLI's own discovery files
(`~/.copilot/mcp-config.json`, `.mcp.json`, `.github/mcp.json`) — never
in a workflow file; see
[MCP servers](https://local-workflows.github.io/getting-started/settings.md#aimcpservers).

That last row is the whole shape of this plugin. `ai@1` declares only
what the *engine* does with a session; the rest is the runtime's own
vocabulary, so a session option shipped last month is usable today
without a new build here.

Full arg table and the MCP guidance:
[`ai@1`](https://local-workflows.github.io/getting-started/plugins.md#ai1).

### Model names

They are the **provider's** vocabulary, not this extension's. `ai@1`
passes the string through and never validates it. `model: auto` is the
sane default — a pinned name goes stale.

---

## The environment the CLI child gets

**An allowlist, not the machine.** This is the one place an agent task
differs from a `run:` task, which still inherits everything. Three
layers, in this order:

1. **A fixed baseline** — the process plumbing no child can start
   without, and nothing else: `PATH`, `PATHEXT`, the Windows
   `SYSTEMROOT`/`WINDIR`/`COMSPEC`/`SYSTEMDRIVE`, the temp dirs, the
   home-directory names (`HOME`, `USERPROFILE`, `APPDATA`,
   `LOCALAPPDATA`, `HOMEDRIVE`, `HOMEPATH`), `USERNAME`, `LANG`,
   `LC_ALL`, `SHELL`, and `COPILOT_CLI_PATH`. The home directory is
   deliberately in there — it is where both CLIs keep their sign-in, so
   an allowlisted child is still a signed-in one.
2. **Names a grant list allows** — `env.allowed` in
   [`settings.json`](https://local-workflows.github.io/getting-started/settings.md#env--the-gate-on-mcp-env-reads),
   or the task's `allowedEnv:`. Those two exist to hand a machine
   credential across the boundary, so their values are registered as
   secrets before the child sees them: an agent that echoes one prints
   `***` into the run log.
3. **The task's own `env:` values**, layered last so they win. Written
   in the file rather than read off the machine, so they are
   configuration and are not masked.

`env.denied` vetoes all three, baseline included.

Everything else on the machine stays behind — credentials, and also
ordinary things like `HTTP_PROXY` and `JAVA_HOME`. A session that needs
one does not get it, however the variable is set in your own shell, until
`env.allowed`, `allowedEnv:` or the task's `env:` says so. That is the
deliberate cost of not handing a model your whole environment.

`COPILOT_CLI_PATH` resolved to the native binary and
`ELECTRON_RUN_AS_NODE=1` are then set for you, on top. The Claude
provider needs neither — that SDK resolves and spawns its own binary.

---

## Next

- [Your first spec](https://local-workflows.github.io/getting-started/sdd/index.md) — the first
  thing that needs all of the above.
- [`ai@1`](https://local-workflows.github.io/getting-started/plugins.md#ai1) — the args the engine
  declares, and what happens to the ones it does not.
- [SDD config](https://local-workflows.github.io/getting-started/settings.md#sdd) — setting `provider:`
  and `model:` once for every phase.
- [Agent Client Protocol](https://local-workflows.github.io/getting-started/acp.md) — an agent
  neither SDK covers, like Kiro.
