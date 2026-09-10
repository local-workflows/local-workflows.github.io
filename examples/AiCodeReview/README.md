# AiCodeReview

The agent reviews your branch. You read it. Then it posts.

This is the whole idea of Local Workflows in one file: **the model
proposes, a person approves, a plugin executes.**

## Use it

Copy the folder into any repository:

```
AiCodeReview/.local-workflows/workflows/review.yml
  ->  <your repo>/.local-workflows/workflows/review.yml
```

Open the repository, find **AI code review** in the Local Workflows
sidebar, press play. You are asked for the branch to compare against.
Leave the work item empty the first time - the run then stops after
writing two files, and posts nothing anywhere.

## What it needs

- **GitHub Copilot**, signed in to the editor. That is all the AI steps
  need. No API key, and nothing credential-shaped in the file.
- **Only for the optional last step**: `az login` and
  `az extension add --name azure-devops`.

## The three stages

**1. collect.** `git fetch`, then write the diff to
`.local-workflows/out/diff.patch`. No AI anywhere in this stage. If the
branch matches the base, the run fails here with "nothing to review"
rather than asking a model to review an empty file.

**2. review.** Two agent tasks that share one conversation:

- *Review the diff* writes `review.md` - a verdict, blocking problems,
  things worth fixing, and what it could not judge from a diff alone.
- *Write the pull request description* writes `pr-description.md`.

Both say `session: review`. Two tasks naming the same session share one
thread, so the second one has already read the diff and already knows
what its own review said. It is not told twice, and it cannot contradict
itself.

Neither task touches a source file. They write two files in
`.local-workflows/out/` and stop.

**3. publish.** Reads `review.md` back off disk with `file@1` - so
anything *you* edited into it is what gets posted - and posts it as a
comment on an Azure DevOps work item.

This task says `trigger: manual`. The run stops, and the panel shows you
the resolved arguments: the real work item number, the real comment
text. Not `${{ run.context.REVIEW_TEXT.content }}`. You click Run, or
you do not.

The whole stage says `if: ${{ params.workItem }}`. An empty value is
false, so leaving that parameter alone skips the stage. A skip is not a
failure - the run finishes green with two files on disk.

## The four things this example shows

**A gate that means something.** Approving a template is approving a
promise. The panel resolves every `${{ }}` before it stops, so what you
approve is what runs.

**One conversation across two tasks.** `session: review` on both AI
tasks. This is the only thing in the samples that uses it.

**Reading a file back before acting on it.** The publish stage does not
use the agent's answer directly. It reads `review.md` off disk with
`file@1`, so if you opened the file and deleted a paragraph, the
paragraph is gone from the comment too.

**A stage that skips itself.** `if:` on a stage, driven by a parameter
with an empty default.

## Notes

`plugins:` at the top declares `ai` once, so no task repeats
`uses: ai@1`. There is no `provider:` line, so it runs on GitHub
Copilot, which is the default.

The comment `key` is `ai-code-review`. The same key always updates the
same comment, so running this twice on one work item does not leave two
reviews. Change the key if you want a new comment each time.

`auth: az` means the plugin gets a short-lived token from your own `az`
login. There is no personal access token anywhere in this file, and
nothing to leak if you commit it.
