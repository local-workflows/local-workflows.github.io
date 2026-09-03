# Getting started

The manual. One page per feature, and each page is the whole feature:
a build-it-yourself walkthrough first, then every key, every rule, and
a complete example — for a person reading top to bottom and for a model
fetching one page to author a file.

In order:

1. **[Install](https://local-workflows.github.io/getting-started/install.md)** — the extension,
   and the one prerequisite that is not obvious.
2. **[Agent SDKs](https://local-workflows.github.io/getting-started/agent-sdks.md)** — GHCP,
   the default provider for AI tasks and specs, and what an agent
   session is given. `claude` is the other; everything that is not an
   AI task works without either.
3. **[Tasks](https://local-workflows.github.io/getting-started/tasks.md)** — `tasks.yml`, a
   library of commands. Start here: values, templating and anchors are
   covered once, on this page, for both formats.
4. **[Workflows](https://local-workflows.github.io/getting-started/workflows.md)** — one
   pipeline: stages, parallel jobs, an AI draft, a human gate.
5. **[Variables](https://local-workflows.github.io/getting-started/variables.md)** — every
   built-in variable on one page: the anchors, `params`, `vars`, `env`
   and `run.context`, and the one resolution order.
6. **[Spec-driven development](https://local-workflows.github.io/getting-started/sdd/index.md)**
   — requirements, design, plan, implementation, with a decision between
   each. The shipped styles, their exact prompts, and writing your own.
7. **[Plugins](https://local-workflows.github.io/getting-started/plugins.md)** — the last,
   smallest thing that executes. The six that ship, and writing your
   own in plain JavaScript.
8. **[`package.json` scripts](https://local-workflows.github.io/getting-started/scripts.md)** —
   your existing npm scripts, listed beside everything else.
9. **[`settings.json`](https://local-workflows.github.io/getting-started/settings.md)** — the
   engine's one configuration file.
10. **[Agent Client Protocol](https://local-workflows.github.io/getting-started/acp.md)** —
    adding an agent this build has no dedicated provider for, like Kiro,
    as `provider:` on an `ai@1` task.
11. **[Workspaces](https://local-workflows.github.io/getting-started/workspaces.md)** — where
    "here" is: folder, workspace and profile scopes, and what changes
    when you open a `.code-workspace`.
