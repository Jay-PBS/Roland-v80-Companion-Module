# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in the README.

Last reviewed: 2026-09-11 · Working version: 0.8.8

---

## Build status

| Check                | State                              |
| -------------------- | ---------------------------------- |
| `yarn install`       | Passing                            |
| `yarn build`         | Passing                            |
| `yarn lint`          | Passing — clean, 0 errors          |
| `prettier --check .` | Passing                            |
| `yarn package`       | Passing — `roland-v80hd-0.8.8.tgz` |
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
- **Node — resolved 2026-09-10, standardised on 22.** This machine now runs **v22.20.0**
  (nvm-for-windows; 20.19.0 and 20.16.0 remain installed but unused). `.nvmrc` pins it, `engines`
  (`^22.20`) is satisfied for the first time, and `yarn preflight` passes end to end on it.

  **22 is a ceiling, not a preference.** `@companion-module/base`'s manifest schema accepts only
  `node16`, `node18`, `node20` and `node22` for `runtime.type` — `node24` is not a valid value, so
  moving to 24 is unavailable until bitfocus ships one. `@companion-module/base@1.14.1` declares
  `engines: ^18.12 || ^22.8` and `@companion-module/tools@2.8.0` declares `^18.18 || ^22.18`; both
  agree 22 is the top.

  **After any `nvm use`, run `corepack enable`** — switching Node majors drops the yarn shim, and
  `yarn` is simply missing until corepack is re-enabled.

  _Open, deferred to w/c 2026-09-14: check the laptop's Node major, which may differ. `.nvmrc`
  tells it to use 22.20.0 but will not switch it — run `nvm use` in the repo directory there.
  If 22 is not installed on that machine: `nvm install 22.20.0`, then `corepack enable`._

## Queued for 1.0 release prep

Decided 2026-09-14, to be done as one pass before submission — not now, because both remove files
the current workflow still reads and downloads.

- **Internal working docs stop shipping.** `working_doc.md`, `TESTING.md`, `TESTING-NEXT.md` and
  `CODE_REVIEW.md` go into `.gitignore` and come out of the index. They are internal working files
  and do not belong in a public module repo. Supersedes the old "consider it" note. Untracking needs
  `git rm --cached` on each — confirm before running it, the files stay on disk.
  **Knock-on:** `README.md` and this file cross-reference all four by name; those links break for
  anyone reading the repo and need removing in the same pass.
- **Built `.tgz` files stop shipping.** Bitfocus do not want build artifacts in the tree.
  `/*.tgz` already covers every untracked one; `roland-v80hd-0.8.8.tgz` is tracked deliberately and
  needs `git rm --cached` as well.
  **Knock-on:** [README.md](README.md) line 117 tells users to download the `.tgz` from the repo
  root, and line 136 explains why it is tracked. Both have to change, and 1.0 needs somewhere else to
  be downloadable from — a GitHub Release asset is the obvious answer, since releases currently carry
  only `v0.4.0` with no assets at all.

## Follow-on from PROTOCOL.md — logged 2026-09-14

The protocol knowledge itself now lives in [PROTOCOL.md](PROTOCOL.md). Only the actions are here.

- **Try the Fade To Black query before 1.0.** Recorded as a lead in `PROTOCOL.md` §10.1 — Roland's
  other command set, over the same socket, documents a direct query for the engaged state. Untested.
  If it works it closes the public appeal in `README.md` and retires the block-read hunt; if it does
  not, say so in §10.1 so nobody tries it twice. One line in a terminal.
- **Settle the block-read contradiction 2026-09-15** — `TESTING-NEXT.md` §1b. Once it lands, update
  `PROTOCOL.md` §8.6 from **Contested** to a fact and revisit `README.md`'s "parked as a device
  limit" position.

---

## Queued — once hardware testing clears

Held deliberately until `TESTING-NEXT.md` is signed off, so nothing renames under the tester.

- **Rewrite "layout" / "layer" / "PinP" for clarity.** The three words are used for three different
  things and the naming does not separate them. Established 2026-09-14 by reading the addresses:
  - **PinP 1 and PinP 2 are real hardware layers**, not a module abstraction. Two separate address
    blocks, `0012xx` and `0013xx`, each carrying its own independent source, PGM/PVW, window
    position, size, cropping, view position and view zoom. `pinpAddr()` in `src/api.ts` is the whole
    abstraction — it picks `12` or `13`. They composite simultaneously; the AUX routing proves it,
    needing four addresses for bus × layer (`000020`/`000021`, `000023`/`000024`).
  - **The device has no PinP layout store.** Nothing in the protocol saves or recalls a geometry set.
    Scene Memory (`0A0000`, 32 slots) is the only store-and-recall and it is whole-scene, not
    PinP-scoped — and it is not implemented, see "Decided against" below.
  - **The four "Layout" presets are a hardcoded macro**, not a device slot. `pinpTemplateActions()`
    in `src/presets.ts` fires eight geometry writes at fixed values — position 0/0, size 25%,
    cropping 100/100, view position 0/0, zoom 100%. It is a "reset this layer to a default box"
    button and the name does not say so.

  **This also settles CODE_REVIEW §6.2, which was logged as an open design question.** It is not:
  `pinpTemplateActions()` takes only a `layer` argument, no `aux`, so `aux1_pinp1_layout` and
  `aux2_pinp1_layout` emit byte-for-byte identical commands, as do the PiP2 pair. Four presets, two
  behaviours, two exact duplicates — and all four are named and categorised as AUX-scoped when PinP
  geometry belongs to the layer, not to the bus displaying it. There is no per-AUX geometry in the
  protocol at all. The remaining choice is only what to do: collapse to two presets under a PinP
  category, or keep four for panel convenience and rename so they stop implying AUX scoping.

  **Live caution for the section 1 testing:** the Layout preset writes `pinp_view_position_h/v` at
  **0**, the exact parameter under investigation. Keep it off the panel while chasing View Position.

- **Clean up the browse action list — one line per action.** Decided 2026-09-14. **Next build, not
  now.**

  **The rule: no action carries a `description` except `raw_command`.** The second line makes the
  browse list a mess to scan, and the browse list's job is to let you find an action, not to explain
  it. Where an action genuinely needs explaining, the explanation belongs **inside the action** — a
  `static-text` option, which renders on the button where the operator is actually configuring it.

  **`raw_command` is the one exception**, and only because a wrong command there can crash the unit.
  A hazard that severe earns a warning at pick time, before the action is chosen. `'Expert use
only.'` stays exactly as it is.

  This works because `description` is a single string rendered in **both** the browse list and the
  configured action row on a button — there is no per-context variant — whereas a `static-text`
  option renders only once the action is placed. So moving text from one to the other removes it
  from the list without losing it.

  **Nine descriptions come out. Five already have a `static-text` block, so they are a straight
  delete:**

  | Action                       | Line  |
  | ---------------------------- | ----- |
  | `toggle_aux_linked_pgm_mode` | `123` |
  | `set_aux_linked_pgm_bus`     | `145` |
  | `stream_record_start`        | `390` |
  | `stream_record_stop`         | `396` |
  | `capture_image`              | `403` |

  **Four have no `static-text` behind them. Move the text into one rather than dropping it** — each
  of these is the only place the module explains a genuinely confusing control:

  | Action                   | Line  | Why it has to survive on the button                            |
  | ------------------------ | ----- | -------------------------------------------------------------- |
  | `set_mix_time`           | `65`  | Units key — the option takes tenths, so `4` means 0.4s, not 4s |
  | `set_aux_layer_pinp`     | `174` | Explains AUX-bus PinP overlay working independently of PGM     |
  | `pinp_window_cropping_h` | `255` | Inverted scale — 100% means _no_ crop                          |
  | `pinp_window_cropping_v` | `261` | Same inversion, vertical                                       |

  **Knock-on — `TESTING-NEXT.md` §7, still untested.** Item 29 enumerates which actions show a
  one-line description and is void once this lands. Item 31 checks the livestream hazard is visible
  in the browse list _before_ the action is picked; under this rule it moves to the button, where
  `STREAM_RECORD_INFO` already carries the full warning, so item 31 needs rewriting to check the
  button rather than the list. Item 24 survives and gets more true. **Clear §7 against the current
  0.8.8 build first, or rewrite 29 and 31 before the change lands** — do not test the sheet as
  written against a build that has already been cleaned up.

---

## Not yet implemented

Addresses, payloads and the reasoning are all in [PROTOCOL.md](PROTOCOL.md) §9. Only the intent is
here.

**Wanted, worth building:**

- **Source and still names** (`0220xx`). Dropdowns and button labels carrying the operator's own
  names instead of fixed text. Blocked only on an ASCII payload decoder — `parseDth` truncates every
  reply to its first byte. **This is the one banked capture finding still worth building**, and the
  same decoder unblocks audio levels and metering at the same time.

**Decided against, not blocked:** Scene Memory, audio level control, audio metering, still tally.
Each has a reason recorded in `PROTOCOL.md` §9 — respectively an unwritable save address,
non-motorised panel knobs that would silently disagree with any remote value, the missing decoder,
and the poll budget.

_Removed 2026-09-14: a stale row claiming Stream Start/Stop was "probably already implemented as
Record". It is implemented, on `0A0800`, and confirmed on hardware — the note predated the
2026-09-04 capture that established it._

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

## Banked protocol knowledge — moved

Everything that was here now lives in [PROTOCOL.md](PROTOCOL.md), which is the permanent public
record and goes further than this section did — it also recovers three findings that had been
compressed out of this file and survived only in git history.

Raw capture files are kept locally at `scratchpad/v80_exit_hunt.pcapng` and
`scratchpad/v80_toggle_test.pcapng`. **`scratchpad/` is gitignored, so those are the one piece of
evidence with no backup.** Everything derived from them is written up; the recordings themselves are
not recoverable if that directory is cleared.
