# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in the README.

Last reviewed: 2026-09-08 · Working version: 0.8.5

---

## Build status

| Check                | State                              |
| -------------------- | ---------------------------------- |
| `yarn install`       | Passing                            |
| `yarn build`         | Passing                            |
| `yarn lint`          | Passing — clean, 0 errors          |
| `prettier --check .` | Passing                            |
| `yarn package`       | Passing — `roland-v80hd-0.8.5.tgz` |
| GitHub Actions       | **Never run** — see below          |

---

## Failures from the 0.8.3 hardware run — 2026-09-08

Full sheet in `TESTING.md`. Verdict was merge: no regressions against 0.6.5, soak passed, image
capture and the whole of section G2 passed. These are what did not.

- **Two PinP geometry actions are unresolved (C7).** `pinp_view_position_h` and
  `pinp_view_position_v` showed no visible movement at any value, positive or negative.
  **Corrected 2026-09-10:** this was previously written up as four actions including
  `pinp_window_position_h` and `pinp_window_position_v` — those two do work. The six passing
  actions are Window Position H and V, Size (`09`), Cropping H (`0B`), Cropping V (`0D`) and
  View Zoom (`1C`).

  **Open question: did the actions fail, or does the range just not move the image?** This has not
  been told apart yet and it changes what the fix is. View Position is a -50 to +50 option; if the
  visible effect over that span is small, or only shows at particular zoom or crop settings, then
  "nothing moved" may be an observation problem rather than a protocol one. Establish this first.

  On paper the commands check out: the addresses are right (anchored on Size working at `09`, the
  params before it fill `00`-`08` exactly); the encoder emits the spec's own printed bytes; the
  action option ranges permit negatives. **Not a regression** — `git log -L 985,1020:src/api.ts`
  shows prettier reformatting as the only change ever made to those lines.

  **Next steps:** (1) re-test View Position at extremes with View Zoom raised, so any movement is
  as visible as it can be; (2) if still nothing, capture RCS dragging a PinP view and read what it
  really sends — same method that identified `0B002A` in a single recording, tshark against
  `10.100.20.229` on Ethernet 4.

- **A corrected password is not retried (A4).** After an auth failure, saving the right password
  leaves the connection sitting at failed; it only recovers if the connection is toggled off and
  on. A saved config change should force a reconnect.
- **`sync_now` gives the operator nothing (C67).** No feedback, no log line, so there is no way to
  tell whether it did anything. A log line at minimum.
- **Split actions are in an odd order in the actions list (C5).** Cosmetic.
- **A5 and A7 are untestable, not passing.** The auth window is under 100ms, so no button can be
  pressed inside it by hand. They need a different method or should be marked NA.
- **FTB section G could not be attempted.** `RQH:030200,000030;` returned nothing at all, so the
  block-diff approach does not work as written. Confirmed again that the feedback only reports
  fade-in-progress. The engaged-state address remains unidentified.

## Device behaviour worth knowing — capture screen

Observed on hardware 2026-09-08: **the capture screen does not block the unit's other menus.** Open a
menu while a capture is running and the menu stays up, with the capture visibly continuing behind it.
The two ignore each other rather than one taking priority.

That matters for the delayed close in `cmdCaptureImage`, which fires `0B002A` twice 7 seconds after
the capture executes. Those presses address the `[CAPTURE IMAGE]` function directly — it is a panel
switch, not a menu key — so they cannot disturb an unrelated menu the operator happens to have open.
Reasoning from what the switch is, not separately tested.

The real caution is unchanged: **do not fire captures less than 7 seconds apart**, or the first
close can land on the second capture's screen.

## Pending release decisions

- **Merged 2026-09-08.** `exp/code-review-0.7.0` merged to `main` and pushed to `origin` at 0.8.5, carrying the whole 0.7.0 code review plus the 0.8.x capture work, after the hardware run passed. Before this, `main` sat at 0.6.5 with no `TESTING.md` or `CODE_REVIEW.md` at all.
- **Tagging still undecided.** Tags are `v0.4.0` and `v0.6.5`. 0.6.0, 0.6.2, 0.6.3 and 0.6.4 all went untagged. 0.6.5 is merged to `main` and is the most tested build the project has had, so it is the obvious candidate for the first tag since 0.4.0. Not done — waiting on a decision.
- **Version numbering is discontinuous.** 0.4.2 went straight to 0.6.0, and 0.6.0 to 0.6.5. 0.4.1, 0.4.2 were local-only builds and 0.6.1 was never built — only the branch carries that name. Recorded in the README changelog so it does not cause confusion again.
- Decide whether this file should ship in the repo at all. If the module is ever submitted upstream to bitfocus, consider gitignoring it.

## CI

The `companion-module-checks` workflow ran once, on the 2026-09-04 push to `main`, and failed at its
first step:

```
Unknown repository name format: Roland-v80-Companion-Module.
Repository name must start with companion-module- or companion-surface-
Error: Process completed with exit code 99.
```

Not a code fault — it never reached build or package. **Resolved by removing the workflow from this
fork.** The repository keeps the name `Roland-v80-Companion-Module`, and `repository` / `bugs` URLs
in `package.json`, `companion/manifest.json` and README point at it, so everything is internally
consistent.

**What was given up:** that workflow also ran install, build, package and a launch test. Nothing now
catches a broken package before it reaches hardware, so `yarn build`, `yarn lint`,
`prettier --check` and `yarn package` passing locally is the whole gate.

**If the module is ever pushed upstream**, the naming rule applies on whatever repository the work
lands in. `bitfocus/companion-module-roland-v80hd` already satisfies it, so this only matters if a
differently-named intermediate fork is used.

## Open issues

- **Transition type feedback is partial.** It responds to panel activity but can land in an unexpected state when driven from the panel directly. Root cause not yet established.
- **`enableScripts: false`** came in from upstream's `.yarnrc.yml`. This is a deliberate safety setting, but it means `postinstall: husky` no longer runs, so git hooks will not self-install on a fresh clone. Existing `.husky/` is intact. Decide whether to document the manual step or drop husky.
- **Node version drift.** `engines` requires `^22.20`; this machine runs v24.11.0. Nothing has failed because of it, and CI selects Node 22 from the manifest, so local and CI are not building on the same major version.

## Not yet implemented

| Feature           | Blocker                                            |
| ----------------- | -------------------------------------------------- |
| Stream Start/Stop | Probably already implemented as Record — see below |

Decided against, not blocked:

- **Scene Memory control.** Pulled from the project and the docs. It was never implemented in 0.6.0 anyway — the "code exists but is unexposed" claim was carried forward from 0.2.x, and `cmdLoadMemory`/`cmdSaveMemory` were dropped in the TypeScript rewrite. If it is ever wanted back: Load is one write to `0A0000` (00H-1FH = Memory 1-32) and is easy; Save is not, because the spec marks `0A0001` **Read Only**, so the old 0.2.x save almost certainly did nothing and would need a Wireshark capture of a panel-driven save first.
- **Audio level control.** The level knobs are not motorised, so a level set from Companion cannot be reflected on the panel and the two silently disagree. Mute stays the only audio control. Revisit only if the RC software turns out to handle this differently. The address is documented if it is ever wanted: `01 xx 03`, three bytes, `7E 00 00` = -INF, `00 00 00` = 0.0dB, `00 00 64` = +10.0dB, where xx is 01H-0FH matching the existing `AUDIO_CH` map.
- **Still tally.** `0C0008` onward covers Still 1-32. Left out deliberately: 32 more reads would take the poll cycle from 61 commands to 93, and 250ms already locked the panel up once. Add behind a config toggle if anyone actually wants it.

### Image Capture — presets still a placeholder

The capture sequence itself is solved and confirmed on hardware; see the README changelog.

**Open, and Jay's call:** the preset layout. Currently Still 1-8 with HDMI In 1 hardcoded as the
source, which is a placeholder rather than a design. Nothing to do until he says.

### Findings banked from the RCS captures, not yet acted on

- **Source and still names are readable.** `0220xx` returns 8-byte ASCII: `022000` = "HDMI 1", `022400` = "SDI 1", `022800` onward = "Still 1", "Still 2" ... So dropdowns and button labels could carry the operator's own names instead of fixed text. Worth doing; needs a decoder for ASCII payloads, which `parseDth` cannot do today (it truncates to the first byte).
- **The device does push state unprompted, extensively.** After every capture it dumps its entire parameter set — `000000` through `600xxx`, bracketed by `0E0001,01` and `0E0002`. That answers the long-standing "does it push without polling" question: it does, but as a full reload rather than per-parameter deltas. Whether that could replace or reduce the 500ms poll is worth investigating, though it would need the multi-byte parser above.
- **`0B002A` is the `[CAPTURE IMAGE]` panel switch — identified 2026-09-08 by packet capture against RCS, 16 open/close cycles.** Closing the screen a capture leaves behind needs **two** presses 300ms apart, ungated, **7 seconds** after the capture executes. Confirmed working in 0.8.3. All four of those had to be right at once, which is why 0.8.0-0.8.2 each failed differently. Note the gate on the pushed `0A0504` `00`/`01` state is wrong for this path — our own capture sequence gets `04`/`08`/`0A` back, never `01` — but it is still correct for the hand-driven `capture_screen_close` action. **Two things this disproved:** the device does _not_ echo physical panel presses (ten presses, zero `0B0400` frames), and RCS sends a _single_ press/release pair per action. **Still open: no known EXIT or MENU command.** Captures kept at `scratchpad/v80_exit_hunt.pcapng` and `v80_toggle_test.pcapng`.
- **Audio level meters are pushed unprompted at `0F0000`, `0F0300` and `0F0600`** — spotted 2026-09-08 in `scratchpad/v80_toggle_test.pcapng` around t=227s. 36-byte payloads, values in L/R pairs, `7F` = silence and lower = louder (matching the control guide's -INF..0dB encoding). Three registers, probably Main / AUX 1 / AUX 2. They arrive only while audio is present, no polling. Would give real level meters as Companion variables, but needs the multi-byte payload parser `parseDth` still lacks. Not started.
- **`0E0000`** is a 1 Hz keepalive both directions; **`030604`** a 1 Hz clock counter. Neither is state.

---
