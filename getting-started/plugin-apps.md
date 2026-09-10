# Plugin apps

**A plugin can ship a page of its own. The page becomes a tab in the
run panel and the spec panel, is there whether or not anything is
running, and talks to the plugin's own code and its own database.**

This page is the whole contract. Everything a plugin app can rely on is
here; anything not here is not promised.

---

## What you get

| | |
|---|---|
| **Where it shows** | A tab in the run panel of every `tasks.yml` and workflow, and in every spec panel, beside Logs / Artifacts / Problems. One tab per plugin that declares a `ui`. `ui.surface` narrows it to one kind of panel. |
| **When it shows** | From the moment the panel opens. Before a run, during, after. It does not depend on a step being selected. |
| **What it is** | Your `index.html`, drawn in an iframe inside the panel. You own the whole document. |
| **What it stays** | Alive while other tabs are open. Switching tabs hides it; it is not rebuilt. |
| **How it talks** | `window.lw` - five calls, listed below. Nothing else leaves the iframe. |

Everything else about a plugin - `plugin.json`, `execute`, args,
artifacts, secrets, the sandbox - is on [Plugins](https://local-workflows.github.io/getting-started/plugins.md).
This page only adds the app.

A bundled plugin can ship one too: `ado-release@1`'s *ADO releases*
tab is written against exactly this contract, and is the worked
example of a page that picks something and starts a run with it - see
[`lw.run`](#lwruntarget-params).

---

## Quick start

Four files. Copy them, run **Local Workflows: Reload Plugins**, open any
task - the tab is there.

```
.local-workflows/plugins/boardV1/
  plugin.json
  index.js
  ui/
    index.html
    app.js
```

**`plugin.json`**

```json
{
    "id": "board",
    "version": { "major": 1, "minor": 0, "patch": 0 },
    "ui": { "label": "Board", "entry": "ui/index.html" }
}
```

**`index.js`**

```js
module.exports = {

    // A plugin is still a task. This can be as small as this.
    async execute(args, ctx) {
        return { success: true };
    },

    // The page's back end - see "handle".
    async handle(request, ctx) {

        if (request.name === "ping")
            return { pong: true, at: new Date().toISOString() };

        throw new Error(`board@1 has no handler named '${request.name}'`);
    }
};
```

**`ui/index.html`**

```html
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Board</title>
</head>
<body>
    <h2>Board</h2>
    <button id="ping">Ping index.js</button>
    <p id="out"></p>
    <pre id="state"></pre>
    <script src="app.js"></script>
</body>
</html>
```

**`ui/app.js`**

```js
lw.onState(state => {
    document.getElementById("state").textContent = JSON.stringify(state, null, 2);
});

document.getElementById("ping").addEventListener("click", async () => {
    try {
        const reply = await lw.call("ping");
        document.getElementById("out").textContent = "pong at " + reply.at;
    } catch (error) {
        document.getElementById("out").textContent = error.message;
    }
});
```

That is a working plugin app. The rest of this page is the exact rules.

---

## The files

| File | Required | What it is |
|---|---|---|
| `plugin.json` | yes | The manifest. `ui` is the one new key - see below. |
| `index.js` | yes | The implementation: `execute` (required, as for any plugin) and `handle` (only if the page calls `lw.call`). |
| `ui/index.html` | yes when `ui` is declared | The page. The path is `ui.entry`; `ui/index.html` is the default. |
| `ui/*.js`, `ui/*.css` | no | Referenced from the page by relative name. Pulled inline by the host. |

The folder must be named `<id>V<major>` - `boardV1` - like every folder
plugin. A single-file plugin (`board.js` with no folder) cannot have an
app: there is nowhere to put the page.

### `ui` in `plugin.json`

```json
"ui": { "label": "Board", "entry": "ui/index.html" }
```

| Key | Required | Rule |
|---|---|---|
| `label` | yes | The tab's name. Non-empty string. Keep it short - it sits in a row of tabs. |
| `entry` | no | Path to the page, relative to the plugin folder. Default `ui/index.html`. Must stay inside the folder: no leading `/`, no drive letter, no `..`. |
| `surface` | no | Which panel the tab belongs in: `run`, `spec` or `both`. Default `both`. A page about runs - a release picker - says `run`, and stays out of every spec panel. |

A `ui` that breaks a rule fails the plugin's load, with a message
naming the rule - the same way a bad `args[]` entry does.

---

## How the page is loaded

Knowing this explains every "cannot" below.

1. The host reads `entry` from disk.
2. Every `<script src="relative.js"></script>` is replaced with the file's text inline. Every `<link rel="stylesheet" href="relative.css">` becomes `<style>` with the file's text.
3. Every `<script>` gets the panel's nonce, because the panel's Content-Security-Policy allows scripts by nonce only.
4. The `lw` client script and a small base stylesheet are put at the top of `<head>` (or at the top of the page when there is no `<head>`).
5. The result goes into an `<iframe srcdoc="...">` with `sandbox="allow-scripts allow-forms allow-modals"`.

So the page is **one self-contained document**, of its own origin, that
inherits the panel's policy.

### What the page cannot do

| Cannot | Why | Do instead |
|---|---|---|
| Load a script or stylesheet from a URL (`https://...`) | Policy allows nonced inline scripts only; the host inlines local files, not remote ones. A remote reference is replaced by an HTML comment saying so. | Put the file in `ui/` and reference it by name. |
| `fetch`, `XMLHttpRequest`, `WebSocket` to anywhere | Policy: `default-src 'none'`. | `lw.call` to your own `handle`, which runs in Node and can do what a plugin may do. |
| Show an image by URL | Policy allows `data:` images only. | Embed as a `data:` URI. |
| Use a web font | Not allowed by the run panel's policy. | Use `var(--vscode-font-family)`, which is what the base stylesheet already does. |
| `localStorage`, `sessionStorage`, `IndexedDB`, cookies | The iframe has no `allow-same-origin`; storage APIs throw. | `lw.db` - it persists across reloads and restarts. |
| Reach the panel's own document, its message channel, or VS Code | Different origin, no `allow-same-origin`. | `lw.run` for starting things; there is no other way up, on purpose. |
| Open a new window or navigate the panel | Not in the sandbox list. | - |
| Be told about a change by plugin code on its own | `handle` is request/response; nothing pushes from Node to the page. | Poll from the page, or react to `lw.onState`, which the panel pushes. |

Inline `<script>` and inline `<style>` blocks work. `type="module"`
scripts work. Local `.js`/`.css` files work by relative name, including
inside sub-folders of `ui/`. A path with a `?query` is read without the
query.

Under the profile's `debug: true` the iframe has **no** `sandbox`
attribute - see [debug](#debug-true-no-sandbox) - but the policy above
still applies, so the "cannot" table does not change.

---

## `window.lw` - the whole API

Defined before any of your scripts run. Frozen: you cannot add to it.

```ts
interface Lw {
    readonly state: State | null;
    onState(cb: (state: State) => void): () => void;
    call(name: string, payload?: unknown): Promise<unknown>;
    db: {
        run(sql: string, params?: unknown[] | Record<string, unknown>): Promise<{ changes: number; lastInsertRowid: number }>;
        get(sql: string, params?: unknown[] | Record<string, unknown>): Promise<Record<string, unknown> | undefined>;
        all(sql: string, params?: unknown[] | Record<string, unknown>): Promise<Record<string, unknown>[]>;
    };
    run(target?: string, params?: Record<string, unknown>): Promise<null>;
}
```

Every promise rejects with an `Error` whose `message` is the reason -
always a string a person can read. Show it; do not swallow it.

### `lw.state` and `lw.onState(cb)`

What the panel knows, pushed by the panel. `lw.state` is `null` until the
first push. `lw.onState(cb)` calls `cb` immediately if a state exists,
then on every change, and returns a function that unsubscribes.

The state is a plain object. `state.surface` tells you which panel you
are in, and the rest of the shape depends on it.

**On a run panel** (`surface: "run"`):

```ts
{
    surface: "run";
    running: boolean;                       // a run is going
    status: RunStatusName;                  // the whole run's
    workflow: { name: string; engine: string; filePath?: string };
    tasks: {                                // every task the definition declares
        id?: string;
        name: string;
        plugin?: string;                    // "greet@1" - the `uses:` reference
        status?: RunStatusName;             // absent until the task has a status this run
    }[];
    taskStatuses: Record<string, RunStatusName>;   // by task id
    artifacts: Record<string, unknown>;     // `artifact: NAME` values so far, by name
    logs: { at: number; stream: "stdout" | "stderr" | "system"; text: string }[];
                                            // the log lines of the tasks that use YOUR plugin only
}
```

**On a spec panel** (`surface: "spec"`):

```ts
{
    surface: "spec";
    running: boolean;                       // a phase is drafting
    spec: string;                           // the spec's name
    stages: {                               // in pipeline order
        name: string;                       // the phase id - what lw.run takes
        label?: string;
        artifact?: string;                  // the document's path, for a document phase
        exists?: boolean;                   // whether that document is on disk
        sessionId?: string;                 // the agent session that last drafted it, if known here
        openQuestions: number;              // unanswered questions in its document
    }[];
    taskStatuses: Record<string, RunStatusName>;
    gate?: { taskId: string; name: string; stage?: string };   // present while a phase waits for a person
}
```

`RunStatusName` is one of `"Pending" | "Running" | "Success" | "Failed" | "Skipped" | "Waiting" | "Cancelled"`.

The state is replaced whole on every push. Do not mutate it; read it.
It arrives often while a run is going - once per log line - so keep
your `onState` handler cheap, or compare the parts you care about before
redrawing.

### `lw.call(name, payload?)`

Runs your plugin's `handle({ name, payload }, ctx)` and resolves with
whatever it returned, as JSON. `payload` can be anything JSON can carry;
`undefined` arrives as absent.

Rejects when:

- the plugin exports no `handle` - *"Plugin 'board@1' has no 'handle(request, ctx)'"*
- `handle` throws - with the thrown message
- the sandbox could not start - with why

A returned `undefined` arrives as `null`. A `bigint` arrives as a number.

### `lw.db`

The plugin's own SQLite tables, from the page. Exactly the same three
calls as `ctx.db` in `execute` and `handle`, against the same file - see
[the plugin database](#the-plugin-database).

Rejects with *"This window has no plugin database"* when the engine
could not open its databases at all (run history is then in memory too).

### `lw.run(target?, params?)`

Starts something, the same way the panel's own buttons do. Gates still
gate, params are still asked for. Resolves with `null` once the start
was accepted - it does **not** wait for the run to finish; watch
`state.running` for that.

| Panel | `target` | Means |
|---|---|---|
| run | omitted | The **Run** button: the whole definition. |
| run | a `tasks.yml` task id | That task, with what it `needs:` first - what the tree row's play icon does. |
| run | a task id in a staged workflow | Rejected: a staged workflow runs as a whole. Use no target. |
| spec | a phase name (`"design"`) | Starts that phase. |
| spec | omitted | Rejected: name the phase. |

An unknown task id rejects and lists the ids that exist.

**`params`** answers the workflow's `params:` before the run starts, by
name - whole definition only, so `lw.run(undefined, { lab: "uat",
releases: [12, 15] })`. This is how a page becomes the picker for a
run: call `handle` for what exists right now, draw the choice, and
start the run with it already answered. The answers go through the
same door as the Params tab, so they are checked against the
declarations (a `type: list` param must get a list, an undeclared name
rejects), remembered for the next prompt, and shown in the tab. A run
never asks mid-run; the only place it stops is a `trigger: manual`
gate, and by then every param is frozen.

---

## `handle(request, ctx)` - the page's back end

The second export of `index.js`, beside `execute`. Optional: a page that
only displays does not need it.

```js
async handle(request, ctx) { ... }
```

| | |
|---|---|
| `request.name` | the string the page passed to `lw.call` |
| `request.payload` | whatever the page passed second; absent if nothing |
| return value | sent back to the page as JSON. Return plain data. |
| throw | rejects the page's promise with the message |

**It runs exactly like `execute`**: in the sandbox, in a fresh process,
killed when it returns. It is a function call, not a server. Nothing is
kept between two calls - no globals, no timers, no connections. Anything
that has to last goes in `ctx.db`.

**`ctx` for a handle** is the part of a task's context that exists when
nothing is running:

| Field | |
|---|---|
| `cwd`, `root` | the definition's folder - the workspace root on a spec panel |
| `env` | empty. There is no task, so no task env. |
| `secret(name)` | as in `execute`: only names declared in `plugin.json`'s `secrets` |
| `log(text, stream?)` | goes to the **Local Workflows output channel**, prefixed with the plugin ref. There is no task log to put it in. |
| `db` | the plugin database, or absent when the engine has none |

Not there, on purpose: `runId`, `taskId`, `attempt`, `reportSession`,
`cancelled`, `onCancel`. A handle is not a task.

Dispatch on `request.name` and throw for anything unknown. A handler
that returns `undefined` for a name it did not recognise hides a typo in
the page for a long time.

---

## The plugin database

Every plugin can have SQLite tables of its own. `ctx.db` in `execute`
and `handle`, `lw.db` in the page - the same file.

```js
await db.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, text TEXT, at TEXT)");
const { lastInsertRowid } = await db.run("INSERT INTO notes (text, at) VALUES (?, ?)", ["hello", new Date().toISOString()]);
const one = await db.get("SELECT * FROM notes WHERE id = ?", [lastInsertRowid]);
const all = await db.all("SELECT * FROM notes ORDER BY id DESC");
await db.run("DELETE FROM notes WHERE id = $id", { $id: lastInsertRowid });
```

| Call | Returns |
|---|---|
| `run(sql, params?)` | `{ changes, lastInsertRowid }` |
| `get(sql, params?)` | the first row as an object, or `undefined` |
| `all(sql, params?)` | an array of row objects |

`params` is an array for `?` placeholders, or an object for `$name` /
`:name` / `@name` placeholders. Always use placeholders; never build SQL
from strings the page typed.

**Facts to design around**

- **One file per plugin id**: `~/.local-workflows/db/<workspace>/plugins/<id>.db`. Two versions of one plugin (`board@1`, `board@2`) share it. Two plugins never do.
- **Per workspace**, like run history. The same plugin in two repositories has two databases.
- **Nobody else can read it** - not another plugin, not a task, not a `${{ }}` expression. If a later task needs a value, return it from `execute` as an artifact.
- **Create your tables in the code that uses them.** `CREATE TABLE IF NOT EXISTS` on entry is the migration story. There is no schema file.
- **It is plain SQLite** (Node's built-in). No extensions, no JSON1 guarantees beyond what the runtime ships.
- **Absent** when the engine has nowhere to write. `ctx.db` is then `undefined` and `lw.db` rejects. Check `ctx.db` before using it in `execute`, so the task still succeeds.

---

## Look and feel

The page starts out looking like the panel around it without any CSS
from you:

- Every `--vscode-*` CSS variable the editor defines is copied onto the page's `<html>` element, and updated when the theme changes.
- The body carries the editor's theme class (`vscode-dark`, `vscode-light`, `vscode-high-contrast`).
- A base stylesheet styles `body`, `a`, `button`, `input`, `select`, `textarea`, `table`, `code` and `pre` from those variables. Your own `<style>` or `.css` comes after it and wins.

The variables you will reach for most:

| Variable | |
|---|---|
| `--vscode-foreground`, `--vscode-font-family`, `--vscode-font-size` | text |
| `--vscode-editor-font-family`, `--vscode-editor-font-size` | monospace |
| `--vscode-textLink-foreground` | links |
| `--vscode-button-background`, `--vscode-button-foreground`, `--vscode-button-hoverBackground` | buttons |
| `--vscode-input-background`, `--vscode-input-foreground`, `--vscode-input-border` | inputs |
| `--vscode-widget-border` | dividers |
| `--vscode-errorForeground` | an error line |
| `--vscode-textCodeBlock-background` | a `<pre>` block |
| `--vscode-descriptionForeground` | secondary text |

The page background is transparent, so the panel's own background shows
through. Do not paint `body` a solid colour unless you mean to.

The tab is the size of the panel's content area. Make the page scroll
itself (`overflow: auto` on a container) rather than assuming a height.

---

## Errors, and where they show

| What went wrong | Where you see it |
|---|---|
| `ui` in `plugin.json` breaks a rule | The plugin fails to load: a warning toast naming the file and the rule. No tab. |
| `entry` file missing or unreadable | The tab exists and shows one line saying which path could not be read. |
| A local script or stylesheet named in the page is missing, or a remote one | An HTML comment in the page where the tag was, saying which. The rest of the page draws. |
| A script error in your page | The page's own console. Nothing reaches the panel. |
| `handle` throws | The page's `lw.call` promise rejects with the message. Also in the output channel. |
| `lw.run` refused | The promise rejects with the reason (unknown task, staged workflow, no phase named). |
| `lw.db` when there is no database | The promise rejects saying so. |

The panel itself never breaks because of a plugin's page. The worst a
page can do is look wrong.

---

## The edit loop

1. Edit `ui/app.js`, `ui/index.html` or `index.js`.
2. Run **Local Workflows: Reload Plugins** (command palette).
3. Look at the tab. Every open run panel and spec panel gets the page again.

No window reload. The plugin's load errors, if any, come up as they do
at startup.

### `debug: true` - no sandbox

In your **profile's** `~/.local-workflows/settings.json` (a workspace
cannot declare it):

```json
{ "debug": true }
```

Then, after Reload Plugins:

- `execute` and `handle` run **in-process**, like a bundled plugin. No worker, no permission flags, no module allowlist. `require("fs")` works. A throw has a normal stack trace in the output channel.
- The page's iframe has **no `sandbox` attribute**.
- The require cache is cleared for the plugin's folder on every reload, so an edit is picked up.

Take it out when you are done. It is machine-wide, and it also lifts the
directory limit on agent sessions.

---

## Full example: `greet@1`

`Samples/HelloWorld/.local-workflows/plugins/greetV1/` in the repository
uses every part of this page. Its files:

**`plugin.json`**

```json
{
    "id": "greet",
    "name": "Greet",
    "version": { "major": 1, "minor": 0, "patch": 0 },
    "args": [
        { "name": "name", "type": "string", "required": true },
        { "name": "excited", "type": "boolean", "default": false }
    ],
    "artifacts": ["greeting"],
    "secrets": ["GREET_TOKEN"],
    "ui": { "label": "Greet app", "entry": "ui/index.html" }
}
```

**`index.js`** - the parts that matter here

```js
module.exports = {

    async execute(args, ctx) {

        const greeting = `Hello, ${args.name}${args.excited ? "!" : "."}`;

        ctx.log(greeting);

        // Record every run in the plugin's own table. Guarded: `db` is
        // absent when the engine has nowhere to write, and the task
        // must still succeed.
        if (ctx.db) {
            await ctx.db.run("CREATE TABLE IF NOT EXISTS greetings (id INTEGER PRIMARY KEY, name TEXT, at TEXT)");
            await ctx.db.run("INSERT INTO greetings (name, at) VALUES (?, ?)", [args.name, new Date().toISOString()]);
        }

        return { success: true, artifacts: { greeting } };
    },

    async handle(request, ctx) {

        switch (request.name) {

            case "hello":
                return { text: `Hello, ${request.payload?.name || "stranger"}. This came from index.js.` };

            case "history":
                return ctx.db ? ctx.db.all("SELECT name, at FROM greetings ORDER BY id DESC LIMIT 20") : [];

            case "clear":
                if (ctx.db)
                    await ctx.db.run("DELETE FROM greetings");
                return { cleared: true };

            default:
                throw new Error(`greet@1 has no handler named '${request.name}'.`);
        }
    }
};
```

**`ui/index.html`**

```html
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="app.css">
    <title>Greet app</title>
</head>
<body>
    <h2>Greet app</h2>

    <section>
        <h3>Ask index.js something</h3>
        <form id="hello">
            <input id="who" placeholder="Your name" autocomplete="off">
            <button type="submit">Call handle("hello")</button>
        </form>
        <p id="answer" class="answer"></p>
    </section>

    <section>
        <h3>What the panel knows</h3>
        <pre id="state">waiting for state...</pre>
    </section>

    <section>
        <h3>Greetings recorded in this plugin's own database</h3>
        <div class="row">
            <button id="refresh" type="button">Refresh</button>
            <button id="clear" type="button">Clear</button>
            <button id="run" type="button">Run the Greet task</button>
        </div>
        <table id="history"><thead><tr><th>Name</th><th>When</th></tr></thead><tbody></tbody></table>
    </section>

    <script src="app.js"></script>
</body>
</html>
```

**`ui/app.js`**

```js
const $ = id => document.getElementById(id);

const show = (element, text, isError) => {
    element.textContent = text;
    element.classList.toggle("error", Boolean(isError));
};

// lw.call -> handle("hello")
$("hello").addEventListener("submit", async event => {
    event.preventDefault();
    try {
        const reply = await lw.call("hello", { name: $("who").value.trim() });
        show($("answer"), reply.text);
    } catch (error) {
        show($("answer"), error.message, true);
    }
});

// lw.onState -> live view of the panel
lw.onState(state => {
    $("state").textContent = JSON.stringify(state, null, 2);
});

// lw.call -> handle("history") -> the plugin's own table
async function refresh() {
    const body = $("history").querySelector("tbody");
    try {
        const rows = await lw.call("history");
        body.innerHTML = "";
        for (const row of rows) {
            const tr = document.createElement("tr");
            tr.innerHTML = "<td></td><td></td>";
            tr.children[0].textContent = row.name;   // textContent, never innerHTML, for data
            tr.children[1].textContent = row.at;
            body.appendChild(tr);
        }
        if (!rows.length)
            body.innerHTML = '<tr><td colspan="2">Nothing yet - run the Greet task.</td></tr>';
    } catch (error) {
        show($("answer"), error.message, true);
    }
}

$("refresh").addEventListener("click", refresh);

// lw.db straight from the page
$("clear").addEventListener("click", async () => {
    await lw.db.run("DELETE FROM greetings");
    await refresh();
});

// lw.run -> the `greet` task in tasks.yml
$("run").addEventListener("click", async () => {
    try {
        await lw.run("greet");
    } catch (error) {
        show($("answer"), error.message, true);
    }
});

refresh();

// Redraw the table when a run ends.
let wasRunning = false;
lw.onState(state => {
    if (wasRunning && !state.running)
        refresh();
    wasRunning = state.running;
});
```

**`ui/app.css`**

```css
section { margin: 12px 0 18px; }
h2 { margin: 0 0 4px; font-size: 1.2em; }
h3 { margin: 0 0 6px; font-size: 1em; }
.row { display: flex; gap: 8px; margin-bottom: 8px; }
.answer.error { color: var(--vscode-errorForeground); }
pre { max-height: 220px; overflow: auto; padding: 8px; background: var(--vscode-textCodeBlock-background); }
table { width: 100%; }
```

The task that drives it, in the sample's `tasks.yml`:

```yaml
tasks:
  greet:
    uses: greet@1
    args:
      name: Santosh
      excited: true
    artifact: GREETING
```

---

## Checklist for writing one

Use this when generating a plugin app, in order.

1. **Folder** `<id>V<major>` under `.local-workflows/plugins/` (repo) or `~/.local-workflows/plugins/` (profile).
2. **`plugin.json`** with `id`, `version`, and `ui: { label }`. `entry` only if the page is not `ui/index.html`.
3. **`index.js`** exports `execute` (always) and `handle` (if the page calls anything). Both `async`. `handle` switches on `request.name` and throws on an unknown name.
4. **`ui/index.html`** - a full document. Scripts and styles inline or as local files by relative name. No URLs to the web. Images as `data:` URIs.
5. **Page code** uses only `window.lw`. No `fetch`, no `localStorage`. Every `lw.*` call in a `try/catch` or `.catch`, and the message shown.
6. **State** read through `lw.onState`; branch on `state.surface` if the page is meant for both panels.
7. **Persistence** through `lw.db` / `ctx.db`, tables created with `CREATE TABLE IF NOT EXISTS`, placeholders for every value. `ctx.db` guarded in `execute`.
8. **Text from data** put into the DOM with `textContent`, never `innerHTML`.
9. **Styling** from `--vscode-*` variables; no solid `body` background; the page scrolls itself.
10. **Test**: Reload Plugins → open a task → the tab is there → click through every button → run the task → the state and table update. Then the same in a spec panel if the page claims to work there.

---

## What this is not

- **Not a way to ship UI to other people.** There is no marketplace and no plugin sharing. The page is for the machine it sits on.
- **Not a live channel from plugin code.** Nothing pushes from `index.js` to the page; the page asks, or reads state the panel pushes.
- **Not a place to ask a human mid-task.** `handle` runs when nobody is running anything. A task that needs a decision before it continues is two tasks with `trigger: manual` between them - see [Workflows](https://local-workflows.github.io/getting-started/workflows.md).
- **Not a VS Code extension.** The page cannot register commands, views, or settings, and cannot call the VS Code API. What it can do is the `lw` table above, and that table is the whole contract.
