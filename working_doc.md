# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing, kept short), [CHANGELOG.md](CHANGELOG.md), [DEVELOPMENT.md](DEVELOPMENT.md) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in [CHANGELOG.md](CHANGELOG.md).

Last reviewed: 2026-09-26 · Working version: 1.0.5 (on `main`, tagged `v1.0.5`)

---

## Build status

| Check                | State                                                      |
| -------------------- | ---------------------------------------------------------- |
| `yarn install`       | Passing                                                    |
| `yarn build`         | Passing                                                    |
| `yarn lint`          | Passing — clean, 0 errors                                  |
| `prettier --check .` | Passing                                                    |
| `yarn package`       | Passing — `roland-v80hd-1.0.5.tgz` (untracked, local only) |
| GitHub Actions       | Node CI — check the run for `v1.0.5` on `main`             |
| `yarn preflight`     | Passing — the pre-release gate                             |

---

## Open — needs hardware

**Nothing outstanding for 1.0.5.** It passed its hardware smoke test on 2026-09-26.

Open, not blocking: **Q2** in `TESTING-NEXT.md`, what the switcher sends after a wrong password. It
needs a packet capture, since module debug output no longer exists (PROTOCOL.md §11.1).

**Protocol:** Fade To Black was the last open protocol question and it was answered
2026-09-16: the engaged state is in no address, and `QFTB;` from Roland's mnemonic command set reads
it directly. Confirmed on hardware both ways — `FTB:OFF;` clear, `FTB:ON;` engaged.

**The finding that generalises:** the two command languages work on one connection. Several things
recorded as blocked on a multi-byte decoder — audio levels, metering, source names — have plain-ASCII
equivalents in the mnemonic set. Worth a look before anyone writes that decoder. `PROTOCOL.md` §10.1.

## Open — resubmitting to Bitfocus

**1.0.1 was returned by the Bitfocus review on 2026-09-26** with two required changes. What
followed:

- four code reviews, two local and two ultrareview (free runs 1 and 2 of 3), all in
  `CODE_REVIEW.md`;
- three hardware rounds (1.0.2, 1.0.3, 1.0.4), with the fixes each one found;
- 1.0.5, which removes the debug checkbox.

**`main` holds 1.0.5, tagged `v1.0.5`, pushed to this repo only. Nothing has gone to Bitfocus
yet.** The Roland PDF is untracked and still on disk.

**Next, in order:**

1. With Jay's explicit yes, push `main` and `v1.0.5` (not `v1.0.4`) to Bitfocus, and wait for
   Companion Module Checks to go green there.
2. Jay submits v1.0.5 in the portal, with a reply listing the changes.
3. Delete the merged branches (`fix/1.0.2-review`, `fix/1.0.5`, `docs/1.0.5`) if Jay agrees.

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

**1.0.1 was returned by the review on 2026-09-26.** 1.0.5 replaces it; see "Open — resubmitting to
Bitfocus" above. Once approved, a version is live for Companion 4.0+.

**Every future release** follows the steps in `DEVELOPMENT.md`, "Releasing".

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
README say so — released version to Bitfocus, development build here. The issue chooser,
`.github/ISSUE_TEMPLATE/config.yml`, was made to agree on 2026-09-26. It used to say issues don't
belong here, and on the Bitfocus repo it linked to itself. Now it offers the bug and feature forms on
both repos, and links only to Companion's own issues.

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
