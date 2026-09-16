# Hardware Test Sheet — COMPLETED, 2026-09-08

> **This run is finished and its results shipped as v0.8.5.** The sheet is kept as the record of
> what was actually tested and observed — **do not blank it to reuse.** Copy it to a new file for the
> next run, so this one stays intact as evidence.

**Tested build:** `roland-v80hd-0.8.3.tgz` · **Tester:** Jay · **Date:** 2026-09-08
**Base:** 0.6.5 (`main` @ `68787f8`) · **Shipped as:** 0.8.5, tagged `v0.8.5` at the merge commit

> **Two findings here were later overturned. Nothing below has been edited** — this is what was
> observed on the day, and it stays that way. Read these two alongside it:
>
> - **The Fade To Black steady state.** Recorded here, and at the bottom of this sheet, as living at
>   an address not yet identified. It lives at no address: it is read with `QFTB;` from Roland's
>   mnemonic command set, **confirmed on hardware 2026-09-16**. `PROTOCOL.md` §10.1.
> - **C7, View Position H and V.** Carried forward here as Open. They work — the travel is simply too
>   small to see until View Zoom is raised. **Confirmed 2026-09-15.** `PROTOCOL.md` §10.2.

## Outcome

**Verdict: merge.** No regressions against 0.6.5. The 0.7.0 password migration worked with no
re-entry, every action, feedback, variable and preset category checked out, and a 30-minute soak was
clean. That closed the three "can only be judged on hardware" unknowns that had been open since
0.7.0 was written.

**What failed, and where it went:**

| Finding                                                                    | Status                                                                                          |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| C7 — View Position H and V show no visible movement (see correction below) | **Open.** Carried to the next run — retest at extremes with View Zoom raised                    |
| A4 — a corrected password is not retried until the connection is toggled   | **Closed 2026-09-10** — passed on retest                                                        |
| C67 — `sync_now` gives the operator no feedback at all                     | **Closed 2026-09-10** — redundant while polling runs. Kept as an action, deliberately no preset |
| C5 — Split actions sit in an odd order in the list                         | **Fixed 2026-09-10** — Split moved after PinP & Key. Verify in the next run                     |
| A5 / A7 — untestable rather than passing; the auth window is under 100ms   | **Closed 2026-09-10** — recorded in README as untested; needs an automated harness              |
| G — FTB block read returned nothing, so that approach does not work        | **Parked 2026-09-10** — looks like a device limit. README asks for input                        |

**Dispositions applied 2026-09-10.** The Status column above records where each finding went after
Jay reviewed them. Three are closed, one fixed in code, one parked, one carried forward. The carried
and fixed items are queued for the next hardware session in `TESTING-NEXT.md`.

Changes made **after** this run and therefore **not** covered by it: the 0.8.5 palette work, the
0.8.4 wording changes, and the HELP.md / raw-command label fixes. Those need their own pass.

---

## Original brief

0.8.1 is the code review branch plus the capture-screen fix — see `CODE_REVIEW.md` §0 for the review
changes and why. The review changes had not been near a V-80HD; 0.8.0 was tried and broke Image
Capture, which 0.8.1 fixed. The 0.7.0 definitions were diffed against the 0.6.5 build and 108
presets, 67 actions and 28 of 29 feedbacks came out byte-identical, so most of this sheet is
regression cover rather than new ground. 0.8.1 adds two actions on top, taking the total to 70.
**Section A is where the real risk is** — do it first and stop if it fails. **Section G2 is the new
work**, and C66 is the regression that 0.8.0 caused.

## How to use this sheet

Write in the **Result** column: `P` pass · `F` fail · `-` not tested · `NA` not applicable · `B` blocked.
Put anything you observed in **Notes** — a wrong value is worth more than a bare F.

Anything marked **F**, copy the row into the bottom of `working_doc.md` before closing the session,
per the working-doc convention. Leave this file whole as the record of the run.

**Setup before starting**

1. Install `roland-v80hd-0.8.3.tgz` into Companion. Confirm the version shows **0.8.3**, not 0.6.5 —
   Companion caches by version, and a stale 0.6.5 would make the whole sheet meaningless.
2. Do **not** delete the existing connection. A1 depends on an existing 0.6.5 connection with a saved
   password being upgraded in place.
   - **Caveat:** 0.8.0 was already installed over it. If that upgrade already moved the password into
     the secrets store, A1 has effectively been run once and will pass trivially. Record that in the
     A1 note rather than reporting a clean pass.
3. **Delete any button built on `menu_exit`.** That action existed only in 0.8.0 and is gone in 0.8.1,
   so a button using it will show as an unknown action. Repoint it at `capture_screen_close` if you
   want to keep it.
4. Turn on **Enable debug logging** in the connection config for section A, then turn it back off.

**Suggested order for a full run:** A → B → G2 → C → D → E → F → G → H. A gates everything, and G2 is
the only genuinely new code, so both are worth doing while you are fresh.

---

## A. Gate — the 0.7.0 changes that could stop it working

These ship in 0.8.1 and have never been tested on hardware. They are 0.7.0 work, not 0.8.x work.

If A1 fails, nothing else on the sheet is testable.

| #   | Area                | What should happen                                                                                                                       | How to test                                                                                                                                                                                                    | Result | Notes |
| --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----- | --------------------------------------------------------------- |
| A1  | Password migration  | The existing connection authenticates with **no password re-entry**. The upgrade script moves the saved password into the secrets store. | Install 0.8.3 over the existing 0.6.5 connection. Watch the status go Connecting → Authenticating → OK without touching config.                                                                                |        |       | PASS                                                            |
| A2  | Password field type | The config now shows the password as a **secret** field (masked, not echoed back after save).                                            | Open the connection config. Check the field is masked and the rest of the config (IP, port, checkboxes) is intact.                                                                                             |        |       | PASS                                                            |
| A3  | Password re-entry   | Clearing and retyping the password still works.                                                                                          | Blank the password, save (expect auth failure), retype it, save. Should reconnect cleanly. PASS                                                                                                                |        |       |
| A4  | Wrong password      | A wrong password reports "Authentication failed – check password" and does **not** retry into the device lockout.                        | Enter a deliberately wrong password. Watch the log. Then restore the correct one. _Do this once only._ PASS BUT HAVE TO TOGGLE CONNECTION OFF AND BACK ON TO ACCEPT NEW PW, JUST ENTER AND SAVE SITS AT FAILED |        |       |
| A5  | Auth gate           | A button pressed during the Connecting/Authenticating window is **dropped with a warning**, not sent.                                    | Disable/re-enable the connection and hammer a PGM button during the ~1s auth window. Log should show "Not authenticated yet".                                                                                  |        |       | GREY - CONNECTION TO FAST TO SHOW AUTHENICATION WARNING <100mS> |
| A6  | Auth gate — no loss | Once connected, **nothing** is being dropped. This is the regression risk of A5.                                                         | With debug on, press 10 assorted buttons. Every one should show a `TX:` line and no "command dropped" warnings. PASS                                                                                           |        |       |
| A7  | Sync now gated      | `Sync state now` does nothing before auth, works after.                                                                                  | Press it mid-reconnect, then again once connected. CONNECTION TO FAST                                                                                                                                          |        |       |
| A8  | Auth still clean    | No stray `ERR:0` on the wire during connect. The prompt handling changed.                                                                | With debug on, watch a full connect. Look for `ERR:` in the RX lines.                                                                                                                                          |        | PASS  |

---

## B. Connection and recovery

| #   | Area                  | What should happen                                                                                                                                                             | How to test                                                                                                          | Result | Notes |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------ | ----- |
| B1  | Cold connect          | Status reaches OK and initial state populates within a second or two.                                                                                                          | Disable then enable the connection. PASS                                                                             |        |       |
| B2  | Watchdog — dead link  | Link loss is detected in ~4s and the connection rebuilds itself.                                                                                                               | Pull the network cable with the connection up. Time the status change and recovery. PASS                             |        |       |
| B3  | Watchdog — device off | Unreachable host recycles the socket every ~12s without stacking timers.                                                                                                       | Power the unit down with the connection up. Watch the log for repeated retries. PASS AND AT 12S IN LOG               |        |       |
| B4  | Reconnect state       | After recovery, feedbacks repopulate to match the device.                                                                                                                      | Change a source on the panel while disconnected, then let it reconnect. PASS                                         |        |       |
| B5  | Config change         | Changing the IP and changing it back reconnects cleanly, no duplicate sockets.                                                                                                 | Edit the IP to something wrong, save, then restore it. PASS                                                          |        |       |
| B6  | Polling off           | With polling disabled: mutes/splits/PinP-on-air/freeze/test patterns still track from Companion; PGM/PVW/AUX/tally/Stream & Record freeze. **This is expected** — see HELP.md. | Untick Enable polling. Press a mute (should update) then change PGM (feedback should not follow). Re-tick when done. |        |       |

## PASS

## C. Actions

All 70. Where an action has a dropdown, test a representative value or two rather than every entry —
the option lists were verified identical to 0.6.5 in software.

### C1. Transitions

| # | Action id | Name | Result | Notes |
| --- | --------------------- | ------------------- | PASS | ----- |
| 1 | `cut` | CUT | | |
| 2 | `auto` | AUTO | | |
| 3 | `fade_to_black` | Fade To Black (tap) | | |
| 4 | `set_transition_type` | Set Transition Type | | |
| 5 | `set_mix_time` | Set Mix/Wipe Time | | |
| 6 | `set_wipe_type` | Set Wipe Pattern | | |
| 7 | `set_wipe_direction` | Set Wipe Direction | | |
ALL PASS

### C2. Program, Preview, Input Assign

| # | Action id | Name | Result | Notes |
| --- | --------------------- | ------------------------- | PASS | ----- |
| 8 | `set_program_source` | Set Program Source | | |
| 9 | `set_preview_source` | Set Preview Source | | |
| 10 | `input_assign_source` | Input Assign – Set Source |  
 | |
ALL PASS

Check `set_program_source` against a spread: an Input (crosspoint), a direct HDMI, a direct SDI,
a Still, and Video Player. The source list is 49 entries and was regenerated in this release.

| #   | Source family tested   | Result | Notes |
| --- | ---------------------- | ------ | ----- |
| 10a | `input_1` … `input_8`  | PASS   |       |
| 10b | `hdmi_1` … `hdmi_4`    | PASS   |       |
| 10c | `sdi_1` … `sdi_4`      | PASS   |       |
| 10d | `still_1` … `still_32` | PASS   |       |
| 10e | `video_player`         | PASS   |       |

### C3. AUX bus and AUX Link

| # | Action id | Name | Result | Notes |
| --- | ---------------------------- | ------------------------------------- | PASS | ----- |
| 11 | `set_aux_source` | Set AUX Source (test AUX 1 and AUX 2) | | |
| 12 | `set_aux_linked_pgm` | Set AUX Linked PGM (Off/Auto/Manual) | | |
| 13 | `toggle_aux_linked_pgm_mode` | AUX Linked PGM mode (toggle) | | |
| 14 | `set_aux_linked_pgm_bus` | Set AUX Linked PGM – bus follow | | |
| 15 | `toggle_aux_linked_pgm_bus` | Toggle AUX Linked PGM – bus follow | | |

Reminder: the **mode gates the per-bus follow**. Set mode to Auto or Manual before expecting
AUX 1/2 FOLLOW to do anything.

### C4. AUX layer PinP

| # | Action id | Name | Result | Notes |
| --- | --------------------------------- | ------------------------------------------- | PASS | ----- |
| 16 | `set_aux_layer_pinp` | Set AUX Layer – PinP and Key | | |
| 17 | `toggle_aux_layer_pinp` | Toggle AUX Layer PinP (Disable / Enable) | | |
| 18 | `toggle_aux_layer_pinp_always_on` | Toggle AUX Layer PinP (Disable / Always On) | | |

The address table here was rewritten (the `as any` removal). Test **all four** AUX/layer
combinations — 1/1, 1/2, 2/1, 2/2 — they should hit `000020`, `000021`, `000023`, `000024`.

| #   | Combination    | Result | Notes |
| --- | -------------- | ------ | ----- |
| 18a | AUX 1, layer 1 | PASS   |       |
| 18b | AUX 1, layer 2 | PASS   |       |
| 18c | AUX 2, layer 1 | PASS   |       |
| 18d | AUX 2, layer 2 | PASS   |       |

### C5. Split

| #   | Action id       | Name             | Result | Notes |
| --- | --------------- | ---------------- | ------ | ----- |
| 19  | `split1_on`     | Split 1 – On     | PASS   |       |
| 20  | `split1_off`    | Split 1 – Off    | PASS   |       |
| 21  | `split1_toggle` | Split 1 – Toggle | PASS   |       |
| 22  | `split2_on`     | Split 2 – On     | PASS   |       |
| 23  | `split2_off`    | Split 2 – Off    | PASS   |       |
| 24  | `split2_toggle` | Split 2 – Toggle | PASS   |       |

LOOK AT ORDER IN ACTIONS LIST, ODD ORDER

### C6. PinP & Key

| # | Action id | Name | Result | Notes |
| --- | ----------------- | ------------------------- | PASS | ----- |
| 25 | `pinp_set_source` | PinP and Key – Set Source | | |
| 26 | `pinp_pgm_on` | PinP and Key – PGM On | | |
| 27 | `pinp_pgm_off` | PinP and Key – PGM Off | | |
| 28 | `pinp_pgm_toggle` | PinP and Key – PGM Toggle | | |
| 29 | `pinp_pvw_on` | PinP and Key – PVW On | | |
| 30 | `pinp_pvw_off` | PinP and Key – PVW Off | | |
| 31 | `pinp_pvw_toggle` | PinP and Key – PVW Toggle | | |

Test each against **layer 1 and layer 2**.

### C7. PinP geometry

| #   | Action id                | Name                             | Result | Notes                                                     |
| --- | ------------------------ | -------------------------------- | ------ | --------------------------------------------------------- |
| 32  | `pinp_window_position_h` | Window Position H (-100 to +100) | PASS   | Recorded FAIL on the day; corrected 2026-09-10 — see note |
| 33  | `pinp_window_position_v` | Window Position V (-100 to +100) | PASS   | Recorded FAIL on the day; corrected 2026-09-10 — see note |
| 34  | `pinp_window_size`       | Window Size (0 to 100)           | PASS   |                                                           |
| 35  | `pinp_window_cropping_h` | Window Cropping H (0 to 100)     |        | PASS                                                      |
| 36  | `pinp_window_cropping_v` | Window Cropping V (0 to 100)     |        | PASS                                                      |
| 37  | `pinp_view_position_h`   | View Position H (-50 to +50)     |        | FAIL                                                      |
| 38  | `pinp_view_position_v`   | View Position V (-50 to +50)     |        | FAIL                                                      |
| 39  | `pinp_view_zoom`         | View Zoom (100 to 400)           |        | PASS                                                      |

Check the extremes as well as the middle — the signed encoding is the risky part. Cropping at
100% means _no crop_; 0% is fully cropped and the window disappears.

> **Correction, 2026-09-10 (Jay).** This section originally recorded four failures. Only two
> are real: `pinp_view_position_h` and `pinp_view_position_v`. Window Position H and V do work
> and have been re-marked PASS above. It is also unsettled whether the two remaining ones are
> genuinely failing or whether the -50 to +50 range does not move the image visibly enough to
> judge by eye. The original day-of results are left visible in the Notes column rather than
> erased.

### C8. DSK

| #   | Action id        | Name             | Result | Notes |
| --- | ---------------- | ---------------- | ------ | ----- |
| 40  | `dsk_set_source` | DSK – Set Source | PASS   |       |
| 41  | `dsk_pgm_on`     | DSK – PGM On     | PASS   |       |
| 42  | `dsk_pgm_off`    | DSK – PGM Off    | PASS   |       |
| 43  | `dsk_pgm_toggle` | DSK – PGM Toggle | PASS   |       |
| 44  | `dsk_pvw_on`     | DSK – PVW On     | PASS   |       |
| 45  | `dsk_pvw_off`    | DSK – PVW Off    | PASS   |       |
| 46  | `dsk_pvw_toggle` | DSK – PVW Toggle | PASS   |       |

### C9. Audio

| #   | Action id                 | Name                      | Result | Notes |
| --- | ------------------------- | ------------------------- | ------ | ----- |
| 47  | `audio_input_mute_on`     | Audio Input – Mute On     |        | PASS  |
| 48  | `audio_input_mute_off`    | Audio Input – Mute Off    |        | PASS  |
| 49  | `audio_input_mute_toggle` | Audio Input – Mute Toggle |        | PASS  |
| 50  | `main_bus_mute_on`        | Main Bus – Mute On        |        | PASS  |
| 51  | `main_bus_mute_off`       | Main Bus – Mute Off       |        | PASS  |
| 52  | `main_bus_mute_toggle`    | Main Bus – Mute Toggle    |        | PASS  |
| 53  | `aux_bus_mute_on`         | AUX Bus – Mute On         |        | PASS  |
| 54  | `aux_bus_mute_off`        | AUX Bus – Mute Off        |        | PASS  |
| 55  | `aux_bus_mute_toggle`     | AUX Bus – Mute Toggle     |        | PASS  |

**Check the channel dropdown labels while you are here** — this release changed them. Adding an
_action_ and adding a _feedback_ must now offer the same names: `Audio In 3/4`, `Bluetooth In`,
`Video Player / SRT In`, not `audio in 34`.

| #   | Check                                                     | Result | Notes |
| --- | --------------------------------------------------------- | ------ | ----- |
| 55a | Action and feedback channel dropdowns show the same names |        |       |
| 55b | An existing 0.6.5 audio mute button still works           |        |       |

### C10. Freeze

| # | Action id | Name | Result | Notes |
| --- | --------------------- | --------------------- | PASS | ----- |
| 56 | `freeze_on` | Freeze (all) – On | | |
| 57 | `freeze_off` | Freeze (all) – Off | | |
| 58 | `freeze_toggle` | Freeze (all) – Toggle | | |
| 59 | `input_freeze_on` | Input Freeze – On | | |
| 60 | `input_freeze_off` | Input Freeze – Off | | |
| 61 | `input_freeze_toggle` | Input Freeze – Toggle | | |

Input freeze covers HDMI 1–4 and SDI 1–4. Test at least one HDMI and one SDI.

### C11. Test patterns, Stream & Record, Capture, Utility

| # | Action id | Name | Result | Notes |
| --- | ---------------------- | ALL PASS | ------ | ----------------------------------------------------- |
| 62 | `test_pattern` | Test Pattern All Outputs (toggle) | |PASS|
| 63 | `test_pattern_off` | Test Pattern Off |PASS| |
| 64 | `stream_record_start` | Stream & Record – Start |PASS| d_stop`  | Stream & Record – Stop            |    PASS & UPDATE BUTTON TO SAY RECORD AND STREAM    |                                                        |
| 65  |`stream_record_stop`  | Stream & Record – Stop            |    PASS & UPDATE BUTTON TO SAY RECORD AND STREAM    |                                                       |
| 66  |`capture_image`       | Capture Image to Still            |        | **0.8.0 broke this.** Still written AND screen clears |
| 67  |`sync_now`            | Sync state now                    |        |                                                   NOT SURE AS NO FB    |
| 68  |`raw_command`         | Send raw LAN command              |        |PASS|
| 69  |`capture_mode_toggle` | Capture Mode (toggle)             |        |                                                 PASS      |
| 70  |`capture_screen_close` | Capture Mode – close if open | | Must NOT open the screen — see G2c PASS |

⚠️ **64/65 will start a livestream** if Live Streaming is enabled on the unit. Check
Menu → Stream&Record on the device before pressing.
SHOWS LIVE BUT NOT TYPE A LONG ASS RTMPS ADDRESS IN

`raw_command` changed in this release — it is now **always listed**, and the "Allow advanced
actions" checkbox gates whether it sends:
PASS
| # | Check | Result | Notes |
| --- | ---------------------------------------------------------------------------- | ------ | ----- |
| 68a | With the checkbox **on**: `DTH:001500,29;` sets PGM to Input 1 | | |
| 68b | With the checkbox **off**: nothing sent, log warns "enable Show advanced..." | | |
| 68c | Toggling the checkbox off does **not** break an existing raw_command button | | |
PASSS

---

## D. Feedbacks

Two things to check for each: does it light when Companion changes the state, and does it light when
**the panel** changes it. The second is what proves polling is alive.

| # | Feedback id | Name | From Companion | From panel | Notes |
| --- | --------------------------- | -------------------------------- | SEEN ALL DURING TESTING. PASS | ---------- | ----- |
| F1 | `program_input_active` | Program – Input on PGM | | | |
| F2 | `preview_input_active` | Preview – Input on PST | | | |
| F3 | `program_source_active` | Program – Raw source byte on PGM | | | |
| F4 | `preview_source_active` | Preview – Raw source byte on PST | | | |
| F5 | `aux_input_active` | AUX – Input on AUX bus | | | |
| F6 | `transition_type_active` | Transition type active | | | |
| F7 | `ftb_active` | Fade To Black – fade in progress | | | |
| F8 | `wipe_type_active` | Wipe pattern active | | | |
| F9 | `wipe_direction_active` | Wipe direction active | | | |
| F10 | `aux_linked_pgm_active` | AUX Linked PGM mode active | | | |
| F11 | `aux_linked_pgm_bus_active` | AUX Linked PGM – bus follows PGM | | | |
| F12 | `pinp_pgm_active` | PinP & Key – active on PGM | | | |
| F13 | `pinp_pvw_active` | PinP & Key – active on PVW | | | |
| F14 | `aux_layer_pinp_enabled` | AUX Layer – PinP Enabled | | | |
| F15 | `aux_layer_pinp_always_on` | AUX Layer – PinP Always On | | | |
| F16 | `dsk_pgm_active` | DSK – active on PGM | | | |
| F17 | `dsk_pvw_active` | DSK – active on PVW | | | |
| F18 | `split1_active` | Split 1 – active | | | |
| F19 | `split2_active` | Split 2 – active | | | |
| F20 | `audio_input_muted` | Audio Input – Muted | | | |
| F21 | `main_bus_muted` | Main Bus – Muted | | | |
| F22 | `aux_bus_muted` | AUX Bus – Muted | | | |
| F23 | `freeze_active` | Freeze (all) – active | | | |
| F24 | `input_freeze_active` | Input Freeze – active | | | |
| F25 | `tally_pgm` | Tally – Input on air (PGM) | | | |
| F26 | `tally_pvw` | Tally – Input on preview (PST) | | | |
| F27 | `stream_record_active` | Stream & Record – active | | | |
| F28 | `stream_record_state` | Stream & Record – specific state | | | |
| F29 | `test_pattern_active` | Test Pattern – active | | | |

**F7 is the known defect** — it lights only while a fade is _running_, not while FTB is engaged.
Expected to fail as described; see section G.

---

## E. Variables

62 in total. The repetitive families are grouped — spot-check two or three within each.

| # | Variable(s) | Expected value | Result | Notes |
| --- | ALL PULLING THROUGH TO COMPANION, PASS | ----------------------------------------------------------------------------- | ------ | ----- |
| V1 | `program_input`, `preview_input` | Input number 1–8, or 0 | | |
| V2 | `program_source`, `preview_source` | Two-digit hex byte | | |
| V3 | `aux1_input`, `aux2_input` | Input number | | |
| V4 | `aux1_source`, `aux2_source` | Two-digit hex byte | | |
| V5 | `transition_type` | `MIX` or `WIPE` | | |
| V6 | `mix_time` | e.g. `1000ms` | | |
| V7 | `wipe_type`, `wipe_direction` | Pattern / direction name | | |
| V8 | `pinp1_pgm`, `pinp1_pvw`, `pinp2_pgm`, `pinp2_pvw` | `ON` / `OFF` | | |
| V9 | `dsk_pgm`, `dsk_pvw` | `ON` / `OFF` | | |
| V10 | `split1`, `split2` | `ON` / `OFF` | | |
| V11 | `aux_linked_pgm` | `Off` / `Auto Link` / `Manual Link` | | |
| V12 | `aux1_linked_pgm`, `aux2_linked_pgm` | `ON` / `OFF` | | |
| V13 | `main_bus_mute`, `aux1_bus_mute`, `aux2_bus_mute` | `ON` / `OFF` | | |
| V14 | `ftb` | **`FADING` or `IDLE`** — not ON/OFF. HELP.md was wrong about this until 0.7.0 | | |
| V15 | `freeze` | `ON` / `OFF` | | |
| V16 | `test_pattern` | Pattern name, or `Off` | | |
| V17 | `stream_record` | `ON` / `OFF` | | |
| V18 | `stream_record_state` | `Stopped` / `Starting` / `Running` / `Stopping` | | |
| V19 | `mute_*` — 15 audio channels | `ON` / `OFF` | | |
| V20 | `freeze_*` — 8 inputs | `ON` / `OFF` | | |
| V21 | `tally_*` — 8 inputs | `OFF` / `PGM` / `PST` | | |

---

## F. Presets

108 presets across 16 categories, verified byte-identical to 0.6.5 in software. Drop one button from
each category onto a page and confirm it appears correctly and works.

| #   | Category        | Appears | Works | Notes |
| --- | --------------- | ------- | ----- | ----- |
| P1  | Transitions     | PASS    | PASS  |
| P2  | Program         | PASS    |       | PASS  |
| P3  | Preview         | PASS    |       | PASS  |
| P4  | AUX 1           | PASS    |       | PASS  |
| P5  | AUX 2           | PASS    |       | PASS  |
| P6  | AUX Link        | PASS    |       | PASS  |
| P7  | PinP & Key      | PASS    |       | PASS  |
| P8  | DSK             | PASS    |       | PASS  |
| P9  | Split           | PASS    |       | PASS  |
| P10 | Audio           | PASS    |       | PASS  |
| P11 | Freeze          | PASS    |       | PASS  |
| P12 | Test Patterns   | PASS    |       | PASS  |
| P13 | Stream & Record | PASS    |       | PASS  |
| P14 | Image Capture   | PASS    |       | PASS  |
| P15 | Tally           | PASS    |       | PASS  |
| P16 | Input Assign    | PASS    |       | PASS  |

Two preset details changed shape in this release even though the output is identical — worth a glance:

| # | Check | Result | Notes |
| --- | PASS AND ALL GOOD, AND ACTUALLY KEEP THE TALLEY PREWSET, NO HARM | ------ | ----- |
| P17 | Tally button text still reads `HDMI` / `1` on two lines | | |
| P18 | Freeze button text still reads `FRZ` / `HDMI 1` | | |

---

## G. Fade To Black — the open defect

Not a 0.7.0 regression; this has been open since 0.6.5 and is **one measurement from solved**. If
there is time on the day, this is the highest-value thing to capture.

`030207` is a fade-**in-progress** flag, not the engaged state — confirmed by capture: six FTB
presses produced twelve transitions, 00→01 while each fade ran and back to 00 once it settled,
whether the result was black or live. The steady state lives at an address not yet identified. CONFIRMED ONLY SHOWS IN PROGRESS

| # | Step | Result | Notes |
| --- | ---------------------------------------------------------------------- | ------ | NO RESPONCE OR FB |
| G1 | Engage FTB and let it **settle** (output fully black, no fade running) | | |
| G2 | Send `RQH:030200,000030;` via `raw_command` and capture the reply | | |
| G3 | Diff against the FTB-off block already captured (see `working_doc.md`) | | |
| G4 | Candidate address for the engaged state: | | |

Fallback approaches are recorded in `working_doc.md`.

---

## G2. The capture screen — `0B002A`

**The new work in 0.8.1.** Image capture left its screen up on the monitor with no documented way to
dismiss it. There is no EXIT command: the LAN interface is only `DTH`/`RQH`/`VER` over the SysEx map,
and Panel Lock (`020300`–`020347`) is lock state rather than presses — it omits `[MENU]`, `[EXIT]`,
`[ENTER]` and the `[VALUE]` knob entirely.

`0B002A` is the `[CAPTURE IMAGE]` panel switch, confirmed by packet capture against RCS on
2026-09-08 over 16 open/close cycles — RCS sends the same press/release pair to open and to close,
and the device answers `0A0504,01` or `0A0504,00` within ~60ms every time.

**It is a toggle, so sending it blind opens the screen.** The module therefore tracks the screen from
the device's own `0A0504` push and only closes what the device says is open. That gate is the thing
most worth testing here.

| # | PASS Step | Result | Notes |
| --- | ----------------------------------------------------------------------------------------- | ALL PASSED, AND NOTHING A THROUGH AT IT EVEN OTHER MENUS BLOCKED IT | ----- |
| G2a | `capture_image` into a spare slot. Still is written **and** screen clears unaided | | |
| G2b | Log still shows `Image capture complete` | | |
| G2c | `capture_screen_close` with **no** screen showing. Nothing happens — it must not open one | | |
| G2d | Open the screen from the panel, then `capture_screen_close`. It closes | | |
| G2e | `capture_mode_toggle` twice. Opens, then closes | | |
| G2f | Repeat G2a three times back to back. No drift, no screen left behind | | |

G2c is the important one. If it opens the screen, the state gate is not working and the action is
dangerous on a live desk.

Still unknown, and **not** solved by this: a general menu dismissal. `[MENU]`, `[EXIT]`, `[ENTER]` and
the `[VALUE]` knob have no known remote equivalent. Note that the device does **not** echo physical
panel presses — ten panel presses produced no `0B0400` frames — so the only way to map another panel
switch is to capture RCS driving that same control.

---

## H. Soak

| # | Check | Result | Notes |
| --- | PASS, WENT FOR COFFEE AND STILL GOOD | ------ | ----- |
| H1 | Leave connected 30+ min idle. Still OK, no runaway reconnects in the log. | | |
| H2 | Feedbacks still accurate after the soak. | | |
| H3 | No memory or log growth that looks wrong. | | |
| H4 | Debug logging off — no leftover verbose output. | | |

---

## Verdict

| Question                                           | Answer                                             |
| -------------------------------------------------- | -------------------------------------------------- |
| Is 0.8.1 safe to merge to `main`?                  | YES, MERGE,                                        |
| Did the 0.7.0 password migration work (A1)?        | PASS                                               |
| Is Image Capture fixed, and does the screen clear? | PASS                                               |
| Any regression against 0.6.5?                      | NO                                                 |
| Anything that needs fixing before a 1.0 attempt?   | PIP NOTES, BUT CAN BE TEATHING ISSUES SORTED LATER |
| Tag 0.6.5 and/or 0.8.1 once this passes?           | BUMB RO 0.8.4                                      |

**Summary / next actions**
