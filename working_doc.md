# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in the README.

Last reviewed: 2026-09-10 · Working version: 0.8.5

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
| `yarn preflight`     | Passing — the pre-release gate     |

---

## Open — needs hardware

Only one finding from the 2026-09-08 run is still open. The full queue for the next session,
including the blind fix and the changes that shipped after that run, is in
[TESTING-NEXT.md](TESTING-NEXT.md).

- **PinP View Position H and V show no visible movement (C7).** `pinp_view_position_h` and
  `pinp_view_position_v`. The six other geometry actions pass — Window Position H and V, Size
  (`09`), Cropping H (`0B`), Cropping V (`0D`), View Zoom (`1C`).

  **Settle "would I see it if it worked" before assuming the commands are wrong.** View Position is
  a -50 to +50 option; if the visible travel is small, or only shows at particular zoom or crop
  settings, then "nothing moved" is an observation problem, not a protocol one. That changes the fix
  entirely. Steps are written out in `TESTING-NEXT.md` §1.

  On paper the commands check out: addresses anchored on Size working at `09`, the encoder emits the
  spec's printed bytes, the option ranges permit negatives. **Not a regression** —
  `git log -L 985,1020:src/api.ts` shows prettier reformatting as the only change ever made to those
  lines.

## Open — needs a decision

- **Tagging — resolved 2026-09-10, no backfill.** Tags are `v0.4.0`, `v0.6.5` and `v0.8.5`, and
  those are the states worth keeping. The earlier note claimed 0.6.2, 0.6.3 and 0.6.4 went untagged;
  they cannot be tagged, because they were never committed. Committed history runs
  0.4.0 → 0.6.0 → 0.6.5 → 0.7.0 → 0.8.2 → 0.8.4 → 0.8.5; 0.6.1, 0.6.2, 0.6.3, 0.6.4, 0.8.0, 0.8.1
  and 0.8.3 exist in no commit's `package.json` and were local builds only. Of the four that could
  be tagged (0.6.0, 0.7.0, 0.8.2, 0.8.4), none is worth retrieving — 0.8.2 and 0.8.4 were steps
  toward 0.8.5 inside two days, 0.7.0 was the experimental hardware-run build, 0.6.0 is superseded.
  **These are all pre-release dev versions, so backfill only if something specific needs
  retrieving.** That changes at 1.0: once the module is submitted to bitfocus and people are running
  released builds, a tag per release stops being tidiness and becomes how you answer "which code was
  in the build that broke". **From 1.0: tag every release, once `yarn preflight` passes.**
- **Whether this file ships.** If the module is ever submitted upstream to bitfocus, consider
  gitignoring `working_doc.md` and `TESTING*.md`.
- **Node version drift.** `engines` requires `^22.20`; this machine runs v24.11.0. Nothing has
  failed because of it, and CI selects Node 22 from the manifest, so local and CI are not building
  on the same major version.

## Not yet implemented

| Feature           | Blocker                                            |
| ----------------- | -------------------------------------------------- |
| Stream Start/Stop | Probably already implemented as Record — see below |

Wanted, not started:

- **Pull the operator's own source and still names.** `0220xx` returns 8-byte ASCII: `022000` =
  "HDMI 1", `022400` = "SDI 1", `022800` onward = "Still 1", "Still 2"… Dropdowns and button labels
  could carry the operator's names instead of fixed text. Needs an ASCII payload decoder, which
  `parseDth` cannot do today — it truncates to the first byte. **Kept deliberately: this is the one
  banked capture finding still worth building.**

Decided against, not blocked:

- **Scene Memory control.** Pulled from the project and the docs. Never implemented in 0.6.0 anyway — the "code exists but is unexposed" claim was carried forward from 0.2.x, and `cmdLoadMemory`/`cmdSaveMemory` were dropped in the TypeScript rewrite. If it is ever wanted back: Load is one write to `0A0000` (00H-1FH = Memory 1-32) and is easy; Save is not, because the spec marks `0A0001` **Read Only**, so the old 0.2.x save almost certainly did nothing and would need a Wireshark capture of a panel-driven save first.
- **Audio level control.** The level knobs are not motorised, so a level set from Companion cannot be reflected on the panel and the two silently disagree. Mute stays the only audio control. The address is documented if it is ever wanted: `01 xx 03`, three bytes, `7E 00 00` = -INF, `00 00 00` = 0.0dB, `00 00 64` = +10.0dB, where xx is 01H-0FH matching the existing `AUDIO_CH` map.
- **Audio level metering.** Readable and pushed unprompted, but needs the same multi-byte decoder. Recorded in the README audio section; raise an issue if anyone actually wants it.
- **Still tally.** `0C0008` onward covers Still 1-32. Left out deliberately: 32 more reads would take the poll cycle from 61 commands to 93, and 250ms already locked the panel up once. Add behind a config toggle if anyone actually wants it.

---

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
catches a broken package before it reaches hardware, so `yarn preflight` passing locally is the whole
gate. Run it before releasing a version.

**If the module is ever pushed upstream**, the naming rule applies on whatever repository the work
lands in. `bitfocus/companion-module-roland-v80hd` already satisfies it, so this only matters if a
differently-named intermediate fork is used.

---

## Banked protocol knowledge — reference only, no action

Closed as work items on 2026-09-10, kept because it was expensive to obtain and would be costly to
rediscover. Nothing here needs doing.

- **The capture screen does not block the unit's other menus.** Observed 2026-09-08. Open a menu while a capture is running and the menu stays up, the capture visibly continuing behind it. That is why the delayed close in `cmdCaptureImage` is safe: `0B002A` addresses the `[CAPTURE IMAGE]` function directly — a panel switch, not a menu key — so it cannot disturb an unrelated menu. **The live caution: do not fire captures less than 7 seconds apart**, or the first close lands on the second capture's screen.
- **`0B002A` is the `[CAPTURE IMAGE]` panel switch**, identified 2026-09-08 by packet capture against RCS over 16 open/close cycles. Closing the screen a capture leaves behind needs **two** presses 300ms apart, ungated, **7 seconds** after the capture executes. All four had to be right at once, which is why 0.8.0-0.8.2 each failed differently. Confirmed working in 0.8.3 and the current build. The gate on the pushed `0A0504` `00`/`01` state is wrong for this path — our own sequence gets `04`/`08`/`0A` back, never `01` — but remains correct for the hand-driven `capture_screen_close` action. If a cleaner exit than pressing Image Capture twice ever turns up, this is the place to change it.
- **The device pushes state unprompted, extensively.** After every capture it dumps its entire parameter set, `000000` through `600xxx`, bracketed by `0E0001,01` and `0E0002`. So it does push without polling, but as a full reload rather than per-parameter deltas. Could reduce the 500ms poll one day; would need the multi-byte parser. Efficiency only — the current build performs well from an operator's point of view.
- **Two things the captures disproved:** the device does _not_ echo physical panel presses (ten presses, zero `0B0400` frames), and RCS sends a _single_ press/release pair per action.
- **No known EXIT or MENU command.** Nothing in the documented set backs out of a menu and none was found by capture. Blocks nothing today; noted in the README in case anyone knows one.
- **`0E0000`** is a 1 Hz keepalive both directions; **`030604`** a 1 Hz clock counter. Neither is state.

Captures kept at `scratchpad/v80_exit_hunt.pcapng` and `scratchpad/v80_toggle_test.pcapng`.
