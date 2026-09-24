# Install

---

## What you need

| | |
|---|---|
| **VS Code 1.103** or newer | the extension will not activate below this |
| **The YAML extension** (`redhat.vscode-yaml`) | installed automatically alongside this one — it is a real extension dependency, unlike Copilot below. It is what gives `tasks.yml` and `workflows/*.yml` schema validation and autocomplete as you type |
| **PowerShell** | only for tasks that declare `shell: pwsh`, and for the `pwsh@1` plugin |
| **A GitHub Copilot sign-in and the Copilot CLI** | only for AI tasks and [specs](https://local-workflows.github.io/getting-started/sdd/index.md) on the default `ghcp` provider. `npm install -g @github/copilot` |
| **A Claude sign-in (or `ANTHROPIC_API_KEY`) and the Claude Code CLI** | only for AI tasks saying `provider: claude`. `npm install -g @anthropic-ai/claude-code` |
| **The vendor's own CLI** | only for AI tasks naming one of the seven [ACP](https://local-workflows.github.io/getting-started/acp.md) providers — `kiro-cli`, `gemini-cli`, `codex-cli`, `cursor-cli`, `opencode-cli`, `copilot-cli`, `claude-cli` |

The two SDK providers in full — where the credential comes from, what
to do when the CLI is somewhere unusual, and what each failure means:
[Agent SDKs](https://local-workflows.github.io/getting-started/agent-sdks.md). The ACP ones:
[Agent Client Protocol](https://local-workflows.github.io/getting-started/acp.md).

Everything else works with none of the above. No AI vendor is declared
as an extension dependency, because that field force-installs it — you
should not get Copilot pushed onto you for tasks you may never write.

### Why the CLI, and not the Copilot extension

The extension does not call the GitHub Copilot extension — it drives the
**Copilot CLI**, a separate program, through GitHub's own SDK. So having
Copilot's editor extension installed and signed in buys nothing here,
and not having it costs nothing.

The CLI is ~340 MB per platform, which is why it is a prerequisite you
install rather than something bundled — the same call PowerShell gets.
Nothing checks for it until the first AI task actually runs, and when
one does without it, the failure says exactly this.

---

## Installing

From the Marketplace:

**[Local Workflows on the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=local-workflows.local-workflows)**

Or search `Local Workflows` in the **Extensions** view, or from a terminal:

```bash
code --install-extension local-workflows.local-workflows
```

### Kiro, VSCodium and other Code-OSS builds

Those editors cannot see the Microsoft marketplace. The same build is
published to Open VSX, which is the registry they search:

**[Local Workflows on Open VSX](https://open-vsx.org/extension/local-workflows/local-workflows)**

Search `Local Workflows` in that editor's Extensions view, or install
the `.vsix` from the Open VSX page by hand. Nothing in the extension is
different between the two registries; Kiro IDE runs it unchanged.

---

## Checking it worked

A **Local Workflows** icon appears in the Activity Bar. Click it. With no
workflow files in the workspace yet you get an empty state offering to
create one — which is exactly where
[your first `tasks.yml`](https://local-workflows.github.io/getting-started/tasks.md)
starts.

The extension activates once VS Code finishes starting up. With no
workflow files in the workspace it just sits idle until you open one of
its views.
