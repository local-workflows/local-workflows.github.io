# The Spec Kit style

A spec, a plan with companions, tasks. One phase writes several
documents, and the plan is a flat numbered list. A worked example, not
shipped with the extension — see [Trying it](#trying-it) to copy it in.

---

## The shape

```
intake.md  ->  spec.md  ->  plan.md (+ research.md, data-model.md, contracts/, quickstart.md)  ->  tasks.md  ->  implement
```

Copy it in (see [Trying it](#trying-it)), then turn it on with one line
in `.local-workflows/settings.json`:

```json
{ "sdd": { "styles": ["spec-kit"] } }
```

---

## One kind of spec

Unlike [Kiro](https://local-workflows.github.io/getting-started/sdd/kiro.md), Spec Kit draws no
distinction between a feature and a fix — the same phases run either way.
Its `specTypes:` list has a single entry, and a single entry means
**＋ New Spec asks nothing** about which type you want.

---

## Phase by phase

### `specify`

Produces `spec.md`, not `specify.md` — the stage id is the Spec Kit
command and the document is Spec Kit's, which is the one thing in this
style that no convention could have guessed and the only reason it needs
a `stages:` entry at all.

Like Kiro's `requirements`, it is the first phase a model runs, seeded by
`intake.md` — so it opens the work item, issue or copied files that
document names before it drafts.

### `plan`

The interesting one, and the reason this worked example is worth
copying in.

It has no `stages:` entry of its own — no line in `style.yml` names
`plan.md`. It doesn't need one: with no `produces:` override, a phase
falls back to the default naming rule, `<id>.md`, and `plan` already
matches its own document.

`plan.md` is the only document that default names. `research.md`, `data-model.md`,
`quickstart.md` and `contracts/` are written **only when the work calls
for them** — a data model is meaningless for a CLI flag, and contracts
are meaningless without an interface.

None of them needs declaring. A document no stage produces is context for
every later phase the moment it exists, and it can never hold the pipeline
waiting on a file nobody was going to write. Which ones this phase may
write is an instruction, and it lives in the plan prompt with the reason
for each.

### `tasks`

Produces `tasks.md`. A **flat** list with ids like `T001`, `T002`, where
`[P]` marks tasks that may run at the same time.

That is the sharpest difference from Kiro, which numbers tasks `1`, `1.1`
and carries a dependency graph. Same phase, genuinely different dialect —
see the style's own `instructions/tasks.md`.

### `implement`

Identical in kind to Kiro's: the `implement` stage, the output gate, so
the panel hands tasks over and does not wait on them. The plan is
approved by starting its first task, and git is the record.

---

## Why this example exists

Beyond covering another team's habits: **a style layer that only ever
proved one shape would not be much of a demonstration.**

Spec Kit differs from the built-in `custom` style exactly where it
counts — a stage with several artifacts, a document written only
sometimes, different filenames, and a flat plan dialect. Everything it
needed, the model already had, except the plan grammar. That is the test
the style layer had to pass.

---

## Two Spec Kit commands are deliberately absent

If you know Spec Kit from elsewhere, you will notice `/clarify` and
`/analyze` are missing. Neither is a gap:

**`/clarify` edits `spec.md` in place** rather than writing a document of
its own, so it could never be a phase: a stage producing an artifact an
earlier stage already wrote would be satisfied the instant it was
reached, and skipped. Edit `spec.md` in the panel and Save.

**`/analyze` reads the three documents and reports**; it writes nothing.
A stage that leaves no artifact can never be satisfied, so the walk would
park on it forever.

Both belong to the surface, not to the pipeline. The rule underneath
them is the same one that makes existing specs resumable: **a stage is
satisfied when its artifacts exist**, which means every stage must leave
one.

---

## Files it produces

| File | Written by | Always? |
|---|---|---|
| `intake.md` | ＋ New Spec, no model | yes |
| `spec.md` | `specify` | yes |
| `plan.md` | `plan` | yes |
| `research.md`, `data-model.md`, `quickstart.md`, `contracts/` | `plan` | only when the work calls for it |
| `tasks.md` | `tasks` | yes |

---

## Trying it

This does not ship with the extension, so there is no **Eject Style**
entry for it. Copy it in by hand:

1. Create `.local-workflows/styles/spec-kit/style.yml` (workspace scope)
   or `~/.local-workflows/styles/spec-kit/style.yml` (profile scope,
   applies to every repository you open).
2. Copy `style.yml` and every instruction file from
   [The Spec Kit instructions](https://local-workflows.github.io/getting-started/sdd/spec-kit-prompts.md)
   into that folder, keeping the same filenames
   (`instructions/specify.md`, `instructions/plan.md`,
   `instructions/tasks.md`, `instructions/tasks-implement.md`). A stage
   reads `instructions/<stage id>.md` from its own style folder, so the
   folder name and the filenames are what make each phase find its file.
   That page holds the whole example — it is not carried anywhere else in
   the repository.
3. Put a `grammar.md` beside `style.yml`. It is the document grammar
   every phase is handed, it belongs to the style folder, and a style
   without one runs with no grammar at all — while its prompts still say
   *"Follow the `grammar` above"*. The quickest source is the built-in
   one: run **Local Workflows: Eject Style** on `custom`, then copy the
   `grammar.md` it writes into your `spec-kit` folder. Edit it from
   there — Spec Kit numbers its plan `T001` rather than `1.1`, and the
   grammar is where you say so.
4. Set `{ "sdd": { "styles": ["spec-kit"] } }` in
   `.local-workflows/settings.json`, as shown above.
5. ＋ New Spec — Spec Kit is in the menu.

See [Writing your own style](https://local-workflows.github.io/getting-started/sdd/custom-style.md)
for what each key does, and for using this as a starting point for
something of your own rather than running it as is.
