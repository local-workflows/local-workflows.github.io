# CallAService

Calling something that is not your machine, without writing a shell
command to do it.

Two plugins, both bundled:

- **`http@1`** - one HTTP request. In-process fetch, so there is no
  `curl` to install and no quoting that works on your OS and breaks on
  someone else's.
- **`mcp@1`** - one tool call on one MCP server. The same servers an AI
  session gets, reached directly when the work needs no model.

Everything here runs as written. Nothing to sign in to.

## Use it

Open this folder in VS Code and press play on **Run all of it**.

The first MCP task takes a while - `npx` is downloading the server
before it is a server. That is why those tasks say
`timeoutMs: 120000`.

To copy it, take the whole `.local-workflows/` folder. The
`settings.json` matters: a task picks a server by name, and the name has
to be declared.

## What is in it

```
CallAService/
  .local-workflows/
    tasks.yml         nine tasks
    settings.json     the two MCP servers
```

### The HTTP half

| Task | What it shows |
|---|---|
| **Is GitHub up** | One GET against GitHub's real public status endpoint |
| **Read the answer** | Reading the stored response in a later task |
| **Check without failing** | `failOnHttpError: false`, plus a timeout and retries |
| **Only when the check did not return 200** | An `if:` reading the stored status code |
| **Post to a webhook** | A POST with a token that never appears in the file |

### The MCP half

| Task | Tool | What it shows |
|---|---|---|
| **Call a tool over MCP** | `echo` | The simplest call - one string in, one back |
| **Pass real arguments** | `get-sum` | Numbers, not strings |
| **A tool that answers with structured data** | `get-structured-content` | `text` and `structured` side by side |
| **Read both shapes of answer** | - | How far a `${{ }}` reaches into a stored result |

## The four things this example shows

**A failure that is data, not a dead run.** *Check without failing* sets
`failOnHttpError: false`, so a 500 is stored instead of stopping the
run. The task after it reads that status code in its `if:` and only runs
when it was not 200. A false condition is a skip, and a skip is not a
failure - the run carries on green.

**A credential that is never in the file.** The POST task names
`authEnv: WEBHOOK_TOKEN`. The plugin reads that environment variable
itself and registers the value as a secret, so it cannot land in a log
or in the run record. A token typed into `headers:` would land in both.
This file is safe to commit.

**A task picks a server, it does not declare one.** `server: demo` names
an entry in `settings.json`. That split is deliberate: which servers
this machine will talk to is a machine decision, and a task file that
could declare its own would take it away.

**How far a template reaches.** `mcp@1` stores `text`, `structured` and
`isError`. `text` is the whole answer as a string; `structured` is the
object, when the tool sends one.

A `${{ }}` reaches exactly one key into a stored result -
`run.context.NAME.key` and no further. So
`${{ run.context.WEATHER.structured }}` gives you the object as JSON,
and `${{ run.context.WEATHER.structured.temperature }}` does not
resolve at all - which fails the run rather than quietly producing an
empty string. *Read both shapes of answer* takes the JSON and picks the
fields out itself, which is where that work belongs.

## The servers

`settings.json` declares two.

**`demo`** is `@modelcontextprotocol/server-everything`, the reference
server. It needs no arguments, no path and no credentials, which is what
makes this example run anywhere. Its tools are deliberately dull -
`echo`, `get-sum` - because the point being made is the plumbing.

**`files`** is the real-world shape: `server-filesystem`, pointed at one
folder. It is `disabled: true` and its path says
`REPLACE-WITH-AN-ABSOLUTE-PATH`, because there is no path that is
correct on your machine and mine. Set an absolute path, delete the
`disabled` line, and it works. Its tools are `list_directory`,
`search_files`, `read_text_file`, `get_file_info` and a few more.

`disabled: true` is a real key, not a comment - a disabled server stays
out even when a task names it, and the task fails saying so rather than
silently doing nothing.

## Notes

*Read the answer* passes the response body through `env:` rather than
pasting it into the script. A response body is somebody else's text, and
somebody else's text inside your quotes is how a quote ends up closing
early.

The `timeoutMs` on the MCP tasks is 120 seconds. That is not how long
the tool takes - it is how long `npx` takes to download the server the
first time. Later runs are fast.
