# `package.json` scripts

A **Scripts** section at the bottom of the sidebar lists every script in
your `package.json`, and runs each one in a terminal with the right
package manager.

---

## What you get

The section appears on its own once the workspace has a `package.json`
with a non-empty `scripts` block. There is nothing to configure and
nothing to declare — you do not add these to a `tasks.yml`.

Each row is one script: its name, with the command it actually runs shown
beside it. That second half is the point — it is the whole question a
reader has about a script named `ci:verify`.

Same contract as every other row in the sidebar: **clicking opens,
the inline ▶ runs.** Clicking a script opens `package.json` scrolled to
the line that script is declared on, not to the top of a two-hundred-line
manifest. `npm run deploy` is not a thing a stray click should start.

---

## It works out your package manager

The one thing this does that a hardcoded `npm run` would not.

`npm run build` in a pnpm workspace either fails outright or — worse —
succeeds against the wrong dependency tree. So the manager is resolved
per package, in this order:

1. **A `packageManager:` field**, if the manifest has one. Corepack's
   field is an explicit statement by the repository, so it wins over
   anything found on disk. The version is ignored: only the name at the
   front matters, and pinning to a version you may not have installed
   would break the one thing the row does.
2. **The nearest lockfile**, searching the package's own folder and then
   every folder above it.
3. **`npm`**, if there is no lockfile anywhere above. It is the one
   manager certain to be installed alongside Node, and a repository with
   no lockfile at all is usually an npm one that has not committed it.

Walking *up* for the lockfile is what makes monorepos work. In a pnpm or
yarn workspace the lockfile exists exactly once, at the root, while the
packages that need it sit several folders down with nothing of their own.

When two lockfiles are present, the less common one wins:

| Lockfile | Manager |
|---|---|
| `pnpm-lock.yaml` | pnpm |
| `bun.lockb`, `bun.lock` | bun |
| `yarn.lock` | yarn |
| `package-lock.json`, `npm-shrinkwrap.json` | npm |

Checked in that order, most specific first. A `package-lock.json` sitting
beside a `pnpm-lock.yaml` is almost always the accident — someone's stray
`npm install` — and the deliberate one is the other.

The command is always spelled out in full, `yarn run build` rather than
`yarn build`. Both work until a script is named `add` or `why`, at which
point the short form silently runs the manager's own subcommand instead.

---

## Monorepos

Every `package.json` in the workspace is found, not just the root one —
a monorepo's scripts live in its packages, and those are the ones people
run.

With **one** package, its scripts are listed directly. With **more than
one**, each gets a heading showing its `name:` field, with its folder
beside it when the two differ: `@acme/api` tells you what it is,
`packages/api` tells you where the terminal will open. Only the first
heading starts expanded — thirty expanded packages is a wall of rows.

Packages are ordered shallowest first, so the root package leads and its
workspace packages follow. Ties break on path, so the list is identical
on every machine.

---

## What never shows up

Three filters, and between them the list stays the manifests a human
wrote:

- **No `node_modules`.** Excluded by the search itself.
- **No manifest without scripts.** This one quietly solves most of the
  problem: a built `dist/package.json` and the generated shims that
  litter a repository all declare no scripts, so none of them reach the
  tree.
- **No tool folders.** `.yarn`, `.pnpm`, `.turbo`, `.next`, `.nuxt`,
  `.svelte-kit`, `.output`, `.cache`, `.wrangler`, `.vscode-test`,
  `.pnpm-store`, `.git`. Yarn Berry is the loud case: a few hundred
  unplugged dependencies, each with a `prepack`, would bury the handful
  of rows you came for.

These are named exactly rather than matched as "any dotted folder",
because a workspace living at `C:\Users\me\.projects\api` is not build
output and matching on the shape of a path would silently lose it.

A `package.json` that is not valid JSON is skipped in silence. It is
already underlined in your editor, listed in Problems, and breaking your
package manager — a fourth complaint about it would add noise to a
problem you cannot possibly have missed.

---

## Terminals

▶ opens a terminal in that package's own folder and types the command.
In a monorepo the terminal is named `@acme/api: build` so twelve
identical `build`s stay apart.

One terminal is reused per script rather than piling up one per press.
The cost is honest and small: pressing ▶ on a script that is still
running — a watcher, a dev server — types the command into the running
process instead of starting a second copy. That is exactly what would
happen if you typed it yourself in that terminal.

The list refreshes on its own when a `package.json` is added, changed, or
deleted.

---

## Scripts are not tasks

The section exists for consolidation, not capability — VS Code's own npm
support can already run these. What it buys is that *everything you can
run in this repository* is one list in one place, with the scripts you
run daily sitting one row away from the
[tasks](https://local-workflows.github.io/getting-started/tasks.md) that would replace them.

The two are deliberately different things, and the sidebar says so. A
task runs through the engine: resolved args, gates, a run record, a
status that outlives the run. A script is handed to a terminal and
forgotten. That is why a script row wears a terminal glyph that never
changes, rather than the pass/fail circle a task gets — a status icon
there would promise a history that does not exist.

So scripts get no run record, no status, and no gates, and they never
will. The moment they did, this extension would have two engines and the
distinction that makes the other sections trustworthy would be gone.
Scripts are the unmanaged things; the managed ones live in `tasks.yml`.
