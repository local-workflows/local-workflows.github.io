# TeamWorkspace sample

What a `.code-workspace` changes. Open `team.code-workspace` — the file,
not this folder — and compare it with opening `Samples/HelloWorld` on
its own.

## What is here

```
TeamWorkspace/
  team.code-workspace            the workspace file
  .local-workflows/
    tasks.yml                    workspace-level tasks
    specs/                       created on first spec (see below)
```

The workspace lists one folder, `../HelloWorld`. One is enough to show
the behaviour; a real one lists a repository each.

## What to look at

**A third scope in the Tasks tree.** HelloWorld's own tasks appear under
a **Folder** heading, these under **Workspace**, and anything in your
`~/.local-workflows/tasks.yml` under **Profile**. Open HelloWorld as a
plain folder instead and the headings disappear — one scope needs no
heading.

**The folder pick.** Press play on **Where am I**. You are asked which
folder to run in, because a workspace-level task belongs to no
repository. It prints the folder you picked. Press play again and you
are asked again — the answer is stored nowhere, deliberately.

Press play on one of HelloWorld's own tasks and nothing is asked. It
already has its repository.

**Spec placement.** Specs always live in `.local-workflows/specs` under
the window's root — the location is fixed. What a `.code-workspace`
changes is *which folder is that root*: `localWorkflows.workspaceRoot`,
the one setting the extension keeps in the editor, names the folder
whose `.local-workflows` is authoritative for the window — its
`settings.json`, its specs, its plugins. It is left empty here, which
means the folder the `.code-workspace` file sits in. So a spec started
here lands in `Samples/TeamWorkspace/.local-workflows/specs/`, not
inside HelloWorld — one feature spanning several repositories is one
spec.

## Note

`workspaceRoot` applies only when a `.code-workspace` is open; a plain
folder is always its own root. A relative path is resolved against the
folder holding the `.code-workspace` file, so a real workspace can point
it at one of its repositories — or at a separate repository that holds
the team's shared `.local-workflows` and nothing else.
