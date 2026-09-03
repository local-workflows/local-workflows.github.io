# Agent Client Protocol (ACP)

`ghcp` and `claude` are built-in providers, each wired to its vendor's
own SDK. `ai.acpAgents` in `settings.json` is the general-purpose door
for anything else: any command that speaks the
[Agent Client Protocol](https://agentclientprotocol.com) becomes a
`provider:` an `ai@1` task can name, the same way `ghcp` and `claude`
already are.

---

## When this is the page you want

**Not for `ghcp` or `claude`.** Both already have a dedicated provider
built on the vendor's own SDK — see
[Agent SDKs](https://local-workflows.github.io/getting-started/agent-sdks.md). That stays the
right way to reach either of them.

**For an agent this build ships no provider for.** Kiro is the case: no
SDK, no built-in `provider:` id — ACP is the only way in, and this page
covers it. Claude's and GitHub Copilot's own CLIs also speak ACP, and a
section below covers reaching them that way too, for the one time it's
useful — comparing behaviour across agents, or standardising a team's
whole setup on one protocol rather than three vendor SDKs.

---

## Declaring one

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

`provider: kiro` on an `ai@1` task now runs on it — same session shape
as `ghcp` or `claude`: a response, and any tool call the agent makes is
auto-approved unattended. To run *every* `ai@1` task and SDD phase on
it instead of naming it per task, see
[making a provider the default](https://local-workflows.github.io/getting-started/settings.md#making-a-provider-the-default).

**The id can be anything except `ghcp` or `claude`.** Those two are
checked first, always — an `acpAgents` entry under either name is never
reached. See [Claude, via ACP](#claude-via-acp) below for exactly this
case.

Full key reference (`command`, `args`, `env`, and the
`${{ env.NAME }}` gate):
[`ai.acpAgents`](https://local-workflows.github.io/getting-started/settings.md#aiacpagents).

---

## MCP servers

Every server declared under
[`ai.mcpServers`](https://local-workflows.github.io/getting-started/settings.md#aimcpservers)
is forwarded to an ACP agent too — same declaration, same
`${{ env.NAME }}` gate, same `requiresWarmStartup`
preflight `ghcp`/`claude` get. Nothing to add per agent.

**`stdio` servers are always forwarded.** ACP's own capability flags
never name `stdio` — it is the protocol's baseline, not something an
agent opts into. `http` and `sse` servers are only forwarded when the
agent's own `initialize` response actually advertised support for that
transport; one that did not is left out and logged (`system` stream),
naming the server and why, rather than sent and left to fail silently
inside the agent.

**`autoApprove` and `disabledTools` are not applied to an ACP agent.**
The protocol has no per-tool allow-or-deny at `session/new` the way
Copilot's and Claude's own SDKs do — a declaration that named either is
logged once, so it reads as a known gap rather than a silent no-op.

**`command` is resolved to an absolute path before it is sent.** ACP's
own schema documents a stdio server's `command` as an absolute path —
stricter than the bare `npx` every MCP README (and `ghcp`/`claude`)
accepts — and at least one real agent silently does not connect to a
server declared the lenient way. A bare command is resolved against
`PATH` first; a `.cmd`/`.bat` result (Windows only) is then wrapped for
`cmd.exe` the same way [Agent SDKs](https://local-workflows.github.io/getting-started/agent-sdks.md)
already documents for `ghcp`. Nothing to write differently — declare it
the way every MCP README shows, same as for `ghcp`/`claude`.

The full session about to start — every capability the agent
advertised and every server actually being sent, full command and args
included — is logged in one block when the session opens (`system`
stream): `ACP agent '<id>' session: {...}`. That block is the fastest
way to tell "nothing was sent" from "it was sent and the agent dropped
it" when a tool isn't showing up.

---

## Kiro CLI

**Prerequisite:** `kiro-cli` installed and signed in — `kiro-cli login`.
`kiro-cli whoami` reporting you're signed in does **not** mean the
session token is still valid, since that check is local-state only; an
expired token shows up as a slow `session/new` (repeated failing
retries) followed by a `-32603 Internal error` on the very first
prompt, which reads like a protocol bug and isn't one. Run
`kiro-cli login` again if you see that.

```json
{ "command": "kiro-cli", "args": ["acp"] }
```

- Logs are at `%TEMP%\kiro-log\logs\kiro-chat.log` — not stderr, and not
  `~/.kiro`, which is the separate Kiro IDE's own directory. Start there
  when an agent declared this way fails with an opaque error.
- `-a trust-all-tools` in `args` is an alternative to this engine's own
  unattended auto-approve: set on Kiro's own command line, it may answer
  its own tool-call permission requests before this engine ever sees
  one.
- `--agent-engine v1`/`v2`/`v3` selects Kiro's engine (default `v2`);
  add it to `args` if a particular engine version behaves differently
  for you.

---

## Claude, via ACP

An alternative to the built-in `claude` provider, using the official
[`claude-agent-acp`](https://github.com/agentclientprotocol/claude-agent-acp)
wrapper instead of this engine's own Claude Agent SDK integration.

**Prerequisite:** `npm install -g @agentclientprotocol/claude-agent-acp`
— not a dependency of this extension, an external binary you install
yourself, the same as `kiro-cli`. It authenticates the same way the
CLI does — the same sign-in `claude` itself uses.

```json
{
  "ai": {
    "acpAgents": {
      "claude-acp": { "command": "claude-agent-acp" }
    }
  }
}
```

**The id cannot be `claude`.** `AgentProviders` checks the built-in
providers first and only falls back to `ai.acpAgents` for an id
*neither* `ghcp` nor `claude` already owns — an entry named `claude`
here is never reached, silently, because the built-in always answers
first. Pick a different id (`claude-acp` above, or anything else) and
say `provider: claude-acp` on the task.

Prefer the built-in `claude` provider for everyday use — it's the same
vendor SDK this wrapper is also built on, with one fewer process in the
middle.

---

## GitHub Copilot CLI, via ACP

An alternative to the built-in `ghcp` provider.

**Prerequisite:** the same Copilot CLI the built-in provider needs —
[install it](https://local-workflows.github.io/getting-started/agent-sdks.md#prerequisites)
first if you haven't. `--acp --stdio` is the same binary, a different
mode.

```json
{
  "ai": {
    "acpAgents": {
      "ghcp-acp": { "command": "copilot", "args": ["--acp", "--stdio"] }
    }
  }
}
```

**Same rule as Claude above: the id cannot be `ghcp`** — that name is
the built-in provider's, and it is checked first every time. Use
`ghcp-acp` or another id of your own, and `provider: ghcp-acp` on the
task.

GitHub's own docs describe ACP support in Copilot CLI as **public
preview and subject to change** — a real caveat, not boilerplate: at
the time this was written, Copilot CLI's ACP reference didn't confirm
session resume (`session/load`) or tool-call events
(`tool_call`/`tool_call_update`) the way Claude's and Kiro's do. Verify
those specifically before relying on this route for anything unattended.

Prefer the built-in `ghcp` provider for everyday use, for the same
reason as Claude above.

---

## Others

Any CLI that implements ACP works the same way — declare its `command`
and whatever `args` put it into ACP mode, and it runs as a provider like
any other. The [ACP registry](https://agentclientprotocol.com/get-started/registry)
lists agents that speak the protocol; a growing list at the time of
writing includes Cline, Cursor, Devin, Goose, and others beyond the
three above.

If nothing is written here for the agent you're adding: check its own
documentation for an `acp` subcommand or an `--acp` flag — that's the
whole shape this page's examples follow — declare it, and read the log
line this engine writes on `initialize` (`Capabilities: {...}`, under
`"system"`) to see what it actually advertises before trusting it with
anything unattended.

---

## Next

- [`settings.json`](https://local-workflows.github.io/getting-started/settings.md#aiacpagents) —
  the full `ai.acpAgents` key reference.
- [Agent SDKs](https://local-workflows.github.io/getting-started/agent-sdks.md) — the built-in
  `ghcp`/`claude` providers this page is the alternative to.
- [`ai@1`](https://local-workflows.github.io/getting-started/plugins.md#ai1) — the args every
  provider shares, whichever one runs the session.
