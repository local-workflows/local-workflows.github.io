# ReleaseNotes

Turn the commits since your last tag into a changelog entry you actually
want to publish.

## Use it

Copy one file into any repository:

```
ReleaseNotes/.local-workflows/workflows/release-notes.yml
  ->  <your repo>/.local-workflows/workflows/release-notes.yml
```

Open the repository, find **Release notes** in the Local Workflows
sidebar, press play. You are asked for the version. Leave *since* empty
and it works out the range from your newest tag.

## What it needs

GitHub Copilot, signed in to the editor. That is all. No API key, and
nothing credential-shaped in the file.

## The three stages

**1. collect.** Works out the range - your newest tag, or whatever you
typed - and writes `git log` to `.local-workflows/out/commits.txt`. No
AI in this stage. If the range holds no commits, the run fails here
rather than asking a model to summarise nothing.

**2. draft.** The agent reads that file and writes one changelog section
to `.local-workflows/out/notes.md`. The prompt is strict about the part
people get wrong: one bullet per real change, not one per commit, and
nothing a user cannot see. Refactors and dependency bumps get dropped.

Open `notes.md` and edit it. It is a draft, and the next stage reads
whatever is on disk.

**3. publish.** Reads the entry and the existing `CHANGELOG.md`, then
**stops**.

The gate is on a `file@1` write whose `content:` is already the complete
new file. So the panel is not showing you a plan - it is showing you the
exact bytes about to land on disk. You click Run, or you close the tab
and come back tomorrow. Nothing runs while it waits.

## The three things this example shows

**`file@1` doing the writing.** Not a shell command with a redirect - a
plugin whose arguments are visible at the gate. This is the "a plugin
executes" half of the idea, and nothing else in the samples uses
`file@1 write`.

**The work happens before the gate, not after.** Both files are read,
and the new content is composed, *before* the run stops. If composition
happened after approval you would be approving a promise.

**Your edits win.** The publish stage reads `notes.md` off disk rather
than using the agent's answer directly. Delete a bullet in the editor
and it is gone from the changelog too.

## Notes

The changelog has no file-level header - it is just entries, newest
first. That is what makes "prepend" a single concatenation instead of a
parse.

The first run creates an empty `CHANGELOG.md`, because reading a file
that is not there is an error and a first run has no changelog.

`timeout: 5m` on the drafting task. A long commit log takes the agent a
while, and the default would throw away work that was nearly done.

Nothing here commits anything. The last task tells you to review the
file and commit it yourself, which is where that decision belongs.
