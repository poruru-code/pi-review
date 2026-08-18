# pi-review

`pi-review` adds a practical code review workflow to Pi via `/review` and `/end-review`
that is used by us at Earendil.

## Install

```bash
pi install git:github.com/earendil-works/pi-review
```

## What It Does

- Review **uncommitted changes**
- Review changes against a **base branch**
- Review a specific **commit**
- Review a GitHub **pull request** (checks it out locally via `gh`)
- Review one or more **folders/files** as a snapshot (not a diff)
- Produce prioritized findings with a clear verdict and actionable follow-ups
- It separates feedback to the agent from human callouts

It also supports custom shared instructions that are loaded from `REVIEW_GUIDELINES.md`.

## Quick usage

```bash
/review
/review uncommitted
/review branch main
/review commit abc123
/review pr 123
/review pr https://github.com/owner/repo/pull/123
/review folder src docs
/review branch main --extra "focus on performance and error handling"
```

When a review session is active, finish it with:

```bash
/end-review
```

You can then return only, return + summarize, or return + queue fixing work.

## Extension integration

`pi-review` exposes a small lifecycle contract over Pi's shared `pi.events` bus so another Pi extension, automation, logging integration, or review dashboard can observe reviews without scraping the UI:

- `pi-review:started` includes schema version 1, a unique `reviewId`, the resolved review target, `fresh` or `current` mode, the start timestamp, and the origin entry ID when available.
- `pi-review:settled` includes the same review correlation data, the settled timestamp, the latest assistant message ID and response text when available, and a machine verdict.
- `pi-review:ended` is emitted only after a fresh review successfully returns to its origin and clears review state. It includes the selected `return`, `summarize`, or `fix` action and the final verdict.

The exported verdict values are `correct`, `needs_attention`, and `unknown`. Only one exact standalone `Overall verdict: correct` or `Overall verdict: needs attention` response line is accepted. Missing, duplicate, contradictory, or unavailable verdict text produces `unknown`; surrounding prose is never used to guess a result.

Event names, payload types, `ReviewTarget`, and `PiReviewVerdict` are available as named exports. For example, another extension can subscribe with `pi.events.on(PI_REVIEW_SETTLED_EVENT, handler)`. The settled lifecycle uses Pi's official `agent_settled` Extension hook; older Pi versions without that hook cannot emit `pi-review:settled`.

Mode selection can be made explicit without changing the existing interactive default:

```bash
/review commit abc123 --fresh
/review folder src docs --current
/review branch main --fresh --extra "focus on concurrency"
```

Likewise, `/end-review` with no arguments still opens the existing action selector, while an explicit action skips it:

```bash
/end-review return
/end-review summarize
/end-review fix
```
