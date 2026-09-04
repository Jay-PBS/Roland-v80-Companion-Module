# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in the README.

Last reviewed: 2026-09-04 · Working version: 0.6.0

---

## Build status

| Check                | State                              |
| -------------------- | ---------------------------------- |
| `yarn install`       | Passing                            |
| `yarn build`         | Passing                            |
| `yarn lint`          | Passing — clean, 0 errors          |
| `prettier --check .` | Passing                            |
| `yarn package`       | Passing — `roland-v80hd-0.6.0.tgz` |
| GitHub Actions       | **Never run** — see below          |

---

## Pending release decisions

- **Branch `chore/upstream-sync-0.6.1` is not merged and not pushed.** It holds the bitfocus upstream sync, the doc rewrite and the prettier cleanup. `main` is still at `012569f`.
- **No `v0.6.0` tag exists.** The only tag in the repo is `v0.4.0`. Decide whether 0.6.0 gets tagged, or whether the tagged release becomes the next version instead.
- **Version numbering is discontinuous.** 0.4.2 went straight to 0.6.0; 0.4.1 and 0.4.2 were local-only builds. Recorded in the README changelog so it does not cause confusion again.
- Decide whether this file should ship in the repo at all. If the module is ever submitted upstream to bitfocus, consider gitignoring it.

## Needs verification on hardware

Nothing here has been re-tested since the reformat and upstream sync.

- **Smoke test the rebuilt 0.6.0 package.** The `.tgz` has been rebuilt twice since the version installed in Companion (which is the 6 Aug build). The installed module and the current tree are not the same file.
- **Reconnect watchdog paths.** The 8s rebuild, 10s auth retry and 20s socket recycle were verified by packet capture during development, but not re-tested since. Worth exercising: pull the network cable mid-session, power-cycle the switch, and block the device at the firewall to simulate silent loss.
- **Auth lockout detection.** Confirm a deliberately wrong password reports the lockout and stops retrying, and that recovery works once the device clears.
- **Batched poll cycle.** Confirm feedback still tracks correctly at 500ms now that a cycle is one write rather than 52.
- **The four feedbacks added in 0.6.0** — FTB, wipe pattern, wipe direction, AUX Linked PGM — against panel operation.
- **Per-channel `mute_*` and per-input `freeze_*` variables** across all channels, not just a sample.

## CI

The `companion-module-checks` workflow arrived with the upstream sync and has never run, because nothing has been pushed since it was added.

- It runs install → build → package → launch test. It does **not** run lint.
- It validates repository naming against the module ID. This repo is `Roland-v80-Companion-Module`, not `companion-module-roland-v80hd`, so **the naming check may fail on this fork**. Unconfirmed until a push happens. Not a code fault if it does.
- Manifest and package versions match at 0.6.0, so that check should pass.

## Open issues

- **Transition type feedback is partial.** It responds to panel activity but can land in an unexpected state when driven from the panel directly. Root cause not yet established.
- **Scene Memory load/save is implemented in code but not exposed.** Needs testing before the actions are surfaced.
- **`enableScripts: false`** came in from upstream's `.yarnrc.yml`. This is a deliberate safety setting, but it means `postinstall: husky` no longer runs, so git hooks will not self-install on a fresh clone. Existing `.husky/` is intact. Decide whether to document the manual step or drop husky.
- **Node version drift.** `engines` requires `^22.20`; this machine runs v24.11.0. Nothing has failed because of it, and CI selects Node 22 from the manifest, so local and CI are not building on the same major version.

## Not yet implemented

Carried from the README roadmap. Kept here only while they are active work.

| Feature                | Blocker                                     |
| ---------------------- | ------------------------------------------- |
| Record                 | Pending hardware testing                    |
| Image Capture to Still | Pending investigation                       |
| Scene Memory presets   | Code exists, needs testing before exposure  |
| Tally feedbacks        | Needs hardware tally output to test against |
| Stream Start and Stop  | Needs further protocol analysis             |
| Audio level control    | Not started — mute only at present          |

---

## Closed — remove at next review

- Docs claimed FTB had no feedback. It has had one since 0.6.0; README and HELP corrected.
- HELP.md was still titled v0.4.0. Corrected.
- 625 prettier violations. Fixed; lint and format both clean.
