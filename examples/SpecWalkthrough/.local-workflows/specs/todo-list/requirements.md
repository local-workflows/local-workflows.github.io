# Requirements Document

## Introduction

A todo list for one person on one machine, used from the command line.
It holds a short list of things to do, remembers them between runs, and
answers the one question that is asked of it most often: what is still
open.

Everything outside that is deliberately absent. There are no accounts,
no server, no sharing, no due dates, no priorities and no tags. Adding
any of them later is a new spec; none of them is assumed here.

## Glossary

- **Todo_Item**: one thing to do. It has an id, a title, and a state.
- **Todo_List**: every Todo_Item, in the order they were added.
- **Active**: a Todo_Item that has not been completed.
- **Done**: a Todo_Item that has been completed.
- **Todo_File**: the file the Todo_List is saved to and read back from.

## Requirements

### Requirement 1: Add an item

**User Story:** As someone with things to do, I want to add an item to
the list, so that I stop holding it in my head.

#### Acceptance Criteria

1. WHEN a person adds a Todo_Item with a non-empty title THEN THE todo list SHALL store it as Active and give it an id that no Todo_Item has held before.
2. THE todo list SHALL remove leading and trailing whitespace from a title before storing it.
3. IF a title is empty once whitespace is removed THEN THE todo list SHALL refuse to add it and report that a title is needed.
4. IF a title is longer than 200 characters once whitespace is removed THEN THE todo list SHALL refuse to add it and report both the limit and the length given.
5. THE todo list SHALL keep Todo_Items in the order they were added.

### Requirement 2: Complete an item, and open it again

**User Story:** As someone working through the list, I want to mark an
item done, so that what is left is what I still have to do.

#### Acceptance Criteria

1. WHEN a person completes a Todo_Item THEN THE todo list SHALL mark it Done.
2. WHEN a person reopens a Done Todo_Item THEN THE todo list SHALL mark it Active.
3. IF a Todo_Item is already in the state being asked for THEN THE todo list SHALL succeed and change nothing.
4. IF no Todo_Item has the given id THEN THE todo list SHALL refuse the change and name the id it was given.

### Requirement 3: Delete an item

**User Story:** As someone whose list has gone stale, I want to delete
an item, so that the list is only things I still intend to do.

#### Acceptance Criteria

1. WHEN a person deletes a Todo_Item THEN THE todo list SHALL remove it from the Todo_List.
2. THE todo list SHALL NOT give a later Todo_Item the id of a deleted one.
3. IF no Todo_Item has the given id THEN THE todo list SHALL refuse the deletion and name the id it was given.

### Requirement 4: See the list, and see only what is open

**User Story:** As someone looking at the list, I want to see only what
is still open, so that finished work does not bury what is left.

#### Acceptance Criteria

1. WHEN a person asks for the list with no filter THEN THE todo list SHALL return every Todo_Item in the order they were added.
2. WHEN the filter is active THEN THE todo list SHALL return only Active Todo_Items.
3. WHEN the filter is done THEN THE todo list SHALL return only Done Todo_Items.
4. IF the filter is not one of all, active or done THEN THE command line SHALL refuse the request and name the three values it accepts.
5. WHERE the result holds no Todo_Items THE command line SHALL say the list is empty rather than printing nothing.

### Requirement 5: The list survives between runs

**User Story:** As someone who closes the terminal, I want the list to
still be there tomorrow, so that I can trust it with something I do not
want to forget.

#### Acceptance Criteria

1. WHEN a Todo_Item is added, changed or deleted THEN THE store SHALL write the whole Todo_List to the Todo_File before the command exits.
2. WHEN the command line starts and no Todo_File exists THEN THE store SHALL start from an empty Todo_List.
3. IF the Todo_File is not valid JSON THEN THE store SHALL refuse to start and name the file that is wrong.
4. IF the Todo_File is valid JSON but does not hold a Todo_List THEN THE store SHALL refuse to start and name the file that is wrong.
5. IF a write does not finish THEN THE store SHALL leave the previous Todo_File exactly as it was.
6. WHERE the TODO_FILE environment variable is set THE store SHALL read and write that path instead of the default one.

### Requirement 6: Say what went wrong

**User Story:** As someone who mistyped a command, I want one line
telling me what was wrong, so that I can fix it without reading a stack
trace.

#### Acceptance Criteria

1. WHEN a request is refused because of what the person asked for THEN THE command line SHALL print one line saying what was wrong and exit with a non-zero status.
2. IF a failure is not something the person did THEN THE command line SHALL print the underlying error rather than a one-line summary of it.
3. WHEN a request succeeds THEN THE command line SHALL exit with status zero.

## Assumptions

- **One list.** Nobody asked for more than one, and the Todo_File is a
  single file. A second list is the TODO_FILE variable pointed
  somewhere else, which requirement 5.6 already allows.
- **200 characters** is the title limit. The intake set no number. It is
  long enough for a real task and short enough to read in a list.
- **Ids are numbers, shown to the person.** Every command that changes
  an item takes one, so it has to be something a person can read off the
  screen and type back.
- **The list is small.** A few hundred items at most, so the whole file
  is read and written each time and nothing is indexed.
