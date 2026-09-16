# Hardware Test Sheet — OPEN TASKS

> **Open tasks only.** Cleared items are deleted, not recorded — the closed record lives in git
> history and in `PROTOCOL.md`. `TESTING.md` is the 2026-09-08 run and is not edited.

**Build under test:** `roland-v80hd-0.9.0.tgz` · **Tester:** Jay · **Firmware:** v1.20.201
**Last updated:** 2026-09-16

## 0.9.0 — presentation only, nothing urgent

**0.9.0 is the aesthetic and consistency pass.** No id changed, no protocol changed, and nothing an
existing button does changed — Companion copies names, faces and styles onto a button when a preset
is dropped rather than referencing them, so a button built before this keeps what it had. There is
nothing here that can regress a show.

Fold these into the next session whenever it happens:

| #   | Check                  | What to look for                                                                                                                                                            |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Renamed actions fire   | `PinP & Key – …`, `Stream & Record – Start` / `– Stop`, `Test Pattern – All Outputs (toggle)` / `– Off`, `Set` / `Toggle AUX Linked PGM – mode`, `Utility – Sync state now` |
| P2  | Feedback default style | Add any feedback by hand — it should arrive with black text and read better lit than unlit                                                                                  |
| P3  | PinP button faces      | `PiP 1` / `PiP 2` fit at 16pt without wrapping, on both the Aux and PinP & Key presets                                                                                      |

**0.8.13 was fully verified.** Every check passed — Fade To Black including the engaged state and the
panel tracking, the Split relabel, the readable raw echo, the FTB fade colour, and the on-button
detail blocks.

The raw echo also confirmed `QFTB;` is live in the poll rather than only in a manual test — every
cycle closes with:

```
<STX>DTH:0C0007,00;<LF><STX>ACK;<LF><STX>FTB:OFF;<LF><STX>ACK;<LF>
```

There are no open protocol questions and no open decisions. P1 to P3 above are cosmetic
confirmations of the 0.9.0 pass, not outstanding work.

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

## Still held — the rest of the 0.9 tidy-up

Decided 2026-09-16. **The aesthetic and consistency pass is done and shipped as 0.9.0** — that is
what P1 to P3 above cover. What remains needs no build and no hardware:

- Untrack the test sheets and the code review
- Remaining repository management
- A final end-to-end documentation review, including the beta wording

`working_doc.md` holds the detail. 0.8.14 was never built and is not needed.

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
