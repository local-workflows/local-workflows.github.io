# Install

---

## What you need

| | |
|---|---|
| **VS Code 1.103** or newer | the extension will not activate below this |
| **PowerShell** | only for tasks that declare `shell: pwsh`, and for the `pwsh@1` plugin |
| **A GitHub Copilot sign-in** | only for AI tasks and [specs](https://local-workflows.github.io/getting-started/sdd/index.md) on the default `ghcp` provider. AI tasks saying `provider: claude` need a Claude sign-in (or `ANTHROPIC_API_KEY`) instead |
| **The GitHub Copilot CLI** | the same cases as above. `npm install -g @github/copilot` |

Both of those, in full — where the credential comes from, what to do when
the CLI is somewhere unusual, and what each failure means:
[Agent SDKs](https://local-workflows.github.io/getting-started/agent-sdks.md).

Everything else works with none of the above. Copilot is deliberately
*not* declared as an extension dependency, because that field
force-installs it — you should not get Copilot pushed onto you for tasks
you may never write.

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

---

## Checking it worked

A **Local Workflows** icon appears in the Activity Bar. Click it. With no
workflow files in the workspace yet you get an empty state offering to
create one — which is exactly where
[your first `tasks.yml`](https://local-workflows.github.io/getting-started/tasks.md)
starts.

The extension only activates when one of its views is opened, so nothing
runs in a workspace you never point it at.
