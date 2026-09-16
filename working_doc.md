# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in the README.

Last reviewed: 2026-09-15 · Working version: 0.8.13

---

## Build status

| Check                | State                                                       |
| -------------------- | ----------------------------------------------------------- |
| `yarn install`       | Passing                                                     |
| `yarn build`         | Passing                                                     |
| `yarn lint`          | Passing — clean, 0 errors                                   |
| `prettier --check .` | Passing                                                     |
| `yarn package`       | Passing — `roland-v80hd-0.8.13.tgz` (untracked, local only) |
| GitHub Actions       | Passing — Node CI, green on `main`                          |
| `yarn preflight`     | Passing — the pre-release gate                              |

---

## Open — needs hardware

**Nothing outstanding.** Fade To Black was the last open protocol question and it was answered
2026-09-16: the engaged state is in no address, and `QFTB;` from Roland's mnemonic command set reads
it directly. Confirmed on hardware both ways — `FTB:OFF;` clear, `FTB:ON;` engaged.

**The finding that generalises:** the two command languages work on one connection. Several things
recorded as blocked on a multi-byte decoder — audio levels, metering, source names — have plain-ASCII
equivalents in the mnemonic set. Worth a look before anyone writes that decoder. `PROTOCOL.md` §10.1.

**Wider question, not acted on:** no state field is cleared on disconnect. `destroyTcp()` stops the
timers and clears nothing, and `configUpdated()` reuses the same `ModuleInstance`. The FTB pair is
now cleared explicitly, because the engaged state cannot be re-derived and a wrong value there
persists. Every other boolean has the same flaw but is re-established by the next poll within a
cycle, so the stale window is half a second. Decide whether that is worth fixing generally.

## Built but unverified — 0.8.13

Fade To Black is confirmed on hardware and needs nothing further. What is still unverified:

- **The FTB fade colour.** Orange rather than the transition purple, so red on that button means one
  thing only: the output is actually black. `TESTING-NEXT.md` §C.
- **The Split relabel.** Actions, presets, faces, feedbacks and variable names all carry Vertical and
  Horizontal. **Display-only — every id was left alone**, and §N3 is the check that proves an
  existing button still fires.
- **The readable raw echo.** Frames render as text rather than hex. §N5.

## Open — needs a decision

- **Whether every state field should clear on disconnect.** Nothing does today: `destroyTcp()` stops
  the timers and clears nothing, and `configUpdated()` reuses the same `ModuleInstance`. The FTB fade
  flag is now cleared explicitly, because a fade is a one-second transient and a stuck one is simply
  false. Every other boolean has the same flaw but is re-established by the next poll within a cycle,
  so the stale window is half a second and nobody would notice. Worth deciding rather than leaving as
  an inconsistency someone trips over later.

## Queued — 0.8.14

**Not yet — nothing is being built.** Whatever comes out of the outstanding checks in
`TESTING-NEXT.md` lands here: C1, N3, N4, N5 and D1. If they all pass, 0.8.14 may not need to exist.

## Queued — 0.9, the tidy-up release

Decided 2026-09-16. Everything that is housekeeping rather than function is held for one deliberate
pass, rather than dribbling into point releases where it obscures what actually changed.

- **Untrack the test sheets and the code review.** `TESTING.md`, `TESTING-NEXT.md` and
  `CODE_REVIEW.md` into `.gitignore` and out of the index with `git rm --cached`. Files stay on disk;
  losing their ongoing history is accepted pre-1.0. `working_doc.md` and `PROTOCOL.md` stay tracked
  in both repos. Closes CODE_REVIEW §4.3. **Confirm before running it.**
- **Repository management.** Whatever remains of the two-repo split once the dust settles — issue
  routing is done, but turning Issues off in this repository's settings is the only thing that
  actually enforces it, and that is a GitHub setting rather than a file.
- **Aesthetic and consistency pass.** Button faces, preset categories, colour use across the palette,
  action naming. Nothing is known to be wrong; this is the read-it-cold pass that catches what months
  of incremental change leave behind.
- **Final documentation review.** `README.md` and `HELP.md` end to end, with the beta wording
  revisited — they still describe the module as provided for evaluation.

## Queued for 1.0 release prep

- **Decide how 1.0 is distributed.** Whether it ships as a GitHub Release asset, or whether the
  module store is the only route. Releases currently carry `v0.4.0` with no assets at all, so a
  downloadable 1.0 is something to set up rather than something that happens by itself. README
  currently promises "each release will carry its `.tgz` as a GitHub Release asset" — either make
  that true or change the sentence.

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

**The `companion-module-checks` workflow remains deleted, and that is correct — not a workaround.**
It failed at its first step:

```
Unknown repository name format: Roland-v80-Companion-Module.
Repository name must start with companion-module- or companion-surface-
```

**The check validates the name of the repository it is running in.** It is Bitfocus's own CI, meant
to run in a Bitfocus module repo, and it cannot pass in a personal fork whatever the fork is called.
Keeping it here would only add a permanently red check that proves nothing.

**Nothing needs renaming.** `bitfocus/companion-module-roland-v80hd` already satisfies the rule, and
`manifest.id` is `roland-v80hd`, which is exactly what that repo name resolves to. The two agree
today. This was previously written up as a submission blocker waiting on a repo rename; it is not
one, and never was.

The one real submission-time item is smaller: `repository` and `bugs` in `companion/manifest.json`
and `package.json` both point at this fork. Whether they move to the Bitfocus repo is a decision
about where bug reports should land — issues currently come here, and `CONTRIBUTING.md` is written
on that basis.

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
