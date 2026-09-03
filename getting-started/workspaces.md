# Workspaces

How the extension decides which folder things belong to — especially
when several repositories are open at once.

---

## Two ways to open a project

VS Code opens either **a folder** or **a `.code-workspace` file** — a
JSON file that lists several folders, usually one repository each. This
extension behaves differently in the two, and the difference is worth
knowing before you hit it.

Open a folder and there are two scopes: the folder's own
`.local-workflows/` is the project's, and your profile at
`~/.local-workflows/` sits behind it.

Open a `.code-workspace` and a third scope appears in the middle: the
workspace itself. It belongs to no single repository and it is not your
personal settings. It is where a team keeps what all their repositories
share.

---

## The three scopes

| Scope | Where | Who it is for |
|---|---|---|
| **Folder** | `<repo>/.local-workflows/`, anywhere in the tree | this repository |
| **Workspace** | beside the open `.code-workspace` | every repository in it |
| **Profile** | `~/.local-workflows/` | you, everywhere |

All three hold the same things — `tasks.yml`, `settings.json`,
`workflows/`, `plugins/`, `styles/`. Two entries are single-scope:
`specs/` is workspace-only and `db/` (run history) is profile-only. The
workspace scope is not special; it just sits in the middle.

**The narrowest scope wins.** If a repository declares a task named
`deploy`, the repository's `deploy` runs. Copies with the same name in
the workspace or your profile are skipped, with no error — that is what
the scopes are for. A workspace copy beats a profile copy the same way.

```
folder      →  beats  →  workspace  →  beats  →  profile
```

The sidebar lists the scopes in this same order, so what you read is
what runs.

---

## Where the workspace folder is

By default, next to the `.code-workspace` file:

```
D:\Work\team\team.code-workspace
D:\Work\team\.local-workflows\        <- the workspace scope
D:\Work\repos\api\.local-workflows\   <- a folder scope
D:\Work\repos\web\.local-workflows\   <- another
```

If you want it somewhere else — say the `.code-workspace` lives in a
config repository, or the shared files belong elsewhere — set the place
in the workspace file itself:

```json
{
  "folders": [
    { "path": "../repos/api" },
    { "path": "../repos/web" }
  ],
  "settings": {
    "localWorkflows.workspaceRoot": "../shared"
  }
}
```

Relative paths start from the folder that holds the `.code-workspace`,
just like its own `folders:` entries. They do not start from where you
launched the editor — that would make the same file mean different
things on different machines.

This setting is optional - it is the only one this extension keeps in
the editor, and most workspaces need it only when specs and settings
belong somewhere other than beside the `.code-workspace` file.

---

## Which folder a run uses

A multi-root workspace creates one problem.

A task in `api/.local-workflows/tasks.yml` runs in `api`. That is clear.
But a task from the workspace scope or your profile — `git clean -fdx`,
say — belongs to no repository. If five are open, which one did you
mean?

There is no safe default, so **you are asked**, every time you run a
workspace- or profile-level task. The answer is used for that one run
and is not remembered.

Not remembering is deliberate. A remembered answer means you stop seeing
the question — and you notice that the morning you run a migration
against last week's checkout.

You are asked even when only one folder is possible. A dialog whose
outcome is already decided teaches people to dismiss dialogs.

The choices are the folders the `.code-workspace` lists, minus the
workspace root — that one holds shared definitions and is often not a
repository at all.

Both ways of starting a run ask: the play icon on the row, and the Run
button inside the panel. A panel left open since yesterday is not aimed
at anything now, so it asks again instead of quietly reusing the last
folder.

Nothing else asks. A repository's own tasks already have their folder,
and a plain-folder window has only one possible answer and keeps using
it.

---

## Specs across repositories

A developer changing five services for one feature writes **one** spec.
Copying it into all five repositories would be worse than writing none,
and picking one of the five at random would be worse still.

So with a `.code-workspace` open, specs live under the **workspace root**
rather than in each repository: `.local-workflows/specs` inside whichever
folder `localWorkflows.workspaceRoot` names.

```json
"settings": {
  "localWorkflows.workspaceRoot": "D:\\Work\\team-specs"
}
```

A backslash in JSON must be doubled — `"D:\Work"` is an invalid escape,
and `"D:\team"` silently becomes a tab character. Forward slashes work
too and need no escaping.

That folder can be anywhere, including a repository the workspace does
not list. A separate specs repository is exactly the case this exists
for - and because the same pointer decides where `settings.json` is read
from, the team's process settings travel with the specs.

Leave it out and both go beside the `.code-workspace` file - the same
layout a single folder uses, one level up. You are not asked, and nothing
is written into your workspace file.

> **Where specs live** defaults to `.local-workflows/specs` under the
> workspace root; `sdd.specsDir` in
> [`settings.json`](https://local-workflows.github.io/getting-started/settings.md) moves it —
> workspace-relative or absolute. What the pointer moves is the *root*,
> and a relative `specsDir` follows it.

> With a `.code-workspace` open, **custom styles** are read from the
> workspace's `.local-workflows/styles/` instead of from each open
> repository, and `settings.json` is read from the workspace root plus
> your profile rather than from each repository. In a plain folder, both
> work exactly as they always have.

---

## Run history

History is stored per workspace, under
`~/.local-workflows/db/<workspace>/run.db`.

With a `.code-workspace` open, that key is the **workspace file
itself**, not one of its folders. So reordering the `folders:` array —
an edit that changes nothing about the work — does not start a fresh
history.

---

## What a plain folder sees

Nothing on this page applies. No third scope, no folder question, no
workspace settings read, and specs go in this folder's own
`.local-workflows/specs`. If you
never open a `.code-workspace`, none of this exists for you.

The same is true of a multi-root workspace assembled in the window but
**never saved** — with no file on disk it is treated as a plain folder
until you save it.
