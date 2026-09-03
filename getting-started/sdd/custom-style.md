# Writing your own style

A style is a folder holding a `style.yml` and a `prompts/` directory.
There is no code to write and nothing to register — drop the folder in
and it appears in the ＋ New Spec menu beside the built-ins.

---

## Where a style can live

Three places, and the folder name is the style's id:

| Scope | Location |
|---|---|
| **workspace** | `<repo>/.local-workflows/styles/<id>/` |
| **profile** | `~/.local-workflows/styles/<id>/` |
| **builtin** | ships with the extension |

Workspace wins over profile, which wins over builtin. Put a style in your
profile to use it in every repository you open; put it in the workspace
to commit it with the project, so the whole team runs the same process.

> **With a `.code-workspace` open, "workspace" means the workspace, not
> a repository.** Styles are read from the workspace root's
> `.local-workflows/styles/`, and a style committed inside one of the
> open repositories is not loaded. That is the same rule as spec
> placement: with several repositories open, the process is the
> workspace's decision rather than each repository's. See
> [Workspaces](https://local-workflows.github.io/getting-started/workspaces.md).

Every style — built-in included — is parsed by the same code. That is
what makes a shipped style and a hand-written one behave identically by
construction, and what makes "eject a built-in and modify it" a file copy
rather than a code generator.

---

## Changing one prompt without forking a style

You usually do not need a whole style. **The definition and the prompts
resolve separately**: the highest scope holding a `style.yml` supplies
the definition, but *every* scope holding that id contributes prompts.

So to change how Kiro writes design documents, and nothing else:

```
.local-workflows/styles/kiro/prompts/design.md
```

No `style.yml`. Kiro's own definition still drives the pipeline; your
file replaces that one prompt. You inherit every later fix to the rest of
the style instead of freezing a copy of it.

---

## `style.yml`, key by key

```yaml
schema: 1

# Names the process this implements. The folder name is the identity;
# this field asserts it.
id: my-process
name: My Process
desc: One line, shown in the style picker.

# What + New Spec offers. A single entry means nobody is asked.
#
# List the drafting phases only. Every pipeline opens with the input gate
# and closes with the output gate - the ask comes in, the work goes out -
# and neither is yours to place. What you choose is the middle.
specTypes:
  - id: feature
    label: Feature
    stages: [requirements, design, tasks]
  - id: bug
    label: Bug fix
    stages: [requirements, tasks]

# No `format:`, no `intro:`, no grammar file. Each phase's own
# `prompts/<id>.md` is the whole of what it runs on.

# No `stages:` block. There is nothing to say: `design` writes `design.md`,
# runs `prompts/design.md`, and parks for a human, and its id said all three.
# Add one only for a stage that differs - see below.
```

---

## The four rules that decide everything

Get these and the format stops needing memorisation.

### 1. A stage is satisfied when its artifacts exist

This one rule does the most work in the whole design. It is why a spec
folder someone else wrote resumes at the right phase, why an
implementation chat nobody is watching holds nothing up, and why
re-running a finished phase does nothing.

Its consequence: **every stage must leave an artifact**, unless it is
the terminal one. A stage that writes nothing can never be satisfied, so
the walk would park on it forever — which is why "review the documents
and report" is not a phase.

### 2. The gates are not yours to place

Every pipeline opens with the **input gate** and closes with the
**output gate**, and a spec type lists neither — listing one is refused
at load.

| | Role | Produces | Prompt |
|---|---|---|---|
| `intake` | **input gate** — written by ＋ New Spec, no model runs | `intake.md` | **none** |
| your phases | drafting phases the engine runs and waits on | `<id>.md` | `prompts/<id>.md` |
| `implement` | **output gate** — where the work becomes code | nothing, and may not | `prompts/<last stage>-implement.md` |

`intake` runs nothing at all. ＋ New Spec writes its document from what
you picked — the spec type, the source, the work item or the files — so
there is no prompt, and naming one is refused at load. The document
points at its source material; the phase after it reads the original.

`implement` is **terminal**: it produces nothing, and may not. That is
how you say *the work for this phase happens somewhere the engine cannot
reach*. Nothing can be listed after it, because it is appended rather
than placed.

**Its prompt is named for the stage that fed it.** A spec type ending in
`tasks` runs `prompts/tasks-implement.md`; one ending in `stories` runs
`prompts/stories-implement.md`. What the gate is handed differs with what
came before — a plan to build, or a list to file — so those are two
files rather than one file with a branch in it, and a style whose spec
types end differently ships one of each.

There is no fallback to a plain `prompts/implement.md`. If the file
named for your last stage is missing, starting the gate says so and
names it.

**Their ids are fixed** — the id is the session name, the log bucket
key and the per-stage settings key. To show a different word, give the
stage a `label`:

```yaml
stages:
  - id: intake
    label: Capture the ask
```

### 3. There is no `requires:` key

What a stage needs is whatever the prior stages of *that spec type*
produced. Declaring it per stage would state the pipeline twice, and the
two copies would eventually disagree.

This is also why a stage can appear in several spec types with different
args and no conditionals: in a Bug fix that skips `design`, the `tasks`
stage simply sees one document instead of two.

### 4. Every phase waits for you, and the press is the approval

There is no `gate:` key, because there is nothing to configure. Nothing
runs on its own. Starting a phase is what approves the document before
it — "this is good enough to build on", a judgement made when you are
about to rely on it.

Nothing else blocks either: a document's open questions are on screen
when you decide, and you decide.

---

## Reference: `style.yml`

Required keys: `schema`, `id`, `name`, `desc`, `specTypes`.
`stages:` is optional and usually absent. No unknown keys, and no
`requires:` key exists — what a stage needs is rule 3 above. Every path
is relative to the style folder, except a stage's `template:` and
`attachments:`, which are relative to the workspace — those name files
your repository owns, so they travel in git with the style pointing at
them. `${{ }}` expressions are
resolved anywhere in the file — see
[settings.json](https://local-workflows.github.io/getting-started/settings.md#---expressions).

### Top level

| Key | Type | Meaning |
|---|---|---|
| `schema` | `1` | Style schema version. |
| `id` | `string` | Must equal the folder name. |
| `name` | `string` | Shown in pickers. |
| `desc` | `string` | One line. |
| `specTypes` | list | What ＋ New Spec offers. One entry = no question asked. |
| `stages` | list | Optional. The pool of exceptions — one entry per stage that differs from what its id already implies. Order here means nothing; a spec type's list is the pipeline. |

Those six, and no others. There is no `intake:` key — the input gate is a
stage the parser puts into every style, and ＋ New Spec writes its
document. There is no `revise:` key either: **Revise** re-runs the phase's
own prompt over the document it already wrote, handing it that document as
`current` and whatever the person typed as a note.

### A spec type

| Key | Type | Meaning |
|---|---|---|
| `id` | `string` | required |
| `label` | `string` | Shown in the picker. |
| `stages` | `string[]` | Ordered stage ids — this is the pipeline. A type that skips design just omits it here. |

### A stage entry

Only for a stage that differs from the defaults. Everything is optional
but the id.

| Key | Type | Meaning |
|---|---|---|
| `id` | `string` | required. Also the session name and the log bucket. |
| `label` | `string` | Optional. What a person sees on the chip. Defaults to the id. |
| `produces` | path \| path[] | Optional. All must exist for the stage to be satisfied. Defaults to `<id>.md`; forbidden on `implement`, which is terminal. |
| `template` | path | Optional, and usually absent. The instructions this phase runs on. Left out, it derives to `prompts/<id>.md` in the style folder, which a workspace or profile copy of that one file already replaces. Written, it is your team's own file, relative to the **workspace**, run in place of the shipped prompt. `${{ workspaceFolder }}/docs/x.md` works and means the same as `docs/x.md`; anything landing outside the repository is refused. Not on `intake`. |
| `attachments` | path \| path[] | Optional. Extra files this phase is handed **beside** its instructions — your API contract, a house style guide, a glossary. Relative to the **workspace**, under the same rule as `template`. They are attached the way the prompt is, so the session opens them, and they stay out of the spec's own documents: reference to read, not documents to write. Every file must exist — the phase fails naming the one that does not, because a reference nobody notices is missing is worse than a phase that will not start. Not on `intake`. |
| `ai` | map | Optional. What this phase runs on — `model`, reasoning effort, a `systemMessage`, anything your plugin takes. Merged per key over `ai."<plugin>"` in settings.json, so naming one setting never drops the others. **This is the only per-phase place these live** — `sdd.stages.<id>` is gone, because only a style knows which of its phases is the hard one. Refused here: `uses` (which plugin runs is the team's call, in `sdd.uses`) and the five the engine writes — `prompt` (use `template`), `attachments` (use `attachments`), `title`, `target`, `detach`. Not on `intake`. |

There is no `prompt` key. It and `template` were two keys for one thing
— the instructions a phase runs on — and a style still carrying
`prompt:` is refused at load, naming the key that replaced it.

### Spec variables

Those three keys — `template`, `attachments` and `ai` — can also name the
spec the phase is running for. Nobody sets these; they are read-only facts
the flow already knows by the time a phase starts.

| Variable | Is |
|---|---|
| `${{ spec.dir }}` | The spec folder, as a path the agent resolves. |
| `${{ spec.path }}` | The same folder, absolute. |
| `${{ spec.name }}` | The spec's own name. |
| `${{ spec.type }}` | The spec type you picked at ＋ New Spec. |
| `${{ spec.stage }}` | The stage being run. |

```yaml
stages:
  - id: design
    template: docs/prompts/${{ spec.type }}-design.md   # one prompt per kind of work
    attachments:
      - ${{ spec.dir }}/api.md                          # a file this spec alone owns
```

They are answered when the phase is assembled, which is the first moment
there is a spec to answer them with — every other expression in the file
is resolved when the style is read. So they work in those three keys and
nowhere else: `produces:` and a spec type's `stages:` are read before a
spec is in hand, and an expression there is refused at load rather than
compared as literal text against a real filename. A name that is not one
of the five is refused at load too.

The rules do not soften. A path still has to land inside the repository
after substitution, and a file that is not there is still a hard error —
`${{ spec.dir }}/api.md` means every spec of that type
needs one. They are not accepted in `settings.json`: a value that changes
per spec belongs to the process, not to your deployment.

### Load errors

Every one refused at load, never mid-run: `id` ≠ folder name · `schema:`
missing, not a whole number, or newer than the build · `stages:` not a
list, or declaring a stage `id` twice · a stage with an empty `produces`
· a stage no spec type visits — an entry describing a phase that never
runs is a typo, not a definition · `produces` on `implement`, which is
terminal · `template`, `attachments` or `ai` on `intake`, which runs no
model · a stage attaching the same file twice · a stage whose `ai:` names
`uses`, or any of the five args the engine writes · a stage still
declaring the removed `prompt:` key ·
`specTypes:` empty or a duplicated id · a spec type listing no stages,
listing a gate, or visiting a stage twice.

`kind`, `gate`, `requires` and `mayProduce` are all gone. Nothing reads
them, and nothing errors on them either — the editor's JSON schema flags
them as unknown keys while you type, which is the moment to catch one.

---

## A prompt's job

Prompts are Markdown, and they are handed a specific, bounded context —
never the whole folder, never a conversation.

Write a phase prompt about doing *its* job well, and nothing else. Your
file is not the whole of what the phase reads — the engine wraps it in a
short prompt of its own, and a prompt that re-explains what the wrapper
already says is duplicated text that will drift.

**What the wrapper already supplies**, so you do not have to:

| It already says | So your prompt need not |
|---|---|
| the spec folder, the spec type, and the checkpoints setting | repeat any of them |
| every earlier document that exists, by name and by path | list what to read |
| that the repository is context, and to follow `AGENTS.md` | ask for the codebase to be read |
| that nothing downstream sees this conversation, so the document must carry everything | explain the pipeline |
| on a second pass: that the document is being **edited, not replaced**, that `current` is required reading, and that anything not asked about comes back unchanged | restate the general revision rules — say only what is specific to *your* document, such as which numbers are references |
| the closing ask — write the file, then one sentence back | ask for the file again in your own words |
| **the document grammar**, attached as `grammar` — headings, requirement ids, the citation link, the checkbox rows, EARS keywords | restate any of it, or invent a shape of your own for a citation |

What is yours: the document's shape, what belongs in each section, what
this phase must decide, and what a good one looks like. On a revision,
what your format makes unsafe to change — numbering that other documents
cite, ids that survive a rewrite.

**The grammar is the one file a style cannot replace.** Every phase of
every style is handed it, and it wins on the shape of a line — a
citation is `[Name : 1.2](file.md)` whatever your style calls its
phases. That is not a limit on your format so much as the price of the
review features: the panel reads those shapes to give an outline, linked
citations, highlighted criteria and a runnable task list, and a document
that abandons them loses the features rather than gaining freedom.

Your own numbering is yours, though. Put the id first in its own
heading — `## G11 -- feature flag` — and it becomes citable like
anything else.

Keep an `## Open Questions` section in your document format, first in the
document. Nothing enforces it and nothing blocks on it — no button is
disabled and no check runs. It is on screen when you decide whether to
start the next phase, and it goes into git either way, which is the whole
mechanism.

---

## Trying it

1. Run **Local Workflows: Eject Style** and pick a built-in. It copies
   `style.yml`, byte for byte, into the scope you choose — your **user
   profile** (`~/.local-workflows/styles/`, the default, applies
   everywhere you work) or the **workspace** (committed with the repo).
   Prompts are not copied: they keep resolving from the extension, so
   they keep improving with it. An existing file is listed and confirmed
   before anything is overwritten.
2. To make it a new style rather than a replacement of the built-in,
   rename the folder and change `id:` and `name:` to match.
3. Add a stage to a spec type's list, reorder them, or point a stage's
   `template:` at instructions your team already maintains. To change a
   *prompt's* wording, drop your own copy at
   `.local-workflows/styles/<id>/prompts/<name>.md` — one file, and every
   other prompt stays the built-in.
4. Set `{ "sdd": { "style": "my-process" } }` in
   `.local-workflows/settings.json`.
5. ＋ New Spec — your style is in the menu.

Starting from a copy rather than a blank file is the fastest path,
because the shipped styles are heavily commented with the reasoning
behind each key.

> **An ejected `style.yml` stops receiving improvements to the built-in
> one.** Kept under its original id it shadows it outright. Its prompts
> are unaffected — those still come from the extension unless you shadow
> one yourself. Reverting is deleting files: whatever you remove falls
> back to the built-in.
