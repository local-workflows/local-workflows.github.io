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

## The six that ship

| | |
|---|---|
| `shell@1` | a command in the OS default shell — what `run:` becomes |
| `pwsh@1` | PowerShell 7+ |
| `file@1` | file operations |
| `ado-comment@1` | add or update one comment on an Azure DevOps work item |
| `http@1` | one HTTP(S) call — a webhook, a status poll, a JSON fetch |
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

### `http@1`

Calls one HTTP(S) endpoint, in-process — no curl, no shell quoting, no
platform gotchas. **Artifacts:** `status`, `body`, `headers`.

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
says so. Credential-bearing response headers (`Set-Cookie`,
`WWW-Authenticate`, `Authorization`, `Proxy-Authenticate`) are never
stored — artifacts land in the run record, and the run record is
secret-free by contract.

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
| `attachments` | list | | Files the session may open, as `[{ path, name }]`. Paths are **absolute**, and need not sit inside the working directory. |
| `detach` | `boolean` | `false` | Return the session id without waiting for the turn — for a conversation a person will join in the editor. `target` is not checked. |
| `cleanup` | `boolean` | `false` | Delete the provider's stored conversation once the task succeeds. A failed session is kept — it is the one most worth reopening — and a detached one is never touched. |
| `target` | `string` | | The file this session is expected to produce. The path is told to the agent, and the task fails if the session ends without it. |
| `title` | `string` | | A short human title, sent as the prompt's first line, so the chat history names the session. |
| `allowedEnv` | `string[]` | | Environment variable names that `${{ env.NAME }}` in an MCP declaration may read — **names only, never values**. One grant among three; `env.denied` vetoes them all. See [`settings.json`](https://local-workflows.github.io/getting-started/settings.md#env--the-gate-on-mcp-env-reads). |

That table is only what the *engine* does with a session. Everything a
session can be **told** — its tools, its servers, its standing
instructions — is the provider's own vocabulary, written under the
provider's own names. See
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

#### What the agent can see

The session's working directory is the task's `cwd:`, and every folder
open in the explorer is readable alongside it. In a multi-root workspace
that matters: the change is in one service and the reason for it is in
its sibling. The `.code-workspace` file itself is included when there is
one.

#### It enforces no gate

Not one. The place a human decides anything is a `trigger: manual` task
**you** put in the file — the same mechanism every other task uses.

A permission card per tool was considered and rejected: nobody reads the
fifth one, and a run recording "approved" against an unread card is worse
than a run recording nothing. Use `availableTools`/`excludedTools` to set
policy once instead.

**A permission the agent does ask for is answered in the conversation.**
The task registers no handler, so nothing decides on your behalf — the
request stays pending in the session, and you open it from the run panel
and answer it there. That is also why a task can sit waiting: a session
nobody opens is a session nobody has answered.

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
    "execution": { "target": "index.js" },
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
| `execution.target` | entry point; default `index.js` |

Each `args[]` entry:

| Field | Value |
|---|---|
| `name` | required |
| `type` | `string` \| `number` \| `boolean` \| `string[]` \| `object` \| `array` |
| `label` / `description` | |
| `required` | default `false` |
| `default` | applied when the task omits the arg |
| `options[]` | `string` type only — checked when the file is read *and* again when an expression resolves |
| `multiline` | rendering hint: an editor rather than a one-line box |

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
| `messages` | turns appended to the task's `session:`, in order |
| `session` | `{ id }` of a provider-owned conversation |

### What `ctx` gives you

Deliberately narrow — a plugin that reached for `fs` and `net` directly
could never be constrained later without breaking every plugin ever
written.

| | |
|---|---|
| `runId`, `taskId`, `attempt` | `attempt` is `1`, higher on retry |
| `cwd`, `root` | `root` is the run's starting directory — the project the definition belongs to. It is **not** a template anchor; there is no `${{ root }}` |
| `env` | resolved **non-secret** environment |
| `session` | this task's turns, oldest first |
| `secret(name)` | uncached, auto-masked |
| `log(text, stream?)` | `stdout` \| `stderr` \| `system` |
| `reportSession(id)` | report an external conversation as it opens |
| `cancelled`, `onCancel(fn)` | cooperative cancellation |

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

Plugins are read when the engine first starts. After editing one, reload
the window (**Developer: Reload Window**) to pick it up. A plugin that
fails to load is surfaced as a warning naming the file and the reason —
never silently skipped, because a missing plugin looks exactly like a
workflow bug.

---

## Why these six and no more

There is no marketplace, nothing is downloaded, and nothing is signed.
The six that ship are what the engine needs to be useful on its own: a
shell, a better shell, the filesystem, a work item's comment thread,
an HTTP endpoint, and an agent. Anything past that is a plugin you
write — a folder, a manifest, and a JavaScript file.
