# GitChores

The git jobs you do every week, as tasks you can press play on.

**Nothing to install.** One file, `git`, and any repository.

## Use it

Copy one file:

```
GitChores/.local-workflows/tasks.yml   ->   <your repo>/.local-workflows/tasks.yml
```

Open your repository in VS Code. The tasks appear in the Local Workflows
sidebar under **Folder**. Press play on one.

If your main branch is called `master`, change one line at the top:

```yaml
vars:
  main: master
```

## What is in it

Read-only. Run these at any time; none of them change anything.

| Task | What it does |
|---|---|
| **Status** | What has changed, and which branch you are on |
| **Fetch** | Update your copy of the remote, drop branches deleted there |
| **What I changed** | Files this branch touches compared with main |
| **What I am about to push** | Commits on this branch that main does not have |
| **What I have not pulled** | Commits on main that this branch does not have |
| **My branches, newest first** | Every local branch with its last commit date |
| **Branches already merged** | What *Delete merged branches* would remove |
| **Branches nobody has touched** | Every local branch, oldest first |
| **Who wrote this** | Commit counts per person |
| **What clean would delete** | A dry run of `git clean` |
| **Check before I push** | Runs the first three in one click |

These change your repository. Every one stops and waits for you.

| Task | What it does |
|---|---|
| **Sync with main** | Rebase this branch onto the latest main |
| **Stash work in progress** | Put everything aside, untracked files included |
| **Delete merged branches** | Delete local branches whose work is already in main |
| **Undo my last commit** | Remove the commit, keep every change staged |
| **Delete untracked files** | `git clean -fd`. This cannot be undone |

## The three things this example shows

**A gate.** Every task that changes something says `trigger: manual`.
The run stops there and shows you the real command - the actual branch
names, not the template - and waits until you click Run. Nothing is
executing while it waits, so you can close the tab and come back.

**A task that runs nothing.** *Check before I push* has no `run:` and no
`uses:`. All it has is `needs:`, so pressing play on it runs the three
tasks it names. That is how you group work you always do together.

**One place to change a setting.** `vars:` at the top holds the main
branch, the remote and the protected branch list. Tasks read them as
`${{ vars.main }}`. Change the value once instead of editing ten tasks.

## Notes

Every plain `run:` task uses double quotes only. `cmd` on Windows does
not understand single quotes, and these tasks are meant to work
everywhere without edits. The four tasks that need real logic say
`shell: pwsh`.

*Delete merged branches* uses `git branch -d`, never `-D`. `-d` refuses
to delete a branch whose work is not merged, which is the safety net.
Your current branch and everything in `vars.protected` are skipped on
top of that.
