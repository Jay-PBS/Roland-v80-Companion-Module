# Hardware Test Sheet — OPEN TASKS

> **Open tasks only.** Cleared items are deleted, not recorded — the closed record lives in git
> history and in `PROTOCOL.md`. `TESTING.md` is the 2026-09-08 run and is not edited.

**Last updated:** 2026-09-16 · **Tester:** Jay · **Device firmware:** v1.20.201

## 0.8.10 is fully verified

**All ten checks passed, and both open protocol questions were answered.** Nothing from that build
is outstanding. What follows is only what has landed since.

Two protocol results worth carrying forward, both now in `PROTOCOL.md`:

- **Block reads do not work** (§8.6). `RQH:030200,000030;` returns nothing. The 142 frames that
  followed were every one a single-byte poll reply. This killed the Fade To Black block-diff plan —
  §10.1 lists what replaces it.
- **`0A0504` never reaches our session** (§4.11). The `030800` trap for the second time: a push seen
  in an RCS recording is not proof it reaches yours.

Plus two that came free from reading the wire (§2.3, §2.4): every answered read produces **two**
frames, `DTH:` then `ACK;`, and the device **batches its replies** — up to 22 frames in one segment,
splitting across boundaries — even though it refuses batched requests.

---

## Q. Fade To Black — verify the engaged state

**`QFTB;` works.** Confirmed 2026-09-16: `FTB:OFF;` with FTB clear, `FTB:ON;` engaged. Built and
polled; needs a build to test.

| #   | Check                                                                                                | Result |
| --- | ---------------------------------------------------------------------------------------------------- | ------ |
| Q1  | **Connect with FTB already engaged.** `Fade To Black – engaged` lights within a second or two        |        |
| Q2  | Toggle from Companion — the engaged feedback follows                                                 |        |
| Q3  | **Toggle on the V-80 panel — the engaged feedback follows.** This is what the redesign exists for    |        |
| Q4  | `Fade To Black – fade in progress` still lights only during the fade, and goes dark after            |        |
| Q5  | `$(v80hd:ftb)` reads `ENGAGED` / `CLEAR`; `$(v80hd:ftb_fading)` reads `ON` / `OFF`                   |        |
| Q6  | **Pull the network mid-fade.** Both feedbacks go dark rather than sticking lit, `$(ftb)` → `UNKNOWN` |        |
| Q7  | Engage FTB from the **Roland RCS software** if convenient — the feedback should still follow         |        |

**Q3 is the one that matters.** The old feedback could never track a panel press, and that was the
whole point of the redesign. Q6 is the disconnect bug fix; Q7 is a bonus if RCS is to hand.

**Watch the poll budget.** The cycle is now 65 commands rather than 64. With the device already
answering only ~58% of polls (`PROTOCOL.md` §7.2), note whether the engaged feedback feels sluggish —
if it does, `QFTB;` may be better sent every second cycle than every cycle.

**Breaking change to check:** `$(v80hd:ftb)` no longer returns `FADING`/`IDLE`. Any button expression
testing `= "FADING"` is now dead and needs pointing at `$(v80hd:ftb_fading)` instead.

---

## N. Next build — two changes to verify

Written 2026-09-16, typechecked and linted, **not yet packaged.** Bump the version before building.

### The Split relabel

Confirmed on the panel: **Split 1 is vertical, Split 2 is horizontal.** Now said in action names,
preset names, button faces, feedback names, variable display names and `HELP.md`.

| #   | Check                                                                                               | Result |
| --- | --------------------------------------------------------------------------------------------------- | ------ |
| N1  | Actions read `Split 1 (Vertical) – On/Off/Toggle` and `Split 2 (Horizontal) – …`                    |        |
| N2  | Presets read `Split 1 – Vertical` / `Split 2 – Horizontal`, faces `SPLIT / VERT` and `SPLIT / HORZ` |        |
| N3  | **An existing split button built before the rename still fires**                                    |        |
| N4  | Feedback names read `Split 1 (Vertical) – active`; `$(v80hd:split1)` still resolves                 |        |

**N3 is the only one that really matters.** The rename is display-only and every id was left alone —
`split1_on`, `split1_off`, `split1_toggle`, `split2_*`, both `*_active` feedbacks, both variable ids.
N3 is what proves it.

### The readable raw echo

Frames now render as text rather than hex, because a 242-byte segment of hex pairs is unreadable and
most segments are that size.

| #   | Check                                                                                     | Result |
| --- | ----------------------------------------------------------------------------------------- | ------ |
| N5  | Fire `RQH:001500,000001;`. `Raw RX` reads `<STX>DTH:001500,29;<LF><STX>ACK;<LF>`, not hex |        |

**Turn polling off first** — connection config, untick `Enable polling`. The echo arms for two
seconds, which with polling on catches four poll cycles and buries the reply among dozens of frames.
Turn it back on afterwards.

---

## D. Desk item — Companion only

| #   | Item                 | What to check                                                                                                                    | Result |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------ |
| D1  | Detail on the button | Place Capture Image and both Stream & Record actions on buttons — a labelled `Note` or `Warning` block appears above the options |        |

Largely implied by V6 and V7 having passed, but it covers Capture Image specifically, which they did
not.

---

## Deferred

- **Raw-command button built on an older version still fires.** No such button exists. Fold into the
  next regression pass, where a 0.8.10-era button will exist naturally.
