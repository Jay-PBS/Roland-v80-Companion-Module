# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in the README.

Last reviewed: 2026-09-15 · Working version: 0.8.9

---

## Build status

| Check                | State                                                      |
| -------------------- | ---------------------------------------------------------- |
| `yarn install`       | Passing                                                    |
| `yarn build`         | Passing                                                    |
| `yarn lint`          | Passing — clean, 0 errors                                  |
| `prettier --check .` | Passing                                                    |
| `yarn package`       | Passing — `roland-v80hd-0.8.9.tgz` (untracked, local only) |
| GitHub Actions       | Passing — Node CI, green on `main`                         |
| `yarn preflight`     | Passing — the pre-release gate                             |

---

## Open — needs hardware

Two questions, one five-minute session — `TESTING-NEXT.md` §B has the steps.

**Tick the connection's "Enable debug logging (verbose TX/RX)" checkbox first.** Both 2026-09-15
attempts produced nothing because it was off. It is the fifth field in the connection config, between
"Enable polling" and "Allow advanced actions" — not Companion's log-level filter. The absence of any
warn line proves the command was sent; only `TX:` and `RX RAW:` are debug-gated.

- **B1 — Do block reads work?** Contradictory hardware results on record. Gates the Fade To Black
  search entirely.
- **B2 — Does `0A0504` reach our session?** `Image capture complete` never appeared, and that log is
  info level and ungated, so it would have shown had `0A0504,08` arrived. `0A0504` is push-only and
  never polled, so if it does not reach us the module never learns a capture finished — which also
  makes the `screen reported closed` diagnostic meaningless. **Same trap as `030800`:** the capture
  that established its behaviour recorded RCS's session, not ours. If confirmed, either poll it or
  drop the completion log and the diagnostic. `PROTOCOL.md` §4.11 and §7.4 carry the caveat.

**C7 PinP View Position is closed, 2026-09-15.** It works; the travel is only visible once View Zoom
is raised — an observation problem, not a protocol one. `README.md` and `HELP.md` are corrected.

## Built but unverified — 2026-09-15

Four code changes written, typechecked and linted, **never run**. They need one build and one
session; `TESTING-NEXT.md` §V has the checks. **Bump the version before packaging.**

- **F2 — capture action no longer outlives Companion's timeout.** The dismissal runs detached, so
  the action resolves in ~1.3 s instead of ~8.5 s. Device behaviour unchanged.
- **Duplicate initial poll guarded.** `onAuthenticated()` returns early if already authenticated.
  The reconnect check is the one that matters.
- **Freeze trio made consistent.** The optimistic update moved into `cmdSetFreeze`, so On, Off and
  Toggle all behave the same. The wider optimistic-update rule is now written down in `PROTOCOL.md`
  §7.3 rather than changed — that closes CODE_REVIEW §5.3.
- **Browse list cut to one line per action.** Nine descriptions removed, four of them relocated into
  `static-text` notes so the text survives on the button. Only `raw_command` keeps a description.

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
- **Built `.tgz` files stopped shipping — done 2026-09-15.** `roland-v80hd-0.8.8.tgz` untracked with
  `git rm --cached`; it stays on disk. `/*.tgz` covers everything now that nothing is excepted, and
  carries a comment saying why. README's "download it from the repository root" section is rewritten
  to point at building, with a note that releases will carry the asset from 1.0.

  **Still to decide before 1.0:** whether 1.0 ships as a GitHub Release asset, or whether the module
  store is the only route. Releases currently carry `v0.4.0` with no assets at all.

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

`.github/workflows/node.yaml` ("Node CI") runs on every branch push, on `v*` tags and on pull
requests: `yarn install --immutable`, `yarn build`, `yarn lint`, `prettier --check .` on Node 22.x,
with `permissions: contents: read` and superseded runs cancelled. Green on `main`.

**The `companion-module-checks` workflow remains deleted.** It failed at its first step because the
repository name must begin with `companion-module-`:

```
Unknown repository name format: Roland-v80-Companion-Module.
Repository name must start with companion-module- or companion-surface-
```

Not a code fault — it never reached build or package. The repository keeps its name, and
`repository` / `bugs` in `package.json`, `companion/manifest.json` and the README all point at it
consistently. **If the module goes upstream the naming rule applies wherever the work lands**, and
`bitfocus/companion-module-roland-v80hd` already satisfies it.

`yarn preflight` (`format` → `lint:fix` → `build` → `package`) remains the local pre-release gate.

---

## Banked protocol knowledge — moved

Everything that was here now lives in [PROTOCOL.md](PROTOCOL.md), which is the permanent public
record and goes further than this section did — it also recovers three findings that had been
compressed out of this file and survived only in git history.

Raw capture files are kept locally at `scratchpad/v80_exit_hunt.pcapng` and
`scratchpad/v80_toggle_test.pcapng`. **`scratchpad/` is gitignored, so those are the one piece of
evidence with no backup.** Everything derived from them is written up; the recordings themselves are
not recoverable if that directory is cleared.
