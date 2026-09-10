# Writing your own style

A style is a folder holding a `style.yml`, an `instructions/` directory
(what each phase is told to do) and a `prompts/` directory (the whole
message a phase is actually run with — a first draft, a plain revise,
or a revise with a note typed in). There is no code to write and
nothing to register — drop the folder in and it appears in the ＋ New
Spec menu beside the built-in `custom` style.

Two worked examples are documented on this site rather than shipped with
the extension — [Kiro](https://local-workflows.github.io/getting-started/sdd/kiro.md) and
[Spec Kit](https://local-workflows.github.io/getting-started/sdd/spec-kit.md), each a complete,
differently-shaped process with its exact prompts published verbatim.
Copying one in is the fastest way to see a second real style, or to
start yours from something closer to the shape you want than `custom`
is.

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

## Changing one phase's instructions without forking a style

You usually do not need a whole style. **The definition and the
instructions resolve separately**: the highest scope holding a
`style.yml` supplies the definition, but *every* scope holding that id
contributes instruction files.

So to change how the built-in `custom` style writes design documents,
and nothing else:

```
.local-workflows/styles/custom/instructions/design.md
```

No `style.yml`. The built-in definition still drives the pipeline; your
file replaces that one phase's instructions. You inherit every later fix
to the rest of the style instead of freezing a copy of it.

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

# No `format:`, no `intro:`. Each phase's own
# `instructions/<id>.md` says what it does; the shipped grammar file,
# attached to every phase, says what the document must look like.

# No `stages:` block. There is nothing to say: `design` writes `design.md`,
# runs `instructions/design.md`, and parks for a human, and its id said all three.
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

### 2. The input gate is not yours to place; the output gate is yours to choose

Every pipeline opens with the **input gate**, and a spec type never
lists it — listing it is refused at load. The **output gate** is
different: it closes a pipeline only when a spec type asks for it, by
listing `implement` itself, last.

| | Role | Produces | Instructions |
|---|---|---|---|
| `intake` | **input gate** — written by ＋ New Spec, no model runs | `intake.md` | **none** |
| your phases | drafting phases the engine runs and waits on | `<id>.md` | `instructions/<id>.md` |
| `implement` | **output gate**, if listed — where the work becomes code | nothing, and may not | `instructions/<last stage>-implement.md` |

`intake` runs nothing at all. ＋ New Spec writes its document from what
you picked — the spec type, the source, the work item or the files — so
there is no prompt, and naming one is refused at load. The document
points at its source material; the phase after it reads the original.

**Not every process ends in code.** A spec type that never names
`implement` simply ends at its last drafting phase — an ordinary stage,
with an ordinary document, no different from any other. If the last
thing this process does is publish a document somewhere rather than
write code, that last stage is just a stage: give it a real `produces`
and let it run like any other phase.

A spec type that does want code at the end lists `implement` itself:

```yaml
specTypes:
  - id: feature
    label: Feature
    stages: [requirements, design, tasks, implement]
```

`implement` is **terminal**: it produces nothing, and may not. That is
how you say *the work for this phase happens somewhere the engine cannot
reach*. It must be the last entry — listed anywhere else, the style
fails to load, because the stages after a terminal one could never be
reached.

**Its instructions are named for the stage that fed it.** A spec type ending in
`tasks, implement` runs `instructions/tasks-implement.md`; one ending in
`stories, implement` runs `instructions/stories-implement.md`. What the gate
is handed differs with what came before — a plan to build, or a list to
file — so those are two files rather than one file with a branch in it,
and a style whose spec types end differently ships one of each.

There is no fallback to a plain `instructions/implement.md`. If the file
named for your last drafting stage is missing, starting the gate says so
and names it.

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
is relative to the style folder, except a stage's `instructions:` and
`attachments:`, and the style's own top-level `attachments:`, which are
relative to the workspace — those name files your repository owns, so
they travel in git with the style pointing at them.
`${{ }}` expressions are
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
| `attachments` | path \| path[] | Optional. Reference files handed to **every** stage that runs a model, on top of whatever that stage attaches itself — a house style guide, a product glossary, whatever the whole process should read rather than one phase of it. Same rule as a stage's own `attachments:` below: relative to the workspace, `${{ }}` resolved first, nothing outside the repository. Merged ahead of a stage's own list — general reference before what one phase asked for. |
| `ai` | map | Optional. The plugin args every stage of this process starts from — the style-wide default, same shape as a stage's own `ai:` below and merged the same way, underneath it. Write a house model or a standing `systemInstructions` once here instead of on every stage. Refused here: `uses`, for the same reason it is refused on a stage. |
| `blockOnOpenQuestions` | `boolean` | Optional, default `true`. Whether an unanswered `## Open Questions` section in a drafting document stops the next phase from starting. See [The one thing that should stop you](https://local-workflows.github.io/getting-started/sdd/index.md#6-the-one-thing-that-should-stop-you). |

Those nine, and no others. There is no `frame:` key any more — the wrapper
around a phase's instructions is not made of nameable paragraphs. It is
one of the three whole-message files in the style's `prompts/` folder
(`first.md`, `rewrite.md`, `rewrite-note.md`), and rewording it means
replacing that file, the same way you replace one phase's instructions.
A `style.yml` still carrying `frame:` is refused at load. There is no
`intake:` key either — the input gate is a
stage the parser puts into every style, and ＋ New Spec writes its
document. There is no `revise:` key either: **Revise** re-runs the phase's
own prompt over the document it already wrote, handing it that document as
`current` and whatever the person typed as a note.

### A spec type

| Key | Type | Meaning |
|---|---|---|
| `id` | `string` | required |
| `label` | `string` | Shown in the picker. |
| `stages` | `string[]` | Ordered stage ids — this is the pipeline. A type that skips design just omits it here. `intake` is added automatically and never listed. `implement` is not added automatically — list it yourself, last, if this process ends in code; leave it out and the pipeline ends at your last drafting phase. |

### A stage entry

Only for a stage that differs from the defaults. Everything is optional
but the id.

| Key | Type | Meaning |
|---|---|---|
| `id` | `string` | required. Also the session name and the log bucket. |
| `label` | `string` | Optional. What a person sees on the chip. Defaults to the id. |
| `prefix` | `string` | Optional. The id this stage's own numbered items are cited by — `Req` for `requirements.md`'s `Req-3`, say. An uppercase letter followed by letters or digits. Refused on `intake` and `implement`, which write no numbered document. |
| `produces` | path \| path[] | Optional. All must exist for the stage to be satisfied. Defaults to `<id>.md`; forbidden on `implement`, which is terminal. If your process doesn't end in code, don't name the last stage `implement` — give it a real id and it gets a real `produces` like any other stage. |
| `instructions` | path | Optional, and usually absent. The instructions this phase runs on. Left out, it derives to `instructions/<id>.md` in the style folder, which a workspace or profile copy of that one file already replaces. Written, it is your team's own file, relative to the **workspace**, run in place of the shipped instructions. `${{ workspaceFolder }}/docs/x.md` works and means the same as `docs/x.md`; anything landing outside the repository is refused. Not on `intake`. |
| `attachments` | path \| path[] | Optional. Extra files this phase is handed **beside** its instructions — your API contract, a house style guide, a glossary. Relative to the **workspace**, under the same rule as `instructions`. They are attached the way the instructions are, so the session opens them, and they stay out of the spec's own documents: reference to read, not documents to write. Every file must exist — the phase fails naming the one that does not, because a reference nobody notices is missing is worse than a phase that will not start. Not on `intake`. |
| `ai` | map | Optional. What this phase runs on — `model`, reasoning effort, `systemInstructions`, an `mcp` selection, anything your plugin takes. Three layers, each overriding only the keys it names: `ai."<plugin>"` in settings.json, then the style's own top-level `ai:`, then this — so naming one setting here never drops what the other two set. Refused here: `uses` (which plugin runs is the team's call, in `sdd.uses`) and the five the engine writes — `prompt` (use `instructions`), `attachments` (use `attachments`), `title`, `target`, `detach`. Not on `intake`. |
| `ai.systemInstructions` | string | Optional. Standing instruction for every turn of this phase, appended to the runtime's own guardrails — never replacing them. Either the text itself, or `file://` followed by a full path (build it with the [path variables](https://local-workflows.github.io/getting-started/settings.md#---expressions) — `${{ workspaceFolder }}`, `${{ workspaceConfig }}`, `${{ home }}`, `${{ cwd }}`) naming a file to read instead, once, when the session starts. Passing a provider's own field name (`systemMessage`, `systemPrompt`) through as an undeclared plugin arg does nothing — both are ignored, precisely so this is the one channel and it always appends. |
| `ai.mcp` | map | Optional. Which of `settings.json`'s MCP servers this phase gets, and which of their tools — `{ servers: [ado], tools: { ado: [wit_get_work_item] } }`. Both allowlists, both optional: no `servers` means every declared server, `servers: []` means none — the right answer for a phase that only writes a document. Replaces the default's `mcp` **whole**, not key by key. A server `disabled` in settings stays out even when named; a name settings does not declare fails the phase, naming the declared ones. See [`settings.json`](https://local-workflows.github.io/getting-started/settings.md#mcp--which-servers-one-task-gets). |

There is no `prompt` key and no `template` key. Both were earlier names
for the same thing — the instructions a phase runs on — and a style
still carrying either one is refused at load, naming the key that
replaced it: `instructions`.

### Spec variables

Those three keys — a stage's `instructions`, `attachments` and `ai` — can also
name the spec the phase is running for, and so can the style's own
top-level `attachments:`. Nobody sets these; they are read-only facts
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
    instructions: docs/instructions/${{ spec.type }}-design.md   # one file per kind of work
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
terminal · `instructions`, `attachments` or `ai` on `intake`, which runs no
model · a stage's `attachments:`, or the style's own, naming the same
file twice · a stage whose `ai:` names
`uses`, or any of the five args the engine writes · a stage still
declaring the removed `prompt:` or `template:` key · a style still
declaring the removed `frame:` key ·
`specTypes:` empty or a duplicated id · a spec type listing no stages,
listing a gate, or visiting a stage twice.

`kind`, `gate`, `requires` and `mayProduce` are all gone. Nothing reads
them, and nothing errors on them either — the editor's JSON schema flags
them as unknown keys while you type, which is the moment to catch one.

---

## An instructions file's job

Instruction files are Markdown, and they are handed a specific, bounded
context — never the whole folder, never a conversation.

Write a phase's instructions about doing *its* job well, and nothing
else. Your file is not the whole message the model sees — the engine
wraps it in a message of its own (see [Wording the whole
message](#wording-the-whole-message) below), and instructions that
re-explain what that message already says is duplicated text that will
drift.

**What the wrapping message already supplies**, so you do not have to:

| It already says | So your prompt need not |
|---|---|
| the spec folder | repeat it |
| every earlier document that exists, attached under its own name | list what to read |
| that the repository is context, and to follow whatever conventions file it carries | ask for the codebase to be read |
| that the next phase gets a new chat, so it goes in the file rather than in the reply | explain the pipeline |
| on a second pass: that `current` is the file being rewritten and that a human's edits in it are decisions | restate the general revision rules — say only what is specific to *your* document, such as which numbers are references |
| the ask — write the file, then one sentence back | ask for the file again in your own words |
| **the document grammar**, attached as `grammar` — headings, requirement ids, the citation link, the checkbox rows, EARS keywords | restate any of it, or invent a shape of your own for a citation |

What is yours: the document's shape, what belongs in each section, what
this phase must decide, and what a good one looks like. On a revision,
what your format makes unsafe to change — numbering that other documents
cite, ids that survive a rewrite.

### Wording the whole message

There is no `frame:` key. An earlier cut named the wrapper's paragraphs
and let a style reword one at a time; a `style.yml` still carrying
`frame:` is refused at load, naming the replacement. The wrapper is now
three whole files, in the style's own `prompts/` folder, one for each
kind of run:

| File | Runs when |
|---|---|
| `prompts/first.md` | no document exists yet — a first draft |
| `prompts/rewrite.md` | the document exists and the Revise box was left empty |
| `prompts/rewrite-note.md` | the document exists and something was typed into Revise |

Each is resolved through the same three scopes as everything else in the
style folder, so a workspace copy of `prompts/rewrite.md` alone changes
how a revise is worded and leaves the other two as the built-in has
them. There is nothing to name — the whole file is yours, the way one
phase's `instructions/<id>.md` is.

They use the same placeholders as everywhere else — the [spec
variables](#spec-variables) — plus two more, answered only here:

| Variable | Is |
|---|---|
| `${{ phase.target }}` | The document this phase writes, in backticks. |
| `${{ phase.note }}` | What a person typed into Revise. Only in `prompts/rewrite-note.md`. |
| `${{ phase.documents }}` | The list of earlier documents attached to this run. |
| `${{ phase.references }}` | The list of reference files attached to this run. |

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

1. Run **Local Workflows: Eject Style** and pick the built-in `custom`
   style. It copies `style.yml`, the style's `prompts/` files
   (`first.md`, `rewrite.md`, `rewrite-note.md` — whichever the style
   ships) and `grammar.md`, into the scope you choose — your **user
   profile** (`~/.local-workflows/styles/`, the default, applies
   everywhere you work) or the **workspace** (committed with the repo).
   The phase instructions under `instructions/` are not copied: they keep
   resolving from the extension, so they keep improving with it. An
   existing file is listed and confirmed before anything is overwritten.

   `grammar.md` is the document grammar every phase is handed — the file
   that says what a requirement heading, a citation link, an acceptance
   criteria block and a task checkbox row look like. Your copy is used
   exactly as you write it, and nothing checks it. **Edit it, but keep
   the shapes.** The spec panel reads them out of your documents to build
   the outline, link between documents, and give the implement lens a
   task list; drop one and that part of the panel stops working, with no
   error — a shape it cannot read is just prose to it. Delete the file
   and the style falls back to the built-in copy in the scope below it;
   a style that has none in any scope runs with no grammar at all.

   To start from [Kiro](https://local-workflows.github.io/getting-started/sdd/kiro.md) or
   [Spec Kit](https://local-workflows.github.io/getting-started/sdd/spec-kit.md) instead, there
   is no eject command for them — neither ships with the extension. Copy
   `style.yml` and every file under `instructions/` from that page into
   `.local-workflows/styles/kiro/` (or `spec-kit/`) yourself; the text
   there is generated from the real files, so it is exactly what would
   run.
2. To make it a new style rather than a replacement of the built-in,
   rename the folder and change `id:` and `name:` to match.
3. Add a stage to a spec type's list, reorder them, or point a stage's
   `instructions:` at instructions your team already maintains. To change
   one phase's instructions, drop your own copy at
   `.local-workflows/styles/<id>/instructions/<name>.md` — one file, and
   every other phase stays the built-in.
4. Set `{ "sdd": { "styles": ["my-process"] } }` in
   `.local-workflows/settings.json`.
5. ＋ New Spec — your style is in the menu.

Starting from a copy rather than a blank file is the fastest path,
because the shipped style and the two worked examples are heavily
commented with the reasoning behind each key.

> **An ejected `style.yml` stops receiving improvements to the built-in
> one.** Kept under its original id it shadows it outright. Its phase
> instructions are unaffected — those still come from the extension
> unless you shadow one yourself. Reverting is deleting files: whatever
> you remove falls back to the built-in.
