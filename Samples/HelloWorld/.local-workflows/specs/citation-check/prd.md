# PRD: nobody notices a spec drifting

## Problem

A spec is three documents that point at each other by number. The plan
cites the criteria each task answers for; the design cites the criteria
each property validates. Those numbers are the only thing tying the
three together.

Nothing checks them outside the panel. A reviewer who opens `tasks.md`
in the editor, on GitHub, or in a pull request sees the citations as
ordinary links and has no way to know that half of them point at
criteria a revise renumbered away. The drift is invisible exactly where
review actually happens.

## Requirements

### Requirement 1: A spec can be checked without opening the panel

**User Story:** As a developer reviewing a pull request, I want to know
whether a spec's citations still resolve, so that I find out about drift
in review rather than months later.

#### Acceptance Criteria

1. WHEN the check runs over a spec folder THEN THE checker SHALL report
   every citation whose target file does not exist.
2. WHEN the check runs over a spec folder THEN THE checker SHALL report
   every citation naming a criterion the target document does not
   contain.
3. WHERE a target document numbers no requirements at all, THE checker
   SHALL report nothing for citations of it.
4. THE checker SHALL exit non-zero when it reported anything.

### Requirement 2: The report says enough to act on

**User Story:** As a developer, I want each finding to name the file,
the line and the reference, so that I can fix it without hunting.

#### Acceptance Criteria

1. WHEN the checker reports a finding THEN THE checker SHALL name the
   file, the 1-based line, and the reference that failed.
2. IF a spec has no citations at all THEN THE checker SHALL say so
   rather than reporting success silently.

## Out of scope

- Fixing anything. The checker reports; a person edits.
- Any other document format. Only the shapes in the SDD grammar.
