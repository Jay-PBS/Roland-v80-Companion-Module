# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in the README.

Last reviewed: 2026-09-23 · Working version: 0.9.1

---

## Build status

| Check                | State                                                      |
| -------------------- | ---------------------------------------------------------- |
| `yarn install`       | Passing                                                    |
| `yarn build`         | Passing                                                    |
| `yarn lint`          | Passing — clean, 0 errors                                  |
| `prettier --check .` | Passing                                                    |
| `yarn package`       | Passing — `roland-v80hd-0.9.1.tgz` (untracked, local only) |
| GitHub Actions       | Passing — Node CI, green on `main`                         |
| `yarn preflight`     | Passing — the pre-release gate                             |

---

## Open — needs hardware

**Nothing outstanding.** Fade To Black was the last open protocol question and it was answered
2026-09-16: the engaged state is in no address, and `QFTB;` from Roland's mnemonic command set reads
it directly. Confirmed on hardware both ways — `FTB:OFF;` clear, `FTB:ON;` engaged.

**The finding that generalises:** the two command languages work on one connection. Several things
recorded as blocked on a multi-byte decoder — audio levels, metering, source names — have plain-ASCII
equivalents in the mnemonic set. Worth a look before anyone writes that decoder. `PROTOCOL.md` §10.1.

## Built, not yet on hardware — 0.9.0 and 0.9.1

**0.9.0 is the aesthetic and consistency pass (2026-09-16); 0.9.1 is a second pass on the preset
faces (2026-09-23). Neither has run against a V-80HD yet.** Both are presentation only — display
names, button faces and default colours, all of which Companion copies onto a button rather than
referencing. No id changed, so nothing already built moves, and there is no protocol or behaviour
change to regress.

What to look at on the next hardware session, none of it urgent — `TESTING-NEXT.md` P1–P5:

- The renamed 0.9.0 actions appear under their new names and still fire
- A feedback added by hand arrives with black text, and reads better lit than unlit
- Every face fits at 24pt — `AUX LINK`, the test pattern names and `Capture` are the likeliest to
  wrap
- The new face text: `TOGGLE` on the Aux PiP buttons, `Capture` / 1–8, `MUTED` on the bus mutes
- The bus mute colours read well — #990000 on #8080FF is about 2.7:1, below the palette's 4.5 rule,
  chosen deliberately; switch to black text if it does not read at a distance

**Everything through 0.8.13 is verified on hardware:** Fade To Black including the engaged state and
panel tracking, the Split relabel, the readable raw echo, the FTB fade colour, and the on-button
detail blocks.

Two things are recorded as **verified by inspection rather than on hardware**, because neither has a
subject to test against and neither is worth manufacturing an old build for — a split button built
before the rename, and a raw-command button from an older version. Both become testable naturally in
a later regression pass. The ids were all left untouched and a Companion button resolves actions by
id, so the reasoning is sound; it is simply not the same as having seen it.

## Open — needs a decision

**Nothing.**

_Closed 2026-09-16 — clearing state on disconnect._ Not needed. **Companion marks every key with a
red warning triangle when a connection drops**, so a stale feedback is already flagged as unreliable
without the module doing anything, and every polled field re-establishes itself within a cycle of
reconnecting.

That is worth remembering beyond this one question: **do not design defensively around a dropped
connection.** The surface already tells the operator. The FTB fade flag is still cleared explicitly,
because a fade is a one-second transient and a stuck one is plainly false — but that is correctness
for its own sake rather than a fix for anything an operator would have seen.

## Queued — the rest of the 0.9 tidy-up

Decided 2026-09-16. Everything that is housekeeping rather than function gets one deliberate pass
rather than dribbling into point releases where it obscures what actually changed. None of what
remains is a code change.

- **Repository management.** Whatever remains of the two-repo split once the dust settles — issue
  routing is done, but turning Issues off in this repository's settings is the only thing that
  actually enforces it, and that is a GitHub setting rather than a file.
  **`bitfocus/main` is 2 commits ahead of here** as of the last fetch on 2026-09-14: two Dependabot
  bumps touching `yarn.lock` only (js-yaml 4.3.1→4.3.2, colord 2.10.0). `git fetch bitfocus` before
  the next push upstream, since there may be more by then.
- **Final documentation review.** `README.md` and `HELP.md` end to end, with the beta wording
  revisited — they still describe the module as provided for evaluation. The README's empty
  `## Roadmap` heading was removed on 2026-09-16 rather than filled; decide in this pass whether a
  public roadmap earns a section, given this file already holds one.

**Old builds live outside the repo.** Every `.tgz` before the current one, and `TESING NOTES.xlsx`,
moved to `C:\GitHub\v80hd-builds\` on 2026-09-23. Only the build under test sits in the repo root;
move the previous one out when the next is built. `TESTING.md`, `TESTING-NEXT.md` and
`CODE_REVIEW.md` stopped being tracked the same day — they stay on disk and are gitignored.

## Queued for 1.0 release prep

- **Decide how 1.0 is distributed.** Whether it ships as a GitHub Release asset, or whether the
  module store is the only route. Releases currently carry `v0.4.0` with no assets at all, so a
  downloadable 1.0 is something to set up rather than something that happens by itself. README
  currently promises "each release will carry its `.tgz` as a GitHub Release asset" — either make
  that true or change the sentence.

## Not yet implemented

Addresses, payloads and the reasoning are all in [PROTOCOL.md](PROTOCOL.md) §9. Only the intent is
here.

**Shelved — build if requested:**

Nothing here is planned. Each item waits for a user to ask for it.

- **Source and still names** (`0220xx`). Dropdowns and button labels carrying the operator's own
  names instead of fixed text. Blocked only on an ASCII payload decoder — `parseDth` truncates every
  reply to its first byte — though the mnemonic command set may reach the names without one
  (`PROTOCOL.md` §10.1). The same decoder would also unblock audio levels and metering. Shelved
  2026-09-23.

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

**The submission-time item that was open here is done.** `repository` and `bugs` in
`companion/manifest.json` and `package.json` both point at `bitfocus/companion-module-roland-v80hd`,
which is where issues are routed — by `CONTRIBUTING.md`, by the README and by the issue chooser in
`.github/ISSUE_TEMPLATE/config.yml`, which turns the blank option off so a report cannot land here by
accident.

`yarn preflight` (`format` → `lint:fix` → `build` → `package`) remains the local pre-release gate.

---

## Banked protocol knowledge — moved

Everything that was here now lives in [PROTOCOL.md](PROTOCOL.md), which is the permanent public
record and goes further than this section did — it also recovers three findings that had been
compressed out of this file and survived only in git history.

Raw capture files were written to the session scratchpad — `v80_exit_hunt.pcapng`,
`v80_toggle_test.pcapng`, `v80_capture_image.pcapng`, the `v80_ftb_block*` set and the `ftb*` set.
**That scratchpad is a per-session temp directory outside the repository, not an ignored folder
inside it**, so those recordings are the one piece of evidence with no backup and no path in this
tree that would find them again. Everything derived from them is written up in `PROTOCOL.md`; the
recordings themselves are gone as soon as the directory is cleared. Copy a capture somewhere durable
at the time if it is ever worth keeping.
