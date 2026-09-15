# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in the README.

Last reviewed: 2026-09-15 · Working version: 0.8.10

---

## Build status

| Check                | State                                                       |
| -------------------- | ----------------------------------------------------------- |
| `yarn install`       | Passing                                                     |
| `yarn build`         | Passing                                                     |
| `yarn lint`          | Passing — clean, 0 errors                                   |
| `prettier --check .` | Passing                                                     |
| `yarn package`       | Passing — `roland-v80hd-0.8.10.tgz` (untracked, local only) |
| GitHub Actions       | Passing — Node CI, green on `main`                          |
| `yarn preflight`     | Passing — the pre-release gate                              |

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

## Queued — next build cycle

- **Rewrite HELP's Image Capture section — after final testing.** The current text describes the
  button as busy for the full ten seconds, which the timeout fix changed: it returns in about a
  second and the screen clears itself later. A corrected version was written and **reverted on
  2026-09-15 deliberately** — the observed behaviour needs confirming on hardware first, and the
  section will want rewriting once around the final result rather than twice. Also move the
  "overwrites without confirmation" warning out of the timing paragraph; it is the part that loses
  someone's work and it is currently buried.

- **Point `repository` and `bugs` at the Bitfocus repo.** Decided 2026-09-15. Both fields in
  **`companion/manifest.json`** and **`package.json`** currently name this fork:

  ```
  from  https://github.com/Jay-PBS/Roland-v80-Companion-Module
  to    https://github.com/bitfocus/companion-module-roland-v80hd
  ```

  The module's home once submitted is the Bitfocus repo, so `repository` should say so.

  **Worth a second's thought when you do it:** `bugs` is the URL Companion sends users to when they
  report a problem. Pointed at Bitfocus, reports land in their tracker rather than here — where the
  issue templates in `.github/ISSUE_TEMPLATE/` and the triage described in `CONTRIBUTING.md`
  actually live. Splitting them — `repository` upstream, `bugs` here — is legitimate and some
  modules do it. Flagging it, not arguing it.

  **Observed on the upstream repo 2026-09-15:** their `companion/manifest.json` still points both
  fields at this fork and still carries `"version": "0.4.0"` hardcoded. Ours is `"0.0.0"`, injected
  at build time — CODE_REVIEW §3.3. So the update that goes upstream fixes their stale version
  string as well.

- **Test sheets and the code review stop shipping.** Moved here from the 1.0 pass on 2026-09-15 —
  do it with the next build rather than at submission. **`TESTING.md`, `TESTING-NEXT.md` and
  `CODE_REVIEW.md`** go into `.gitignore` and come out of the index. Closes CODE_REVIEW §4.3.

  **`working_doc.md` and `PROTOCOL.md` stay tracked, in both repos** — decided 2026-09-15.
  `PROTOCOL.md` is public reference material by design, and `working_doc.md` carries the project's
  reasoning in a form a future maintainer would want. Only the test sheets and the review go.

  `git rm --cached` on each — **confirm before running it.** The files stay on disk; only the index
  entries go, exactly as the `.tgz` did.

  **Knock-on is smaller than previously recorded.** `README.md` mentions `working_doc.md` and
  `CODE_REVIEW.md` only inside changelog entries (lines 256 and 306) as historical prose, not as
  links — a reader would see a filename that is not in the repo, which is worth a light edit but
  breaks nothing. `PROTOCOL.md`, `HELP.md` and `CONTRIBUTING.md` reference none of them.

  Changes to the three stop being versioned from that commit onward. **Accepted, 2026-09-15** —
  everything already committed stays in history, and pre-1.0 the ongoing history of test sheets is
  not worth keeping.

## Queued for 1.0 release prep

- **Decide how 1.0 is distributed.** Whether it ships as a GitHub Release asset, or whether the
  module store is the only route. Releases currently carry `v0.4.0` with no assets at all, so a
  downloadable 1.0 is something to set up rather than something that happens by itself. README
  currently promises "each release will carry its `.tgz` as a GitHub Release asset" — either make
  that true or change the sentence.

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

Held until `TESTING-NEXT.md` is signed off, so nothing renames under the tester.

- **Rewrite "layout" / "layer" / "PinP" for clarity — presets done 2026-09-15, naming still open.**

  The preset half is closed: the four AUX-scoped "Layout" duplicates are gone and the two survivors
  are renamed `PiP1 Reset` / `PiP2 Reset` under `PinP & Key`. That also closed CODE_REVIEW §6.2.

  **Still to do:** the three words are used for three different things and the naming only separates
  two of them so far.
  - **PinP 1 and 2 are real hardware layers** — two address blocks, `0012xx` and `0013xx`, each with
    its own source, PGM/PVW and full geometry, compositing simultaneously. The module calls them
    layers already; nothing to change.
  - **The device has no layout store.** Scene Memory (`0A0000`) is the only store-and-recall and it
    is whole-scene. The word "Layout" is now gone from the presets — check `HELP.md` and `README.md`
    do not reintroduce it before 1.0.
  - **Window vs View geometry** is the remaining confusion, and the one that actually caught us out:
    Window Position and View Position are different parameters at different addresses with different
    ranges, and View Position only shows its effect once View Zoom is raised. The action names say
    `Window` and `View` correctly, but nothing explains the relationship. A `static-text` note on the
    View actions would have saved two test sessions.

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
