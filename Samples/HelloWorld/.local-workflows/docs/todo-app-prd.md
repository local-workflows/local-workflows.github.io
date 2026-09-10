# PRD: a simple todo app

## Problem

There is no small React app in this sample workspace. Every workflow and
spec here works on scripts and documents, so there is nothing to point a
spec at that gets built, run and looked at in a browser.

A todo app is the smallest thing that is still a real app: it has state,
a list, a form, and things that persist. It is enough to exercise a spec
from start to finish and end with something you can open.

## Who it is for

One person, on one machine, using a keyboard. Not a team. Nobody shares
a list and nobody is assigned anything.

## Requirements

### 1. Add a todo

A text box sits at the top of the page. Type a title, press Enter, and
the todo is added and appears in the list. The box clears and keeps
focus, so several can be typed in a row without touching the mouse.

A title that is empty or only spaces is not added. The box shows a short
message saying a title is needed, and the message clears as soon as
typing starts again.

A title is trimmed of spaces at both ends before it is stored, and is
capped at 200 characters.

### 2. See the list

Todos are shown newest first.

Each row shows a checkbox, the title, and a delete button. A done todo
stays in the list with its title struck through and dimmed.

When there are no todos at all, the list is replaced by a line saying
the list is empty.

### 3. Mark a todo done, and undo it

Clicking the checkbox marks a todo done. Clicking it again marks it not
done. Done todos stay where they are in the list; the order never
changes because something was ticked.

### 4. Edit a todo

Double-clicking a title turns that row into a text box holding the
current title. Enter saves it, Escape cancels and leaves the todo as it
was, and clicking outside the box saves it.

The same rules as adding apply to the saved title: trimmed, not empty,
capped at 200 characters. An empty edit cancels rather than deleting the
todo.

### 5. Delete a todo

The delete button removes that todo immediately. No confirmation.

### 6. Filter

Three buttons - All, Open, Done - decide which todos the list shows.
All is selected when the page first loads. The selected one is visibly
different from the other two.

The filter changes only what is shown. It never changes or deletes
anything.

### 7. Count what is left

Above or beside the filter, a line says how many todos are still open,
for example "3 open". It counts every open todo, not just the ones the
current filter is showing, and it updates as soon as anything is added,
ticked, unticked or deleted.

### 8. The list survives a reload

Todos are saved in the browser's `localStorage` under a single key.
Reloading the page, closing the tab and coming back, or restarting the
browser all bring the same list back, including which ones are done.

If the stored value is missing or cannot be read, the app starts with an
empty list rather than failing to load.

## Constraints

- React and TypeScript, built with Vite.
- No backend, no accounts, no sign-in, no network calls of any kind.
- Runs with `npm install` then `npm run dev`, and nothing else.
- It lives in this sample workspace, in its own folder.
- No UI component library. Plain CSS is fine.

## Out of scope

- Due dates, reminders, notifications, and anything time-based.
- Tags, projects, folders, priorities, sub-tasks.
- Search and sorting.
- Undo of a delete.
- Mobile layouts. Desktop browser only.
- Syncing between machines or browsers.
