# `settings.json`

The engine's one configuration file. One shape, read from at most two
places, merged per key. This page is the whole file — every key, every
default, and every error it can raise.

---

## The two scopes

| Scope | Where | Applies to |
|---|---|---|
| Workspace | `<workspace root>/.local-workflows/settings.json` — committed, reviewed in PRs | everyone on this repository or workspace |
| Profile | `~/.local-workflows/settings.json` | you, in every workspace |

**Merged per key, workspace wins.** A personal MCP server declared in
your profile follows you into every repository; a team server with the
same name shadows it. For `ai.mcpServers` the merge unit is one
**server**: an entry is taken whole, never merged field by field — half
a server declaration from each scope is not a server anybody wrote.

Every field has a default and both files are optional. A fresh install
writes nothing and works.

**A malformed file fails loudly and names itself** — the error opens with
the file's full path. Plain JSON: no comments, no trailing commas. The
one silent path is absence — a scope that declares nothing is the normal
case.

---

## The whole file

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
    "ai@1": { "model": "auto" },
    "mcpServers": {
      "ado": {
        "command": "npx",
        "args": ["-y", "@azure-devops/mcp@2.9.0", "contoso",
                 "--authentication", "azcli"],
        "autoApprove": ["wit_work_item", "wit_query"]
      }
    },
    "acpAgents": {
      "kiro": { "command": "kiro-cli", "args": ["acp"] }
    }
  },
  "env": {
    "allowed": ["ADO_PAT"],
    "denied": []
  },
  "defaultFoldersToIgnoreScanning": ["node_modules", "dist"]
}
```

Four top-level keys, and no others. An unknown one is an error, not
tolerance: a misspelled `env` that silently gates nothing is a security
setting that looks applied and is not.

| Key | What it is |
|---|---|
| `sdd` | everything [spec-driven development](https://local-workflows.github.io/getting-started/sdd/index.md) reads |
| `ai` | per-plugin default args, plus MCP servers and ACP agents |
| `env` | the gate on `${{ env.NAME }}` in an MCP declaration |
| `defaultFoldersToIgnoreScanning` | folders the workspace scan skips when there is no `.gitignore` |

Not in this file: the workspace-root pointer (`localWorkflows.workspaceRoot`, kept in the
`.code-workspace` — see
[Workspaces](https://local-workflows.github.io/getting-started/workspaces.md)), and anything
about a run — params, vars and env belong to the file being run.

---

## `sdd`

**It never reaches an AI.** The extension reads it and hands each phase
only the values that phase needs. Model choice, style id, and source
settings stay in the engine.

| Key | Values | Default |
|---|---|---|
| `sdd.style` | `kiro`, `spec-kit`, or a [style you wrote](https://local-workflows.github.io/getting-started/sdd/custom-style.md) | `kiro` |
| `sdd.specsDir` | where spec folders live — workspace-relative, or absolute | `.local-workflows/specs` |
| `sdd.source` | `manual` \| `ado` \| `gh` \| `file` | unset — ＋ New Spec asks each time |
| `sdd.checkpoints` | `required` \| `optional` \| `none` | `required` |
| `sdd.uses` | a plugin reference | `ai@1` |

**`sdd:` is a closed set.** Those five keys and no others — a sixth is a
hard error naming the valid ones, because a misspelled setting that
silently does nothing is worse than one that refuses to load. Plugin
args do not go here; they go under `ai."ai@1"` for every phase, or on a
stage's `ai:` in your
[style](https://local-workflows.github.io/getting-started/sdd/custom-style.md) for one phase.

### `sdd.style`

The process: its phases, its gates, its prompts, and the spec types in
the ＋ New Spec menu. `kiro` and `spec-kit` ship; your own works the same
way.

### `sdd.specsDir` — where specs live

`.local-workflows/specs` under the workspace root by default. Point
`sdd.specsDir` somewhere else to move them: a relative path anchors to
the workspace (`docs/specs`), an absolute one stands alone — a vault
outside the repository, shared between projects
(`D:/team/spec-vault`).

In a plain folder the workspace root is the repository itself. With a
`.code-workspace` open it is whichever folder
`localWorkflows.workspaceRoot` names — by default the folder the
`.code-workspace` file sits in. One feature spanning five repositories
is one spec, not five.

### `sdd.source`

Where the work item behind a spec comes from: written by hand
(`manual`), Azure DevOps (`ado`), GitHub (`gh`), or a file on disk
(`file`).

This is the one key with no default on purpose. Unset means the file
does not say, and ＋ New Spec asks each time — which is the difference
between a team that has standardised and one that has not.

`file` opens a native file picker either way — chosen in the menu or set
here. The source can be standardised; the files are per-spec. The picked
files — one or several — are **copied into the spec folder** and named in
`intake.md`, so they need not be in the repository to start with and end
up in it regardless. Copied rather than linked: the ask goes into git with
the documents drawn from it, and a name that collides gets a numeric
suffix rather than overwriting.

### `sdd.checkpoints`

Whether the plan gets "run the tests and stop" barriers between groups
of tasks. Read by the tasks prompt when the plan is written; nothing
else branches on it.

### `sdd.uses` — what runs the AI phases

Names the plugin, `ai@1` by default. Nobody writes it until a second AI
plugin exists. **The plugin's args come from `ai."<plugin ref>"`** — the
lookup is by the reference `sdd.uses` names, so a team that points it at
a different plugin gets *that* plugin's defaults.

### One phase, different settings — not here

There used to be a `sdd.stages.<id>` block for this. **It moved to the
style**, where a phase is already described:

```yaml
# .local-workflows/styles/<your-style>/style.yml
stages:
  - id: design
    ai:
      model: gpt-5
      reasoningEffort: high
```

The merge is **per key, not per block**: `design` above keeps whatever
`ai."ai@1"` set and changes only what it names. Naming one setting never
silently drops the others.

Why it moved: only a style knows which of its phases is the hard one, so
that belongs beside the phase rather than in a second file. Two files
answering "why is this phase on that model" meant reading both to know.

`sdd.uses` did **not** move — which plugin runs a phase is yours, not the
style's, and a style naming one would not run for a team on a different
plugin. Neither did the defaults below: `ai."<plugin>"` still sets what
every phase starts from.

A `sdd.stages` block still in your file is a hard error naming where the
settings went, rather than a key that sits there looking applied.

The keys are the plugin's, and `ai@1` is a passthrough — so beyond
`provider` and `model`, what belongs there is whatever the **provider**
understands. `reasoningEffort`, `contextTier`, `reasoningSummary` and
`enableExperimentalMode` are `ghcp`'s; `reasoningEffort` in particular is
only valid on a model whose capabilities report it, which `auto` does not
— so pin a model when you set it.

---

## `${{ }}` — expressions

Anywhere in this file, and anywhere in a
[style](https://local-workflows.github.io/getting-started/sdd/custom-style.md)'s `style.yml`.
The same notation `tasks.yml` uses, resolved before a single key is
read — so it works under any key, at any depth, in either file.

```json
{
  "sdd": {
    "specsDir": "${{ workspaceFolder }}/docs/specs"
  },
  "ai": {
    "ai@1": { "model": "${{ env.TEAM_MODEL }}" }
  }
}
```

**What is readable.** The four anchors — `workspaceFolder`,
`workspaceConfig`, `home`, `cwd` — plus `env.NAME`. `cwd` equals the
workspace root here: nothing is running, so there is no working
directory of its own.

**What is not.** `vars`, `params` and `run.context` belong to a *run*,
and these files are read before there is one. Asking for one is an
error that says so, not a silent blank.

**A value that is nothing but an expression keeps its type.**
`"model": "${{ env.MODEL }}"` stays a string; a
templated number stays a number.

**The env gate follows the destination, not the spelling.** There is
one spelling now, so which rule applies is decided by where the value
goes:

| Where | Rule |
|---|---|
| inside `ai.mcpServers` or `ai.acpAgents` | the [full gate](#env--the-gate-on-mcp-env-reads) — `env.allowed` (or a workflow's `env:`, or `allowedEnv:`) must grant the name |
| anywhere else in this file, and in `style.yml` | no grant needed; `env.denied` still vetoes |
| `tasks.yml` | no grant needed; unchanged |

A declaration under `ai.mcpServers` or `ai.acpAgents` is handed to a
third-party process, so it is granted a name. A value the engine
consumes itself is only vetoed. **`env.denied` wins everywhere** — it
is the one thing that is a veto rather than a default.

**An unresolvable expression fails loudly, naming the file.** It is
never left as literal text — a typo'd
`${{ workspaceFoldr }}` becoming part of a real path
is the failure this exists to prevent.

**With no workspace open** there is nothing for `workspaceFolder` to
mean, so a file that writes an expression is refused rather than
resolved to an empty string. A file that writes none is unaffected,
which is nearly every file.

---

## `ai` — per-plugin defaults

Every key under `ai:` that is not `mcpServers` is a **plugin
reference**, spelled exactly as a task would spell it, holding that
plugin's default args everywhere it runs:

```json
{
  "ai": {
    "ai@1": { "model": "auto" }
  }
}
```

A workflow file's own `plugins:` entry, an SDD stage entry, or a task's
own `args:` win over it — one key at a time, not one block at a time.

One default is worth knowing on its own: `model: auto` — the provider
picks. A pinned model name goes stale, and a team that has not formed
an opinion should not be made to hold one.

### Making a provider the default

`provider` is just another arg here, and this is the one place that
changes it for **every** `ai@1` task and every SDD phase at once —
tasks.yml workflows and SDD both read the same `ai."ai@1"` defaults
before anything more specific overrides them.

```json
{
  "ai": {
    "ai@1": { "provider": "kiro" }
  }
}
```

Nothing ships this way — `ai@1`'s own manifest defaults `provider` to
`ghcp`, and this file states no opinion until you write one. Writing
`"provider": "ghcp"` here yourself would be a no-op, restating what the
manifest already does; the reason to write this key at all is to name a
*different* default, `kiro` or otherwise.

**This only reaches `ai@1`.** The key it lives under is a plugin
reference (`ai."ai@1"`, exactly), and a phase whose style overrides
`sdd.uses` to a different plugin gets *that* plugin's own defaults
instead — a `provider` written here would reach nothing for it. Point a
default at whichever plugin `sdd.uses` actually names, if it is not
`ai@1`.

A single stage, or a single task, still wins over this with its own
`provider:` — the precedence above applies here exactly as it does to
`model`.

---

## `ai.mcpServers`

MCP servers for every `ai@1` session, in the standard `mcpServers` entry
shape every MCP README shows — copied unedited, plus four engine keys:

```json
{
  "ai": {
    "mcpServers": {
      "ado": {
        "command": "npx",
        "args": ["-y", "@azure-devops/mcp@2.9.0", "contoso"],
        "env": { "ADO_PAT": "${{ env.ADO_PAT }}" },
        "autoApprove": ["wit_work_item", "wit_query"],
        "disabledTools": ["wit_work_item_write"],
        "requiresWarmStartup": true
      }
    }
  }
}
```

| Key | | |
|---|---|---|
| `command` | `string` | the executable for a stdio server. Write it portably — `npx`, not `npx.cmd` |
| `args` | `array` | |
| `url` | `string` | the endpoint for an http server |
| `type` | `string` | `stdio`, `sse` or `http`. Inferred when absent — a `command` means `stdio`, a `url` means `http`, so `sse` must be said. `local` is an accepted alias for `stdio` |
| `env` | `object` | environment for the server process. `${{ env.NAME }}` is expanded under [the gate](#env--the-gate-on-mcp-env-reads) |
| `headers` | `object` | |
| `timeout` | `number` | milliseconds. Copilot's own **per-tool-call** timeout (default 180000) — not a connection or handshake timeout, and not what `requiresWarmStartup` addresses. Copilot has a long-standing bug where this value is silently ignored ([github/copilot-cli#172](https://github.com/github/copilot-cli/issues/172), still open); a server with genuinely slow individual tool calls may time out regardless of what is set here |
| `disabled` | `boolean` | `true` skips the server entirely |
| `autoApprove` | `array` | only these tools. Absent means every tool |
| `disabledTools` | `array` | never these tools. **A name in both lists is denied** — deny wins |
| `requiresWarmStartup` | `boolean` | `true` probes this server once before a session starts. See below |

The last four are the engine's own and are stripped before the runtime
ever sees the server: `autoApprove` becomes the SDK's per-server
allowlist, `disabledTools` session-level exclusions under their wire names.

### `requiresWarmStartup`

Some stdio servers' first spawn on a machine is slow enough to lose the
race against the vendor CLI's own (short, fixed) startup timeout — a
`command: npx` server whose package is not yet in the local cache is the
common case: `npx` resolves and installs it over the network before the
server ever answers the MCP handshake. Lose that race and the session
starts anyway, silently missing the server — the agent reports it has no
tools for it, and nothing in the log says why.

`requiresWarmStartup: true` opts a server into a preflight: before a
session starts, the engine spawns it, completes the handshake, and kills
it — off the vendor CLI's clock rather than racing it — once per exact
declaration (command, args, env, everything), remembered in the profile
folder so every later task skips straight past it. A version bump or any
other change to the declaration earns its own fresh probe automatically.
A server that will not come up within the probe's timeout fails the task
loudly, naming the server, before the vendor CLI is ever started.

Leave it unset for servers that already start fast — most of them,
including GH's built-in server, Playwright, and Chrome DevTools. Setting
it on one of those adds seconds to every task for a race that was never
close.

**Wire names.** An MCP tool's wire name is `<serverKey>-<toolName>` — the
server declared as `ado` above surfaces `wit_work_item` as
`ado-wit_work_item`. `autoApprove` and `disabledTools` take the **bare**
name and the engine adds the prefix; a task writing its own
`availableTools:`/`excludedTools:` must write the full wire name itself,
and one that writes the bare name there matches nothing, silently.

### `command` is made runnable for you

On Windows there is no `npx` — there is `npx.cmd`, a batch shim, and
process creation does not consult `PATHEXT`. So the declaration stays
portable and the engine makes it run: a command with no file extension is
resolved through the shell on Windows. A command that already carries
one — `node.exe`, an absolute path — is left exactly as written.

### It is a fourth source, not a replacement

The Copilot CLI's own discovery files still apply:

| File | Scope |
|---|---|
| `~/.copilot/mcp-config.json` | every session on this machine |
| `.mcp.json` in the workspace | this repository — commit it |
| `.github/mcp.json` in the workspace | same, GitHub's preferred spot |

`ai.mcpServers` is layered on top of those explicitly. The difference
worth caring about is that it is the only one the extension can show you,
toggle for you, and merge across scopes.

The editor's own `mcp.json` — user-level or `.vscode/mcp.json` — is
**not** among the CLI's files and is not bridged across. A server that
answers in the chat panel says nothing about a task.

A `mcpServers:` block in a workflow's or a task's `args:` is **not**
supported. It is deleted before the session is created, from every
direction — MCP servers are machine setup, not workflow definition.

### A server signed in once stays signed in

A server that authenticates over OAuth has nobody to ask during a run —
no window belongs to the task. Tokens are kept where the runtime keeps
them rather than discarded with the session, so one interactive sign-in
holds for every task after it.

### The MCP Servers view

The sidebar's **MCP Servers** section is a view over these two files,
collapsed by default and hidden entirely until a scope declares a server.
Every server both scopes declare shows up, labelled with which file
declared it. Ticking a checkbox writes `disabled`, `autoApprove` or
`disabledTools` **back into that same file**, so what the panel shows and
what a session resolves can never be two different truths.

| Command | |
|---|---|
| **Local Workflows: Start MCP Server (Discover Tools)** | spawn (or reach) the server, handshake, list its tools, disconnect |
| **Local Workflows: Reload MCP Servers** | re-read both files |
| **Local Workflows: Open MCP Config** | open the file that declared the selected server |

**Start does not leave anything running.** The Copilot CLI spawns its own
server per session, so a probed server is not a process your tasks talk
to — discovery is the honest version of "start".

---

## `ai.acpAgents`

Agents that speak the [Agent Client Protocol](https://agentclientprotocol.com)
(ACP), registered as a provider under the id you give them — a task's
`provider: kiro` is this key, not a name the extension ships with.
`ghcp` and `claude` are separate, built-in providers with their own
vendor SDKs; this is the general-purpose door for anything else that
speaks ACP.

```json
{
  "ai": {
    "acpAgents": {
      "kiro": {
        "command": "kiro-cli",
        "args": ["acp"]
      }
    }
  }
}
```

| Key | | |
|---|---|---|
| `command` | `string`, required | the executable that speaks ACP on stdio when run with `args` |
| `args` | `array` | arguments that put it into ACP mode — `["acp"]` for Kiro |
| `env` | `object` | environment for the agent process. `${{ env.NAME }}` is expanded under [the gate](#env--the-gate-on-mcp-env-reads), same rule as `ai.mcpServers` |

Once declared, `provider: kiro` on an `ai@1` stage or task runs on it —
same session shape as `ghcp` or `claude`: a response, and any tool call
the agent makes is auto-approved unattended, same as the other two
providers. `ai.mcpServers` reaches it too, forwarded on the same terms
— see [Agent Client Protocol](https://local-workflows.github.io/getting-started/acp.md#mcp-servers).

**The id cannot be `ghcp` or `claude`.** Those two are checked first,
always — an entry under either name is never reached, silently. Reaching
either vendor through ACP instead of its built-in provider needs a
different id.

Per-agent setup, gotchas and worked examples (Kiro, Claude and GitHub
Copilot via ACP, and adding one this page doesn't name):
[Agent Client Protocol](https://local-workflows.github.io/getting-started/acp.md).

---

## `env` — the gate on MCP env reads

`${{ env.NAME }}` inside any string value of an MCP
declaration reads the machine's environment — but only if something a
reviewer can see grants the name. A committed settings file arrives with
the repository, so nothing reads your environment by default.

**This gate is about MCP declarations, not about the notation.** The
same `${{ env.NAME }}` elsewhere in this file needs
no grant — see [expressions](#---expressions). What earns the gate is that
the value is handed to a third-party server process.

**Three grants, one veto:**

| | Granted by |
|---|---|
| `env.allowed` | this file — reviewed in the same PR as the servers that use it |
| the workflow's own `env:` block, and `.env` values | the file the task lives in. Its *value* also wins over the machine's |
| `allowedEnv:` on the `ai@1` task | the workflow's author, seen by its reviewer |
| **`env.denied`** | **always wins.** A name written here is unreadable no matter what any repository says |

A name nothing grants fails the task with an error saying how to grant
it — rather than expanding to an empty string and starting a server that
cannot authenticate.

Names only, never values. Nothing here ever holds a secret.

---

## `defaultFoldersToIgnoreScanning`

Folders the workspace scan skips when the repository has no `.gitignore`
to say so itself. Names, not globs. With a `.gitignore`, the scan follows
that instead and this is not consulted.

Declaring it replaces the built-in list for that scope rather than adding
to it. The built-in list is:

```
node_modules  .git  .vscode  .idea  TestResults
bin  obj  dist  out  coverage  build  target
logs  tmp  temp
```

---

## Every error the `sdd:` section can raise

All raised when the file is read, not in the middle of a run:

| The file says | The error |
|---|---|
| anything that is not valid JSON | `'<path>' is not valid JSON: ... Plain JSON only - no comments.` |
| a top-level key that is not `sdd`, `ai`, `env` or `defaultFoldersToIgnoreScanning` | `'<path>' has an unknown setting '<key>'. Valid sections: ...` |
| a key under `sdd:` that is not one of the five | `settings.json has an unknown key 'sdd.<key>'. Valid: style, specsDir, source, checkpoints, uses.` |
| `sdd.stages:`, which moved to the style | `settings.json has an unknown key 'sdd.stages'. Per-phase settings moved to the style: a stage's 'ai:' in style.yml says what that phase runs on, and 'sdd.uses' still says which plugin runs every phase.` |
| `sdd.style:` or `sdd.uses:` that is not text | `settings.json 'sdd.style' must be text.` |
| a `sdd.source:` or `sdd.checkpoints:` value not in its list | `settings.json has 'sdd.source: x' - expected one of 'manual', 'ado', 'gh', 'file'.` |

`sdd.stages` gets a message of its own rather than the plain list,
because somebody carrying that block has per-phase settings that used to
work — and a list of valid keys would leave them guessing which one
replaced theirs.

A key inside `ai."<plugin>"` is **not** checked here — those are plugin
args by design, and the plugin validates its own. The JSON schema the
extension contributes for `settings.json` is what flags a genuinely
misplaced key while you type.
