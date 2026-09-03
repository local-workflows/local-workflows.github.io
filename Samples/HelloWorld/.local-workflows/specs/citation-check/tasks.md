# Implementation Plan: Citation check

## Overview

The citation checker is a headless reading of a Spec_Folder that prints
every Citation which no longer resolves and exits non-zero when it found
one. Almost all of the reading already ships in
`src/webview/templates/specRefs.ts`, which is what the Spec_Panel renders
its strike-through from - so this plan is mostly plumbing around code
that is already written, and the one thing it must never do is write a
second grammar for the same document.

The order follows that. Group 1 moves `specRefs.ts` into
`src/sdd/documents/`, gives it the line-aware `citationsIn` scan the
panel currently does inline, and switches the panel onto it - after which
there is one reading and two callers. Group 3 builds
`src/sdd/citations/` on top of it: a `CitationFiles` port so the check
itself never touches disk, the check, the report and the command, each
with unit tests over inline fixtures. Group 5 adds the entry file and a
fifth esbuild bundle whose `external` deliberately omits `vscode`, so
"runs with no editor" is a fact the build asserts rather than a promise.

Nothing here is behind a flag. The panel keeps the behaviour it has; what
changes is that the same verdict is now available from a shell.

## Tasks

- [ ] 1. One reading of citations, where both surfaces can reach it

  - [ ] 1.1 Move `specRefs.ts` into `src/sdd/documents/` and repoint its importers
    - Move `src/webview/templates/specRefs.ts` to `src/sdd/documents/specRefs.ts`, leaving `parseRefLink`, `resolveRef`, `requirementAnchors`, `requirementPreviews`, `anchorsByLine`, `anchorId` and every regex in the file exactly as they are.
    - Move `src/webview/templates/__tests__/specRefs.test.ts` to `src/sdd/documents/__tests__/specRefs.test.ts`, changing nothing but its `../specRefs` import, so its record of asserted behaviour survives the move.
    - Repoint the one production importer, `src/webview/templates/SddRunView.tsx`, at `../../sdd/documents/specRefs`.
    - Confirm the moved test still covers the anchor reader: the `Requirement N` heading, an `N.M` item under an acceptance-criteria marker, a numbered list with no marker above it, and a criterion keyed by the number as written rather than by its position. That coverage is requirement 3, and the move must not lose it.
    - [requirements : 3.1, 3.2, 3.3, 3.4, 4.3](requirements.md)

  - [ ] 1.2 Add `citationsIn` to `specRefs.ts`
    - Export `FoundCitation extends SpecRefLink` with `line` - the 1-based line of the content it was scanned from - and `written`, the whole link as the author typed it, for the report to reproduce.
    - Export `citationsIn(content: string): FoundCitation[]`, returning Citations in document order.
    - Scan line by line with a running inside-a-fence flag toggled by a triple-backtick or `~~~` opener, remove inline code spans from the line, then match `/\[([^\]\n]+)\]\(([^)\s]+)\)/g` - the pattern already in `SddRunView.tsx` - and keep only the matches `parseRefLink` returns something for.
    - Four-space indentation is not code: a plan's detail lines sit four spaces in, and that is where nearly every Citation in `tasks.md` lives.
    - Extend `src/sdd/documents/__tests__/specRefs.test.ts`: a real Citation with its line, an ordinary link, an href carrying an `https:` scheme, a protocol-relative href, a Citation inside a fenced block, a Citation on a four-space-indented detail line, and a Citation naming three ids returned in the order written.
    - [requirements : 2.1, 2.2, 2.3](requirements.md)

  - [ ] 1.3 Read the panel's `cited` memo through `citationsIn`
    - In `src/webview/templates/SddRunView.tsx`, replace the `body.matchAll(...)` loop inside the `cited` memo with `citationsIn(body)`, resolving each result through `resolveRef(artifact, citation.href)` into the same set of paths it builds today.
    - Change no rendering, no message and no state: `SpecRefLink`, the `missing` test and the `unnumbered` test keep the behaviour they have.
    - The panel now prefetches one document fewer - a citation-shaped link inside a code fence - which is the narrowing that makes the two surfaces agree rather than a regression.
    - [requirements : 4.1, 4.2, 4.3](requirements.md)

- [ ] 2. Checkpoint - one reading of citations, under `src/sdd/documents`, with the panel calling it
  - Run `npm test` and confirm the full suite passes, including the moved `specRefs` tests at their new path.
  - Run `npm run build` and confirm every bundle still builds after the import move.

- [ ] 3. The citation checker, with no editor and no disk in it

  - [ ] 3.1 The `CitationFiles` port and `NodeCitationFiles`
    - Add `src/sdd/citations/citationFiles.ts` declaring `CitationFiles` with `isFolder(target): Promise<boolean>`, `documents(folder): Promise<string[]>` - `.md` files directly inside the folder, absolute and sorted - and `read(file): Promise<string>`.
    - `read` returns `""` for a file that is not there and throws for any other failure, so "missing" and "unreadable" stay different answers.
    - Add `src/sdd/citations/NodeCitationFiles.ts` implementing it over `fs`: `documents` is one `readdir` with `withFileTypes`, keeping `entry.isFile()` and a case-insensitive `.md` suffix, so sub-folders such as `.history/` are never listed and never walked; `read` is `fs.promises.readFile(file, "utf8")` with `ENOENT` and `ENOTDIR` mapped to `""`.
    - This is the only file in the feature that imports `fs`, and it opens nothing for writing.
    - A new port rather than `SpecFiles`: `NodeSpecFiles.read` refuses any path outside the spec folder, which is right for artifacts and fatal for a Citation that points at `../../docs/prd.md`.
    - [requirements : 1.1, 1.6](requirements.md)

  - [ ] 3.2 `checkCitations` over a `CitationFiles`
    - Add `src/sdd/citations/checkCitations.ts` exporting `Finding`, `CheckResult` and `checkCitations(folder, files): Promise<CheckResult>`, with the field sets the design's data models give.
    - Per document: read it, `citationsIn` it, and for each Citation resolve `resolveRef(document, href)` and read the target through a `Map` cache keyed by the resolved path, so a target cited from four documents is read once.
    - Then, in order: target text is `""` - one Finding, `kind: "target"`, whatever ids the Citation named; `requirementAnchors(text)` is empty - an Unnumbered_Document, no Finding, ids not looked at; otherwise one Finding, `kind: "criterion"`, per id the anchor set does not contain.
    - A document that throws on read goes into `CheckResult.unreadable` and the run carries on to the next; a *target* that throws becomes a `kind: "target"` Finding carrying the reason.
    - Findings come out in document then line order, documents in listing order.
    - Test in `src/sdd/citations/__tests__/checkCitations.test.ts` against a hand-written `CitationFiles` over a `Record<string, string>` - no disk: a Citation that resolves, a missing target, an unknown id, an unnumbered target, a target reached with `../` from outside the folder, a Citation naming three ids of which one fails, and a document that throws on read.
    - [requirements : 1.1, 1.2, 1.3, 1.4, 1.5, 2.4, 2.5, 3.5](requirements.md)

  - [ ] 3.3 `citationReport`
    - Add `src/sdd/citations/citationReport.ts` exporting `citationReport(result, folder): string[]`, so the command decides where the lines go and a test can read them without capturing a stream.
    - One line per Finding, shaped `file:line: <citation as written> - <why>`, with the document named relative to the Spec_Folder and the reason saying either that the target file is not there or that the target has no such id.
    - Then exactly one closing sentence: the count of Findings when there were any; that every citation in this spec resolves when Citations were checked and none failed; that this spec folder holds no citations when none was found at all.
    - Test in `src/sdd/citations/__tests__/citationReport.test.ts` with the lines asserted whole: a `kind: "target"` line, a `kind: "criterion"` line, and each of the three closing sentences.
    - [requirements : 5.1, 5.2, 5.3, 5.4, 5.5, 5.6](requirements.md)

  - [ ] 3.4 `checkCommand` - arguments, output and exit status
    - Add `src/sdd/citations/checkCommand.ts` exporting `CommandIo` (`out`, `err`) and `checkCommand(argv, files, io): Promise<number>`, kept out of the entry file so it can be tested without spawning a process.
    - No path argument: print `Usage: node check-citations.js <spec-folder>` on `err` and return 2. A path `isFolder` says no to: print the path and that it is not a folder, return 2.
    - Otherwise run `checkCitations`, print `citationReport` on `out`, and return 2 when anything was unreadable - naming each file and the reason on `err` - 1 when there were Findings, 0 otherwise.
    - A folder holding no `.md` file prints the "no citations" sentence and returns 0; an empty folder is not a failure.
    - Test in `src/sdd/citations/__tests__/checkCommand.test.ts` with a fake `CitationFiles` and `out`/`err` collected into arrays, asserting both the return code and the text for: no argument, a path that is not a folder, a clean folder, a folder with Findings, a folder with an unreadable document.
    - [requirements : 6.1, 6.2, 6.3, 6.4, 6.5, 6.6](requirements.md)

  - [ ] 3.5 Panel parity test
    - Add `src/sdd/citations/__tests__/panelParity.test.ts`: run one fixture Spec_Folder through `checkCitations`, and the same documents through the functions `SddRunView` calls - `citationsIn`, `parseRefLink`, `requirementAnchors` and the panel's own `missing` (`text === ""`) and `unnumbered` (`known.size === 0`) expressions.
    - Assert link for link that a reference the panel would strike through has a Finding, and a link the panel leaves as ordinary text has none.
    - The fixture carries both halves of that: a resolving citation, a stale id, a missing target, an unnumbered target, an ordinary link, a link with a scheme, and a citation inside a fence.
    - The test guards a shared function rather than two implementations, which is the point of task 1.3 - if it ever has to compare two readings, something has grown a second one.
    - [requirements : 4.1, 4.2, 4.3](requirements.md)

- [ ] 4. Checkpoint - a Spec_Folder can be checked, reported on and exit-coded, entirely in memory
  - Run `npm test` and confirm the full suite passes, including the four new files under `src/sdd/citations/__tests__`.
  - Confirm `src/sdd/citations` imports nothing from `src/webview` or `src/vscode` and nothing named `vscode` - the check task 5.2 automates, done by reading the imports here.

- [ ] 5. The headless entry

  - [ ] 5.1 CLI entry and the `dist/check-citations.js` bundle
    - Add `src/cli/checkCitations.ts`: construct `NodeCitationFiles`, call `checkCommand(process.argv.slice(2), files, io)` with `console.log`/`console.error`, set `process.exitCode`, and carry the same rejection handler as the tail of `src/cli/runTask.ts`. Nothing else lives in this file.
    - Add a fifth bundle to `esbuild.js` beside `cli`: `entryPoints: ["src/cli/checkCitations.ts"]`, `outfile: "dist/check-citations.js"`, `platform: "node"`, `format: "cjs"`, `external: runtimeDependencies` - and `vscode` deliberately **not** in `external`, so the build breaks the moment anything reachable from this entry imports the editor.
    - Wire it into both `build()` and the watch list in `start()`, the way `cli` is wired into both.
    - Add no npm script and no editor command; invoking it is `node dist/check-citations.js <spec-folder>` and wiring it into a build is the caller's business.
    - [requirements : 6.7](requirements.md)

  - [ ]* 5.2 Boundary test over the checker's module graph
    - Add `src/sdd/citations/__tests__/checkerBoundary.test.ts`, reusing the import walk in `src/core/__tests__/coreBoundary.test.ts` - the same `sourceFiles` and `importedModules` shape - applied to `src/sdd/citations` and `src/cli/checkCitations.ts`.
    - Assert no file imports `vscode`, and no file reaches into `src/vscode` or `src/webview` by relative path.
    - Include the guard that keeps the walk from passing vacuously on a bad path, as `coreBoundary.test.ts` does.
    - [requirements : 6.7](requirements.md)

- [ ] 6. Checkpoint - `node dist/check-citations.js <folder>` builds, runs and exits on what it found
  - Run `npm run build` and confirm `dist/check-citations.js` is produced with no `vscode` resolution error.
  - Run `node dist/check-citations.js Samples/HelloWorld/.local-workflows/specs/citation-check` from the repository root and confirm the output lines and the exit code match what the report and command tests assert.
  - Run it with no argument and confirm it prints the usage line and exits non-zero.
  - Run `npm test` and confirm the full suite passes.

## Notes

**Why the order is what it is.** Group 1 has to land first because
everything after it imports `citationsIn`, and because moving a file the
panel depends on is the one change in this plan that can break a surface
nobody is testing here. Within group 1 the three tasks are strictly
sequential and share files - 1.1 and 1.3 both edit `SddRunView.tsx`, and
1.2 and 1.1 both edit `specRefs.ts` - so no two of them may run at once.

**Group 3 is one group, not three.** The port, the check, the report and
the command are one module, `src/sdd/citations`, and splitting them
across checkpoints would put a barrier between an interface and the only
thing that calls it. Inside the group only 3.3 and 3.5 can run together:
they write different new files and both depend on nothing later than 3.2.

**`NodeCitationFiles` gets no test of its own**, per the design's testing
strategy. Every behaviour that matters about it - `.md` only, one level
deep, `""` for absent, throw for anything else - is a contract the fake
`CitationFiles` in 3.2 and 3.4 exercises, and the claim that the checker
writes nothing is held by this being the only file in the feature that
imports `fs` and by that file calling no write API. If it ever grows a
second responsibility, that is the moment it earns a test.

**Nothing spawns the bundle from vitest.** The entry file holds only
argv-to-`checkCommand` wiring, and the suite does not build first; the
bundle is the build's assertion, not the test suite's. Checkpoint 6 is
where a person sees it run end to end.

**Task 5.2 is optional.** Skipping it leaves requirement 6.7 held by
`npm run build` alone, which is a real guard - esbuild fails the bundle
the moment anything reachable from the entry imports `vscode` - but a
narrower one. The build says nothing about a relative reach into
`src/webview`, which esbuild would happily bundle into a node CLI along
with React, and it only fires when somebody runs it rather than on every
`npm test`. Skip it for a faster first cut and add it before the feature
is relied on in review.

**Exit codes.** 1 means Findings, 2 means the run could not do its job -
argument errors, a path that is not a folder, an unreadable document.
Only zero-against-non-zero is contracted, so a caller may gate on either;
the split follows what `runTask.ts` already spends 1 and 2 on.

## Assumptions

1. A checkpoint runs `npm test` (vitest) and, where the build is what is
   being verified, `npm run build`. Those are the scripts `package.json`
   declares; no new script is added by this feature.
2. `src/webview/templates/SddRunView.tsx` is the only production file
   importing `specRefs`, and `src/webview/templates/__tests__/specRefs.test.ts`
   the only test - so task 1.1 touches exactly those two importers.
3. Task 1.2 adds `citationsIn` and touches nothing else in `specRefs.ts`.
   The fence handling and the inline-code stripping live in the new
   function; `parseRefLink` and `resolveRef` keep their current text.
4. The repository has no `AGENTS.md`, so the house conventions this plan
   follows are the ones the neighbouring modules already show: a port
   beside its node implementation, tests in a `__tests__` folder next to
   the code, inline fixtures rather than temp directories.
5. Requirements 3.1 to 3.4 are satisfied by code that ships today.
   Task 1.1 carries that code and its tests into the module the checker
   reads from, which is why it is the task those criteria are cited on;
   no new anchor-reading logic is written anywhere in this plan.
6. The report's line shape is `file:line: <citation> - <reason>`, which
   is what an editor's terminal already turns into a link. The exact
   wording of the reason is settled by the tests in 3.3.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3", "3.5"] },
    { "id": 6, "tasks": ["3.4"] },
    { "id": 7, "tasks": ["5.1"] },
    { "id": 8, "tasks": ["5.2"] }
  ]
}
```
