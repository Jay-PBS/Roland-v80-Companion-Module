# Hardware Test Sheet — OPEN TASKS

> **Open tasks only.** Cleared items are deleted, not recorded — the closed record lives in git
> history and in `PROTOCOL.md`. `TESTING.md` is the 2026-09-08 run and is not edited.

**Build under test:** `roland-v80hd-0.8.13.tgz` · **Tester:** Jay · **Firmware:** v1.20.201
**Last updated:** 2026-09-16

## Nothing outstanding

**0.8.13 is fully verified.** Every check passed — Fade To Black including the engaged state and the
panel tracking, the Split relabel, the readable raw echo, the FTB fade colour, and the on-button
detail blocks.

The raw echo also confirmed `QFTB;` is live in the poll rather than only in a manual test — every
cycle closes with:

```
<STX>DTH:0C0007,00;<LF><STX>ACK;<LF><STX>FTB:OFF;<LF><STX>ACK;<LF>
```

There are no open protocol questions, no open decisions, and no outstanding checks.

> **Check the connection is on the build you think it is, before testing anything.** Installing the
> `.tgz` adds the version to Companion's module list; **the connection stays pinned to the version it
> was already on**. This cost a round trip on 2026-09-16 — a working change was reported as broken
> and the whole code path re-verified before the version turned out to be the problem. The log line
> naming the module path is the quickest confirmation.

---

## Untestable by absence — fold into the next regression pass

Neither has a subject to test against, and neither is worth manufacturing an old build for. Both
become testable naturally once buttons exist that predate a later change.

- **A split button built before the Vertical/Horizontal rename still fires.** None exists. The risk
  is real but the evidence is not: every id was left untouched — `split1_on`, `split1_off`,
  `split1_toggle`, `split2_*`, both `*_active` feedbacks and both variable ids — and a Companion
  button references actions by id, so an unchanged id resolves. **Verified by inspection rather than
  on hardware**, which is worth saying out loud rather than recording as a pass.
- **A raw-command button built on an older version still fires.** Same situation.

---

## Held for 0.9 — the tidy-up release

Decided 2026-09-16. Housekeeping gets one deliberate pass rather than dribbling into point releases
where it obscures what actually changed:

- Untrack the test sheets and the code review
- Remaining repository management
- An aesthetic and consistency pass — button faces, categories, colour use, action naming
- A final end-to-end documentation review, including the beta wording

`working_doc.md` holds the detail. **Nothing is being built.** 0.8.14 exists only if something turns
up; on current evidence it does not need to.

---

## Changed in 0.8.11–0.8.13 without needing a test

Docs and config only, listed so nothing looks unexplained:

- **Feedback latency corrected** in README and HELP. Four places said "up to 500ms"; the device
  answers ~58% of polls, so the real figure is a 0.51 s median with a tail to 6.5 s.
- **HELP's Image Capture section rewritten** now the behaviour is confirmed — the button returns in
  about a second, and the overwrite warning leads rather than sitting at the end of a timing
  paragraph.
- **All issues and discussions point at the Bitfocus repo**, including the issue chooser here. The
  split is deliberate: this repository carries experimental work, the released one carries versions
  that have been through hardware testing.
