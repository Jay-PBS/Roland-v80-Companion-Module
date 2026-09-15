# Code Review — companion-module-roland-v80hd

**Reviewed:** 2026-09-04 · **Version reviewed:** 0.6.5 (`main` @ `68787f8`)
**Reference:** `C:\GitHub\companion-module-template-ts` (Bitfocus TypeScript module template) plus the
current [Companion Connection Developers' Guide](https://companion.free/for-developers/module-development/).

**Status: acted on.** The review below is preserved as written against 0.6.5. What was done about
each item is recorded in [§0 Status](#0-status-of-this-review), and §10's list is annotated with
outcomes. The work is on `exp/code-review-0.7.0`, packaged as `roland-v80hd-0.7.0.tgz`, and has
**not yet been tested against a V-80HD**.

---

## 0. Status of this review

**Branch:** `exp/code-review-0.7.0` (from `main` @ `68787f8`) · **Build:** `roland-v80hd-0.7.0.tgz`
· **Applied:** 2026-09-04 · **Hardware test:** pending, Monday 2026-09-07

Eight commits carry the code and doc changes, one review concern each, so a hardware failure
bisects to a single cause. A ninth carries the version bump and changelog.

| §   | Item                                    | Status                             | Commit    |
| --- | --------------------------------------- | ---------------------------------- | --------- |
| 6.1 | `presets.ts` comment damage             | Fixed                              | `de4d68b` |
| 5.7 | Dead `SRC_*` exports                    | Fixed — used, not deleted          | `de4d68b` |
| 8   | Four documentation contradictions       | Fixed                              | `03aab67` |
| 5.3 | Polling cost undocumented               | Documented; behaviour untouched    | `03aab67` |
| 3.4 | `tsconfig` split resolution             | Fixed                              | `a167c4c` |
| 3.3 | `manifest.version` hardcoded            | Fixed — back to `0.0.0`, `$schema` | `a167c4c` |
| 4.2 | No CI workflows                         | `node.yaml` restored               | `a167c4c` |
| 7.2 | Pre-commit hook a no-op                 | Fixed — hook restored, documented  | `a167c4c` |
| 6.3 | Duplicated choice lists                 | Fixed                              | `700aa62` |
| 6.4 | 57-method pass-through layer            | Deleted                            | `f8d64b6` |
| 5.4 | `raw_command` conditionally registered  | Fixed                              | `dc87365` |
| 5.6 | `as any` defeating the types            | Fixed — no bare `any` in `src/`    | `dc87365` |
| 5.1 | Password in the config store            | Fixed, with migration              | `3c99344` |
| 5.2 | Commands sendable before authentication | Fixed                              | `55e965f` |
| 5.5 | Prompt detection discards the rx buffer | Fixed                              | `55e965f` |

**Since done — closed after the review was written:**

| §   | Item                                | Why                                                                                                                                                                                                                                     |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.2 | The four AUX "layout" presets       | **Done 2026-09-15.** Not a design question after all — `pinpTemplateActions()` took only a layer, so the four AUX copies were byte-for-byte duplicates of a layer-scoped operation. Deleted; the two survivors renamed Layout to Reset. |
| 5.3 | Optimistic-update policy            | **Done 2026-09-15.** The freeze trio was the one genuine inconsistency and is fixed; the wider split is deliberate and now written down in `PROTOCOL.md` §7.3 rather than changed.                                                      |
| 7.1 | Build artifacts in the working tree | **Done 2026-09-15.** No `.tgz` is tracked any more — `roland-v80hd-0.8.8.tgz` untracked with `git rm --cached`, `/*.tgz` covers the rest. Files stay on disk; README now points at building.                                            |

**Still not done, all deliberate:**

| §   | Item                             | Why                                                                                                                                                                                                                                                                                          |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Repository name vs manifest `id` | **Not a defect — reassessed 2026-09-15.** `id` is `roland-v80hd`, and the upstream repo is `companion-module-roland-v80hd`. That matches exactly. The mismatch only ever existed against this personal fork's name, which is not where the check applies.                                    |
| 4.2 | `companion-module-checks.yaml`   | **Not applicable here, not blocked.** The check validates the _hosting repository's_ name, so it cannot pass in a fork named anything else and has no business being here. It passes upstream automatically.                                                                                 |
| 4.3 | `working_doc.md` is tracked      | **Queued for the next build cycle** (moved from the 1.0 pass, 2026-09-15). `TESTING.md`, `TESTING-NEXT.md` and `CODE_REVIEW.md` get gitignored and `git rm --cached`; `working_doc.md` and `PROTOCOL.md` stay tracked. Files stay on disk. Losing their ongoing history is accepted pre-1.0. |
| —   | 2.x API migration                | Out of scope, as the review says. 1.14.1 remains a fine place to submit from.                                                                                                                                                                                                                |

**The repository name was never a submission blocker**, and the original review overstated it. The
check reads the name of the repo the workflow is running in. `bitfocus/companion-module-roland-v80hd`
already satisfies it, so nothing needs renaming and nothing is waiting on anything.

The one genuine submission-time item is smaller: `repository` and `bugs` in both
`companion/manifest.json` and `package.json` point at this fork. Whether they should move to the
bitfocus repo is a decision about where bug reports land, not a defect.

### How it was verified

No hardware was involved, so everything below is a scripted comparison against the 0.6.5 build
rather than a claim that the module works. Lint, both `tsc` projects, `prettier --check` and
`companion-module-check` all pass, and additionally:

| Check                                                   | Result                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Every preset definition, 0.6.5 vs 0.7.0                 | 108 ids, **identical**                                                                       |
| Every action definition, 0.6.5 vs 0.7.0                 | 67 ids, **identical**                                                                        |
| Every feedback definition, 0.6.5 vs 0.7.0               | 29 ids, identical **except** `audio_input_muted`, which is the §6.3 label fix. Ids unchanged |
| `SOURCE_CHOICES` generated vs hand-written              | 49 entries, ids and labels **identical**                                                     |
| `INPUT_ASSIGN_SOURCE_CHOICES` generated vs hand-written | 41 entries, ids and labels **identical**                                                     |
| All 68 action callbacks fired against a recording stub  | every one reaches the API with arguments intact                                              |
| AUX layer address table, all four combinations          | `000020` / `000021` / `000023` / `000024`, unchanged                                         |
| Password migration, 5 stored-config shapes              | all pass; rest of config intact in each case                                                 |
| Receive path, 7 traffic shapes                          | all pass, including a frame behind the password prompt that 0.6.5 discarded                  |
| Packaged manifest                                       | `version: 0.7.0` and `apiVersion: 1.14.1` injected correctly by the build                    |

**What none of this proves:** that the module still talks to a V-80HD. The three changes that can
only be judged on hardware are §5.1 (does it still authenticate, and did an existing password
migrate?), §5.2 (is any legitimate command being dropped?) and §5.5 (is authentication still
clean?). Those are the first things to try on Monday.

---

## 1. Verdict

This module is not the kind of thing Bitfocus complains about. The substance is clearly derived from
real hardware work: packet captures with dates and counts, refuted hypotheses left in the comments,
protocol decisions that are argued rather than guessed. It passes every automated gate cleanly, and
the internal wiring across 68 actions, 29 feedbacks, 46 presets and 31 variables is completely
consistent — no dangling ids anywhere.

What it does have is **generated-looking surface damage**: a section of `presets.ts` where comment
blocks are duplicated, truncated mid-sentence and left orphaned above unrelated code; a 60-method
pass-through layer in `main.ts` that does nothing but forward calls; and the same eight-item input
list written out five times across four files. A reviewer skimming for "AI slop" will land on those
first, and they are the cheapest things in the repo to fix.

There are also **three things that will get a Bitfocus PR bounced before anyone reads the code**
(§4), and **one genuine security-shaped defect** — the device password is stored in the plaintext
config store when the installed API version already offers a secrets store (§5.1).

Roughly: strong engineering, weak presentation, three procedural blockers.

---

## 2. What passes cleanly

Every automated gate the template ships was run and passed:

| Check    | Command                             | Result                                        |
| -------- | ----------------------------------- | --------------------------------------------- |
| Lint     | `npx eslint .`                      | **0 errors, 0 warnings** across 9 files       |
| Types    | `npx tsc -p tsconfig.json --noEmit` | **exit 0**, no diagnostics                    |
| Format   | `npx prettier --check .`            | **All matched files use Prettier code style** |
| Manifest | `npx companion-module-check`        | **passed** — no validation or licence errors  |

Cross-reference audit (script-verified, not eyeballed):

| Check                                                                    | Result           |
| ------------------------------------------------------------------------ | ---------------- |
| Preset `actionId`s with no matching action definition                    | **none**         |
| Preset `feedbackId`s with no matching feedback definition                | **none**         |
| Upgrade-script rename targets missing from `actions.ts` / `feedbacks.ts` | **none**         |
| Variables declared in `variables.ts` but never set                       | **none** (31/31) |
| Variables set in `main.ts` but never declared                            | **none** (31/31) |
| `console.*` calls left in `src/`                                         | **none**         |
| `TODO` / `FIXME` / `HACK` markers                                        | **none**         |

That last set is worth stating plainly, because dangling ids and undeclared variables are the
classic failure mode of machine-generated modules, and this one has zero.

---

## 3. Structural comparison against the template

### 3.1 File layout

`src/` matches the template's expected layout exactly — `main.ts`, `actions.ts`, `feedbacks.ts`,
`presets.ts`, `upgrades.ts`, `variables.ts`, `config.ts` — plus `api.ts` for the transport layer,
which is a normal and welcome addition. `companion/manifest.json`, `companion/HELP.md`, `LICENSE`,
`README.md`, `.gitignore` are all present and correct per the
[file-structure guide](https://companion.free/for-developers/module-development/module-setup/file-structure/).

**Present in the template, absent here:**

| Path                                             | Consequence                                                |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `.github/workflows/companion-module-checks.yaml` | Nothing validates the manifest or builds a package on push |
| `.github/workflows/node.yaml`                    | Nothing runs install / build / lint on push                |
| `.husky/pre-commit`                              | The commit hook is a no-op — see §7.2                      |

**Present here, absent from the template:** [working_doc.md](working_doc.md) (tracked in git),
`TESING NOTES.xlsx` (untracked, gitignored, filename typo), seven `.tgz` build artifacts, `dist/`
and `pkg/` (all gitignored, but present in the working tree).

### 3.2 `package.json`

Effectively identical in shape to the template. Scripts match one-for-one; the only difference is
`yarn build` where the template uses Yarn 4's `run build` — functionally the same.

The dependency sets have diverged because **the template has moved to the 2.x module API and this
module is on 1.x**:

| Dependency                | This module | Template |
| ------------------------- | ----------- | -------- |
| `@companion-module/base`  | `~1.14.1`   | `2.0.4`  |
| `@companion-module/tools` | `^2.8.0`    | `^3.1.0` |
| `typescript`              | `~5.9.3`    | `~6.0.3` |

That is not a defect — 1.14.1 is a supported API and the module is internally consistent with it.
It does mean the template can no longer be read as a line-by-line reference (§8).

### 3.3 `companion/manifest.json`

Validates against the 1.14.1 schema with no errors. Field-by-field against the template:

| Field                 | Template     | This module | Assessment                                                                                                                                                                                           |
| --------------------- | ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$schema`             | present      | **absent**  | Cosmetic. Editors lose inline manifest validation.                                                                                                                                                   |
| `type: "connection"`  | present      | **absent**  | Not a defect at base 1.14 — the 1.x schema does not define this property, and the checker passes without it. It becomes relevant only on a 2.x migration.                                            |
| `version`             | `"0.0.0"`    | `"0.6.5"`   | **Divergence.** The guide says leave it `0.0.0`; the build injects the real version from `package.json`. Hardcoding it creates a second source of truth that has to be hand-synced on every release. |
| `apiVersion`          | `"0.0.0"`    | `"0.0.0"`   | Correct.                                                                                                                                                                                             |
| `repository` / `bugs` | bitfocus URL | fork URL    | See §4.1.                                                                                                                                                                                            |
| everything else       | —            | —           | Correct and populated properly.                                                                                                                                                                      |

### 3.4 TypeScript config — a real inconsistency

The template has `tsconfig.json` **extend** `tsconfig.build.json`, so the editor, the linter and the
build all typecheck under one set of options. This repo does not:

- [tsconfig.json](tsconfig.json) extends `@companion-module/tools/tsconfig/node22/recommended`, which
  sets `"module": "commonjs"`, `"moduleResolution": "node"`.
- [tsconfig.build.json](tsconfig.build.json) extends the same preset but then **overrides** to
  `"module": "Node16"`, `"moduleResolution": "Node16"`.

So `yarn lint` and the IDE resolve modules as CommonJS/node, while `yarn build` resolves as
ESM/Node16 — against a package that declares `"type": "module"`. It happens to typecheck both ways
today, which is exactly why it has gone unnoticed. A module-resolution-sensitive error would show up
only in the build, or only in the editor, and be confusing either way.

Also in `tsconfig.build.json`: `"baseUrl": "./"` with `"paths": { "*": ["./node_modules/*"] }`
duplicates the `paths` the tools preset already sets, and appears in neither the template nor the
current tools presets. It is doing nothing useful.

**Recommendation:** have `tsconfig.json` extend `./tsconfig.build.json` as the template does, and
drop the `baseUrl`/`paths` pair. Tools 2.8.0 does ship a `node22/recommended-esm.json`
(`module: node20`, `moduleResolution: node16`) which is the closer match to what the build actually
wants.

---

## 4. Submission blockers

These are procedural, not code quality. They will stop a Bitfocus PR before review.

### 4.1 Repository name and manifest `id` disagree

The manifest guide states the `id` "has to match the repository name excluding the
`companion-module-`". Here `id` is `roland-v80hd`, but [companion/manifest.json](companion/manifest.json)
declares `repository` as `Jay-PBS/Roland-v80-Companion-Module`, which does not begin with
`companion-module-` at all.

This is the exact failure [working_doc.md](working_doc.md) records from the one CI run:

```
Unknown repository name format: Roland-v80-Companion-Module.
Repository name must start with companion-module- or companion-surface-
```

The fork's own resolution — delete the workflow — is fine for a private fork and inconsistent for an
upstream submission. `bitfocus/companion-module-roland-v80hd` already satisfies the rule; the
manifest, `package.json` and README all need to point there when the module goes upstream.

### 4.2 No CI workflows

Both template workflows have been removed. `companion-module-checks` is the workflow Bitfocus itself
runs, and `node.yaml` is what proves lint and build pass on a clean checkout with Node 22 rather
than on this machine's Node 24. Nothing currently catches a broken package before it reaches
hardware — [working_doc.md](working_doc.md) states this explicitly and accepts the trade.

Restoring `node.yaml` alone would be worth it independently of any upstream plan: it is the only
thing that would have caught the Node version drift the working doc flags.

### 4.3 `working_doc.md` is tracked

[working_doc.md](working_doc.md) is 307 lines of live engineering notes — session plans, "Jay's
call", pcap filenames, open hypotheses. It is genuinely valuable and it should not ship in a module
package. The file itself raises this ("Decide whether this file should ship in the repo at all").
Gitignore it, or move it out of the repo, before any upstream PR.

---

## 5. Correctness and robustness

### 5.1 The device password is stored in the config store, not the secrets store

**[src/config.ts:21](src/config.ts#L21)** declares the network password as a plain `textinput`.

The installed `@companion-module/base@1.14.1` already provides `CompanionInputFieldSecret`
(`type: 'secret-text'`), and its own typings say of it:

> "Available for config. Note: the value for this will be in the secrets store, not the config store."

and of `saveConfig`:

> "The whole config object and the keys of the secrets object are reported to the webui, so be
> careful how sensitive data is stored"

So today the V-80HD password is round-tripped to the web UI in the clear and persisted in the
connection config alongside the IP address. `InstanceBase` in this version is
`InstanceBase<TConfig, TSecrets>` with `init(config, isFirstInit, secrets)` and
`configUpdated(config, secrets)`; [src/main.ts:11](src/main.ts#L11) declares
`InstanceBase<ModuleConfig>` and [src/main.ts:65](src/main.ts#L65) takes only `config`, so the
secrets channel is unused.

This is the single highest-value fix in the review, and it does not require an API upgrade — the
capability is in the version already installed.

### 5.2 Commands can be sent before authentication completes

[`sendCmd`](src/api.ts#L715) gates only on `this.tcp` existing. It does not check `isConnected` or
`isAuthenticated`. During the authentication window the module logs "Connecting — Authenticating"
but the socket is open, so any button pressed in that window writes a command line into a session
that is still waiting for a password.

That is precisely the failure the auth code works so hard to avoid: the comment at
[src/api.ts:259-262](src/api.ts#L259-L262) records that an unprompted extra line "leaves a stray
line the device parses as a command (observed ERR:0 on the wire)", and
[`onPasswordPrompt`](src/api.ts#L352) refuses to answer a second prompt specifically to avoid
tripping the device's brute-force lockout. A stray command sent mid-authentication is a candidate
for being counted as a failed attempt.

`requestCoreState` has the same gap in weaker form — it checks `isConnected` but not
`isAuthenticated` ([src/api.ts:626](src/api.ts#L626)), and is reachable from the user-facing
`sync_now` action.

**Recommendation:** gate `sendCmd` on `isAuthenticated` and log/queue rather than write when it is
false.

### 5.3 Optimistic state updates are applied inconsistently

Some commands write local state and call `changedState()` immediately; others deliberately do not.
Both behaviours are defensible, but the split is not principled and is not documented as a whole:

| Optimistic                                                                                                                                                                                  | Not optimistic                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cmdSplit1/2`, `cmdPinpPgm/Pvw`, `cmdDskPgm/Pvw`, `cmdAudioInputMute`, `cmdMainBusMute`, `cmdAuxBusMute`, `cmdSetInputFreeze`, `cmdSetAuxLinkedPgm`, `cmdSetAuxLayerPinp`, `cmdTestPattern` | `cmdSetProgramSource`, `cmdSetPreviewSource`, `cmdSetAuxSource`, `cmdPinpSetSource`, `cmdDskSetSource`, all PinP geometry commands, `cmdStreamRecordStart/Stop` |

`cmdSetAuxLinkedPgmBus` is the one case where the choice is argued, in a good comment at
[src/api.ts:826-830](src/api.ts#L826-L830).

There is a third variant: `cmdFreezeToggle` ([src/api.ts:1017](src/api.ts#L1017)) updates state
optimistically, while `cmdFreezeOn` / `cmdFreezeOff` — which reach the same address through the same
`cmdSetFreeze` — do not. So `freeze_active` feedback behaves differently depending on which of three
actions the user put on the button.

**Why it matters:** with polling enabled the 500 ms cycle corrects everything within one tick, so
none of this is visible. With **polling disabled** (a supported config option,
[src/config.ts:22](src/config.ts#L22)) the optimistic half of the module keeps its feedbacks moving
and the non-optimistic half freezes permanently. The user-facing behaviour of "Enable polling"
therefore isn't "feedbacks lag a bit" — it's "about half the feedbacks stop working". Neither
[README.md](README.md) nor [companion/HELP.md](companion/HELP.md) says so.

### 5.4 `raw_command` is registered conditionally

[src/actions.ts:443-454](src/actions.ts#L443-L454) only adds the `raw_command` action when
`config.showAdvanced` is true. Turning the checkbox back off removes the action definition while
existing buttons still reference it, leaving those buttons in an unknown-action state. Companion's
conventional approach is to always define the action and use `isVisible` / `isVisibleExpression` on
its options, or simply to accept a permanently visible expert action with the warning text it
already carries.

Low impact — it is an expert-only feature — but it is a real state trap.

### 5.5 Password-prompt detection discards the receive buffer

[src/api.ts:384-388](src/api.ts#L384-L388) tests the whole accumulated `rxBuffer` for
`/enter password/i` and, on a match, clears the entire buffer. Two consequences: any framed data
arriving in the same TCP segment after the prompt is dropped, and if the literal string ever appears
inside normal payload data the buffer is destroyed. The comment correctly explains _why_ the raw
buffer must be tested (the prompt has no terminator) — the issue is the unconditional
`rxBuffer = ''` rather than consuming up to and including the prompt.

Similarly, the overflow guard at [src/api.ts:409](src/api.ts#L409)
(`if (this.rxBuffer.length > 8192) this.rxBuffer = this.rxBuffer.slice(-4096)`) will slice through
the middle of a frame, producing one silently corrupt parse. Given the device's traffic volume this
is unlikely to ever fire, but it is a silent failure when it does.

### 5.6 `as any` defeats the module's own types

[src/api.ts:837](src/api.ts#L837):

```ts
const addr = ({ 1: { 1: '000020', 2: '000021' }, 2: { 1: '000023', 2: '000024' } } as any)[aux][layer]
if (!addr) return
```

`aux` is `AuxId` (`1 | 2`) and `layer` is `LayerId` (`1 | 2`), so the lookup is total and the
`as any` — plus the unreachable `if (!addr)` guard it necessitates — is throwing away exactly the
type safety the file defines two lines' worth of types to get. A `Record<AuxId, Record<LayerId, string>>`
annotation removes both.

[src/actions.ts:76](src/actions.ts#L76) has the same shape: `const L = (e: any): 1 | 2 => ...`,
where the parameter has a real type available from the action callback signature.

Note the Bitfocus ESLint config explicitly sets `@typescript-eslint/no-explicit-any: 'off'`, so
neither is a rule violation. They are still the two places in the codebase where the types were
switched off rather than satisfied.

### 5.7 Inconsistent source-byte arithmetic

[`sourceIdToByte`](src/api.ts#L184) uses the named constants for three families and a bare literal
for the fourth:

```ts
if (id.startsWith('hdmi_')) { ... return n - 1 }          // SRC_HDMI1 exists and is 0x00
if (id.startsWith('sdi_'))  { ... return SRC_SDI1 + n - 1 }
```

As a direct result, `SRC_HDMI1`, `SRC_HDMI4`, `SRC_SDI4` and `SRC_STILL32` are **exported but never
referenced anywhere** — four dead exports whose only purpose was to document the ranges the function
then bypasses.

---

## 6. Structure and duplication

This is the section that most affects how the module reads to an outside reviewer.

### 6.1 `presets.ts` comment structure is visibly damaged

Four separate defects in one file, all of them cosmetic and all of them the sort of thing that reads
as unreviewed machine output:

1. **[src/presets.ts:260-267](src/presets.ts#L260-L267) and [268-279](src/presets.ts#L268-L279)** —
   the `── AUX Link ──` header and its explanatory paragraph appear **twice**, in two slightly
   different revisions. The first copy is cut off mid-sentence: it ends `"Manual is usually what you
want when Companion is"` and the next line starts the duplicate header.

2. **[src/presets.ts:450-452](src/presets.ts#L450-L452)** — a `── Stream & Record ──` header with
   two lines of explanation, itself truncated mid-sentence (`"Amber marks the brief
Starting/Stopping states the"`), sitting immediately above the **Test Patterns** presets, which
   have nothing to do with it. The Stream & Record presets are 26 lines further down.

3. **[src/presets.ts:475](src/presets.ts#L475)** — the orphaned tail of that sentence,
   `// device reports before it settles.`, floating alone above `presets['stream_record_start']`.

4. **[src/presets.ts:472-473](src/presets.ts#L472-L473)** — `── Image Capture — suspended ──` with a
   commented-out placeholder `// presets['capture_...'] = { ... }`, twenty lines above
   [src/presets.ts:493](src/presets.ts#L493) where Image Capture is fully implemented and live. The
   feature is not suspended; the comment is stale.

None of this affects behaviour. All of it is what a reviewer sees first.

### 6.2 The AUX "layout" presets are not AUX-specific

`aux1_pinp1_layout`, `aux1_pinp2_layout`, `aux2_pinp1_layout`, `aux2_pinp2_layout`, `pinp1_layout`
and `pinp2_layout` are six presets across three categories, but all six call the same
[`pinpTemplateActions(layer)`](src/presets.ts#L553), which takes only a layer and emits the eight
global PinP window actions. `aux1_pinp1_layout` and `aux2_pinp1_layout` are **byte-for-byte
identical button definitions** under different names and categories.

Placing them under "AUX 1" and "AUX 2" implies they configure that AUX bus's layer. They do not —
there is no AUX-scoped geometry action in the module. Either the naming is misleading or four of the
six presets are redundant.

### 6.3 The same data is written out repeatedly

| Data                                                     | Copies | Locations                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The eight physical inputs (`hdmi_1`…`sdi_4`) with labels | **5**  | [api.ts:16](src/api.ts#L16) (`INPUT_FREEZE_IDX`), [api.ts:29](src/api.ts#L29) (`TALLY_IDX`), [actions.ts:52](src/actions.ts#L52) (`FREEZE_INPUTS`), [feedbacks.ts:19](src/feedbacks.ts#L19) (`PHYSICAL_INPUTS`), [presets.ts:6](src/presets.ts#L6) (`TALLY_PRESET_INPUTS`) — plus a sixth inline copy at [presets.ts:429](src/presets.ts#L429) |
| Wipe pattern names                                       | **3**  | [actions.ts:25](src/actions.ts#L25), [feedbacks.ts:33](src/feedbacks.ts#L33), [main.ts:110](src/main.ts#L110)                                                                                                                                                                                                                                  |
| Wipe direction names                                     | **3**  | [actions.ts:35](src/actions.ts#L35), [feedbacks.ts:43](src/feedbacks.ts#L43), [main.ts:120](src/main.ts#L120)                                                                                                                                                                                                                                  |
| AUX layer dropdown                                       | **2**  | [actions.ts:72](src/actions.ts#L72), [feedbacks.ts:29](src/feedbacks.ts#L29)                                                                                                                                                                                                                                                                   |
| AUX bus dropdown                                         | **2**  | [actions.ts:62](src/actions.ts#L62), [feedbacks.ts:53](src/feedbacks.ts#L53)                                                                                                                                                                                                                                                                   |
| Capture sources                                          | **2**  | [api.ts:58](src/api.ts#L58) (`CAPTURE_SRC`), [actions.ts:40](src/actions.ts#L40) (`CAPTURE_SOURCES`, then filtered against the first)                                                                                                                                                                                                          |

Most conspicuously,
[`INPUT_ASSIGN_SOURCE_CHOICES`](src/api.ts#L137) is 41 hand-written entries that are **exactly**
[`SOURCE_CHOICES`](src/api.ts#L85) minus its eight `input_N` entries — verified by set difference.
Both lists spell out `still_1` through `still_32` by hand. That is 90 lines of literal array where
one filter and one generated range would do.

The duplication has already produced a user-visible inconsistency: the audio channel dropdown in
[actions.ts:8](src/actions.ts#L8) uses friendly labels (`Audio In 3/4`, `Bluetooth In`), while the
same dropdown in [feedbacks.ts:17](src/feedbacks.ts#L17) derives labels mechanically from the keys
(`audio in 34`, `bluetooth in`). The user sees different names for the same channel depending on
whether they are adding an action or a feedback.

### 6.4 `main.ts` is 60 pass-through methods

[src/main.ts:190-363](src/main.ts#L190-L363) is 174 lines in which every one of 60 methods has the
identical body `this.api?.cmdX(...)`. `actions.ts` already imports `ModuleInstance`; it could call
`self.api.cmdX(...)` directly and delete the entire layer.

Two secondary observations:

- The `?.` is dead defensiveness. `api` is declared `public api!: V80Api` — a definite assignment —
  so per the type it is never undefined. Either the `!` or the `?.` is wrong.
- The layer is incomplete: `cmdSetFreeze` ([src/api.ts:1008](src/api.ts#L1008)) is `public` on the
  API but has no forwarder, so it is public for no reason.

### 6.5 State and transport are mutually coupled

`ModuleInstance` holds ~30 public mutable fields; `V80Api` holds a reference back to it and writes
directly into those fields from `parseDth` (`this.self.programSource = val`, and 30 more). So
`main.ts` reaches into `api.ts` for every command and `api.ts` reaches into `main.ts` for every
state update.

This works and it is not unusual in Companion modules. But a `DeviceState` object owned by the API
and read by the feedbacks would remove the cycle and make `main.ts` roughly the size of the
template's. Worth considering only if the file is being restructured anyway for §6.4.

---

## 7. Repository hygiene

### 7.1 Build artifacts in the working tree

Seven `.tgz` packages (0.4.0 → 0.6.5), plus `dist/` (292K) and `pkg/` (217K), all correctly
gitignored but all sitting in the repo root. Also `TESING NOTES.xlsx` — gitignored, with the typo
baked into the `.gitignore` entry so renaming the file would un-ignore it.

Not a code problem. It is a first-impression problem if anyone ever browses the directory, and
keeping every historical `.tgz` alongside a memory rule about version bumping is a good way to
install the wrong one.

### 7.2 The pre-commit hook does nothing

`git config core.hooksPath` is `.husky/_`, and `.husky/_/pre-commit` exists — but it delegates via
`.husky/_/h`, which does:

```sh
s=$(dirname "$(dirname "$0")")/$n     # -> .husky/pre-commit
[ ! -f "$s" ] && exit 0
```

`.husky/pre-commit` **does not exist** in this repo (the template ships it, containing
`lint-staged`), so every commit exits the hook immediately. `lint-staged` is fully configured in
`package.json` and has never run.

Compounding it, [working_doc.md](working_doc.md) correctly notes that `enableScripts: false` in
`.yarnrc.yml` (inherited from upstream) stops `postinstall: husky` from running, so the hook
directory will not self-install on a fresh clone either. `.husky/` is also untracked.

The practical effect is nil right now — lint and format are both clean — but the safety net people
assume is there is not there. Either restore `.husky/pre-commit` and document the manual
`yarn husky` step, or drop husky and `lint-staged` from `package.json` so the config stops implying
a guarantee it does not provide.

---

## 8. Documentation accuracy

The docs are unusually thorough for a module of this size — the README changelog and HELP.md's AUX
Link and Tally sections are better than most shipped modules. That makes the contradictions worth
listing precisely, because a reader has every reason to trust these files.

| #   | Location                                                  | Problem                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [companion/HELP.md](companion/HELP.md), Feedbacks section | States **"Stream & Record state is not polled — the device pushes it whenever it changes."** The code polls `030800` on every cycle ([api.ts:659](src/api.ts#L659)) and both [api.ts:1040-1044](src/api.ts#L1040-L1044) and [working_doc.md](working_doc.md) establish by packet capture that **the device does not push it to our session**. This is the 0.6.5 fix documented backwards. |
| 2   | [companion/HELP.md](companion/HELP.md), Known Limitations | **"Stream Start and Stop are not implemented. The V-80HD's published control specification contains no address for them."** Stream & Record start/stop is implemented, on `0A0800`, and documented at length earlier in the same file.                                                                                                                                                    |
| 3   | [README.md](README.md), Roadmap                           | Lists **"Stream Start and Stop"** as roadmap. The 0.6.4 changelog in the same file says "Stream Start and Stop removed from the roadmap — it is the same trigger, not a separate feature."                                                                                                                                                                                                |
| 4   | [companion/HELP.md](companion/HELP.md), Variables table   | Documents `ftb` as **"Fade To Black state (ON or OFF)"**. [main.ts:165](src/main.ts#L165) sets it to `FADING` or `IDLE`. A button expression testing `= "ON"` will never match.                                                                                                                                                                                                           |
| 5   | [README.md](README.md)                                    | Feature table says tally feedbacks were **"added in 0.6.4"**; the 0.6.3 changelog entry in the same file, and HELP.md, both say 0.6.3.                                                                                                                                                                                                                                                    |
| 6   | Both                                                      | Neither states that disabling the "Enable polling" option leaves roughly half the feedbacks permanently stale (§5.3). The config label — "keeps feedbacks in sync" — understates it.                                                                                                                                                                                                      |

Items 1, 2 and 4 are the ones that will actively mislead a user.

---

## 9. Does this read as AI-generated?

Since that is the concern behind the review, here is the honest split.

**Reads as machine-generated:**

- The `presets.ts` comment wreckage (§6.1) — duplicated headers, sentences truncated at identical
  points, an orphaned clause, a "suspended" note above live code. Nothing else in the repo looks
  like this, which is what makes it stand out.
- 60 mechanically identical forwarding methods (§6.4).
- A 41-entry array that is another array minus eight entries, with `still_1`…`still_32` spelled out
  twice (§6.3).
- The same eight inputs written five times, in five slightly different shapes.

**Reads as human, hardware-derived work — and strongly so:**

- Comments that record measurements, not intentions. [api.ts:686-694](src/api.ts#L686-L694):
  _"packet capture on 2026-09-04 showed 17,220 RQH sent as 273 batched writes of 63 commands
  returning 21 DTH replies in total — and all 21 were answers to the watchdog's separate
  single-command nudge."_ Followed by an explicit instruction not to reintroduce the optimisation
  without re-capturing. No generator produces that.
- Refuted hypotheses left in place with their evidence: `030207` documented as _not_ the FTB state
  ([api.ts:569-574](src/api.ts#L569-L574)), `03020F` documented as wrong and warned against
  ([api.ts:1046-1048](src/api.ts#L1046-L1048)).
- Decisions argued against the obvious choice: `cmdSetAuxLinkedPgmBus` deliberately refusing an
  optimistic update because the device owns that state ([api.ts:826-830](src/api.ts#L826-L830)).
- An authentication path built around a _device behaviour_ — refusing to answer a second password
  prompt because answering loops into a brute-force lockout that then rejects the correct password
  ([api.ts:352-362](src/api.ts#L352-L362)).
- A feedback renamed to `"fade in progress"` with a description explaining it is not the engaged
  state, rather than shipping a feedback that lies.
- Two upgrade scripts that are correct, plus a comment explaining which migration was deliberately
  _omitted_ and why ([upgrades.ts:213-214](src/upgrades.ts#L213-L214)).
- Timing constants justified by testing: `POLL_INTERVAL_MS = 500` with _"250ms caused panel lockup
  during testing"_ ([config.ts:13-15](src/config.ts#L13-L15)).
- Zero dangling ids across 174 registered entities.

The generated-looking parts are all _surface_: comments, boilerplate, repeated literals. The
protocol layer — the part that would actually be dangerous if it were hallucinated — is the most
carefully evidenced part of the repo.

---

## 10. Recommended order of work

Listed by value per unit of effort, with what actually happened. Twelve of the fifteen are done;
see [§0](#0-status-of-this-review) for the full status table.

**Cheap, high visibility**

1. ~~Fix the four comment defects in `presets.ts` (§6.1).~~ **Done** — `de4d68b`. The recovered
   Stream & Record paragraph described a single toggle button and amber transitional states, neither
   of which exists, so it was rewritten to describe the Start and Stop presets that are there.
2. ~~Fix the four documentation contradictions (§8, items 1–4).~~ **Done** — `03aab67`. Items 5 and 6
   too.
3. ~~Delete the four dead `SRC_*` exports, or use them in `sourceIdToByte` (§5.7).~~ **Done** —
   `de4d68b`, used rather than deleted: the ranges now derive from the constants.

**Cheap, real correctness**

4. ~~Move the password to `type: 'secret-text'` (§5.1).~~ **Done** — `3c99344`, with an upgrade
   script migrating an existing password so nothing needs re-entering, and a config fallback in case
   that script has not run.
5. ~~Gate `sendCmd` on `isAuthenticated` (§5.2).~~ **Done** — `55e965f`. Dropped with a warning
   rather than queued: replaying a stale button press onto a live switcher is worse than doing
   nothing. `requestCoreState` gated too.
6. ~~Make `tsconfig.json` extend `tsconfig.build.json` (§3.4).~~ **Done** — `a167c4c`, with compiler
   output deliberately unchanged.

**Worth doing before any upstream submission**

7. ~~Restore `.github/workflows/node.yaml` (§4.2).~~ **Done** — `a167c4c`, plus a `prettier --check`
   step.
8. Gitignore `working_doc.md` (§4.3). **Queued for the next build cycle** — moved from the 1.0
   pass on 2026-09-15. `TESTING.md`, `TESTING-NEXT.md` and this file go; `working_doc.md` and `PROTOCOL.md` stay. The files stay on disk; what ends is their
   version history from that commit onward.
9. ~~Restore `.husky/pre-commit` (§7.2).~~ **Done** — `a167c4c`. It has run on every commit since,
   which is how we know it now works. The one-off `yarn husky` step is documented in the README,
   since `enableScripts: false` still prevents self-install.
10. ~~Set `manifest.version` back to `0.0.0` (§3.3).~~ **Done** — `a167c4c`. Verified end to end: the
    packaged manifest carries `0.7.0`, injected from `package.json`, so the version-bump-per-build
    workflow is unaffected.
11. Resolve the repository-name rule (§4.1). **Not done** — only at the point of upstream submission,
    and it means renaming the repo.

**Larger, optional**

12. ~~Collapse the duplicated choice lists into shared exports in `api.ts` (§6.3).~~ **Done** —
    `700aa62`. The address maps stay written out for readability against the control specification,
    but are tied to the canonical list with `satisfies`, so drift is now a build failure. The
    audio-label inconsistency was fixed for free, as predicted.
13. ~~Delete the `main.ts` forwarding layer (§6.4).~~ **Done** — `f8d64b6`. 364 lines to 189.
14. Decide what the four AUX "layout" presets are meant to do (§6.2). **Not done** — this is a
    design decision, not a defect. Needs an answer before any code changes.
15. Document, or make consistent, the optimistic-update policy (§5.3). **Half done** — `03aab67`
    documents what disabling polling costs, in HELP.md, the README and the config field label
    itself. The behaviour is deliberately **unchanged**: making it consistent moves ~20 commands at
    once, and landing that beside the authentication changes would make a Monday failure ambiguous.
    Next build.

A 2.x API migration is **not** on this list. It is a separate piece of work (typed
`ModuleSchema`, `secrets`, the new preset sections/`type: 'simple'` model, `runEntrypoint` removal),
and 1.14.1 is a perfectly reasonable place to submit from.

---

## Sources

- [Companion Connection Developers' Guide](https://companion.free/for-developers/module-development/)
- [Module Development 101](https://companion.free/for-developers/module-development/module-development-101/)
- [File Structure Overview](https://companion.free/for-developers/module-development/module-setup/file-structure/)
- [manifest.json Config](https://companion.free/for-developers/module-development/module-setup/manifest.json/)
- [Actions — Connection Basics](https://companion.free/for-developers/module-development/connection-basics/actions/)
- [bitfocus/companion-module-base](https://github.com/bitfocus/companion-module-base)
- Local: `C:\GitHub\companion-module-template-ts`, and the typings shipped in
  `node_modules/@companion-module/base@1.14.1` and `node_modules/@companion-module/tools@2.8.0`
