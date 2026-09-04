# Working Document — Roland V-80HD Companion Module

Live working notes: **open items only**.

Once something is done and verified on hardware, delete it from this file. Anything worth keeping permanently belongs in [README.md](README.md) (project-facing) or [companion/HELP.md](companion/HELP.md) (user-facing), not here. This file is not a changelog and holds no logs — the changelog lives in the README.

Last reviewed: 2026-09-04 · Working version: 0.6.5

---

## Build status

| Check                | State                              |
| -------------------- | ---------------------------------- |
| `yarn install`       | Passing                            |
| `yarn build`         | Passing                            |
| `yarn lint`          | Passing — clean, 0 errors          |
| `prettier --check .` | Passing                            |
| `yarn package`       | Passing — `roland-v80hd-0.6.5.tgz` |
| GitHub Actions       | **Never run** — see below          |

---

## Pending release decisions

- **Merged and pushed 2026-09-04.** `main` is at `d080ed1` (0.6.5) on `origin`, fast-forwarded from `012569f`, bringing in the bitfocus upstream sync, the doc rewrite, the prettier cleanup and the whole 0.6.5 protocol correction. The `chore/upstream-sync-0.6.1` branch is now redundant and can be deleted whenever convenient.
- **Still untagged.** The only tag in the repo is `v0.4.0`. 0.6.0, 0.6.2, 0.6.3 and 0.6.4 all went untagged. 0.6.5 is merged to `main` and is the most tested build the project has had, so it is the obvious candidate for the first tag since 0.4.0. Not done — waiting on a decision.
- **Version numbering is discontinuous.** 0.4.2 went straight to 0.6.0, and 0.6.0 to 0.6.5. 0.4.1, 0.4.2 were local-only builds and 0.6.1 was never built — only the branch carries that name. Recorded in the README changelog so it does not cause confusion again.
- Decide whether this file should ship in the repo at all. If the module is ever submitted upstream to bitfocus, consider gitignoring it.

## Needs verification on hardware

Nothing here has been re-tested since the reformat and upstream sync.

### Session plan

Build under test: **`roland-v80hd-0.6.5.tgz`**. Install this before anything else — the previously
installed build is from 6 Aug and contains none of Tally, Record, Image Capture or the AUX Link presets.

**Testing today**

1. **Tally feedbacks** — four steps below. Step 3 decides whether the feature stays.
2. **FTB, wipe pattern, wipe direction** — the 0.6.0 feedbacks, against panel operation. Never verified.
3. **Reconnect watchdog and auth lockout** — cable pull, switch power-cycle, firewall block, wrong password.
4. **AUX Linked PGM presets** (new in 0.6.3) — three buttons under the `AUX Link` category, Off / Auto / Manual, each lighting on its own mode. Quick check while the unit is up.

**Wiresharking today**

- **Record function and feedback.** The command `03020F` is already implemented and packet-confirmed. What the capture adds: whether the device acknowledges, and whether it pushes anything back when record is started from the panel. If it does, the feedback can stop being send-only.
- **Is `03020F` actually the combined Stream & Record trigger?** The one streaming item scheduled. See the breakdown below for why this replaces the old hunt for a separate stream address, and for the exact procedure.

While Wireshark is up and the rig is live, also capture: still output cut direct to PGM, macro execute, and **which messages the device pushes unprompted without polling**. That last one would settle whether the transition-type feedback fault and the audio-mute-from-panel limitation are fixable or are device behaviour.

**On hold**

- **Image Capture to Still** — deferred to Monday, testing time. Code is in 0.6.3 and ready.

**Not scheduled**

- **Audio control in the RC software** — research, not a test. The mute-only decision rests on the panel knobs not being motorised; RC may show something that changes it.
- **`mute_*` / `freeze_*` variables across all channels** and the **batched poll cycle at 61 commands** — carry-overs, worth folding into today if there is time.

### Detail per item

- **Reconnect watchdog paths.** The 8s rebuild, 10s auth retry and 20s socket recycle were verified by packet capture during development, but not re-tested since. Worth exercising: pull the network cable mid-session, power-cycle the switch, and block the device at the firewall to simulate silent loss.
- **Auth lockout detection.** Confirm a deliberately wrong password reports the lockout and stops retrying, and that recovery works once the device clears.
- **Batched poll cycle.** Confirm feedback still tracks correctly at 500ms now that a cycle is one write of 61 commands.
- **Record (restored in 0.6.3, untested).** `record_on` / `record_off` / `record_toggle` plus a `record_active` feedback, on the Wireshark-confirmed `03020F`. The commands were never in the 0.6.0 tree - they were commented out at 0.2.6 and the docs kept claiming otherwise. Full confirmation that a file lands is blocked on the SSD; the command and feedback can still be exercised today. The 03H area is absent from the published address map, so there is no RQH to poll: the feedback tracks what the module sent, and will be wrong if recording is started or stopped from the panel.
- **The four feedbacks added in 0.6.0** — FTB, wipe pattern, wipe direction, AUX Linked PGM — against panel operation.
- **Per-channel `mute_*` and per-input `freeze_*` variables** across all channels, not just a sample.

## CI

The `companion-module-checks` workflow ran once, on the 2026-09-04 push to `main`, and failed at the
first step:

```
Unknown repository name format: Roland-v80-Companion-Module.
Repository name must start with companion-module- or companion-surface-
Error: Process completed with exit code 99.
```

Not a code fault — it never reached build or package. Resolved by renaming the GitHub repository to
`companion-module-roland-v80hd` and removing the workflow from this fork, since it is an upstream
gate rather than something needed here. `repository` and `bugs` URLs in `package.json`,
`companion/manifest.json` and README were updated to match.

**Note what was given up:** that workflow also ran install, build, package and a launch test. Nothing
now catches a broken package before it reaches hardware, so `yarn build`, `yarn lint`,
`prettier --check` and `yarn package` all passing locally is the only gate. If the module is ever
submitted upstream, bitfocus runs these checks on their own repository anyway.

## Open issues

- **Transition type feedback is partial.** It responds to panel activity but can land in an unexpected state when driven from the panel directly. Root cause not yet established.
- **`enableScripts: false`** came in from upstream's `.yarnrc.yml`. This is a deliberate safety setting, but it means `postinstall: husky` no longer runs, so git hooks will not self-install on a fresh clone. Existing `.husky/` is intact. Decide whether to document the manual step or drop husky.
- **Node version drift.** `engines` requires `^22.20`; this machine runs v24.11.0. Nothing has failed because of it, and CI selects Node 22 from the manifest, so local and CI are not building on the same major version.

## Not yet implemented

| Feature           | Blocker                                            |
| ----------------- | -------------------------------------------------- |
| Stream Start/Stop | Probably already implemented as Record — see below |

Decided against, not blocked:

- **Scene Memory control.** Pulled from the project and the docs. It was never implemented in 0.6.0 anyway — the "code exists but is unexposed" claim was carried forward from 0.2.x, and `cmdLoadMemory`/`cmdSaveMemory` were dropped in the TypeScript rewrite. If it is ever wanted back: Load is one write to `0A0000` (00H-1FH = Memory 1-32) and is easy; Save is not, because the spec marks `0A0001` **Read Only**, so the old 0.2.x save almost certainly did nothing and would need a Wireshark capture of a panel-driven save first.
- **Audio level control.** The level knobs are not motorised, so a level set from Companion cannot be reflected on the panel and the two silently disagree. Mute stays the only audio control. Revisit only if the RC software turns out to handle this differently. The address is documented if it is ever wanted: `01 xx 03`, three bytes, `7E 00 00` = -INF, `00 00 00` = 0.0dB, `00 00 64` = +10.0dB, where xx is 01H-0FH matching the existing `AUDIO_CH` map.
- **Still tally.** `0C0008` onward covers Still 1-32. Left out deliberately: 32 more reads would take the poll cycle from 61 commands to 93, and 250ms already locked the panel up once. Add behind a config toggle if anyone actually wants it.

### Stream & Record — SOLVED 2026-09-04

Packet capture against the **Roland RCS software**, four clean on/off cycles, `v80_streamrec.pcapng`:

```
23.926  PC      DTH:0A0800,01;     start
23.934  DEVICE  ACK;
23.975  DEVICE  DTH:030800,04;     starting
24.161  DEVICE  DTH:030800,05;     running

29.782  PC      DTH:0A0800,00;     stop
29.832  DEVICE  DTH:030800,03;     stopping
31.919  DEVICE  DTH:030800,02;     stopped
```

| Address  | Direction       | Meaning                                                          |
| -------- | --------------- | ---------------------------------------------------------------- |
| `0A0800` | write           | Stream & Record trigger. `01` start, `00` stop                   |
| `030800` | **device push** | Status: `02` stopped, `03` stopping, `04` starting, `05` running |

Both undocumented — the spec publishes only `0A0000`-`0A0003` in the `0A` area and nothing in `03`.

**`03020F` did not appear once in 120 seconds.** The old "record on/off" note pointed at the wrong
address, so record was almost certainly broken as shipped in 0.6.3. Do not reinstate `03020F`
without a fresh capture; it may have been a different function or changed with firmware.

**`030800` is pushed to the RCS session, but not to ours.** Capture `v80_streamrec_fb.pcapng`
confirms it: five start/stop cycles driven from Companion produced `0A0800` writes and **no `030800`
in either direction**, so the device does not volunteer status to our session even when we are the
one issuing the command. Tested on hardware 2026-09-04: the
actions worked (so `0A0800` is confirmed correct) but the feedback stayed dark, because `030800`
was parsed and never polled. It is now in the poll list like everything else. The parse branch is
kept so a push is still handled if one ever arrives. Lesson: do not assume a push seen in one
client's session reaches ours.

Background traffic decoded so it does not confuse a future capture: `0E0000` is a 1 Hz keepalive
both directions, `030604` is a 1 Hz clock counter (`07496D`, `07496E`, ...). Neither is
stream-related.

**Start and Stop confirmed working on hardware 2026-09-04**, several cycles under packet capture.
The Toggle action was removed at the user's request — Start and Stop only. The `record_toggle`
upgrade mapping was dropped with it, so an old `record_toggle` button has nothing to migrate to;
acceptable because record never worked (it was on the wrong address).

**Feedback fixed but not yet verified:** trigger moved to `0A0800`, `030800` parsed into
`streamRecordState` / `streamRecordActive`, `stream_record_active` and `stream_record_state`
feedbacks, `stream_record` and `stream_record_state` variables, actions renamed `record_*` to
`stream_record_*` with an upgrade script in `src/upgrades.ts`. Needs a bench check that Start and
Stop from Companion produce the same `030800` sequence RCS did.

**Still open:** the Live Streaming / Video Rec / Audio Rec enable flags are undocumented and
uncaptured. Capturing them in RCS would let Companion show what a Start will actually do rather
than warning generically.

### Batched polling was broken — FIXED, needs verification

**Root cause of every feedback complaint.** Packet capture 2026-09-04 (`v80_ftb_transition.pcapng`),
Companion connected and polling, user driving FTB and transition type from Companion buttons:

```
RQH sent by module      : 17220
DTH returned by device  :    21     <- all 21 answered single-command writes
RQH per TCP write       : 63 x 273 writes -> zero replies, not even an ACK
                           1 x  21 writes -> 21 replies
```

The device does not answer a batched write at all. Batching was introduced in 0.6.0 as a traffic
optimisation ("52 packets to 1") and silently disabled **every polled feedback** from that release
onward. The only poll that ever returned data was the watchdog's standalone `RQH:001500` nudge.

That explains, in one stroke: FTB feedback dead in Companion, transition type feedback "partial",
audio mute feedback "not updating from the panel" (documented as a device limitation — it was not),
and AUX linked PGM per-bus never updating. Feedbacks appeared to work only when driven from
Companion, because the commands set local state optimistically.

**Fixed:** `sendCmdBatch` now sends one command per TCP write. Do not reintroduce batching without
capturing the result; if traffic ever needs reducing, find the chunk size the device tolerates on
hardware first.

**CONFIRMED FIXED on hardware 2026-09-04**, twice over. Tally feedback reaches the Companion preset
in 0.6.4, and a second capture measured the poll directly: **18,838 RQH sent, 15,518 DTH returned**,
against 17,220 sent and 21 returned on 0.6.3. The batched write was the whole problem.
Tally is entirely poll-driven — `0C0000`-`0C0007` with no device push — so it could not light at all
unless the poll is returning data. That validates the batching fix directly.

**Consequence: re-test the three long-standing "known issues" from the panel.** All three are
consistent with polling never returning data, and may simply be gone:

- Audio mute feedback "does not update when changed on the panel" — documented in README and HELP as
  a device limitation. It probably never was one.
- Transition type feedback "partial / lands in an unexpected state when driven from the panel" —
  **RESOLVED 2026-09-04.** Mix and wipe feedback confirmed working on 0.6.4. It was the dead poll,
  not device behaviour. Removed from README and HELP.
- FTB feedback showing on the mixer but not in Companion — **open, one measurement away.**
  Feedback now moves, but only _during_ the fade, never while FTB sits on or off. `030207` is a
  transition-in-progress flag, not the steady state. The FTB command (`0B003C` press/release) is
  fine; only the feedback address is wrong.

  **Block reads work** — confirmed 2026-09-04. `RQH:030200,000030;` via the raw command action
  returned all 48 bytes. That is a capability we did not have before and it also unblocks the
  name-reading and poll-reduction ideas below.

  **Have (FTB off, settled):**

  ```
  030200 = 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
           00 01 00 00 00 02 01 00 00 00 00 00 00 00 00 00
           00 00 00 00 00 00 00 00 01 01 00 00 00 00
  ```

  **Need (one command):** the same read with **FTB engaged and settled** — black on air, fade
  finished — then diff. Whichever byte differs is the steady FTB state. Enable "Show advanced
  actions" in the connection config, add "Send raw LAN command", command string
  `RQH:030200,000030;`.

  If the differing byte is not in this block, widen the search: `RQH:030000,000040;` and
  `RQH:030100,000060;` cover the neighbouring blocks.

  Fallback if that stalls: capture RCS while toggling FTB there. RCS clearly knows the state, and
  that route already produced `0A0800`, the capture sequence and the tally answer.

Do not delete those doc entries until each has been re-tested from the panel on 0.6.4 or later.

**Still unknown: whether `030207` is the right FTB address.** It could not be tested while polling
was dead. If `DTH 030207=...` never appears in the debug log once polling works, find the real one
by toggling FTB and diffing the `030200` block, which the device dumps as 48 bytes
(`010F7F0000...` with FTB off).

### Watchdog timings tightened — needs verification

Reported as slow on hardware: ~10s to notice a disconnection. That matched the arithmetic exactly —
8s of receive silence checked on a 2.5s tick, worst case 10.5s. Now: 1s tick, nudge a quiet link at
1.5s, give up at 4s, so detection lands around 4-5s. Auth stall 10s to 6s, unreachable recycle 20s
to 12s. Needs the same cable-pull and firewall-block tests as before to confirm no spurious
reconnects, particularly with polling turned off, where the 1.5s nudge is what keeps the link alive.

### AUX Link — resolved 2026-09-04

The FOLLOW buttons appeared to do nothing because **the mode gates them**. With `AUX Linked PGM`
(`020114`) set to Off there is no AUX link at all, so `020115` / `020116` have nothing to enable.
Set the mode to Auto Link or Manual Link first and the follow buttons work. Confirmed on hardware.

Addresses and values were correct all along; no code change was needed for the fix itself.

**Auto Link vs Manual Link** (reference manual p. 159). Identical while the link is intact — they
differ only in how the link is restored after being broken by a manual AUX source selection:

- Auto Link: restored automatically at the next transition (AUTO/CUT).
- Manual Link: restored only by re-selecting the currently active AUX source. Survives transitions.

Operational consequence, now in HELP: under Auto Link a `Set AUX Source` action from Companion is
temporary and the next CUT or AUTO undoes it. Manual Link is usually the right mode for a show file
that drives AUX from buttons.

**Preset layout, corrected after testing.** Three separate buttons, not a cycle:
`AUX LINK OFF` sets the mode to Off outright; `AUX LINK AUTO` and `AUX LINK MANUAL` each toggle -
press to select that mode, press again to return to Off. Each lights on its own mode. The two
FOLLOW buttons stay as toggles.

The mode name deliberately does **not** come from a variable: a preset cannot know the connection's
label, and hardcoding one is the bug 0.6.0 fixed in the FTB preset. `src/presets.ts` should contain
no `$(...)` at all.

**One code change came out of the diagnosis.** `cmdSetAuxLinkedPgmBus` no longer sets local state
optimistically — the value comes only from the poll, so the button reports what the device says
rather than what we sent. The optimistic version would have lit the button even while the mode was
Off and the write was doing nothing, which is what made this hard to see.

### Image Capture — working, presets to be redesigned

Confirmed on hardware 2026-09-04 with the four-command sequence in 0.6.4:
`0A0501` slot, `0A0504,03` arm, `0A0500` source, `0A0504,07` execute. The 800ms wait after arming
holds up in practice. The old fourteen-command version was replaying the device's own status
replies back at it; do not reinstate `0A0504` values `04`, `05`, `08`, `0A` or `00` as commands.

**Open, and Jay's call:** the preset layout. Currently Still 1-8 with HDMI In 1 hardcoded as the
source, which is a placeholder rather than a design. Jay is thinking about what the buttons should
actually be. Nothing to do until he says.

### Findings banked from the RCS captures, not yet acted on

- **Source and still names are readable.** `0220xx` returns 8-byte ASCII: `022000` = "HDMI 1", `022400` = "SDI 1", `022800` onward = "Still 1", "Still 2" ... So dropdowns and button labels could carry the operator's own names instead of fixed text. Worth doing; needs a decoder for ASCII payloads, which `parseDth` cannot do today (it truncates to the first byte).
- **The device does push state unprompted, extensively.** After every capture it dumps its entire parameter set — `000000` through `600xxx`, bracketed by `0E0001,01` and `0E0002`. That answers the long-standing "does it push without polling" question: it does, but as a full reload rather than per-parameter deltas. Whether that could replace or reduce the 500ms poll is worth investigating, though it would need the multi-byte parser above.
- **`0B00xx` panel switches work on the V-80HD.** RCS sends `0B002A` press/release pairs (`01` then `00`, ~10ms apart) throughout. Function unidentified, but it confirms the press/release mechanism the V-160HD uses, which is the route to assignable pads if one is ever needed.
- **`0E0000`** is a 1 Hz keepalive both directions; **`030604`** a 1 Hz clock counter. Neither is state.

---

## Closed — remove at next review

- Docs claimed FTB had no feedback. It has had one since 0.6.0; README and HELP corrected.
- HELP.md was still titled v0.4.0. Corrected.
- 625 prettier violations. Fixed; lint and format both clean.
