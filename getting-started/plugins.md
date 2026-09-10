# Plugins

**A plugin is the last, smallest thing that actually executes.**

Every task in this extension bottoms out in one — a bare `echo`
one-liner, a workflow task, an SDD phase. There is no second execution
path underneath. A plugin never runs on its own: a
[task](https://local-workflows.github.io/getting-started/tasks.md) uses it, via `uses:`, and
supplies its `args:` — the task is the wrapper, the plugin is the thing
that executes.

---

## Everything desugars to a plugin

A task declares what it runs in one of two ways, and they are the same
thing:

```yaml
setup: echo Restoring...          # a bare string, which means...

setup:
  run: echo Restoring...          # ...this, which means...

setup:
  uses: shell@1                   # ...this.
  args:
    script: echo Restoring...
```

`run:` is author sugar. The parser rewrites it to `shell@1` with the
command as `script:`, so even the tersest task is a plugin call — which
is why a `run:` task's stdout and exit code can be captured with
`artifact:` exactly like any other plugin's.

Declaring both `run:` and `uses:` is an error: *"a task runs one thing."*

---

## `uses: id@major`

Always an id and a major version. Both halves are required:

```yaml
uses: pwsh@1                   # ok
uses: pwsh                     # error - a missing version is never implied
uses: actions/setup-node@v4    # error - not a marketplace action
```

Ids are lowercase kebab (`^[a-z0-9]+(-[a-z0-9]+)*$`), versions are whole
numbers, and there is no `id@0`.

**Only the major is pinned.** Minor and patch float underneath it, so a
fix reaches every workflow without anyone editing a file — and a breaking
change has to announce itself by taking a new major, which is a new
folder and a new reference.

A bare id is rejected rather than defaulting to `1`: an implicit version
means a workflow's meaning can change under it when a plugin ships a v2,
which is exactly the drift a committed file is supposed to prevent.

---

## `args:` is the boundary

Engine keys sit at the task level. Everything the plugin itself consumes
goes inside `args:`.

```yaml
- name: Say hello              # engine
  uses: greet@1                # engine
  args:                        # <- the plugin's, whatever it declares
    name: World
  artifact: GREETING           # engine
```

That split is not cosmetic. Two things break without it:

- **The same word legitimately means two things.** An `http@1` task wants
  a `timeout` for the request; the engine wants one for the task. Flat,
  only one can exist.
- **The parser could never reject an unknown key**, because unknown keys
  *would be* the plugin's args — so a misspelled `triger: manual` would
  silently become an arg and the human gate would disappear.

With `args:`, the task level is a closed set and that typo is a hard
error.

---

## The round trip

The keys you write under `args:` are exactly the names the plugin
**declares**, and they arrive in its code under those same names.
`greet@1` — which ships in
`Samples/HelloWorld/.local-workflows/plugins/greetV1/` — end to end:

**1. The plugin declares what it accepts**, in `plugin.json`:

```json
{
    "id": "greet",
    "version": { "major": 1, "minor": 0, "patch": 0 },
    "args": [
        { "name": "name",    "type": "string",  "required": true },
        { "name": "excited", "type": "boolean", "default": false }
    ],
    "artifacts": ["greeting"]
}
```

**2. Your task supplies them**, by those names, under `args:`:

```yaml
tasks:
  hello:
    uses: greet@1
    args:
      name: World          # <- declared above, and required
      excited: true        # <- declared above; omit it and the default is false
    artifact: GREETING
```

**3. The plugin reads them**, already resolved and type-checked:

```js
async execute(args, ctx) {

    const greeting = `Hello, ${args.name}${args.excited ? "!" : "."}`;

    return { success: true, artifacts: { greeting } };
}
```

**4. A later task reads what came back:**

```yaml
  announce:
    needs: hello
    run: echo ${{ run.context.GREETING }}
```

`greet@1` declares exactly one artifact, so
`${{ run.context.GREETING }}` *is* the greeting. Two or more
and you name the key — `${{ run.context.GREETING.greeting }}`.

Three names, one list. Misspell `naem:` in step 2 and the run does not
start: the parser knows what `greet@1` accepts without executing any of
it. See [checked before anything runs](#checked-before-anything-runs).

---

## Where plugins come from

| Origin | Location |
|---|---|
| **bundled** | compiled into the extension |
| **folder** | `<repo>/.local-workflows/plugins/`, every open folder |
| **workspace** | beside an open `.code-workspace` |
| **profile** | `~/.local-workflows/plugins/` |

The workspace origin exists only when you opened a `.code-workspace` —
see [Workspaces](https://local-workflows.github.io/getting-started/workspaces.md). Nothing is
downloaded and nothing is signed.

Bundled plugins register first, so one you write can never silently take
over a bundled id — that collision is reported as a load failure. Among
your own, **folder beats workspace beats profile**, so a repository that
ships its own `deploy@1` means **its** deploy. Two *different*
repositories declaring one id is still reported: neither is narrower, so
there is no right answer to pick.

To name a plugin call once per file and reuse it, see
[Naming a plugin once](https://local-workflows.github.io/getting-started/tasks.md#naming-a-plugin-once).

---

## What a plugin gives back

`artifact: NAME` stores the plugin's artifacts in a run variable, readable
anywhere later as `${{ run.context.NAME.key }}`. When a
plugin declares exactly one artifact, the variable *is* that value.

Run variables are **flat and run-scoped**. They cross stage boundaries
for free, with no second mechanism needed.

A task with no `artifact:` exports nothing. What a task exports is
*declared*, never implicit.

**One name, one value.** If two tasks declare the same `artifact:` name
you get a warning — and if both actually run, the second one to write it
**fails**, naming both tasks. It is a warning rather than an error
because only you know whether both can run: two branches of a condition
declaring one name is fine, since only one of them ever writes.

---

## Checked before anything runs

Every `uses:` in a file is validated against the plugin registry before a
single command executes: an unregistered reference, a missing required
arg, an arg the plugin does not accept, a literal of the wrong type,
a `${{ vars.X }}` declared nowhere, a
`${{ run.context.X.key }}` naming an artifact the producing
task never returns, and two tasks declaring the same `artifact:` name.

Whole `${{ }}` expressions are left alone — their
type is not knowable until the run resolves them — as is `env`, which
comes from the machine.

Everything found lands in the run panel's **Problems** tab, with a count
on the tab. Anything that names a task also marks that task's row with
a `!` in the step list.

That check is possible because a plugin's declaration lives in a
manifest separate from its implementation — the engine knows what a
plugin accepts without executing a line of it.

---

## The eight that ship

| | |
|---|---|
| `shell@1` | a command in the OS default shell — what `run:` becomes |
| `pwsh@1` | PowerShell 7+ |
| `file@1` | file operations |
| `ado-comment@1` | add or update one comment on an Azure DevOps work item |
| `ado-release@1` | Azure DevOps classic releases: list, create with pinned builds, promote — and a tab that picks what goes out |
| `http@1` | one HTTP(S) call — a webhook, a status poll, a JSON fetch |
| `mcp@1` | one tool call on an MCP server, with no model in the room |
| `ai@1` | an agent that works in the repo, on the provider you name |

They are the only plugins that are **not sandboxed** — see
[the sandbox](#the-sandbox) for why — and `ai@1` is the only one that
needs anything: a sign-in with whichever provider it names. Its default
`ghcp` needs a Copilot sign-in; `claude` needs a Claude one
([Agent SDKs](https://local-workflows.github.io/getting-started/agent-sdks.md) covers
both).

### `shell@1`

Runs a command line through the OS shell. **Artifacts:** `stdout`,
`stderr`, `exitCode`.

| Arg | Type | Default | Meaning |
|---|---|---|---|
| `script` | `string` | **required** | The command line to run. |
| `shell` | `pwsh` \| `cmd` \| `bash` | OS default | Absent means whatever the OS provides — `cmd` on Windows, `bash` elsewhere. |

`pwsh` must be named explicitly. A `$env:NAME` script with no `shell:`
runs in `cmd` on Windows and comes back empty.

### `pwsh@1`

Runs an inline PowerShell script, or a `.ps1` file. PowerShell 7+.
**Artifacts:** `stdout`, `stderr`, `exitCode`.

| Arg | Type | Default | Meaning |
|---|---|---|---|
| `script` | `string` | | Inline PowerShell. Mutually exclusive with `file`. |
| `file` | `string` | | Path to a `.ps1`, relative to the task's working directory. |
| `additionalArgs` | `string` | | Arguments appended when running `file`, e.g. `-Name "World"`. |
| `shell` | `pwsh` | | The only value accepted. A task that wants `cmd` wants a `run:` task. |
| `errorActionPreference` | `default` \| `stop` \| `continue` \| `silentlyContinue` | `stop` | Prepended as `$ErrorActionPreference`. |
| `progressPreference` | same values | `silentlyContinue` | Prepended as `$ProgressPreference`, so progress bars do not spray control characters into the log. |
| `failOnStderr` | `boolean` | `false` | Fail the task if anything reaches stderr, even on a zero exit. |
| `ignoreExitCode` | `boolean` | `false` | Report a non-zero exit without failing the task. |

`errorActionPreference` defaults to `stop` on purpose, and it is the
single most load-bearing line this plugin emits. Without it a failing
cmdlet is *non-terminating*: it writes to stderr, leaves `$LASTEXITCODE`
alone, and the task reports **success**.

It governs cmdlets only. A native command exiting non-zero is unaffected,
so `git diff --quiet` and friends still work as questions rather than
failures.

The script is staged as a UTF-8 `.ps1` and invoked, rather than passed to
`pwsh -Command` — so it is not capped by the command-line length limit,
quotes survive intact, and it is not visible to anything that can list
processes.

### `file@1`

Reads a file into a run variable, or writes one from a value — the
*executes* half of "AI proposes, a human approves, a plugin executes".
**Artifacts:** `content`, `path`, `lines`.

| Arg | Type | Default | Meaning |
|---|---|---|---|
| `operation` | `read` \| `write` \| `mkdir` | **required** | What to do with the path. |
| `path` | `string` | **required** | Relative to the workspace unless absolute. |
| `content` | `string` | | What to write. Required when writing, ignored when reading. |
| `createDirectories` | `boolean` | `true` | Create parent folders when writing rather than failing on a missing one. |

```yaml
tasks:
  read-notes:
    uses: file@1
    args:
      operation: read
      path: RELEASE_NOTES.md
    artifact: NOTES

  write-notes:
    needs: read-notes
    uses: file@1
    args:
      operation: write
      path: dist/notes.md
      content: ${{ run.context.NOTES.content }}
```

### `ado-comment@1`

Adds or updates one comment on an Azure DevOps work item. No AI —
plain REST against the work item comments API. **Artifacts:**
`commentId`, `action` (`added` | `updated` | `unchanged`).

The `key` decides add vs update: it rides inside the comment as a
short `[lw:key]` line, and each run looks for it in the item's
comments. Found means update, absent means add — so the same task run
twice lands on the same comment instead of piling up duplicates. One
work item can carry several, each under its own key.

Auth defaults to the **az CLI**: a short-lived token from your existing
`az login`, minted once per run — no PAT to create, scope, rotate or
leak. A machine that cannot have az says `auth: pat` and supplies one
through an env var instead.

| Arg | Type | Default | Meaning |
|---|---|---|---|
| `orgUrl` | `string` | **required** | `https://dev.azure.com/{org}` |
| `project` | `string` | **required** | The project the work item lives in. |
| `workItem` | `number` | **required** | The work item id. |
| `key` | `string` | **required** | What decides add vs update. No `[` or `]`. |
| `body` | `string` | **required** | The comment text. |
| `auth` | `az` \| `pat` | `az` | `az` uses the CLI's own login. `pat` is the fallback for a machine without az. |
| `patEnv` | `string` | `AZURE_DEVOPS_EXT_PAT` | Env var holding the PAT. Read only when `auth: pat`. Needs Work Items (Read & Write). |

Declare the org once and let tasks say only what changed:

```yaml
plugins:
  adoComment:
    uses: ado-comment@1
    args:
      orgUrl: https://dev.azure.com/contoso
      project: Platform

tasks:
  notify:
    uses: adoComment
    args:
      workItem: ${{ params.workItem }}
      key: release-status
      body: |
        Release ${{ vars.version }} passed staging.
```

### `ado-release@1`

Azure DevOps **classic releases** — the ones under
`vsrm.dev.azure.com`. The official ADO MCP server covers build
pipelines on `dev.azure.com` and has no classic-release support at all,
so `mcp@1` cannot reach them, and without a plugin every workflow
writes the same three `pwsh@1` tasks. Plain REST, no AI. Same auth as
`ado-comment@1`: `az` by default, `pat` as the fallback.

Four operations, one task each. **Artifacts** depend on the operation:

| `operation` | Needs | Stores |
|---|---|---|
| `definitions` | | `definitions`: `[{ id, name, path }]` |
| `versions` | `definition` | `versions`: per artifact alias, the builds it can take and the default. `environments`: the stages, `[{ id, name }]` in order. |
| `create` | `definition`, optional `pin`, `hold`, `description` | `releaseId`, `name`, `environments` keyed **by stage name**: `${{ run.context.CREATED.environments.UAT.id }}`, no search. |
| `promote` | `release`, `stage` | `releaseId`, `stage`, `status` |

| Arg | Type | Default | Meaning |
|---|---|---|---|
| `orgUrl` | `string` | **required** | `https://dev.azure.com/{org}`. The release host is derived from it. |
| `project` | `string` | **required** | |
| `operation` | `definitions` \| `versions` \| `create` \| `promote` | **required** | |
| `definition` | `number` | | Release definition id, for `versions` and `create`. |
| `pin` | map | | For `create`: artifact alias to build, by version id or build name — `{ "_web-ci": "4821" }`. An alias left out takes the definition's default (latest). A wrong alias or build fails before anything is created, naming what exists. |
| `hold` | list | | For `create`: stage names set to manual on this release, so they wait for `promote` instead of starting on their own. |
| `description` | `string` | | For `create`. |
| `release` | `number` | | Release id, for `promote`. |
| `stage` | `string` | | Stage name, for `promote`. |
| `auth` | `az` \| `pat` | `az` | As `ado-comment@1`. A PAT needs Release (Read, write & execute). |
| `patEnv` | `string` | `AZURE_DEVOPS_EXT_PAT` | Read only when `auth: pat`. |

**It ships a tab.** *ADO releases* in the run panel asks ADO what
exists right now, lets you tick release definitions, pick a build per
artifact and a stage, and starts the workflow with those as its params.
The run never asks mid-run; `promote` is the task that gates, one
approval card per release, each showing the resolved release and stage.
The org and project are remembered in the plugin's own database.

The workflow the tab starts declares two params, `lab` (the stage) and
`releases` (one entry per ticked definition: `definition`, `name`,
`pin`), and runs one task per release with `foreach:`:

```yaml
version: 1
name: Lab Release
label: "Release → ${{ params.lab }}"
cwd: none

params:
  lab:
    desc: Which stage
    options: [UAT, Perf, Prod]
  releases:
    desc: What goes out - filled by the ADO releases tab
    type: list

plugins:
  ado:
    uses: ado-release@1
    args:
      orgUrl: https://dev.azure.com/contoso
      project: Platform

stages:
  - name: deploy
    tasks:
      - name: Create and hold
        foreach: ${{ params.releases }}
        uses: ado
        args:
          operation: create
          definition: ${{ item.definition }}
          pin: ${{ item.pin }}
          hold: ["${{ params.lab }}"]
          description: "${{ item.name }} → ${{ params.lab }}"
        artifact: CREATED

      - name: Deploy to ${{ params.lab }}
        foreach: ${{ run.context.CREATED.items }}
        trigger: manual
        uses: ado
        args:
          operation: promote
          release: ${{ item.releaseId }}
          stage: ${{ params.lab }}
        artifact: PROMOTED
```

Open the tab, tick two definitions, pick their builds, choose UAT,
press *Start the workflow*: two releases are created with UAT held,
then the run parks on the first *Deploy to UAT* card. Approve, it
promotes that one and parks on the next. Reject, the rest are skipped.
Close VS Code between two cards and the run is still there, at the
card it stopped on.

### `http@1`

Calls one HTTP(S) endpoint, in-process — no curl, no shell quoting, no
platform gotchas. **Artifacts:** `status`, `body`, `headers`, and `json` —
the body parsed, present only when the body is JSON.

| Arg | Type | Default | Meaning |
|---|---|---|---|
| `url` | `string` | **required** | `http://` or `https://`. |
| `method` | `GET` \| `POST` \| `PUT` \| `PATCH` \| `DELETE` \| `HEAD` | `GET` | |
| `headers` | map | | Request headers. **Never put credentials here** — use `authEnv`. |
| `body` | `string` | | Sent as-is. `Content-Type` defaults to `application/json` when a body is given and no header names one. |
| `authEnv` | `string` | | Env var holding the full `Authorization` value, e.g. `Bearer <token>`. Read at call time and registered as a secret, so it is masked everywhere — a header literal would land in the resolved args a gate displays. |
| `timeoutMs` | `number` | `30000` | Per-request ceiling — a dead endpoint fails the task rather than hanging it. |
| `failOnHttpError` | `boolean` | `true` | A non-2xx answer fails the task. Say `false` when the status is data — polling, or a later `if:` reading it. |

```yaml
tasks:
  check-deploy:
    uses: http@1
    args:
      url: https://ci.example.com/api/status
      authEnv: CI_TOKEN
    artifact: DEPLOY

  announce:
    needs: check-deploy
    if: ${{ run.context.DEPLOY.status }} == 200
    uses: http@1
    args:
      url: https://hooks.example.com/T000/B000
      method: POST
      body: '{"text":"deploy is green"}'
```

The response body is stored as an artifact up to 1 MB — a response is
workflow data, not a download. Bigger bodies are truncated, and the log
says so. When the body is JSON it is also stored parsed, as `json`, so
a later task reads a field straight out of it:

```yaml
  create:
    uses: http@1
    args:
      url: https://dev.azure.com/contoso/Platform/_apis/release/releases?api-version=7.1
      method: POST
      authEnv: ADO_AUTH
      body: '{"definitionId": 12}'
    artifact: CREATED

  promote:
    needs: create
    uses: http@1
    args:
      url: https://dev.azure.com/contoso/Platform/_apis/release/releases/${{ run.context.CREATED.json.id }}/environments/${{ run.context.CREATED.json.environments[0].id }}?api-version=7.1
      method: PATCH
      authEnv: ADO_AUTH
      body: '{"status": "inProgress"}'
```

No `ConvertFrom-Json` task in between. A body that is not JSON has no
`json` key, and a task reading it fails naming that. Credential-bearing response headers (`Set-Cookie`,
`WWW-Authenticate`, `Authorization`, `Proxy-Authenticate`) are never
stored — artifacts land in the run record, and the run record is
secret-free by contract.

An `http@1` task touches no folder. If the file lives in the workspace
or profile scope, say so at the top of it —

```yaml
cwd: none
```

— and it stops asking which folder to run in before every run. See
[Which folder a run uses](https://local-workflows.github.io/getting-started/workspaces.md#which-folder-a-run-uses).

### `mcp@1`

Calls one tool on one MCP server and stores what it answered. No model
— the same wire an `ai@1` session uses, with the agent taken out of it.

Reach for it when you already know which tool you want. Getting a work
item through `ai@1` means paying a model to decide to make a call you
had already decided on, and the same prompt can make it twice, or not
at all. This makes it once.

| Arg | Type | Default | Meaning |
|---|---|---|---|
| `server` | `string` | **required** | A server declared under `ai.mcpServers` in [`settings.json`](https://local-workflows.github.io/getting-started/settings.md#mcp--which-servers-one-task-gets). A task chooses among the machine's servers; it cannot declare one. |
| `tool` | `string` | **required** | The tool's **bare** name, as the MCP view lists it — `wit_get_work_item`, not `ado-wit_get_work_item`. |
| `arguments` | map | | The tool's own arguments, handed over as written. |
| `allowedEnv` | `string[]` | | Extra env var names this task grants the server declaration, for a `${{ env.NAME }}` inside it. `env.denied` still vetoes. |
| `timeoutMs` | `number` | `60000` | Ceiling on the whole conversation — start, handshake, call. |
| `failOnToolError` | `boolean` | `true` | A tool answering with an error fails the task. Say `false` when that is data a later `if:` reads. |

**Artifacts:** `text` (every text block the tool returned, joined),
`structured` (its `structuredContent`, or `null`), `isError`.

```yaml
tasks:
  close-item:
    uses: mcp@1
    args:
      server: ado
      tool: wit_update_work_item
      arguments:
        id: ${{ params.workItem }}
        state: Closed
    artifact: CLOSED
```

**Nothing checks `arguments` before the run.** The shape belongs to the
server, so a misspelled argument name fails at the server, mid-run — not
when the file is read. That is the price of one task reaching every MCP
server instead of a plugin per vendor.

**A stdio server is a process per call.** `npx -y @azure-devops/mcp` has
to resolve, download and start before it is a server, every task, every
run. Fine once at the end of a spec run; expensive inside a loop. When a
call is hot, a hand-written plugin doing one HTTPS request is the better
answer — that is what `ado-comment@1` is.

**A server that wants an interactive sign-in cannot be used here.**
Nothing about a task can complete one — the same limit `ai@1` has, for
the same reason: no window belongs to a task.

Only text is stored. An image or an embedded resource is dropped and the
log says how many — an artifact is workflow data, not a download.

### `ai@1`

Runs an agent session on whichever provider the task names. It reads,
writes and works in the repo. **Artifacts:** `summary`, `files`.

Put a gate on a later task if you want to review before anything
downstream runs. This plugin changes your working tree.

| Arg | Type | Default | Meaning |
|---|---|---|---|
| `prompt` | `string` | **required** | What to ask the agent to do. |
| `provider` | `string` | `ghcp` | Which agent runtime the session runs on. The vendor is named here and nowhere else. Only registered providers are accepted — an unknown name fails, listing what exists. |
| `model` | `string` | provider's default | Which model runs the session. Usually set once in a `plugins:` entry. |
| `context` | map | | Named documents laid into the session before the prompt, keyed by name — usually file args, e.g. `{ requirements: { file: specs/requirements.md } }`. The session sees nothing not named here. |
| `attachments` | list | | Files the session may open, as `[{ path, name }]`. Paths are **absolute**. An attachment only says a file exists — something still has to open it, and the session's [directory limit](#where-a-session-may-read-and-write) applies when it does. |
| `detach` | `boolean` | `false` | Return the session id without waiting for the turn — for a conversation a person will join in the editor. `target` is not checked. |
| `cleanup` | `boolean` | `false` | Delete the provider's stored conversation once the task succeeds. A failed session is kept — it is the one most worth reopening — and a detached one is never touched. |
| `keep` | `boolean` | `false` | Hold the session open after the turn instead of disposing it, so a later call can carry the same conversation on. The id is written to the log: `Session <id> kept open`. |
| `continueSession` | `string` | | A session id from an earlier `keep: true` call. Still held, this turn runs on that conversation — its own memory, on top of whatever the prompt supplies fresh. Gone, a new session starts, silently. |
| `interactive` | `boolean` | `false` | Says a person is watching and can answer a question — see [when the agent asks you something](#when-the-agent-asks-you-something). Off, the agent is told nobody is there and carries on with an assumption. |
| `target` | `string` | | The file this session is expected to produce. The path is told to the agent, and the task fails if the session ends without it. |
| `systemInstructions` | `string` | | Standing instruction for every turn, appended to the provider's own guardrails — never replacing them, so its safety instructions always survive alongside this. Either the text itself, or `file://` followed by a full path, read once when the session starts. A provider's own name for the same idea (`systemMessage`, `systemPrompt`) written straight onto the task as an undeclared arg does nothing — both are ignored, so this is the one channel. |
| `title` | `string` | | A short human title, sent as the prompt's first line, so the chat history names the session. |
| `verbatim` | `boolean` | `false` | Send `prompt` exactly as given — no title, `context`, or `target` instruction added. Off for every ordinary task, since composing that message is this plugin's job. It exists for a rerun that hands back the text a person edited in the AI Session tab, which is already composed — composing it again would repeat the title, the documents and the target instruction inside themselves. Attachments still go, since they are files the session opens, not text in the prompt. |
| `allowedEnv` | `array` | | Environment variable names that `${{ env.NAME }}` in an MCP declaration may read — **names only, never values**. One grant among three; `env.denied` vetoes them all. See [`settings.json`](https://local-workflows.github.io/getting-started/settings.md#env--the-gate-on-mcp-env-reads). |
| `mcp` | map | every server | Which of `settings.json`'s MCP servers this session gets, and which of their tools — `{ servers: [ado], tools: { ado: [wit_get_work_item] } }`. Both allowlists, both optional: no `servers` means every declared server, no `tools` means every tool of each selected server, `servers: []` means none. A name settings.json does not declare **fails the task**, naming the declared ones. A server `disabled` in settings.json stays out even when named here. A task chooses among the machine's servers; it cannot declare one. See [`settings.json`](https://local-workflows.github.io/getting-started/settings.md#mcp--which-servers-one-task-gets). |

That table is only what the *engine* does with a session. Standing
instruction is `systemInstructions` above, always appended rather than
replaced; everything else a session can be **told** — its tools, its
servers — is the provider's own vocabulary, written under the provider's
own names. See
[args this build has never heard of](#args-this-build-has-never-heard-of).

```yaml
plugins:
  ai:
    uses: ai@1
    args:
      provider: ghcp
      model: claude-sonnet-4.5

tasks:
  draft:
    uses: ai
    args:
      title: Draft the release notes
      prompt: Summarise the commits since the last tag.
      context:
        changelog: { file: CHANGELOG.md }
    artifact: DRAFT
```

`context` pastes a document's *content* into the session. `attachments`
only tells the agent a file exists and lets it open it. Reach for
`context` when the agent must read something, `attachments` when it might
want to.

#### Writing an `attachments:` path

An attachment path is **absolute**. Nothing resolves a relative one — it
leaves the engine as you wrote it. Build one from a
[directory anchor](https://local-workflows.github.io/getting-started/tasks.md#directory-anchors)
rather than typing a machine-specific path:

```yaml
vars:
  notes: ${{ home }}/ai-notes

tasks:
  draft:
    uses: ai@1
    args:
      title: Draft the design
      prompt: Draft the design in my house style.
      attachments:
        - path: ${{ vars.notes }}/house-style.md
          name: style
        - path: ${{ workspaceFolder }}/docs/glossary.md
          name: glossary
```

`${{ home }}` is for files that are **yours rather
than the project's** — a house style you want every repository to be able
to read. `${{ workspaceFolder }}` is for files the
repository owns. Both are absolute, so both satisfy the contract.

**Keep an attachment inside the folders the session may reach.** On
`claude` an attachment is delivered as a path in the prompt and the agent
opens it with an ordinary file tool — so a path outside the task's `cwd`
and the editor's open folders is refused like any other, and the
`${{ home }}` case above is the one that bites.
Either open that folder in the editor, or paste the content in with
`context:` instead: a `context:` file is read by the engine before the
session starts, so the limit never applies to it.

#### MCP servers — reading systems there is no plugin for

An `ai@1` session can reach any system with an MCP server — an issue
tracker, a wiki, Azure DevOps. Declare them in
`.local-workflows/settings.json`, under `ai.mcpServers` — every key, the
env gate, wire names, and what the MCP sidebar view does are on
[`settings.json`](https://local-workflows.github.io/getting-started/settings.md#aimcpservers).

A `mcpServers:` block in a workflow's args is not supported. It is
deleted before the session is created, from every direction —
MCP servers are machine setup, not workflow definition. The
`Session options:` line in the task log shows exactly what was sent, and
it will not be there.

When to use an MCP server instead of writing a plugin:

| | Reach for |
|---|---|
| The same read every run, feeding a durable artefact | **a plugin** |
| Exploratory — you don't know what you're looking for yet | **an MCP server** |
| Attachments — a `.docx` spec, a screenshot | **an MCP server**, clearly |
| It must run headless (schedule, CI, no Copilot sign-in) | **a plugin** |

The deciding difference is that a plugin runs without a model at all,
fails with a message naming the variable, and returns the same thing
twice.

#### Carrying one conversation into a second turn

`keep: true` holds the session after its turn, and `continueSession:`
picks it back up — the second turn has the first one's own memory, on top
of whatever its prompt supplies fresh.

A held session lives in the running editor's memory and is found by id.
No expression reads that id, so this pair is for a panel that starts both
turns — the spec panel's **Revise** does exactly this — rather than
something a workflow file wires up on its own. Between two tasks in a
file, the thing to pass forward is what the first one *produced*:
`artifact:` on the first, `context:` on the second. A file is a thing a
person can read; a thread is not.

#### Where a session may read and write

The session's working directory is the task's `cwd:`, and every folder
open in the explorer is readable alongside it. In a multi-root workspace
that matters: the change is in one service and the reason for it is in
its sibling. The `.code-workspace` file itself is included when there is
one.

Those folders are also the **limit**. A tool call naming a file outside
them is refused and the agent is told why, on every provider, and no
workflow file can turn the check off. The one switch that opens it is
[`debug`](https://local-workflows.github.io/getting-started/settings.md#debug), which lives in
your profile's `settings.json` and therefore cannot arrive with somebody
else's clone.

This is not what the vendors' `cwd` and `additionalDirectories` do on
their own. Those are a *permission scope*: a path outside them is turned
into a permission request rather than refused, and an unattended session
has to answer its own requests. The check below is what makes the scope
mean something.

| | |
|---|---|
| a file named in a tool's arguments — `path`, `file_path`, `cwd`, and the rest | **checked**, at any depth, an MCP server's own path arguments included. A relative name is resolved first and a symlink is followed, so a link inside a folder pointing outside it is still an escape |
| a shell command the agent runs | **contained by the operating system where the OS can** — the `claude` provider asks its SDK for a sandbox, reads locked to the same folders. Where the sandbox is unavailable, the session runs on and the log says the shell is not contained |
| a path the vendor itself reports as out of scope | refused like any other |

`cd .. && cat secrets` names no path in any argument. That is the gap,
and it is why the answer for a shell is an OS sandbox rather than a
check on the text.

#### The project's own `CLAUDE.md`

A session is handed the `CLAUDE.md` — or `AGENTS.md` — at the top of
each folder it may work in, appended to its instructions as text.

Those only. No walking up the directory tree, no `~/.claude/CLAUDE.md`,
and `@import` lines are not followed. Each of those reads a file
**outside** the folders the session is held to, which is the thing being
prevented. A file longer than 32,000 characters is cut, and the cut says
so in the text.

It goes in labelled as the project's own notes, not as something the
engine wrote. The file arrives with a clone of whatever repository the
task points at, so it is that project's conventions — not an instruction
that outranks the task you wrote.

#### It enforces no approval gate

Not one. The place a human decides anything is a `trigger: manual` task
**you** put in the file — the same mechanism every other task uses.

A permission card per tool was considered and rejected: nobody reads the
fifth one, and a run recording "approved" against an unread card is worse
than a run recording nothing. Use `availableTools`/`excludedTools` to set
policy once instead.

**A permission request the agent raises is answered for you, and the
answer is the directory limit above.** Inside the session's folders it is
approved; outside them it is refused with a reason the agent is told. No
request is left pending, because a pending request in an unattended run
is a task that hangs until its `timeout:` kills it.

#### When the agent asks you something

A question is not a permission, and it has its own door: one tool,
`ask_user`, the same on every provider. Three shapes —

- **Pick one** — two or more options.
- **Pick several** — options, more than one allowed.
- **Free text** — no options at all.

— and you can always type your own answer instead of picking, whichever
shape it is. The options an agent offers are its guess at the answers,
not the list of answers that exist.

It waits only when somebody is there to answer. `interactive: true` says
that somebody is — the spec panel sets it for every phase it runs. Off,
which is every workflow task unless the file says otherwise, the agent is
told nobody is watching and told to carry on with a stated assumption
rather than stop.

The question is drawn in the step's **AI Session** tab in the run panel,
and the tab is marked while it waits, so a reader on **Logs** can see
that the session is not stuck but asking. Answer it there and the turn
continues.

#### Args this build has never heard of

`ai@1` passes an arg it does not declare straight to the provider. The
runtime behind it has its own session options and gains more every
release, and restating each one here would mean a new build to expose a
switch somebody else already shipped.

```yaml
    uses: ai@1
    args:
      prompt: Draft the release notes.
      contextTier: long_context      # <- not ours; the runtime's
```

The declared args are still checked for type. An arg that is neither
declared nor understood by the provider is simply ignored by it — so a
misspelling fails quietly here rather than being named, which is the
price of the reach.

#### Stopping a runaway session

An agent works until it decides it is done, and "done" is sometimes a
long way off. Three brakes exist, and none of them is new vocabulary:

| Brake | Where it goes | What it does |
|---|---|---|
| the Stop button | the run panel | ends the turn cleanly. The provider is asked to interrupt, given a moment to finish the sentence, then cut off — and the task reports **cancelled**, not failed |
| `timeout:` | on the task, beside `uses:` | the same stop, pulled automatically. See the [task keys](https://local-workflows.github.io/getting-started/tasks.md) — `timeout: 10m` reads as ten minutes |
| a turn cap | the provider's own vocabulary, through the passthrough | `maxTurns: 20` with `provider: claude` caps how many turns the session may take. Its name and meaning are the provider's, like every passthrough arg |

An unattended pipeline wants at least one of the last two on every
agent task: the Stop button assumes someone is watching. And remember
that a timeout counts as a *retryable* failure — a `retries:` on the
same task will start the session again, which on an agent task is
usually the opposite of what the timeout was for.

#### One plugin, every vendor

The vendor is `provider:`, not the plugin's name. A second vendor is a
second value — and a file that runs two of them declares two `plugins:`
entries over the same `ai@1`. There is deliberately no read-only preset:
it would have to mean something specific per vendor, and a safety setting
whose meaning changes with `provider:` is worse than none. A session that
must not touch the repository says exactly that in `excludedTools:`, and
the gate below it is what the workflow actually rests on.

---

## Writing a plugin

Plain JavaScript. No build step, no dependency on this extension,
nothing to register — drop a folder in and any task can `uses:` it.

`Samples/HelloWorld/.local-workflows/plugins/greetV1/` in the repository
is a complete working example — a manifest, an implementation, a declared
secret and a returned artifact. Copy the **folder** to
`~/.local-workflows/plugins/` and it is available in every workspace as
`uses: greet@1`.

Two layouts: a single `my-plugin.js`, or a `my-plugin/` folder with an
`index.js`. Prefer the folder — see [the sandbox](#the-sandbox).
**A folder must be named `<id>V<major>`** — `greetV1` — and the folder's
major and the manifest's major must agree; a name that disagrees fails at
load, saying so.

```
.local-workflows/plugins/greetV1/
  plugin.json
  index.js
  node_modules/        # optional - vendored npm packages
```

### `plugin.json`

Says what it *is*. Id and version live here and nowhere else, so the
engine can validate a task without executing any of it.

```json
{
    "id": "greet",
    "name": "Greet",
    "description": "Greets someone by name.",
    "version": { "major": 1, "minor": 0, "patch": 0 },
    "args": [
        { "name": "name", "type": "string", "required": true },
        { "name": "excited", "type": "boolean", "default": false }
    ],
    "artifacts": ["greeting"],
    "secrets": ["GREET_TOKEN"]
}
```

| Key | Value |
|---|---|
| `id` | lowercase letters, digits, hyphens |
| `name` | falls back to `id` |
| `description` | |
| `version` | `{ major, minor, patch }`, integers, major ≥ 1 |
| `args[]` | **ordered** array — order is information when a form is drawn from it |
| `artifacts[]` | keys the plugin always produces |
| `artifactsFrom` | name of a `string[]` arg whose value **is** the artifact keys, for a plugin that cannot know them in advance |
| `secrets[]` | env var names readable through `ctx.secret()` |
| `secretsFrom` | name of a `string` arg holding a further env var name |
| `passthrough` | `true` forwards undeclared args instead of rejecting them — see below |
| `ui` | `{ label, entry? }` — the plugin's own page, shown as a tab. See [Plugin apps](https://local-workflows.github.io/getting-started/plugin-apps.md) |

The entry point itself is never named in `plugin.json`. The loader reads
it from `package.json`'s `main` field, falling back to `index.js` when
that is absent.

Each `args[]` entry:

| Field | Value |
|---|---|
| `name` | required |
| `type` | `string` \| `number` \| `boolean` \| `string[]` \| `object` \| `array` |
| `label` / `description` | |
| `required` | default `false` |
| `default` | applied when the task omits the arg |
| `options[]` | `string` type only — checked when the file is read *and* again when an expression resolves |
| `multiline` | rendering hint: an editor rather than a one-line box. It also picks the arg a manual gate's card shows in full — see [what a gate card shows](https://local-workflows.github.io/getting-started/workflows.md#what-a-gate-card-shows) |
| `logged` | `false` keeps this arg's value out of the log's `Args:` block — for a value the plugin writes itself in a better form. `ai@1` sets it on `prompt:`, because it logs the whole prompt it actually sent |

Load-time errors (refused when the manifest loads, never mid-run):
`options` on a non-`string` arg · `options` empty · `default` outside
`options` · `secretsFrom` naming a missing or non-`string` arg · folder
name disagreeing with `version.major`.

What declaring args buys — real errors before the task runs: a missing
`required` arg fails naming it, a type mismatch fails naming the arg and
the expected type, an undeclared arg fails so a typo is caught. `object`
is a map you interpret yourself — validate what is inside it in
`execute` and fail before doing any work.

**`passthrough: true`** is for a plugin that is a **doorway** to
something with its own, larger surface — `ai@1` and an agent runtime is
the case that made it exist. Default to leaving it off: it buys reach
and costs the message a person actually needs. Without it, `retires: 3`
fails saying "no input named 'retires'. It accepts: target, retries,
dryRun". With it, that typo travels silently to whatever is behind you.
Args you *do* declare are still validated either way.

### The implementation

Plain CommonJS, one export:

```js
module.exports = {
    async execute(args, ctx) {

        const greeting = `Hello, ${args.name}${args.excited ? "!" : "."}`;

        ctx.log(greeting);

        return { success: true, artifacts: { greeting } };
    }
};
```

`args` arrives resolved and already checked — templates expanded and
values validated against your manifest, before a line of your code runs.

### What you return

| Field | |
|---|---|
| `success` | required |
| `artifacts` | stored under the task's `artifact:`. **No secrets.** |
| `message` | short reason, shown in the run panel on failure |
| `session` | `{ id }` of a provider-owned conversation |
| `ui` | a tab of your own in the run panel — see below. **No secrets.** |

### A tab of your own

Return `ui` and the run panel adds a tab to your step, beside Logs and
Artifacts, with the name you give it. It shows up when the step ends.

You send **content, not code**. Pick one of three shapes and the panel
draws it with its own components, so your tab looks like the rest of
the panel:

```js
// A document.
return { success: true, ui: { type: "markdown", label: "Report", content: "# All green\n\n12 checks passed." } };

// A grid. One entry per column in every row; anything not a string is shown as JSON.
return { success: true, ui: { type: "table", label: "Coverage",
    columns: ["File", "Lines"], rows: [["src/a.ts", 91], ["src/b.ts", 78]] } };

// Anything else - drawn as the same expandable tree the Artifacts tab uses.
return { success: true, ui: { type: "json", label: "Response", content: { status: 200, items: [] } } };
```

| Field | |
|---|---|
| `type` | `markdown` \| `table` \| `json` |
| `label` | the tab's name — required |
| `content` | `markdown`: a string · `json`: any value |
| `columns`, `rows` | `table` only — `columns` is an array of strings, `rows` an array of arrays |

Three things to know:

- **There is no HTML and no script**, on purpose. A sandboxed plugin
  handing back markup would have that markup run with the panel's own
  access, which is exactly what the sandbox exists to prevent. If a
  shape you need is missing, that is a change to the engine, not a hole
  to work around.
- **It is not an artifact.** Nothing downstream can read it and no
  `${{ }}` expression reaches it. It is for a person
  reading the run. Put anything a later task needs in `artifacts`.
- **It lives with the session, not the run record.** A panel opened
  later in the same editor window shows it; a run read back from the
  store after a restart does not. Secrets are masked on the way through,
  the same way args are.

A `ui` the panel cannot draw — a `type` it does not know, a `table`
with no `columns` — is dropped and the step's log says why. The task
itself still succeeds; the tab is on top of the work, not part of it.

### Your own app in a tab

The result `ui` above is a report: it appears when the step ends and it
is read-only. When you want an actual page — forms, buttons, tables,
something that is there whether or not anything is running — ship one
with the plugin:

```json
"ui": { "label": "Greet app" }
```

plus a `ui/index.html` in the folder. The page becomes a tab in the run
panel and the spec panel, talks to the plugin through `window.lw`, calls
a second export `handle(request, ctx)`, and has SQLite tables of its own
through `ctx.db` / `lw.db`.

The whole contract — files, `lw` API and its exact shapes, `handle`,
the database, what a page cannot do, `debug: true`, Reload Plugins, and
the complete `greet@1` example — is on its own page:
**[Plugin apps](https://local-workflows.github.io/getting-started/plugin-apps.md)**.

### What `ctx` gives you

Deliberately narrow — a plugin that reached for `fs` and `net` directly
could never be constrained later without breaking every plugin ever
written.

| | |
|---|---|
| `runId`, `taskId`, `attempt` | `attempt` is `1`, higher on retry |
| `cwd`, `root` | `root` is the run's starting directory — the project the definition belongs to. It is **not** a template anchor; there is no `${{ root }}` |
| `env` | resolved **non-secret** environment |
| `secret(name)` | uncached, auto-masked |
| `log(text, stream?)` | `stdout` \| `stderr` \| `system` |
| `reportSession(id)` | report an external conversation as it opens |
| `cancelled`, `onCancel(fn)` | cooperative cancellation |
| `db` | this plugin's own SQLite tables — see [Plugin apps](https://local-workflows.github.io/getting-started/plugin-apps.md#the-plugin-database). Absent when the engine has nowhere to write |

There is no route from `ctx` to the engine, the run store, or another
task, and no `ask()` — approval is `trigger: manual` on the task that
acts, which blocks *between* tasks, holds nothing in memory, and
survives closing the editor.

### Secrets

You read a secret only through `ctx.secret()`, and only for names
declared in `secrets`. There is no browsing `process.env` for more — a
sandboxed plugin has no access to the environment, so anything
undeclared is simply absent. Values are read at call time, never cached,
and registered with the run's masker on the way out, so they are
redacted if they ever reach a log.

When the *workflow* names the variable — one person's token is in
`ADO_PAT`, another's in `WORK_ADO_PAT` — declare an arg to hold the name
and point `secretsFrom` at it:

```json
{
    "args": [
        { "name": "patEnv", "type": "string", "default": "ADO_PAT",
          "description": "Environment variable holding the token." }
    ],

    "secretsFrom": "patEnv"
}
```

```js
const token = ctx.secret(args.patEnv);
```

The host resolves the name before building the sandbox's secret map, so
a plugin still receives a fixed set and never a way to ask for more.
Fail with a message naming the variable. Never prompt for it.

### The sandbox

User plugins only; bundled plugins are not sandboxed — `pwsh@1`'s whole
job is to run a shell command, and sandboxing the escape hatch would be
theatre. The line is trust, not capability: bundled ships with the
engine, yours arrived with a repository. (It is also why a user plugin
cannot wrap the Copilot SDK — that needs to spawn the CLI, and the
sandbox denies `child_process`.)

Three layers, and only one of them is enforced below JavaScript:

| Layer | What it stops | Where |
|---|---|---|
| **A separate process** | reaching the engine, the run store, other sessions, VS Code | a fresh worker per call |
| **Node's permission model** | reading outside the plugin's own root, writing anywhere, spawning, native addons | `--permission --allow-fs-read=<plugin root>` |
| **A module allowlist** | `require("fs")`, `net`, `http`, `dns`, `child_process`, `vm`, … | inside the worker |

The permission model is the load-bearing one — Node enforces it, so no
JavaScript trick gets around it, and that is measured rather than
assumed: with the flags removed, the escape tests land three escapes the
allowlist alone does not catch. Because the allowlist alone is not
enough, **the sandbox fails closed**: a runtime that will not accept the
permission flags gets user plugins refused, never loaded unconfined.

A plugin may `require` these builtins and no others — all pure
computation:

```
assert  buffer  crypto  events  path  punycode
querystring  string_decoder  url  util  zlib
```

**Anything absent is denied**, so a module added to Node in a future
version is denied by default rather than allowed by oversight. A plugin
runs in a **fresh process per call** — nothing it leaves behind can
reach the next task.

The boundary is the plugin's own root:

| Layout | Root | Can read |
|---|---|---|
| `plugins/my-pluginV1/` (folder) | the folder | anything in it, including its `node_modules` |
| `plugins/greet.js` (single file) | that one file | **nothing but itself** |

A loose file is granted the one file, not the folder it sits in — that
folder is everybody else's plugin, and a relative `require` needs no
`fs`, so the allowlist would never see it. Anything with data files
beside it needs a folder.

**npm dependencies:** give the plugin a folder, `npm install` inside it,
and `require` normally — its own `node_modules` is inside the permitted
root. A dependency is held to exactly the same rules: a library cannot
`require("fs")` on the plugin's behalf. Ship `node_modules` with the
plugin; nothing here downloads anything, by design.

### Reloading

Plugins are read when the engine first starts. After editing one, run
**Local Workflows: Reload Plugins** from the command palette — or reload
the window. A plugin that fails to load is surfaced as a warning naming
the file and the reason — never silently skipped, because a missing
plugin looks exactly like a workflow bug.

---

## Why these eight and no more

There is no marketplace, nothing is downloaded, and nothing is signed.
The eight that ship are what the engine needs to be useful on its own: a
shell, a better shell, the filesystem, a work item's comment thread, an
HTTP endpoint, any MCP server, and an agent. Anything past that is a
plugin you write — a folder, a manifest, and a JavaScript file.

Two of those eight are **general doors** rather than integrations, and
that is what keeps this list from growing one plugin per vendor. `http@1`
reaches any endpoint; `mcp@1` reaches any MCP server. A system with an
MCP server — work items, tickets, chat, a wiki — becomes a task with no
new plugin and no new build.

So a hand-written plugin is worth it when the door is not good enough,
not merely because a system is worth reaching. `ado-comment@1` is the
example: one HTTPS request instead of a process per call, arguments
checked before the run, and a failure that names the variable.
