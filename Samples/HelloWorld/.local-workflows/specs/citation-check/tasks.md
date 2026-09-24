# Implementation Plan: citation-check

## Overview

Build from the bottom up. First the two pieces that don't depend on
each other: the parser that reads citations (`parseCitations.js`) and
the disk helper (`nodeIo.js`). Then the checker (`checkCitations.js`)
that uses both and carries the test suite. Then the CLI
(`check-citations.js`) that prints the report and adds two more test
cases. There is no feature flag anywhere in this plan - the checker is
a script a person or CI runs directly, not a gated behavior inside the
running extension.

## Tasks

- [ ] 1. A spec can be checked without opening the panel
  - [ ] 1.1 Add the citation and Declared_Id parser
    - `findCitations(content)` reads `content` line by line and finds
      every markdown link `[text](href)` where `href` ends in `.md` and
      `text` looks like `name : id(, id)*`. Each match becomes
      `{ link: { href, name, refs }, line }` - `refs` is the id list,
      split on commas and trimmed; `line` is the 1-based line number.
      Any other link on the line is left alone. This follows
      [local-workflows-sdd-grammar : 3](../../../../../resources/styles/custom/grammar.md).
    - `declaredIds(content)` recognizes two kinds of heading only: a
      `### Requirement N: Title` heading declares `N`, and each
      `1. `/`2. ` line under the next `#### Acceptance Criteria` marker
      declares `N.M` for its own number `M`. Separately, any heading
      whose first word contains a digit (after dropping a trailing `.`
      or `:`) declares that word as its own id - so `### G11: ...`
      declares `G11`, and `## 2. Requirements and acceptance criteria`
      declares `2`. A heading whose first word is plain text, like
      `### Property 1: ...`, declares nothing.
    - Files: `Samples/HelloWorld/scripts/citations/parseCitations.js`
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.2 Add the disk adapter
    - `listMarkdownFiles(folderAbsolute)` walks the folder with
      `fs.readdirSync(dir, { withFileTypes: true })` and returns every
      `.md` file, at any depth, as an absolute path.
    - `readFile(fileAbsolute)` returns the file's text
      (`fs.readFileSync(fileAbsolute, "utf8")`), or `undefined` if it
      can't be read. It never throws - a missing file is something the
      checker reports, not a crash.
    - This is the only file that touches `fs`. The checker takes an
      `io` object instead of calling `fs` directly, so it can be tested
      without a real disk.
    - Files: `Samples/HelloWorld/scripts/citations/nodeIo.js`
    - _Requirements: 1.5_

  - [ ] 1.3 Add the checker and its test suite
    - `checkSpec(specFolderAbsolute, io)` looks at every file
      `io.listMarkdownFiles(specFolderAbsolute)` returns, reads it with
      `io.readFile`, runs `findCitations` on it, and for each citation
      resolves the target path with `path.resolve(path.dirname(file),
      link.href)`. Each target's content and declared ids are read at
      most once per run, even if several files cite it.
    - For each citation: if `io.readFile(target)` is `undefined`, report
      one finding (`kind: "missing-file"`, `reference` is the `href` as
      written). If the target reads fine but declares no ids at all,
      report nothing. If it declares at least one id, report one
      `"missing-id"` finding for each id in `link.refs` that the target
      doesn't declare. Every finding's `file` is the citing file's path
      relative to the spec folder, with forward slashes.
    - `exitCode(report)` returns `1` when there are any findings, `0`
      otherwise.
    - `checkCitations.test.js` (plain Node, using the built-in `assert`,
      run as `node
      Samples/HelloWorld/scripts/citations/checkCitations.test.js`, no
      other dependency) builds a fake in-memory `io` per test case and
      checks: a citation to a file that doesn't exist gives one
      `missing-file` finding (Property 1); a citation naming three ids
      where the target only declares two gives two `missing-id`
      findings (Property 2); a citation into a target with no declared
      ids gives no finding (Property 3); a clean spec gives exit code
      `0`, a spec with one bad citation gives exit code `1` (Property
      4); a run only ever calls `listMarkdownFiles`/`readFile` on `io`,
      nothing else (Property 5); and a heading like `## 2. Requirements
      and acceptance criteria` declares `"2"`, not `"2."`.
    - Files: `Samples/HelloWorld/scripts/citations/checkCitations.js`,
      `Samples/HelloWorld/scripts/citations/checkCitations.test.js`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. The report says enough to act on
  - [ ] 2.1 Add the CLI and lock in what it prints
    - `check-citations.js` is the only file that reads `process.argv` or
      calls `process.exit`. No argument given: print usage to stderr,
      exit `2`. The given path doesn't exist or isn't a folder: print an
      error naming it to stderr, exit `2`. Otherwise call
      `checkSpec(path.resolve(specFolder),
      require("./citations/nodeIo"))`, print each finding as
      `${finding.file}:${finding.line}: ${finding.message}`, print
      `"No citations found in <spec-folder>."` when
      `report.citationCount === 0` (whether or not there are findings),
      and set `process.exitCode = exitCode(report)`.
    - Add two more cases to `checkCitations.test.js` (from 1.3): check
      that a finding's `file`/`line`/`reference` are correct even when
      the bad citation isn't on the first line of its file, in a fixture
      with several documents (Property 6); and check that a fixture with
      no citations anywhere gives `citationCount === 0` (Property 7).
    - Files: `Samples/HelloWorld/scripts/check-citations.js`,
      `Samples/HelloWorld/scripts/citations/checkCitations.test.js`
    - _Requirements: 2.1, 2.2_

- [ ] 3. Verification
  - [ ] 3.1 Run the new tests and a real check, for `local-workflows`
    - Run `node
      Samples/HelloWorld/scripts/citations/checkCitations.test.js` and
      record whether it passes. This is the sample's only test file -
      `Samples/HelloWorld/scripts` has no test framework of its own.
    - Run `node scripts/check-citations.js
      .local-workflows/specs/citation-check` with `Samples/HelloWorld`
      as the working directory, against this spec folder itself, and
      record its output and exit code.
    - No lint and no build step apply here: `Samples/HelloWorld` has no
      `package.json`, lint config, or build script of its own, and the
      repository root's `package.json` belongs to the separate `.debug`
      VS Code extension.
    - Files: none

- [ ] 4. Documentation
  - [ ] 4.1 Record that `local-workflows` needs no documentation update
    - `Samples/HelloWorld` has no `README.md`, `CLAUDE.md`, `AGENTS.md`,
      or steering-doc folder, and its existing scripts (`greet.js`,
      `hello.ps1`, `fail.ps1`) are undocumented the same way. This
      feature just adds one more script in that same pattern, so
      nothing existing needs updating.
    - Files: none
  - [ ] 4.2 No steering or team-doc addition
    - This workspace has no steering-doc folder to add to, and this
      feature is a small, self-contained script like the others already
      here, so nothing is proposed.
    - Files: none

- [ ] 5. Pull requests
  - [ ] 5.1 Open one pull request, for `local-workflows`
    - Branch from the current work and open the PR against `master`.
      The description should cover: the 3.1 test result, the 3.1 real
      run's output and exit code, that there's no feature flag (rollback
      is just deleting the five new files), and anything still blocked.
      There's no `PULL_REQUEST_TEMPLATE` in the repo, so this is a plain
      description covering those points. Open it for review - don't
      merge it.
    - Files: none

## Notes

- 1.1 and 1.2 touch different files and don't depend on each other, so
  they run together. 1.3 needs both to exist first, and 2.1 needs 1.3
  to exist (and edits the same test file), so each waits for the one
  before it.
- `checkCitations.test.js` is edited twice (in 1.3, then in 2.1) rather
  than split into two files, because design.md's Testing Strategy
  describes one test file covering all seven correctness properties.
- design.md doesn't declare any id of its own for other documents to
  cite (its Assumptions say a `### Property N` heading is something to
  validate against, not to cite), so no task here cites it as
  `[Design : ...]`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["4.1", "4.2"] },
    { "id": 5, "tasks": ["5.1"] }
  ]
}
```
