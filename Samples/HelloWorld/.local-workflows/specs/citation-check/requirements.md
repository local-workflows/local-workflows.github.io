# Citation check

## Introduction

A spec is three documents tied together by number. `tasks.md` cites the
criteria a task answers for, `design.md` cites the criteria a property
validates, and `requirements.md` is where those numbers live. A revise
that renumbers requirements leaves both of the other documents pointing
at criteria that no longer exist, and the links still look like ordinary
links everywhere review actually happens - in the editor, on GitHub, in
a pull request.

The spec panel already knows how to spot this. It reads a citation as a
markdown link whose href is a `.md` file and whose text is a name, a
colon and criterion ids, resolves that href against the document holding
it, and strikes through any id the target does not contain. That reading
lives in `src/webview/templates/specRefs.ts` and runs only inside the
webview.

This feature gives the same reading a headless form: something a
developer or a build can point at a Spec_Folder to get a list of
Citations that no longer resolve, and an exit status to gate on. It
reports; it does not fix.

## Glossary

- **Spec_Folder**: one spec's folder - the folder holding `intake.md`,
  `requirements.md`, `design.md`, `tasks.md` and whatever else that
  spec's style writes.
- **Spec_Document**: a markdown file inside a Spec_Folder that the
  checker reads Citations out of.
- **Citation**: a markdown link that names criteria in another document -
  href ending in `.md`, link text shaped `name : ids`, as in
  `[Requirements : 1.2, 3.1](requirements.md)`.
- **Criterion_Id**: the number inside a Citation - `3` for a whole
  requirement, `3.2` for requirement 3's second acceptance criterion.
- **Requirement_Anchor**: a Criterion_Id a target document actually
  offers, taken from its `Requirement N` headings and the numbered lists
  under their acceptance-criteria markers.
- **Unnumbered_Document**: a target document that exists and offers no
  Requirement_Anchor at all - a PRD from another team, most likely.
- **Finding**: one thing the checker reports - a Citation that does not
  resolve, with where it was written.
- **Spec_Panel**: the existing in-editor spec view that renders these
  documents and marks stale references.
- **citation checker**: the whole thing this spec describes.
- **citation scanner**: the part that decides which links in a
  Spec_Document are Citations and where each one points.
- **anchor reader**: the part that works out which Requirement_Anchors a
  target document offers.
- **report writer**: the part that turns Findings into what a reader
  sees.
- **checker command**: how the citation checker is invoked headlessly,
  and what it exits with.

## Requirements

### Requirement 1: A spec can be checked without opening the panel

**User Story:** As a developer reviewing a pull request, I want to know
whether a spec's Citations still resolve, so that I find out about drift
in review rather than months later.

Traces to [prd : 1.1, 1.2, 1.3](prd.md).

#### Acceptance Criteria

1. WHEN the citation checker is pointed at a Spec_Folder THEN THE
   citation checker SHALL check every Citation in every Spec_Document in
   that folder.
2. IF a Citation's target file does not exist THEN THE citation checker
   SHALL report a Finding for it.
3. IF a Citation names a Criterion_Id the target document does not offer
   as a Requirement_Anchor THEN THE citation checker SHALL report a
   Finding for it.
4. WHERE the target is an Unnumbered_Document, THE citation checker
   SHALL NOT report a Finding for any Criterion_Id cited from it.
5. WHERE a Citation's target resolves to a file outside the Spec_Folder,
   THE citation checker SHALL check it on the same terms as one inside.
6. THE citation checker SHALL NOT write to, move or delete any file it
   reads.

### Requirement 2: One definition of what a citation is

**User Story:** As a spec author, I want the checker to count exactly the
links the Spec_Panel counts, so that a link nobody meant as a Citation is
never called broken.

Traces to [prd : 1.1, 1.2](prd.md).

#### Acceptance Criteria

1. THE citation scanner SHALL treat a markdown link as a Citation only
   when its href names a `.md` file and its link text is a name, a colon
   and a comma-separated list of Criterion_Ids.
2. IF a link does not meet both halves of that test THEN THE citation
   scanner SHALL leave it unreported.
3. IF a link's href carries a URL scheme or is protocol-relative THEN
   THE citation scanner SHALL NOT treat it as a Citation.
4. WHEN the citation scanner resolves a Citation THEN THE citation
   scanner SHALL resolve its href relative to the folder holding the
   Spec_Document the Citation was written in.
5. WHEN a Citation names several Criterion_Ids THEN THE citation scanner
   SHALL check each id separately.

### Requirement 3: One definition of what a criterion id resolves to

**User Story:** As a spec author, I want a Criterion_Id checked against
the same anchors the Spec_Panel jumps to, so that a passing check and a
clean panel mean the same thing.

Traces to [prd : 1.2, 1.3](prd.md).

#### Acceptance Criteria

1. THE anchor reader SHALL offer the Requirement_Anchor `N` for each
   heading naming `Requirement N`.
2. THE anchor reader SHALL offer the Requirement_Anchor `N.M` for the
   item numbered `M` in a numbered list sitting under requirement `N`'s
   acceptance-criteria marker.
3. WHERE a numbered list under a requirement sits under no
   acceptance-criteria marker, THE anchor reader SHALL NOT offer its
   items as Requirement_Anchors.
4. THE anchor reader SHALL take a criterion's number from how it is
   written rather than from its position in the list.
5. WHEN a target document offers no Requirement_Anchor at all THEN THE
   anchor reader SHALL report it as an Unnumbered_Document.

### Requirement 4: The checker and the panel agree

**User Story:** As a maintainer, I want the headless check and the
Spec_Panel to reach the same verdict on the same files, so that a second
reading of the grammar never becomes a second source of drift.

#### Acceptance Criteria

1. WHEN the Spec_Panel marks a reference stale in a Spec_Document THEN
   THE citation checker SHALL report a Finding for that same reference.
2. IF the Spec_Panel leaves a link as ordinary text THEN THE citation
   checker SHALL NOT report a Finding for it.
3. THE citation checker SHALL read Citations and Requirement_Anchors by
   the same rules the Spec_Panel reads them by.

### Requirement 5: The report says enough to act on

**User Story:** As a developer, I want each Finding to name the file, the
line and the reference, so that I can fix it without hunting.

Traces to [prd : 2.1, 2.2](prd.md).

#### Acceptance Criteria

1. WHEN the report writer reports a Finding THEN THE report writer SHALL
   name the file the Citation was written in.
2. WHEN the report writer reports a Finding THEN THE report writer SHALL
   name the 1-based line the Citation sits on.
3. WHEN the report writer reports a Finding THEN THE report writer SHALL
   name the reference that failed.
4. WHEN the report writer reports a Finding THEN THE report writer SHALL
   say whether the target file was missing or the Criterion_Id was.
5. WHEN the citation checker found Citations and reported no Finding
   THEN THE report writer SHALL say that the spec's Citations resolve.
6. IF a Spec_Folder holds no Citation at all THEN THE report writer
   SHALL say so rather than reporting success silently.

### Requirement 6: An exit status a build can gate on

**User Story:** As a developer, I want the check to fail a build when it
finds something, so that drift is caught by review rather than by
somebody reading the output.

Traces to [prd : 1.4](prd.md).

#### Acceptance Criteria

1. WHEN the citation checker reported at least one Finding THEN THE
   checker command SHALL exit non-zero.
2. WHEN the citation checker reported no Finding THEN THE checker
   command SHALL exit zero.
3. IF the checker command is given no path THEN THE checker command
   SHALL print how to invoke it.
4. IF the checker command is given no path THEN THE checker command
   SHALL exit non-zero.
5. IF the given path is not a folder THEN THE checker command SHALL say
   so and exit non-zero.
6. IF a Spec_Document cannot be read THEN THE checker command SHALL say
   which file and exit non-zero.
7. THE checker command SHALL run with no editor running.

## Assumptions

1. The Spec_Documents a run reads are the `.md` files directly inside
   the Spec_Folder. Nested folders are not walked, because no artifact
   in the grammar carries Citations from a sub-folder.
2. "Reported nothing" in [prd : 1.4](prd.md) means no Finding. The
   sentence written when a spec has no Citations at all
   ([prd : 2.2](prd.md)) is not a Finding, so it alone does not fail the
   run.
3. Zero against non-zero is the whole exit contract. No particular
   non-zero number is required, so a build can gate on failure without
   the checker owing anyone a table of codes.
4. The report is plain text on the process's own output. No machine
   format - JSON, SARIF, PR annotations - is in scope for this spec.
5. Only the two failures the PRD names are checked. A Citation that
   points backwards or forwards in the pipeline, a criterion nothing
   cites, and a `**Validates:**` line that is missing altogether are all
   real problems and none of them are this one.
6. The checker ships in the local-workflows codebase, beside the
   Spec_Panel whose reading it has to match, even though this
   Spec_Folder sits in the `Samples/HelloWorld` workspace used to
   dogfood the engine. Which folder to point it at is an argument, not a
   fixed path.
7. Checking one Spec_Folder per invocation is enough. Running it across
   every spec in a repository is a loop the caller writes.
8. A Citation that resolves is silent. The checker says nothing about
   each one it checked and passed - only the one closing sentence
   requirement 5 asks for.
