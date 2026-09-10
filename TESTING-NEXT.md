# Hardware Test Sheet — NEXT RUN (not yet started)

> Queue for the next session with a V-80HD. `TESTING.md` is the closed record of the 2026-09-08
> run and should not be edited except to record where a finding went. Fill this one in on the day.

**Build under test:** _(fill in)_ · **Tester:** Jay · **Date:** _(fill in)_
**Base:** 0.8.5 (`main` @ `43a9c74`) · **Device firmware:** v1.20.201

## Why there is a next run

Three things need hardware. One is a finding carried over, one is a fix made blind on 2026-09-10
that nobody has seen work, and one is a set of changes that shipped after the last run and were
therefore never covered by it.

---

## 1. Carried over — C7, PinP View Position

`pinp_view_position_h` and `pinp_view_position_v` showed no visible movement on 2026-09-08.

**The question to settle first is not "does it work" but "would I see it if it did."** View Position
is a -50 to +50 option; if the visible travel over that span is small, or only shows at particular
zoom or crop settings, then "nothing moved" is an observation problem, not a protocol one. That
changes the fix entirely, so establish it before touching any code.

| #   | Step                                                                                   | Result | Notes |
| --- | -------------------------------------------------------------------------------------- | ------ | ----- |
| 1   | PinP on PGM, View Zoom raised to 400% first, then View Position H to -50 and +50       |        |       |
| 2   | Same again at View Zoom 100%, for comparison                                           |        |       |
| 3   | Same two steps for View Position V                                                     |        |       |
| 4   | Try mid-range values (±25) in case the extremes clamp                                  |        |       |
| 5   | If any movement at all is seen, record at which zoom and which value it became visible |        |       |

**If still nothing at any setting:** capture RCS dragging a PinP view and read what it really sends.
Same method that identified `0B002A` in a single recording — tshark against `10.100.20.229` on
Ethernet 4. Only then is it a protocol problem.

Reference: Window Position H and V, Size, Cropping H and V and View Zoom all pass, so the layer is
visible and writable and this is not a "nothing on air" artefact.

---

## 2. Fixed blind on 2026-09-10 — needs eyes

| #   | Item                    | What to check                                                                                                                   | Result | Notes |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------ | ----- |
| 6   | C5 — Split action order | In the Companion action list, Split 1 and 2 now sit after PinP & Key and before DSK. AUX and PinP groups each read as one block |        |       |
| 7   | Split still functional  | `split1_on/off/toggle` and `split2_on/off/toggle` all still fire after the move                                                 |        |       |

---

## 3. Never covered by the 0.8.5 run

These shipped after the 2026-09-08 session, so no one has tested them on hardware.

| #   | Item                         | What to check                                                           | Result | Notes |
| --- | ---------------------------- | ----------------------------------------------------------------------- | ------ | ----- |
| 8   | 0.8.5 button palette         | Active and inactive states are distinguishable at a glance on the panel |        |       |
| 9   | 0.8.4 wording                | Stream & Record button text reads correctly in place                    |        |       |
| 10  | HELP.md / raw-command labels | Labels match what the actions actually do                               |        |       |

---

## 4. Standing item — transition type feedback

Partial. Follows the module and responds to panel activity, but driving the transition from the
front panel directly can leave it showing an unexpected state. Root cause not established.

| #   | Step                                                                       | Result | Notes |
| --- | -------------------------------------------------------------------------- | ------ | ----- |
| 11  | Change transition type from the front panel repeatedly, watch the feedback |        |       |
| 12  | Note the exact sequence that produces a wrong state, if one can be found   |        |       |

---

## Outcome

_(fill in on the day: verdict, what failed, where each finding goes)_
