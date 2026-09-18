# Implementation Plan: citation-check

## Overview

Four new files under `scripts/`, built bottom-up so every task lands on
a green tree: the two dependency-free primitives first
(`parseCitations.js`'s grammar reading, `nodeIo.js`'s disk reads), then
the classifier that composes them together with its test file in the
same task, then the CLI shell that turns a report into stdout and an
exit code. No flag gates any of this - it is a plain script, run
directly with `node`, with no `package.json` and no new dependency.

## Tasks

- [ ] 1. Parsing and filesystem primitives
  - [ ] 1.1 Add `scripts/citations/parseCitations.js`
    - `findCitations(content)`: walk `content` line by line; a line
      containing a markdown link `[text](href)` where `href` ends in
      `.md` and `text` matches `name : id(, id)*` is a citation -
      return `{ link: { href, name, refs }, line }` for each, `refs`
      the comma-split, trimmed id list, `line` 1-based. Anything else
      on the line is left alone.
    - `declaredIds(content)`: a `### Requirement N: Title` heading
      declares `N`; each `1. `/`2. ` line under the next
      `#### Acceptance Criteria` marker, up to the next heading,
      declares `N.M` for its own number `M`. Separately, any heading
      whose first whitespace-delimited token - after stripping one
      trailing `.` or `:` - still carries a digit declares that
      stripped token as its own id (`## 2. Requirements and acceptance
      criteria` declares `"2"`; `### G11: ...` declares `"G11"`). A
      heading whose first token is a bare word, such as `### Property
      1: ...`, declares nothing under this second rule.
    - [Requirements : 1.1, 1.2, 1.3](requirements.md)
  - [ ] 1.2 Add `scripts/citations/nodeIo.js`
    - `listMarkdownFiles(folderAbsolute)`: recurse the folder with
      `fs.readdirSync(..., { withFileTypes: true })`, returning every
      `.md` file at any depth as an absolute path.
    - `readFile(fileAbsolute)`: `fs.readFileSync(fileAbsolute, "utf8")`
      wrapped in `try`/`catch`, returning `undefined` on any error
      rather than throwing.
    - [Requirements : 1](requirements.md)

- [ ] 2. Classifier
  - [ ] 2.1 Add `scripts/citations/checkCitations.js` and `scripts/citations/checkCitations.test.js`
    - `checkSpec(specFolderAbsolute, io)`: for every file
      `io.listMarkdownFiles(specFolderAbsolute)` returns, read it
      through `io.readFile`, run `findCitations` on it, and for each
      occurrence resolve `path.resolve(path.dirname(file), link.href)`.
      Cache a resolved target's content and `declaredIds(...)` by path
      so a Target_Document cited from several files is read and parsed
      once. Per occurrence: `io.readFile(target)` is `undefined` → one
      finding, `kind: "missing-file"`, `reference: link.href`; target
      read and `declaredIds(target).length === 0` → nothing reported;
      target read and declares at least one id → one `kind:
      "missing-id"` finding per id in `link.refs` absent from that
      list, `reference` that id. Every finding's `file` is
      `path.relative(specFolderAbsolute, file)`, forward-slashed, and
      carries the citation's 1-based `line` and a one-line,
      print-ready `message` naming the `href` or `reference` that
      failed. Return `{ findings, citationCount }`, `citationCount`
      counting every citation seen whether or not it resolved.
    - `exitCode(report)`: `1` when `report.findings.length > 0`, else
      `0`.
    - `checkCitations.test.js` uses only Node's built-in `assert`,
      runnable as `node scripts/citations/checkCitations.test.js`, and
      builds an in-memory `io` (a `Map` of absolute path to content,
      backing `listMarkdownFiles`/`readFile`) per case rather than a
      real folder. Cover: a citation to a path the map lacks → one
      `"missing-file"` finding; a citation naming three ids where the
      target declares two → two `"missing-id"` findings, one per
      absent id; a citation into a target with no declared id at all →
      no finding; a spec with only clean citations → `findings` empty
      and `exitCode` `0`, one with a bad citation → `exitCode` `1`; a
      run whose `io` exposes nothing beyond
      `listMarkdownFiles`/`readFile` still completes, showing nothing
      else is ever called on it; a multi-document fixture where the
      failing citation is not on its file's first line, checking
      `file`/`line`/`reference` land on the right values; a
      citation-free fixture → `citationCount === 0`; and a heading
      `## 2. Requirements and acceptance criteria` declaring `"2"`, not
      `"2."`. Run the test file and confirm it exits `0`.
    - [Requirements : 1.1, 1.2, 1.3, 1.4, 1.5, 2.1](requirements.md)

- [ ] 3. CLI
  - [ ] 3.1 Add `scripts/check-citations.js`
    - The only file reading `process.argv` or calling `process.exit`/
      setting `process.exitCode`. No argument → usage on stderr, exit
      `2`. The resolved argument does not exist, or is not a directory
      → error naming it on stderr, exit `2`. Otherwise call
      `checkSpec(path.resolve(specFolder), require("./citations/nodeIo"))`
      and, for each finding, print `${finding.file}:${finding.line}:
      ${finding.message}`. When `report.citationCount === 0`, also
      print an explicit notice ("No citations found in
      `<spec-folder>`.") whether or not there are findings. Set
      `process.exitCode = exitCode(report)`.
    - Run `node scripts/check-citations.js .local-workflows/specs/citation-check`
      against this spec folder and confirm it prints one line per
      finding in `file:line: message` form, prints the "no citations"
      notice only if `citationCount` is actually `0`, and exits
      non-zero only when it printed a finding.
    - [Requirements : 2.1, 2.2](requirements.md)

## Notes

- Order is bottom-up on purpose: 1.1 and 1.2 have no dependency on each
  other or on anything not yet written, so they run together; 2.1
  needs both modules to exist before `checkSpec` can compose them, and
  its test file is written in the same task so the classifier is never
  merged untested; 3.1 needs `checkCitations.js`'s exports to exist
  before the CLI can `require` them.
- No task here is optional. Every one is required for
  [Requirements : 1](requirements.md) and
  [Requirements : 2](requirements.md) to hold, and none costs enough on
  its own to be worth carrying as skippable.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1"] }
  ]
}
```
