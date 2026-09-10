# AI problems and solutions

The problems below show up with every AI model and every AI tool.
Most are workflow bugs, not model bugs — and even the ones rooted in
model behavior are managed by workflow. Each has a working practice
that addresses it, regardless of which model or vendor you use.

---

## 1. One session, five jobs

**The problem.** A session starts as "add the endpoint". Then a test
fails, a stack trace gets pasted, a rename question comes up along
the way. Twenty minutes in, the answers are getting worse — and it is
not the model. Every failed tool call, every dead end, every side
discussion is still sitting in the context, and the model is
reasoning over all of it. Context quality decays, so output quality
decays with it.

**The solution.** Cut the work into the smallest unit that can stand
alone, and give each unit its own session. When one unit's output
feeds the next, carry forward only the finished result — never the
conversation that produced it. The failed attempts and the detours
die with their session instead of polluting the next one.

---

## 2. Lazy prompts

**The problem.** Writing a good prompt takes effort, and opening a
fresh session takes effort, so developers do neither. They type a
vague one-liner into the session that is already open and let the
model guess the rest. The model fills the gaps with assumptions, and
the output quality is a coin toss.

**The solution.** Write the good prompt once and save it. A prompt
worth using twice is worth being a file — reused exactly, refined
over time, never re-typed from memory. The effort is spent once,
deliberately, instead of being skipped a hundred times.

---

## 3. Everyone's own mega-prompt

**The problem.** Each developer on the team keeps their own version
of "the prompt that works" — in a notes app, a chat history, or their
head. Every version drifts differently, nobody reviews any of them,
and the same task produces different quality depending on who ran it.

**The solution.** Prompts are shared, versioned artifacts. Keep them
where the code lives, change them the way code changes — proposed,
reviewed, merged. One prompt per task for the whole team, and an
improvement made by one person reaches everyone.

---

## 4. AI doing jobs that never needed AI

**The problem.** "Create a PR" gets handed to a model as one job. But
two different things hide inside it: writing the description — a job
for a model — and creating the PR — a deterministic action a script
does perfectly every time. Putting a model in front of a
deterministic step adds no value; it only adds a way to fail.

**The solution.** Split every job into its AI part and its action
part. The model produces the value — the description, the summary,
the draft. A plain script performs the action. If a step has exactly
one correct outcome, it is not a job for a model.

---

## 5. No gate before irreversible actions

**The problem.** The model drafts something and the same automated
flow ships it — the PR opens, the message sends, the release goes
out. By the time a human sees the output, it is already public, and
wrong output is now an incident instead of an edit.

**The solution.** A manual gate between generation and any
irreversible action. The model may draft anything; a human reads the
actual, final output — not a summary of it — before it fires.
Reversible steps can flow; irreversible ones wait for a person.

---

## 6. One bad inference poisons everything after it

**The problem.** In a chained workflow, step two builds on step one's
output, step three on step two's. One plausible-but-wrong inference
early in the chain gets consumed by every step after it, and the
error compounds silently. By the end, the whole result is built on a
mistake nobody saw happen.

**The solution.** A checkpoint between steps. Each step consumes only
an output a human has approved — never a raw, unreviewed one. A bad
inference then costs you one step, caught at the gate, instead of the
whole chain.

---

## 7. Quality depends on who is driving, and on what day

**The problem.** The same task gives great output on Monday and
garbage on Thursday, great output from one developer and garbage from
another. Nothing about the model changed. What changed is the input:
each person's ad-hoc prompt, each session's accumulated mess.

**The solution.** Fix the inputs and the quality follows. Same
prompt — a saved one, not a re-typed one — plus same clean context,
per task. Consistency in, consistency out; the model was never the
variable.

---

## 8. Plausible-wrong output survives a tired reviewer

**The problem.** AI output looks right. It is fluent, well-formatted,
and confident — including when it is wrong. Hand a reviewer five
hundred generated lines and they skim; the mistake that reads
smoothly sails through. The better the model gets, the better the
wrong output looks.

**The solution.** Keep each unit of output small enough to actually
read. A reviewer can genuinely verify one small, focused output; no
reviewer can genuinely verify a wall of generated text. Small units
are not just better for the model's context — they are the only
output a human review can honestly certify.

---

## The pattern behind all eight

The workflow controls exactly two things — and every solution above
is one of them.

**The quality of what goes into the model.** Small units keep the
context clean. Saved, shared prompts keep the input fixed. That is
problems 1, 2, 3, and 7 — and it is the lever that actually changes
what the model produces.

**The cost of what comes out wrong.** Gates before irreversible
actions, checkpoints between steps, outputs small enough to honestly
review. That is problems 4, 5, 6, and 8 — and it changes nothing
about the output itself. It makes the failure cheap, contained, and
caught.

No workflow makes a model better than it is. But the first lever gets
you the model's best when it is right, and the second makes it
survivable when it is wrong. "Consistently its best" was never on
offer from any model — a clean input and a cheap failure is, and that
is enough.
