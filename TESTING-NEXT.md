# Hardware Test Sheet — OPEN TASKS

> **Open tasks only.** Cleared items are deleted, not recorded — the closed record lives in git
> history and in `PROTOCOL.md`. `TESTING.md` is the 2026-09-08 run and is not edited.

**Build under test:** `roland-v80hd-0.8.13.tgz` · **Tester:** Jay · **Firmware:** v1.20.201
**Last updated:** 2026-09-16

**Fade To Black is done.** Q1-Q6, Q8 and Q9 all passed on 0.8.12 — engaged tracks the panel, the
variables read correctly, and the fade feedback clears on disconnect instead of sticking. The only
change since is the colour, below.

> **Check the connection is on this build before testing anything.** Installing the `.tgz` adds the
> version to Companion's module list; **the connection stays pinned to the version it was already
> on**. Change it on the connection itself. This cost a round trip on 2026-09-16 — a working change
> was reported as broken and the whole code path re-verified before the version turned out to be the
> problem. The log line naming the module path is the quickest confirmation.

---

## C. The FTB fade colour — one check

Q4 passed but asked for orange instead of purple, so the fade no longer borrows the transition
colour. Red is now reserved for "the output is actually black".

| #   | Check                                                                          | Result |
| --- | ------------------------------------------------------------------------------ | ------ |
| C1  | Drop a fresh FTB preset — the fade shows **orange**, then **red** once engaged |        |

Only a freshly dropped preset picks this up. An existing button keeps the styling it was created
with.

---

## N. The Split relabel and the readable raw echo

N1 and N2 passed on 0.8.12. Three left.

| #   | Check                                                                          | Result |
| --- | ------------------------------------------------------------------------------ | ------ |
| N3  | **A split button built before the rename still fires**                         |        |
| N4  | Feedbacks read `Split 1 (Vertical) – active`; `$(v80hd:split1)` still resolves |        |
| N5  | Fire `RQH:001500,000001;` — `Raw RX` reads readable text, not hex              |        |

**N3 is the only one that really matters.** The rename is display-only and every id was left alone,
so N3 is what proves it.

**For N5, turn polling off first** — the echo arms for two seconds, which with polling on catches
four poll cycles and buries the reply.

---

## D. Desk item — Companion only

| #   | Check                                                                                                                            | Result |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------ |
| D1  | Place Capture Image and both Stream & Record actions on buttons — a labelled `Note` or `Warning` block appears above the options |        |

---

## Closed without testing

- **Q7, engaging FTB from the Roland RCS software.** Cannot be run and never could: **the V-80HD
  accepts a second control session and then sends it nothing** (`PROTOCOL.md` §1.3). RCS and
  Companion cannot both hold the port, so there is no configuration in which this test exists. It
  should not have been written. The underlying question — does the feedback track a change the
  module did not make — is answered by Q3 from the panel.

---

## Not in this build — held for 0.9

Decided 2026-09-16. Housekeeping gets one deliberate pass rather than dribbling into point releases
where it obscures what actually changed: untracking the test sheets and the code review, the
remaining repository management, an aesthetic and consistency pass over button faces, categories,
colour use and action naming, and a final end-to-end documentation review including the beta wording.

`working_doc.md` holds the detail. **Nothing is being built right now** — the next build is 0.8.14 if
the checks above turn something up, and may not need to exist if they all pass.

---

## Also changed in 0.8.11–0.8.13, no test needed

Docs and config only, listed so nothing looks unexplained:

- **Feedback latency corrected** in README and HELP. Four places said "up to 500ms"; the device
  answers ~58% of polls, so the real figure is a 0.51 s median with a tail to 6.5 s.
- **HELP's Image Capture section rewritten** now the behaviour is confirmed — the button returns in
  about a second, and the overwrite warning leads rather than sitting at the end of a timing
  paragraph.
- **All issues and discussions point at the Bitfocus repo**, including the issue chooser here. The
  split is deliberate: this repository carries experimental work, the released one carries versions
  that have been through hardware testing.

---

## Deferred

- **Raw-command button built on an older version still fires.** No such button exists. Fold into the
  next regression pass, where a 0.8.12-era button will exist naturally.
