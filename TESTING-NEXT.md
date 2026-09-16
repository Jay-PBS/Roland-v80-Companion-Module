# Hardware Test Sheet — OPEN TASKS

> **Open tasks only.** Cleared items are deleted, not recorded — the closed record lives in git
> history and in `PROTOCOL.md`. `TESTING.md` is the 2026-09-08 run and is not edited.

**Build under test:** `roland-v80hd-0.8.12.tgz` · **Tester:** Jay · **Firmware:** v1.20.201
**Last updated:** 2026-09-16

Three groups, none verified: **Q** the Fade To Black engaged state, **N** the Split relabel and the
readable raw echo, **D** one desk item.

---

## Q. Fade To Black — the engaged state

**`QFTB;` works** — confirmed 2026-09-16, `FTB:OFF;` clear and `FTB:ON;` engaged. Now polled every
cycle and wired to a new feedback.

| #   | Check                                                                                          | Result |
| --- | ---------------------------------------------------------------------------------------------- | ------ |
| Q1  | Connect with FTB **already engaged** — `Fade To Black – engaged` lights within a second or two |        |
| Q2  | Toggle from Companion — the engaged feedback follows                                           |        |
| Q3  | **Toggle on the V-80 panel — the engaged feedback follows**                                    |        |
| Q4  | `Fade To Black – fade in progress` still lights only during the fade, then goes dark           |        |
| Q5  | `$(v80hd:ftb)` reads `ENGAGED` / `CLEAR`; `$(v80hd:ftb_fading)` reads `ON` / `OFF`             |        |
| Q6  | **Pull the network mid-fade** — the fade feedback goes dark instead of sticking lit            |        |
| Q7  | Engage from the **Roland RCS software**, if it is to hand — the feedback should still follow   |        |
| Q8  | **Drop a fresh FTB preset** from Transitions — it stays lit for as long as the output is black |        |
| Q9  | During the fade it shows the transition colour, then red once engaged — two distinct states    |        |

**Use a freshly dropped preset for the whole Q group.** An FTB button built before 0.8.12 still
carries only _fade in progress_ — presets are copied when dropped rather than linked, so an existing
button keeps the feedback it was created with. That is what made 0.8.11 look broken: the feature
worked, the button was not wired to it.

**Q3 is the whole point of the change.** The old feedback could never track a panel press. Q6 is the
disconnect fix — note that `engaged` deliberately **holds** its value through a disconnect while
`fade in progress` clears, because the switcher keeps doing what it was doing.

**Breaking change to check:** `$(v80hd:ftb)` no longer returns `FADING`. Any button expression
testing `= "FADING"` is dead and needs pointing at `$(v80hd:ftb_fading)`.

**Watch the poll budget.** The cycle is 65 commands now, not 64, against a device already answering
only ~58% of polls. If the engaged feedback feels sluggish, `QFTB;` may be better sent every second
cycle — worth noting, not worth pre-empting.

---

## N. The Split relabel and the readable raw echo

Written 2026-09-16, never run — these missed the 0.8.10 package.

| #   | Check                                                                                               | Result |
| --- | --------------------------------------------------------------------------------------------------- | ------ |
| N1  | Actions read `Split 1 (Vertical) – On/Off/Toggle` and `Split 2 (Horizontal) – …`                    |        |
| N2  | Presets read `Split 1 – Vertical` / `Split 2 – Horizontal`, faces `SPLIT / VERT` and `SPLIT / HORZ` |        |
| N3  | **A split button built before the rename still fires**                                              |        |
| N4  | Feedbacks read `Split 1 (Vertical) – active`; `$(v80hd:split1)` still resolves                      |        |
| N5  | Fire `RQH:001500,000001;` — `Raw RX` reads `<STX>DTH:001500,29;<LF><STX>ACK;<LF>`, not hex          |        |

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

## Also changed in 0.8.11 and 0.8.12, no test needed

Docs and config only, listed so nothing looks unexplained:

- **Feedback latency corrected** in README and HELP. Four places said "up to 500ms"; the device
  answers ~58% of polls, so the real figure is a 0.51 s median with a tail to 6.5 s.
- **HELP's Image Capture section rewritten** now V1 has confirmed the behaviour — the button returns
  in about a second and the screen clears itself later, and the overwrite warning is no longer buried
  at the end of a paragraph about timing.
- **`repository` and `bugs` repointed at the Bitfocus repo** in `manifest.json` and `package.json`.
  **This has a live consequence** — see `working_doc.md`, "Open — needs a decision". Bug reports from
  Companion now land in a repository holding 0.4.0, while `CONTRIBUTING.md` and the issue templates
  still describe this one.

---

## Deferred

- **Raw-command button built on an older version still fires.** No such button exists. Fold into the
  next regression pass, where a 0.8.10-era button will exist naturally.
