# Hardware Test Sheet — OPEN ITEMS

> Live queue. Completed items are deleted, not struck through — same convention as
> `working_doc.md`. `TESTING.md` is the closed record of the 2026-09-08 run and should not be
> edited except to record where a finding went.

**Build under test:** `roland-v80hd-0.8.8.tgz` · **Tester:** Jay · **Base:** 0.8.8
**Device firmware:** v1.20.201 · **Last updated:** 2026-09-14

**Section numbers are deliberately non-contiguous.** Sections 2-5 have been removed as cleared, and
1, 6 and 7 keep their original numbers so the cross-references in `working_doc.md` stay valid. Item
numbers (20-33) are likewise unchanged.

## Cleared — do not retest

| §   | Subject                                | Cleared    |
| --- | -------------------------------------- | ---------- |
| 2   | C5 Split action order, and still fires | 2026-09-14 |
| 3   | 0.8.5 palette, 0.8.4 wording, HELP.md  | 2026-09-11 |
| 4   | Transition type feedback — no repro    | 2026-09-14 |
| 5   | 0.8.6 Advanced action and preset       | 2026-09-14 |

Section 4 is closed as no-repro rather than proven fixed — if it resurfaces it comes back as a fresh
finding. Section 2 raised F1 below.

## Still open

Three sections and one finding. Only items 26, 32 and 33 need the V-80HD; everything else in 6 and 7
is desk work in Companion alone.

---

## 1. Carried over — C7, PinP View Position

**Rerun booked 2026-09-15.** `pinp_view_position_h` and `pinp_view_position_v` showed no visible
movement on 2026-09-08, and reproduced as zero-effect again on 2026-09-14 — but the run tested each
action individually rather than following the steps below, so the question the section exists to
answer is still open. Acknowledged by the tester on the day.

**The question is not "does it work" but "would I see it if it did."** View Position is a -50 to +50
option; if the visible travel over that span is small, or only shows at particular zoom or crop
settings, then "nothing moved" is an observation problem, not a protocol one. That changes the fix
entirely, so establish it before touching any code.

**Run these in order. The pairing is the point** — zoom raised _first_, then position moved while
that zoom is held.

| #   | Step                                                                                   | Result | Notes |
| --- | -------------------------------------------------------------------------------------- | ------ | ----- |
| 1   | PinP on PGM, View Zoom raised to 400% first, then View Position H to -50 and +50       |        |       |
| 2   | Same again at View Zoom 100%, for comparison                                           |        |       |
| 3   | Same two steps for View Position V                                                     |        |       |
| 4   | Try mid-range values (±25) in case the extremes clamp                                  |        |       |
| 5   | If any movement at all is seen, record at which zoom and which value it became visible |        |       |

**Do not escalate to a packet capture until steps 1-4 have been run as written and still show
nothing.** It is about ten minutes of work and it decides whether this is a protocol bug or an
observation artefact.

**If still nothing at any setting:** capture RCS dragging a PinP view and read what it really sends.
Same method that identified `0B002A` in a single recording — tshark against `10.100.20.229` on
Ethernet 4. Only then is it a protocol problem.

**Confirmed working on 2026-09-14, for reference** — View Zoom, Window Cropping H, Window Position H
and V. Size and Cropping V passed on 2026-09-08. So the layer is visible and writable and this is not
a "nothing on air" artefact.

**Keep the PiP Layout preset off the panel during this** — it writes `pinp_view_position_h/v` at 0,
the exact parameter under test.

### 1b. Block reads — settle a contradiction. Two minutes

Unrelated to View Position, but it needs the device and it is cheap. **The record contains two
hardware results four days apart that cannot both be right**: on 2026-09-04 a block read
`RQH:030200,000030;` "returned all 48 bytes", and on 2026-09-08 the same command "returned nothing at
all". The second is the currently shipped position in `README.md`, and it is why Fade To Black is
parked as a device limit.

**This gates the whole FTB search plan**, so it is worth two minutes to settle.

| #   | Step                                                                                            | Result | Notes |
| --- | ----------------------------------------------------------------------------------------------- | ------ | ----- |
| B1  | Enable **Allow advanced actions** in the connection config, and turn debug logging on           |        |       |
| B2  | Fire `Advanced – Send raw LAN command` with command string `RQH:030200,000030;`                 |        |       |
| B3  | Read the **debug log**, not the feedback. Record whether 48 bytes, 1 byte, or nothing came back |        |       |

**Count the bytes on the wire, not in the parser.** `parseDth` truncates every reply to its first
byte, so a successful 48-byte read and a 1-byte read look identical at the application layer — which
may be exactly what made the 2026-09-04 result look like a success. The `RX RAW` debug line is the
one that settles it.

**If bytes come back:** repeat with FTB engaged and settled, then diff the two dumps. Whichever byte
differs is the steady FTB state — the answer to the one open question `README.md` currently asks the
public for help with.

---

## 6. New in 0.8.7 — Aux preset categories and the split description

**NOT STARTED.** Built on 2026-09-11. Presentation only — no ids changed. Items 20-25 need only
Companion and can be cleared at a desk; item 26 needs the device.

Confirmed empirically before the change: Companion sorts preset categories case-sensitively with
uppercase ahead of lowercase, which is why `AUX` sorted above `Advanced` and `Audio`.

| #   | Item                        | What to check                                                                                        | Result | Notes |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------- | ------ | ----- |
| 20  | Category sort order         | The preset sidebar reads `Advanced, Audio, Aux 1, Aux 2, Aux Link, DSK, …`                           |        |       |
| 21  | No presets lost             | All 33 presets still present across the renamed categories — 14 in Aux 1, 14 in Aux 2, 5 in Aux Link |        |       |
| 22  | Rename did not leak         | AUX dropdowns inside the actions still read `AUX 1` / `AUX 2` — they share the same string in source |        |       |
| 23  | Button faces unchanged      | Preset buttons still read `AUX1 3`, `AUX LINK OFF` etc. Only the category labels changed, by design  |        |       |
| 24  | Browse list is terse        | The action list shows only `Expert use only.` beneath `Advanced – Send raw LAN command`              |        |       |
| 25  | Detail shows on the button  | Adding it to a button shows a `Warning` block with the full caution and example above Command string |        |       |
| 26  | Existing buttons unaffected | A raw-command button built on 0.8.6 still fires after the extra option was added                     |        |       |

---

## 7. New in 0.8.8 — capture actions removed, descriptions shortened

**NOT STARTED.** Built on 2026-09-11. Item 32 is the one that matters: `cmdToggleCaptureMode` looks
orphaned once both Capture Mode actions are removed, but `cmdCaptureImage` reaches it through
`cmdExitCaptureFunction` and it is the only thing that emits `0B002A`. It was kept deliberately. If
image capture is broken in this build, that is where to look first.

Items 27-31 need only Companion. Items 32-33 need the device.

| #   | Item                            | What to check                                                                                                                  | Result                                       | Notes |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ----- |
| 27  | Capture actions gone            | The action list offers only `Capture Image to Still` — no `Capture Mode (toggle)`, no `Capture Mode – close if open`           | --correct functionality for a capture button |
| 28  | Old buttons flagged, not hidden | Any button previously built on either removed action reads as an unknown action rather than silently doing nothing             |                                              |       |
| 29  | Short descriptions              | Browse list shows one line for both AUX Linked PGM actions, Capture Image, Stream & Record Start/Stop; Test Pattern shows none |                                              |       |
| 30  | Detail on the button            | Each of those shows its `Note` or `Warning` block above the options once placed on a button                                    |                                              |       |
| 31  | Stream hazard still visible     | `Stream & Record - Start` still names the livestream risk in the browse list, before it is picked                              |                                              |       |
| 32  | **Image capture still works**   | Fire `Capture Image to Still`. The still is captured AND the capture screen closes itself afterwards                           |                                              |       |
| 33  | Capture completion log          | The log still shows `Image capture complete` and the `Exiting capture function` diagnostic                                     |                                              |       |

**Reminder for whoever runs this:** do not fire two captures less than 7 seconds apart, or the first
one's dismissal lands on the second capture's screen.

**⚠ Items 29 and 31 are on borrowed time.** The browse-list cleanup queued in `working_doc.md` —
decided 2026-09-14, landing next build — removes every `description` except `raw_command`'s and
moves any text that is genuinely needed into a `static-text` option on the button instead. That
voids item 29 outright, and item 31 will need rewriting to check the livestream hazard on the
**button** rather than in the browse list. **Clear section 7 against this 0.8.8 build first, or
rewrite 29 and 31 before the cleanup lands** — do not test the sheet as written against a cleaned-up
build.

---

## Findings

### F1 — Split 1 and Split 2 need naming for what they do

Raised 2026-09-14 from section 2, which is otherwise cleared. Both splits work and sit in the right
place in the action list, but they are labelled only by number. **Split 1 is the vertical split and
Split 2 is the horizontal split**, and nothing in the module says so — the operator has to remember
or guess.

Display-only change. **The ids must not change** — `split1_on`, `split1_off`, `split1_toggle`,
`split2_*`, the `split1_active` / `split2_active` feedbacks and the `split1` / `split2` variables
all stay exactly as they are, or existing buttons break. Same call as the 0.8.6 Advanced rename.

Touch points, all display strings:

| File                                              | What                                              |
| ------------------------------------------------- | ------------------------------------------------- |
| [src/actions.ts:281-286](src/actions.ts#L281)     | Six action names, `Split 1 – On` etc.             |
| [src/feedbacks.ts:218-230](src/feedbacks.ts#L218) | Two feedback names                                |
| [src/variables.ts:27-28](src/variables.ts#L27)    | Two variable display names (not the variable ids) |
| [src/presets.ts:422-437](src/presets.ts#L422)     | Two preset names and both button faces            |
| [companion/HELP.md:66-68](companion/HELP.md#L66)  | The Split section and the variable table          |

**Open: confirm which is which.** The note recorded "re-label 1 with vertical and 2 horizontal", and
that mapping should be checked against the panel rather than trusted from a hurried note. Also
undecided: whether the button faces become `SPLIT / VERT` and `SPLIT / HORZ`, or keep the numbers
and carry the orientation in the name only.

---

## Next session

1. **Section 1, steps 1-5 in order** — the only item needing the device that is genuinely unresolved.
2. **Confirm F1's orientation mapping** on the panel while the unit is in front of you.
3. **Sections 6 and 7 at the desk** — items 26, 32 and 33 need the device, the rest do not. Item 32
   is the one not to skip.

**Not on this sheet yet:** the duplicate initial poll at connect (`onAuthenticated()` has no
idempotency guard and fires from two readiness markers, so the 64-command state burst goes out
twice) and the §5.3 optimistic-update inconsistency in the freeze trio. Both are code changes that
do not exist yet — see `working_doc.md`. If either lands, this sheet needs a new section for it
rather than being tested blind.
