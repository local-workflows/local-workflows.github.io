# Requirements Document

## Introduction

A spec is three documents that point at each other by number: a plan's
tasks cite the acceptance criteria they implement, a design's
properties cite the criteria they validate. A revise that renumbers a
requirement silently breaks any citation that pointed at the old
number, and nothing outside the panel notices - a reviewer reading
`tasks.md` on GitHub or in a pull request sees an ordinary link, with
no way to tell it resolves to nothing.

This defines a checker that reads a spec folder's citations and reports
every one that does not resolve, so drift is caught in review rather
than found months later. It reads the one citation shape this
repository's SDD grammar defines and the one scheme that grammar uses
to number a document
([local-workflows-sdd-grammar : 2, 3](../../../../../resources/styles/custom/grammar.md)),
and is not asked to understand any other spec format's own references.
It reports; fixing what it finds is a person's job, not the checker's.

## Glossary

- **Citation**: a markdown link shaped `[Name : ids](target.md)`,
  exactly as the SDD grammar defines it - the only reference shape the
  checker reads. Any other link is ordinary prose, not its concern.
- **Target_Document**: the file a Citation's link points at, resolved
  relative to the document the Citation is written in.
- **Declared_Id**: an id a document exposes through the grammar's own
  numbering - a requirement's number, an acceptance criterion's `N.M`,
  or a document's own scheme such as `G11` or `FR-1`.

## Requirements

### Requirement 1: A spec can be checked without opening the panel

**User Story:** As a developer reviewing a pull request, I want to know
whether a spec's citations still resolve, so that I find out about
drift in review rather than months later.

#### Acceptance Criteria

1. WHEN the checker runs over a spec folder THEN THE checker SHALL
   report every Citation whose Target_Document does not exist as a
   file.
2. WHEN the checker runs over a spec folder THEN THE checker SHALL
   report every Citation naming a Declared_Id that its Target_Document
   does not declare.
3. WHERE a Target_Document declares no Declared_Id at all, THE checker
   SHALL report nothing for Citations of it.
4. WHEN the checker has reported anything THEN THE checker SHALL exit
   with a non-zero status.
5. THE checker SHALL NOT modify any file it reads.

### Requirement 2: The report says enough to act on

**User Story:** As a developer, I want each finding to name the file,
the line and the reference, so that I can fix it without hunting.

#### Acceptance Criteria

1. WHEN the checker reports a finding THEN THE checker SHALL name the
   file, the 1-based line, and the reference that failed.
2. IF a spec folder has no Citations at all THEN THE checker SHALL say
   so rather than reporting success silently.

## Assumptions

- Requirement 2.1 names "the reference that failed" in the singular, so
  a Citation listing several ids (`1.2, 3.1`) produces one finding per
  id that fails to resolve against an existing Target_Document, not one
  finding for the whole Citation - fixing one bad id out of three still
  needs to leave the reviewer told which one is still wrong.
- A Citation whose Target_Document does not exist at all produces one
  finding for the whole Citation, not one per id it lists - there is
  nothing to check any of its ids against yet, and Requirement 1.1
  already covers that case on its own.
- "A spec folder" in Requirement 1 is not narrowed to `requirements.md`,
  `design.md` and `tasks.md` - `intake.md`, `prd.md` and any other
  markdown file dropped into the folder is read for Citations too,
  since nothing in the ask names a shorter list.
