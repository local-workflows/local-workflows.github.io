# Task breakdown process

This file is the process. `ado-breakdown.yml` attaches it to the drafting
session, so changing how work is broken down means editing this file - not
the workflow, and not a prompt buried in YAML.

## What you are given

- The work item as JSON, exactly as `az boards work-item show` returned it.
- The Conditions of Acceptance finding written by the step before this one.

You have both. Do not go looking for anything else, and do not invent
requirements the work item does not state.

## How to break it down

1. **One task per deliverable, not per activity.** "Add the endpoint" is a
   task. "Coding" is not. If two tasks would always be done by the same
   person in the same sitting, they are one task.
2. **Every Condition of Acceptance must be covered by at least one task.**
   Walk the COA list and tick each one off against a task. A COA nothing
   covers is the finding, not a task to guess at.
3. **No task larger than 8 hours.** Anything bigger is not broken down yet.
   Split it or say why it cannot be split.
4. **Include the work that is not code.** Tests, migrations, config,
   documentation, telemetry - if the change needs it to ship, it is a task.
5. **Order them.** List the tasks in the order they can actually be done.
   A task that depends on another comes after it.
6. **Name the gaps separately.** Anything you could not size, or that
   contradicts the COAs, goes under `## Open questions` - never as a task
   with a guessed estimate.

## Output format

Write one Markdown file. Anything you like above and below, but every task
must be a single line in exactly this shape:

```
- TASK | <title> | <hours> | <one line description>
```

- `<title>` becomes the ADO task title. Keep it under 80 characters.
- `<hours>` is a whole number of hours, 1 to 8. No unit, just the number.
- `<one line description>` becomes the task description. One line, no pipes.

Lines that do not start with `- TASK |` are ignored by the task that
creates the work items, so headings, prose and the open questions section
are all safe to write.

### Example

```
# AB#4821 - Export invoices as CSV

- TASK | Add the CSV writer | 4 | Stream rows rather than building the whole file in memory.
- TASK | Wire the export endpoint | 3 | POST /invoices/export, returns 202 and a job id.
- TASK | Unit tests for the writer | 3 | Covers empty result, quoting and the 100k row case.
- TASK | Update the API reference | 1 | Document the endpoint and its response codes.

## Open questions

- COA 3 says "large exports must not time out" without naming a limit.
```
