# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing, kept short), [CHANGELOG.md](CHANGELOG.md), [DEVELOPMENT.md](DEVELOPMENT.md) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in [CHANGELOG.md](CHANGELOG.md).

Last reviewed: 2026-09-26 · Working version: 1.0.4 (branch `fix/1.0.2-review`)

---

## Build status

| Check                | State                                                      |
| -------------------- | ---------------------------------------------------------- |
| `yarn install`       | Passing                                                    |
| `yarn build`         | Passing                                                    |
| `yarn lint`          | Passing — clean, 0 errors                                  |
| `prettier --check .` | Passing                                                    |
| `yarn package`       | Passing — `roland-v80hd-1.0.3.tgz` (untracked, local only) |
| GitHub Actions       | Node CI green on `main`; check `fix/1.0.2-review`          |
| `yarn preflight`     | Passing — the pre-release gate                             |

---

## Open — needs hardware

**1.0.4 test — `TESTING-NEXT.md`.** Three hardware rounds so far, all on 2026-09-26:

- **1.0.2 passed**, and found the capture freeze and the slow reconnect.
- **1.0.3 fixed both, and passed.** It also showed that some wrong passwords get no reply. On that
  silence the module reconnected and resent the password every ~6 s.
- **1.0.4 stops instead.**

**1.0.4 is the one to submit.** It needs BUILD GO, then the short gate in the sheet: one wrong
password, and only one attempt in 30 s. The sheet's Q1 and Q2 are the two open questions (where
module debug output shows, and what the switcher sends after a wrong password). They are for
PROTOCOL.md and don't hold up the release.

**Protocol:** Fade To Black was the last open protocol question and it was answered
2026-09-16: the engaged state is in no address, and `QFTB;` from Roland's mnemonic command set reads
it directly. Confirmed on hardware both ways — `FTB:OFF;` clear, `FTB:ON;` engaged.

**The finding that generalises:** the two command languages work on one connection. Several things
recorded as blocked on a multi-byte decoder — audio levels, metering, source names — have plain-ASCII
equivalents in the mnemonic set. Worth a look before anyone writes that decoder. `PROTOCOL.md` §10.1.

## Hardware — 0.9.0 to 0.9.2

**Passed on hardware 2026-09-25:** the renamed actions, including Sync state now, the feedback default
style, every face at 23.3, the new face text and the bus mute colours. Stream & Record was already
confirmed and only its display name changed.

The black bus mute text replaced #990000 in 1.0.0 and reads clearly — confirmed on 1.0.1.

**Also verified on hardware, through 0.8.13:** Fade To Black including the engaged state and
panel tracking, the Split relabel, the readable raw echo, the FTB fade colour, and the on-button
detail blocks. A split button from before the Vertical/Horizontal rename and a raw-command button
from an older version both still fire — confirmed 2026-09-25.

## Open — 1.0.2, Bitfocus review fixes

**1.0.1 was returned by the Bitfocus review on 2026-09-26** with two required changes. Two code
reviews followed, one of them independent. Both are in `CODE_REVIEW.md`, and its "Two reviews
compared" section holds the combined list.

**All 11 items are done on branch `fix/1.0.2-review`**, one commit each, with the version at
1.0.2. The Roland PDF is untracked and still on disk. Hardware testing added the capture lock
and the 6 s reconnect (1.0.3), and the stop on an unanswered password (1.0.4), so **the submitted
version is 1.0.4**. Not yet merged or tagged, and nothing has gone to Bitfocus.

**Both ultrareviews are done (2026-09-26, free runs 1 and 2 of 3).**

- **The branch diff:** one nit, fixed in `b11ae37`.
- **The whole module:** two nits and no bugs, both deferred to 1.1. They are the AUX layer lookup
  written out five times and the hex formatting written out six times.

Raw findings and the assessment are in `CODE_REVIEW.md`, Reviews 3 and 4.

**Next, in order:**

1. BUILD GO for 1.0.4, then the P1–P3 gate in `TESTING-NEXT.md`.
2. Merge `fix/1.0.2-review` into `main`, tag `v1.0.4`, push to origin and, with Jay's explicit
   yes, to Bitfocus. Then resubmit in the portal with a reply listing the changes.

**Sync state now stays for this release**, by decision (2026-09-26). It is mostly redundant with
polling always on, but removing an action breaks buttons that use it. Revisit in 1.1.

**Queued for 1.1:**

- only send state that changed, with the debounce fix;
- one table for the AUX layer state (R4-1);
- use `hb()` for the hex formatting (R4-2);
- the `NAN` guard;
- remove `captureModeOpen`;
- the HELP.md tidy-up.

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

## 1.0 release

**The 0.9 tidy-up is finished.** Bitfocus's two Dependabot bumps were merged in on 2026-09-25, so
this repo is level with upstream.

**1.0.1 was returned by the review on 2026-09-26.** 1.0.2 replaces it; see "Open — 1.0.2" above.
Once approved, a version is live for Companion 4.0+.

**Every future release:** bump `package.json`, `yarn preflight`, tag `vX.Y.Z`, push `main` and the tag
to both remotes (`git fetch bitfocus` first), then Submit Version in the developer portal. Process
per companion.free, "Releasing your module"

**Old builds live outside the repo.** Every `.tgz` before the current one, and `TESING NOTES.xlsx`,
live in `C:\GitHub\v80hd-builds\`. Only the build under test sits in the repo root; move the previous
one out when the next is built. `TESTING.md`, `TESTING-NEXT.md` and `CODE_REVIEW.md` are gitignored
and stay on disk.

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

**`companion-module-checks` runs only on the Bitfocus repository.** It is guarded with
`github.repository_owner == 'bitfocus'`, so it is skipped here. It was deleted from this repo once,
and pushing 1.0.0 carried the deletion to Bitfocus. The developer portal reads that run as the tag's
"prechecks", so without it 1.0.0 showed as unchecked. Restored in 1.0.1. **Do not delete it again.**
Here it would fail at its first step:

```
Unknown repository name format: Roland-v80-Companion-Module.
Repository name must start with companion-module- or companion-surface-
```

**The check validates the name of the repository it is running in.** It is Bitfocus's own CI, meant
to run in a Bitfocus module repo, and it cannot pass in a personal fork whatever the fork is called.
That is why it is guarded rather than left to run here.

**Nothing needs renaming.** `bitfocus/companion-module-roland-v80hd` already satisfies the rule, and
`manifest.id` is `roland-v80hd`, which is exactly what that repo name resolves to. The two agree
today. This was previously written up as a submission blocker waiting on a repo rename; it is not
one, and never was.

**The submission-time item that was open here is done.** `repository` and `bugs` in
`companion/manifest.json` and `package.json` both point at `bitfocus/companion-module-roland-v80hd`,
which is where issues with released versions go. **Issues stay on in this repository, by decision
(2026-09-25):** after 1.0, people testing development builds report here. `CONTRIBUTING.md` and the
README say so — released version to Bitfocus, development build here. The issue chooser in
`.github/ISSUE_TEMPLATE/config.yml` still leads with the Bitfocus link, and its text says issues do
not belong here; revisit it when development testing starts, remembering it travels upstream with
the code.

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
