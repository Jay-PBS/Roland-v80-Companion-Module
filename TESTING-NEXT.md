# Hardware Test Sheet — NEXT RUN (not yet started)

> Queue for the next session with a V-80HD. `TESTING.md` is the closed record of the 2026-09-08
> run and should not be edited except to record where a finding went. Fill this one in on the day.

**Build under test:** `roland-v80hd-0.8.8.tgz` · **Tester:** Jay · **Date:** _(fill in)_
**Base:** 0.8.8 · **Device firmware:** v1.20.201

## Why there is a next run

Six things. One is a finding carried over, one is a fix made blind on 2026-09-10 that nobody has
seen work, one is a set of changes that shipped after the last run and were therefore never covered
by it, and three are the changes made on 2026-09-11 — the 0.8.6 Advanced grouping, the 0.8.7 Aux
categories and the 0.8.8 capture removal.

Sections 3 and 4 were cleared on 2026-09-11 without hardware and are kept here as the record of
that. Most of sections 6 and 7 need only Companion and can be cleared at a desk too. Everything
else is scheduled for the session in w/c 2026-09-14. The one item not to skip is 32 — image capture
still closing its own screen after the pruning.

---

## 1. Carried over — C7, PinP View Position

`pinp_view_position_h` and `pinp_view_position_v` showed no visible movement on 2026-09-08.

**The question to settle first is not "does it work" but "would I see it if it did."** View Position
is a -50 to +50 option; if the visible travel over that span is small, or only shows at particular
zoom or crop settings, then "nothing moved" is an observation problem, not a protocol one. That
changes the fix entirely, so establish it before touching any code.

| #   | Step                                                                                   | Result  | Notes                    |
| --- | -------------------------------------------------------------------------------------- | ------- | ------------------------ |
| 1   | PinP on PGM, View Zoom raised to 400% first, then View Position H to -50 and +50       | PENDING | Scheduled w/c 2026-09-14 |
| 2   | Same again at View Zoom 100%, for comparison                                           | PENDING | Scheduled w/c 2026-09-14 |
| 3   | Same two steps for View Position V                                                     | PENDING | Scheduled w/c 2026-09-14 |
| 4   | Try mid-range values (±25) in case the extremes clamp                                  | PENDING | Scheduled w/c 2026-09-14 |
| 5   | If any movement at all is seen, record at which zoom and which value it became visible | PENDING | Scheduled w/c 2026-09-14 |

**If still nothing at any setting:** capture RCS dragging a PinP view and read what it really sends.
Same method that identified `0B002A` in a single recording — tshark against `10.100.20.229` on
Ethernet 4. Only then is it a protocol problem.

Reference: Window Position H and V, Size, Cropping H and V and View Zoom all pass, so the layer is
visible and writable and this is not a "nothing on air" artefact.

---

## 2. Fixed blind on 2026-09-10 — needs eyes

| #   | Item                    | What to check                                                                                                                   | Result  | Notes                    |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------ |
| 6   | C5 — Split action order | In the Companion action list, Split 1 and 2 now sit after PinP & Key and before DSK. AUX and PinP groups each read as one block | PENDING | Scheduled w/c 2026-09-14 |
| 7   | Split still functional  | `split1_on/off/toggle` and `split2_on/off/toggle` all still fire after the move                                                 | PENDING | Scheduled w/c 2026-09-14 |

---

## 3. Shipped after the last run — never covered by it

These shipped after the 2026-09-08 session, so no one has tested them on hardware.

| #   | Item                         | What to check                                                           | Result | Notes                                 |
| --- | ---------------------------- | ----------------------------------------------------------------------- | ------ | ------------------------------------- |
| 8   | 0.8.5 button palette         | Active and inactive states are distinguishable at a glance on the panel | PASS   | Cleared 2026-09-11                    |
| 9   | 0.8.4 wording                | Stream & Record button text reads correctly in place                    | PASS   | Cleared 2026-09-11                    |
| 10  | HELP.md / raw-command labels | Labels match what the actions actually do                               | PASS   | Cleared 2026-09-11; raised §5 from it |

**Section closed 2026-09-11.** Item 10 raised the Advanced grouping request, which shipped as 0.8.6
and is queued as section 5 below.

---

## 4. Standing item — transition type feedback

Partial. Follows the module and responds to panel activity, but driving the transition from the
front panel directly can leave it showing an unexpected state. Root cause not established.

| #   | Step                                                                       | Result   | Notes                                                |
| --- | -------------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| 11  | Change transition type from the front panel repeatedly, watch the feedback | NO REPRO | No issues seen during the previous extensive testing |
| 12  | Note the exact sequence that produces a wrong state, if one can be found   | N/A      | Nothing to record while 11 does not reproduce        |

**Section closed 2026-09-11 as no-repro.** Not proven fixed and no root cause was established, so if
it resurfaces it comes back as a fresh finding rather than being reopened here.

---

## 5. New in 0.8.6 — Advanced action and preset

Raised by item 10 and built on 2026-09-11. Display and presentation only: the action id is still
`raw_command` and `cmdRaw` is untouched, so this is checking that the grouping reads correctly and
that nothing that already worked has been disturbed.

| #   | Item                          | What to check                                                                                                                                                           | Result | Notes |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----- |
| 13  | Action reads as its own block | In the Companion action list the entry now reads `Advanced – Send raw LAN command`. Record where it actually lands — same definition-order assumption item 6 is testing |        |       |
| 14  | Preset category exists        | An **Advanced** category appears in the presets list containing exactly one button, `Send raw LAN command`                                                              |        |       |
| 15  | Preset button face            | The button reads `RAW / LAN / CMD` and is legible at 16pt on the panel                                                                                                  |        |       |
| 16  | Preset drops with no command  | Dropping the preset onto a page gives a button whose command string is empty and editable                                                                               |        |       |
| 17  | Preset fires when allowed     | With "Allow advanced actions" ticked, filling in a known-good command (e.g. `DTH:001500,29;` sets PGM to Input 1) works from the preset button                          |        |       |
| 18  | Preset blocked when not       | With "Allow advanced actions" unticked, the same button sends nothing and logs the warning                                                                              |        |       |
| 19  | Existing buttons unaffected   | A raw-command button built before 0.8.6 still resolves after the rename — it is a display-name change only, not an id change                                            |        |       |

---

## 6. New in 0.8.7 — Aux preset categories and the split description

Built on 2026-09-11, same hardware-free session as 0.8.6. Presentation only — no ids changed. Items
20-25 need only Companion and can be cleared at a desk; item 26 needs the device.

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

Built on 2026-09-11. Item 32 is the one that matters: `cmdToggleCaptureMode` looks orphaned once both
Capture Mode actions are removed, but `cmdCaptureImage` reaches it through `cmdExitCaptureFunction`
and it is the only thing that emits `0B002A`. It was kept deliberately. If image capture is broken in
this build, that is where to look first.

Items 27-31 need only Companion. Items 32-33 need the device.

| #   | Item                            | What to check                                                                                                                  | Result | Notes |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ | ----- |
| 27  | Capture actions gone            | The action list offers only `Capture Image to Still` — no `Capture Mode (toggle)`, no `Capture Mode – close if open`           |        |       |
| 28  | Old buttons flagged, not hidden | Any button previously built on either removed action reads as an unknown action rather than silently doing nothing             |        |       |
| 29  | Short descriptions              | Browse list shows one line for both AUX Linked PGM actions, Capture Image, Stream & Record Start/Stop; Test Pattern shows none |        |       |
| 30  | Detail on the button            | Each of those shows its `Note` or `Warning` block above the options once placed on a button                                    |        |       |
| 31  | Stream hazard still visible     | `Stream & Record - Start` still names the livestream risk in the browse list, before it is picked                              |        |       |
| 32  | **Image capture still works**   | Fire `Capture Image to Still`. The still is captured AND the capture screen closes itself afterwards                           |        |       |
| 33  | Capture completion log          | The log still shows `Image capture complete` and the `Exiting capture function` diagnostic                                     |        |       |

---

## Outcome

_(fill in on the day: verdict, what failed, where each finding goes)_
