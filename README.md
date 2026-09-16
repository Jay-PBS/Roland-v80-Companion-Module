# companion-module-roland-v80hd

Bitfocus Companion module for the Roland V-80HD Direct Streaming Video Switcher.

Developed and maintained by Purple Badger Solutions.
Contact: projects@purplebadgersolutions.co.uk
**Released module:** https://github.com/bitfocus/companion-module-roland-v80hd
**Development repository:** https://github.com/Jay-PBS/Roland-v80-Companion-Module

The Bitfocus repository is the released module and where **all issues and discussions belong**.
This repository is where development happens, including experimental work that is not fit to run
a show on. Pulling from here means you may be running something mid-change; pull the release if
you want a version that has been through hardware testing.

This module is currently in beta. It has been tested on physical hardware and is provided for evaluation. Use in production environments is at the operator's own discretion and risk.

Current version: 0.8.11

---

## Supported Hardware

| Hardware      | Firmware Tested |
| ------------- | --------------- |
| Roland V-80HD | v1.20.201       |

---

## Feature Status

| Feature                             | Status                                      |
| ----------------------------------- | ------------------------------------------- |
| CUT, AUTO, Fade To Black            | Confirmed working                           |
| Transition Type Mix and Wipe        | Confirmed working                           |
| Mix and Wipe Time                   | Confirmed working                           |
| Wipe Pattern and Direction          | Confirmed working                           |
| Program Source routing              | Confirmed working                           |
| Preview Source routing              | Confirmed working                           |
| Input Assign slots 1 to 8           | Confirmed working                           |
| AUX 1 and 2 Source routing          | Confirmed working                           |
| AUX Linked PGM                      | Confirmed working                           |
| AUX Layer PinP and Key control      | Confirmed working                           |
| Split 1 and 2                       | Confirmed working                           |
| PinP and Key Source                 | Confirmed working                           |
| PinP PGM and PVW On, Off, Toggle    | Confirmed working                           |
| PinP Window Position H and V        | Confirmed working                           |
| PinP Window Size                    | Confirmed working                           |
| PinP Window Cropping H and V        | Confirmed working                           |
| PinP View Position H and V          | Working — raise View Zoom to see it         |
| PinP View Zoom                      | Confirmed working                           |
| DSK Source, PGM, PVW                | Confirmed working                           |
| Audio Input Mute all channels       | Confirmed working                           |
| Main Bus Mute                       | Confirmed working                           |
| AUX Bus Mute                        | Confirmed working                           |
| Feedback for all polled state       | Confirmed working                           |
| Test Patterns 12 patterns           | Confirmed working                           |
| Fade To Black feedback              | Confirmed working — engaged state in 0.8.11 |
| Wipe Pattern and Direction feedback | Confirmed working — added in 0.6.0          |
| AUX Linked PGM feedback             | Confirmed working — added in 0.6.0          |
| AUX Linked PGM per-bus follow       | Confirmed working — added in 0.6.3          |
| AUX Linked PGM presets              | Confirmed working — added in 0.6.3          |
| Per-channel audio mute variables    | Confirmed working — added in 0.6.0          |
| Per-input freeze variables          | Confirmed working — added in 0.6.0          |
| Audio mute feedback via panel       | Confirmed working                           |
| Transition type feedback via panel  | Partial                                     |
| Stream & Record start/stop          | Confirmed working — added in 0.6.4          |
| Stream & Record state feedback      | Confirmed working — verified 2026-09-08     |
| Image Capture to Still              | Confirmed working — added in 0.6.4          |
| Capture screen close after capture  | Confirmed working on hardware — 0.8.3       |
| Tally feedbacks                     | Confirmed working — added in 0.6.3          |
| Audio level control                 | Mute only by design — raise a GitHub issue  |

---

## Connection Requirements

The V-80HD requires a network password to be configured before LAN control will function. This is set on the device itself via Menu, Network, Network Password. The same password must be entered in the Companion module connection settings.

The device IP address can be found at Menu, Network, LAN Setup.

Default port: 8023

Note: the V-80HD applies a brute-force lockout after repeated failed password attempts, and will reject even a correct password while the lockout is active. If this happens the module reports "Device auth lockout — wait and retry". Wait for the device to clear the lockout before reconnecting.

---

## Polling and Feedback

State is polled every 500ms, but the device answers only about 58% of those polls — measured on hardware, with no packet loss. So a typical feedback updates within half a second and the occasional one takes several: the gap between readings of a given value runs to 5 seconds at the 99th percentile and 6.5 at worst. Steady states like source selection or mute are unaffected in practice. A brief transient can be missed entirely.

Polling is the module's only source of truth, so the "Enable polling" option costs more than lag when it is turned off. Actions that update their own feedback locally — mutes, splits, PinP and DSK on air, freeze, test patterns, AUX layer modes — keep working from Companion. The rest have nothing to update them: PGM, PVW and AUX source selection, PinP and DSK sources, PinP geometry, AUX link follow, tally and Stream & Record all freeze at their last value, and panel or RCS activity is not seen at all.

Each polled address is requested as its own TCP write. 0.6.0 batched the whole cycle into a single write as a traffic optimisation; packet capture showed the device does not answer batched requests at all, which silently disabled every polled feedback. Batching was removed in 0.6.4.

A connection watchdog runs every second and recovers the link automatically:

| Condition                               | Action                 |
| --------------------------------------- | ---------------------- |
| No data received for 4s while connected | Rebuild the connection |
| Authentication stalled for 6s           | Retry authentication   |
| Socket unreachable for 12s              | Recycle the socket     |

This handles silent network loss, where the socket stays open but the device is no longer reachable. If the module still does not reconnect, disable and re-enable it in Companion.

---

## Variables

Variables are accessed as $(instance_label:variable_id).

Core variables: program_input, preview_input, program_source, preview_source, aux1_input, aux2_input, aux1_source, aux2_source, transition_type, mix_time, wipe_type, wipe_direction, pinp1_pgm, pinp1_pvw, pinp2_pgm, pinp2_pvw, dsk_pgm, dsk_pvw, split1, split2, aux_linked_pgm, main_bus_mute, aux1_bus_mute, aux2_bus_mute, ftb, freeze, test_pattern.

Per-channel audio mute variables (added in 0.6.0): mute_audio_in_1, mute_audio_in_2, mute_audio_in_34, mute_usb_in, mute_bluetooth_in, mute_audio_player, mute_hdmi_in_1 to mute_hdmi_in_4, mute_sdi_in_1 to mute_sdi_in_4, mute_video_player.

Per-input freeze variables (added in 0.6.0): freeze_hdmi_1 to freeze_hdmi_4, freeze_sdi_1 to freeze_sdi_4.

Added in 0.6.3: aux1_linked_pgm, aux2_linked_pgm, and tally_hdmi_1 to tally_hdmi_4, tally_sdi_1 to tally_sdi_4.

---

## Installing a prebuilt module

Build it yourself — see [Build Instructions](#build-instructions) below. It takes one command once the toolchain is in place, and `yarn package` writes a `.tgz` you install in Companion via Settings, Module store, Install from file.

**Built packages are no longer committed to this repository.** They are build artifacts and do not belong in source control. From 1.0 each release will carry its `.tgz` as a GitHub Release asset, and the module is intended for the Companion module store, which is where most people should get it.

Whichever route you use, **confirm the version Companion reports after installing**. Companion caches modules by version number, so reinstalling the same version number over itself will silently keep running the old code.

## Build Instructions

Build on **Node 22**. `.nvmrc` pins 22.20.0, and `companion/manifest.json` declares
`runtime.type: node22` — the newest runtime the Companion manifest schema allows. The only valid
values are node16, node18, node20 and node22, so 22 is a ceiling rather than a preference.

```
cd \path\to\version\folder
nvm use            # or: nvm install 22.20.0 && nvm use 22.20.0
corepack enable    # restores yarn, which a Node switch removes
yarn install
yarn preflight
```

Companion runs the module in its own embedded runtime, not the Node you build with, so
`runtime.type` decides execution. Building on the matching major keeps the two aligned.

Built `.tgz` files are gitignored and none is committed, so a rebuild never shows up as a repository change. **Bump the version in `package.json` before packaging anything you intend to test** — Companion caches modules by version number, so rebuilding under a number it has already seen will leave it running the old code with no indication anything is wrong.

`companion/manifest.json` carries `"version": "0.0.0"` deliberately. `yarn package` injects the real
version from `package.json` into the packaged manifest and names the `.tgz` from it, so `package.json`
is the single place a release number is set.

### Before releasing a version

```
yarn preflight
```

That is the gate. It formats, applies auto-fixable lint, builds, and packages, in that order, and
stops at the first failure. Run it and commit whatever it tidies before tagging or publishing a
build, so a release is never the first time the full chain has been exercised.

`.yarnrc.yml` sets `enableScripts: false`, inherited from upstream. That is deliberate and worth
keeping: it stops dependency `postinstall` scripts executing on install, which is a well-known
supply-chain vector. The side effect is that this project's own `postinstall: husky` does not run
either, so the `lint-staged` pre-commit hook does not self-install on a fresh clone.

That is fine. The hook only formats staged files and auto-fixes lint — a strict subset of
`yarn preflight`, with no build, type-check or package step. It is a convenience, not a safety net,
and nothing depends on it. Run `yarn husky` once if you want it; skip it if you would rather nothing
rewrote files during a commit.

---

## Known Issues

PinP is fully functional. All eight geometry actions are confirmed working on hardware, along with source selection and PGM and PVW on, off and toggle.

**View Position H and V need View Zoom raised before you can see them work.** They were recorded as producing no visible movement across two test sessions, and the explanation turned out to be observational rather than a fault: the travel over the -50 to +50 span is small at default zoom. Raise View Zoom first and the movement is plainly visible. Confirmed on hardware 2026-09-15. If you are evaluating these actions, change zoom before concluding anything.

**Fade To Black now reports the engaged state, as of 0.8.11.** There are two feedbacks: _fade in progress_, which lights while a fade runs, and _engaged_, which lights while the output is actually black — however it was engaged, from Companion, the panel or the Roland RCS software.

This was the longest-standing open question in the project and the answer was not where anyone was looking. `030207` is a transition flag and the engaged state is in no address at all: packet capture across three engage / hold / release cycles moved exactly that one byte, block reads return nothing, and the device pushes nothing to a second control session. The state is readable only through `QFTB`, a command from Roland's separate mnemonic command set, which turns out to work over the same connection alongside the address protocol.

Transition type feedback is partial. It follows the module and responds to panel activity, but driving the transition from the front panel directly can leave it showing an unexpected state. Not a show-stopper, and the root cause is not yet established. It is on the list for the next session with hardware.

Two authentication behaviours could not be tested. The window between connecting and the device accepting a password is under 100ms, which is too short to press a button inside by hand, so the "command sent during authentication" cases could not be exercised by any method available during the 2026-09-08 run. They are neither passing nor failing — untested. Reaching them needs an automated harness rather than an operator.

There is no known EXIT or MENU command. Nothing in the documented command set backs out of an on-screen menu, and none was found by packet capture. This blocks nothing today — the Image Capture screen is closed by a different route that is confirmed working — but a general-purpose way to leave a menu would be useful. Reports welcome.

The Stream & Record actions may start a livestream, not only a recording. On the V-80HD the livestream, audio recording and video recording all start and stop together and cannot be triggered separately; only whether each one occurs is separately configurable, and only on the unit itself under Menu, Stream&Record. If Live Streaming is enabled there, the module's Start action begins a livestream — the unit supports RTMP and RTMPS to YouTube Live, Facebook Live and Twitch as well as custom RTMP and SRT destinations. Check the device's Stream&Record settings before assigning this to a button.

Scene Memory control is not provided and is not planned.

Audio control is limited to mute on purpose. The V-80HD exposes full audio control over LAN — input levels, bus levels and the rest — and it does work, but the front-panel level knobs are not motorised, so a level set from Companion cannot be reflected on the unit and the two will silently disagree. Mute is the only audio control the module surfaces.

Audio level metering is not implemented either, though the device does supply it. The unit pushes meter data unprompted on three registers — `0F0000`, `0F0300` and `0F0600`, most likely Main, AUX 1 and AUX 2 — as 36-byte payloads in L/R pairs, arriving only while audio is present and without any polling. Turning that into Companion variables would need a multi-byte payload decoder the module does not currently have, so it is recorded rather than built.

If you want the advanced audio controls or the level meters, please raise an issue on GitHub (https://github.com/bitfocus/companion-module-roland-v80hd/issues). They are not planned otherwise, as the effort is hard to justify without someone who actually needs them.

---

## Changelog

Not every version below is a commit. Only 0.4.0, 0.6.0, 0.6.5, 0.7.0, 0.8.2, 0.8.4, 0.8.5, 0.8.6, 0.8.7 and
0.8.8 were ever committed; the rest — 0.6.1 to 0.6.4, 0.8.0, 0.8.1 and 0.8.3 — were local builds that
went straight to hardware, so their entries record what changed rather than something you can check
out. Tags exist for `v0.4.0`, `v0.6.5` and `v0.8.5`, which are the states worth returning to.

### 0.8.11 — Fade To Black finally reports whether the output is black

**Fade To Black now has two feedbacks: _fade in progress_ and _engaged_.** The second is the one this project has been chasing since the beginning — it lights while the output is actually black, however it got there: from Companion, from the V-80's own panel, or from the Roland RCS software.

The reason it took so long is that the search assumed the state was an address, and it is not one. `030207` turned out to be a transition flag; block reads return nothing; three engage-and-hold cycles captured at the packet level moved exactly one byte out of the sixty-four polled, and that byte was `030207` again; and the device pushes nothing to a second control session. Every route through the address protocol was closed. The state was readable the whole time through `QFTB`, a command from Roland's separate mnemonic command set — which turns out to work over the same connection, alongside the address protocol. That is worth knowing beyond this one feature.

**Breaking: `$(v80hd:ftb)` now reads `ENGAGED`, `CLEAR` or `UNKNOWN`**, where it previously read `FADING` or `IDLE`. A button expression testing `= "FADING"` will stop matching — use the new `$(v80hd:ftb_fading)`, which is `ON` or `OFF`. Companion can migrate variable ids but not their values, so this one cannot be handled automatically. The `Fade To Black – fade in progress` feedback keeps its id and its meaning, so existing buttons using it are unaffected.

**A fade interrupted by a dropped connection no longer sticks.** Nothing was cleared when the link went down, so a fade in flight left the feedback lit indefinitely. The fade flag now clears; the engaged state deliberately does not, because the switcher keeps doing whatever it was doing and the last known value is more accurate than discarding it.

**Corrected: feedback latency is not "up to 500ms".** The device answers only about 58% of polls — measured on hardware, with no packet loss, so it is the unit's own behaviour. Most feedbacks still update within half a second, but the gap between readings of a given value reaches 5 seconds at the 99th percentile and 6.5 at worst. Steady states are unaffected in practice; a brief transient can be missed entirely. README and HELP said otherwise in four places.

### 0.8.10 — PinP preset tidy-up, and a note that would have saved two test sessions

**The four duplicate PinP geometry presets are gone.** There were six, not four: two already sat correctly under PinP & Key, and the other four were AUX-scoped copies in Aux 1 and Aux 2 that emitted byte-for-byte identical commands. They had to be identical — PinP geometry belongs to the layer, and there is no per-AUX geometry in the protocol at all, so the AUX scoping those presets implied did not exist. Aux 1 and Aux 2 now hold only genuinely AUX-scoped presets.

**The two survivors are renamed from Layout to Reset.** "Layout" implied a stored arrangement being recalled, and the device has no layout store — Scene Memory is the only store-and-recall and it is whole-scene. What these buttons do is write eight fixed geometry values, which is a reset to a default box. Existing buttons are unaffected: presets are copied when dropped, not referenced.

**Both View Position actions now carry a note explaining what they do.** View Position moves the image inside the PinP window; Window Position moves the window itself. That is not obvious from the names, and at the default 100% zoom the travel over the -50 to +50 range is too small to see — which is why View Position was recorded as a defect across two hardware sessions before anyone raised the zoom. The note says to raise View Zoom first.

### 0.8.9 — capture no longer errors, one line per action, four fixes

**Image capture no longer writes an error to the log.** The capture always worked, but the action awaited its own 7-second screen dismissal, so it did not resolve for about 8.5 seconds and Companion timed it out with a stack trace every time. The dismissal now runs detached and the action returns in about 1.3 seconds. Nothing about what reaches the device changed — same four commands, same timings, same ungated two-press exit.

**The browse action list is one line per action.** The second line made it hard to scan, and the browse list's job is to help you find an action rather than explain it. Nine descriptions are gone; four of them — Mix/Wipe Time, Set AUX Layer PinP, and both Window Croppings — moved into a `Note` block that appears on the button, where you are actually configuring the thing. `Advanced – Send raw LAN command` keeps its one-line warning, because a wrong command there can crash the unit and that earns a caution before the action is picked.

**Freeze On, Off and Toggle now behave identically.** Only Toggle updated the feedback locally, so `freeze_active` responded differently depending on which of the three actions was on the button. All three now share one path.

**The state burst at connect no longer goes out twice.** The device sends both readiness markers in one exchange and each one triggered a full 64-command state request, so every connection opened with 128 writes and logged "Connection ready" twice. Reported by `iibaranov-IG`.

**The raw LAN command action now reports both directions at info level** — `Raw TX:` and `Raw RX [Nb]:`. It is an expert tool behind its own config gate, and the only reason to use it is to see what the device does; hiding that behind a second debug checkbox cost three hardware sessions. The byte count matters: replies are truncated to their first byte everywhere else, so this is the only place a 48-byte block read is distinguishable from a 1-byte one.

**PinP View Position works.** It was recorded as broken across two test sessions and it is not — the travel over the -50 to +50 span is simply too small to see at default zoom. Raise View Zoom first. README and HELP corrected.

**Also:** `PROTOCOL.md` added at the repository root — a public reference for the V-80HD's LAN control protocol, covering transport, framing, the full address map, encodings, device behaviour, dead ends and open questions, with every claim marked by how it is known.

### 0.8.8 — fewer capture actions, and shorter descriptions throughout

**Breaking: two actions were removed.** `Capture Mode (toggle)` and `Capture Mode – close if open` are gone. `Capture Image to Still` already opens the capture screen, takes the still and closes the screen again by itself, so the hand-driven pair were redundant surface area on a screen that is easy to leave open by accident. Any button built on either one will show as an unknown action and needs deleting by hand — Companion's upgrade API can remap an action id but has no way to remove an action from a button, and there is no surviving action to remap these to. Same call as `record_toggle` in 0.6.4.

Pruned alongside them: `cmdCloseCaptureScreen()` in `src/api.ts`, which had no callers left. **`cmdToggleCaptureMode()` was deliberately kept** — it looks orphaned once both its actions go, but `cmdCaptureImage` reaches it through `cmdExitCaptureFunction`, and it is the only thing that emits `0B002A`. Removing it would have broken image capture entirely. The `0A0504` handler stays too: nothing gates on it now, but it still carries the "Image capture complete" log.

- **Six more actions moved to the one-line description pattern** introduced in 0.8.7 — both AUX Linked PGM actions, Capture Image to Still, Stream & Record Start and Stop, and Test Pattern. The detail now appears on the button, above the options, instead of filling the browse list
- **Stream & Record keeps its hazard in the browse list.** It is the one action where that text is doing safety work, since firing Start can put a stream on air, so the short line names the risk rather than merely being brief. The full warning is unchanged, just relocated
- **Capture Image to Still now carries the 7-second caution on the button**, where it is actually needed. It was previously only in the help file

### 0.8.7 — Aux preset categories, and a shorter action description

Presentation only. No protocol changes, no action or feedback ids changed, and no behaviour change to any existing button.

- **The `AUX 1`, `AUX 2` and `AUX Link` preset categories are now `Aux 1`, `Aux 2` and `Aux Link`.** Companion sorts preset categories with a case-sensitive comparison where uppercase beats lowercase, so `AU` sorted above both `Ad` and `Au` — the three AUX categories sat above `Advanced` and `Audio` and read as though the list was broken. Title-casing them drops the whole A-block into proper alphabetical order: `Advanced, Audio, Aux 1, Aux 2, Aux Link`
- **`Advanced – Send raw LAN command` now shows one line in the action browse list.** The warning and worked example moved into a `static-text` option, which Companion renders only once the action is on a button

Only the preset **category** labels changed. Preset names and button faces (`AUX1 3`, `AUX LINK OFF`), the action and feedback names, and the `AUX 1` / `AUX 2` dropdown labels are all untouched — the categories are browse-time grouping that Companion does not retain once a preset is dropped onto a button, so nothing needed an upgrade script.

A module cannot vary a description by context: `CompanionActionDefinition` carries one `description` string and it is serialized once. A `static-text` option is the only way to show more on the configured action than in the browse list, and there is no way to do the reverse.

### 0.8.6 — raw LAN command moved to Advanced

Housekeeping only. No protocol changes and no behaviour change to any existing button.

- **`Send raw LAN command` is now listed as `Advanced – Send raw LAN command`.** It now carries the same `Group – Name` prefix the rest of the list uses, so it reads as its own Advanced block rather than sitting loose next to `Sync state now`. It is still defined last in `actions.ts`
- **It has a preset, in a new `Advanced` preset category of its own.** The button ships with an empty command string to fill in after dropping it on a page. Nothing else lives in that category, so it is not picked up by accident while browsing the ordinary presets

The action id is unchanged (`raw_command`), so buttons already built against it are unaffected — the rename is the display name only. "Allow advanced actions" still gates whether the command is actually sent.

### 0.8.5 — clearer active and inactive buttons

The first release merged to `main` after a full hardware run. Everything from 0.7.0 and the 0.8.x line is in it.

- **Active and inactive button states are now clearly different.** Every same-hue pair in the preset palette sat between 1.7:1 and 2.3:1 background contrast, against the 3:1 where a state change reads at a glance — the palette paired Tailwind 700 with 500, only two steps apart. All seven pairs now sit at roughly 4:1
- **Active states carry black text.** White failed on every bright colour in the palette (1.53–3.96 against the 4.5 threshold) while black passes on all of them, so a lit button used to be _harder_ to read rather than easier

Each new deep is the bright colour scaled down in RGB, so the hue is preserved exactly and an inactive button still reads as "the red one" instead of going near-black and losing its colour coding. Contrast figures are WCAG relative luminance.

`working_doc.md` was also cut from 357 lines to 136, removing six sections of finished work that the hardware run confirmed.

### 0.8.4 — presets and wording

- **The Stream & Record buttons now read `REC & STREAM`** rather than `STREAM`, so it is obvious from the button face that recording starts alongside the stream. One trigger drives both on this unit
- `Capture Image to Still` is described as taking 10 seconds rather than 1.5, which is what it now takes — most of it is the 7-second hold before the capture screen is dismissed

No protocol changes.

### 0.8.3 — confirmed working on hardware, 2026-09-08

**The 0.8.x line and the whole 0.7.0 code review have now been tested on a V-80HD.** The run passed with no regressions against 0.6.5: the password migration worked with no re-entry, every action, feedback, variable and preset category checked out, and a 30-minute soak was clean. Two PinP geometry actions were outstanding at the time — View Position H and V showed no visible movement. **Resolved 2026-09-15: they work, and the travel is only visible once View Zoom is raised.** It was an observation problem, not a fault.

- **Image Capture now clears its own screen, confirmed on hardware.** Exiting the capture function is two presses of `[CAPTURE IMAGE]` 300ms apart, ungated, after a 7-second wait

What it took, in case it ever regresses: the address had to be right (`0B002A`), the wait had to be long (7s, not 0.5s or 1.2s), the gate had to go, **and** it had to be two presses rather than one. Each of those was necessary on its own; 0.8.0 through 0.8.2 each had one of them wrong.

Why the gate went: `cmdCloseCaptureScreen()` only fired if the device had pushed `0A0504,01`, which happens when the screen is _toggled_. The module's own capture sequence gets `04`/`08`/`0A` back instead, so the close was almost certainly never firing at all in 0.8.1 or 0.8.2 — which is consistent with 1200ms and 7000ms behaving identically on hardware. One press was not enough either, so the screen left behind by a capture is evidently not the same single toggle RCS drives from idle.

The capture sequence now logs whether it fired and what the device reported the screen as, so the next run diagnoses itself without another packet capture.

The standalone `Capture Mode – close if open` action keeps its gate — that one is driven by hand, where the toggle behaviour is exactly what was confirmed by capture.

### 0.8.2 — superseded by 0.8.3

- **Capture screen close now waits 7 seconds**, up from 1.2s. Tested on hardware: the device holds the capture screen far longer than its own "capture done" reply suggests, and closing early either broke the capture (0.8.0, 500ms) or did nothing useful (0.8.1, 1200ms)

The close is still gated on the device's reported state, so it cannot open a screen that is shut. Because the wait is long, starting a second capture within 7 seconds can let the first close land on the second capture's screen — the gate keeps that to a closed screen rather than an opened one, and firing captures that fast is not a real workflow.

### 0.8.1 — superseded by 0.8.3

Fixes 0.8.0, which broke Image Capture on hardware. Builds on 0.7.0, also untested. Read both sets of notes below.

- **Image Capture works again, and now closes its own screen.** 0.8.0 sent a guessed panel-switch address (`0B003A`) 500ms after the capture executed, which broke the capture outright. The address was wrong and the timing was too early
- **New actions: Capture Mode (toggle) and Capture Mode – close if open.** These work the unit's `[CAPTURE IMAGE]` button
- **Removed the EXIT action added in 0.8.0.** It did not do what it claimed — see below

**There is no EXIT command, and 0.8.0 was wrong to claim one.** Roland documents no way to work the menu remotely: the LAN interface is only `DTH`/`RQH`/`VER` over the SysEx map, and Panel Lock (`020300`–`020347`) is lock state rather than presses — it omits `[MENU]`, `[EXIT]`, `[ENTER]` and the `[VALUE]` knob entirely. Nothing found since changes that.

What was actually found is narrower and more useful. **`0B002A` is the `[CAPTURE IMAGE]` panel switch**, confirmed by packet capture against RCS on 2026-09-08 over 16 open/close cycles: RCS sends the same press/release pair to both open and close the still-capture screen, and the device answers `0A0504,01` or `0A0504,00` within ~60ms every time. It is a **toggle**, so sending it blind when the screen is shut opens it.

That is why the capture flow gates on state rather than firing it: the module now tracks the screen from the device's own `0A0504` `00`/`01` push, and `Capture Image to Still` closes the screen only if the device says it is up. A capture that leaves no screen behind is left alone, and a screen opened from the panel is still closed correctly.

Two claims made in the 0.8.0 notes were wrong and are withdrawn:

- **The device does not report physical panel presses.** Ten panel presses of `[CAPTURE IMAGE]` produced no `0B0400` frames at all — only `0A0504` state. The `0B0400` frames in the older logs are something else, so "press the button with Wireshark running and read the address" does not work
- **One press, not two.** RCS sends a single press/release pair per action. The doubled send in 0.8.0 solved a problem that did not exist

### 0.7.0 — code review, tested on hardware in the 0.8.3 run

Everything in this release comes from the code review in `CODE_REVIEW.md`. It shipped untested and was finally put on hardware as part of the 0.8.3 run on 2026-09-08, where it passed.

Behaviour changes, all since confirmed:

- **The device password now lives in Companion's secrets store** rather than the plaintext config store, where it was previously saved next to the IP address and sent back to the web UI in the clear. An upgrade script moves an existing password across automatically, so no re-entry should be needed. This is the change most worth watching on first connect
- **Commands are refused until authentication completes.** Pressing a button during the "Connecting — Authenticating" window previously wrote a command into a session still waiting for the password, risking the device's brute-force lockout. Such presses are now dropped with a warning in the log
- **Data arriving in the same packet as the password prompt is no longer thrown away**, and an overflowing receive buffer is discarded with a warning instead of being sliced through the middle of a frame
- **Send raw LAN command is always listed.** It used to be registered only while "Show advanced actions" was ticked, so unticking it left any button using it in an unknown-action state. The checkbox now gates whether the command is sent, and is renamed "Allow advanced actions"
- Audio channels are named consistently between actions and feedbacks. The feedback dropdown previously showed `audio in 34` where the action showed `Audio In 3/4`

No behaviour change, but touched:

- The 57-method pass-through layer in `main.ts` is gone; actions call the API directly. `main.ts` drops from 364 lines to 189
- Every duplicated choice list has a single source in `api.ts`. The eight physical inputs were written out five times, wipe patterns and directions three times each, and the 41-entry Input Assign list is now derived from the source list rather than retyped. The protocol address maps stay written out but are now tied to the canonical list at compile time
- `presets.ts` comment damage repaired — a duplicated and truncated AUX Link block, a Stream & Record header sitting above the Test Pattern presets, and a stale "Image Capture — suspended" note above the live implementation
- Four documentation statements corrected that contradicted the code, including HELP.md claiming Stream & Record is not polled and that Stream Start/Stop is unimplemented
- Both docs now state what disabling polling actually costs: roughly half the feedbacks stop updating rather than merely lagging
- `tsconfig.json` now extends `tsconfig.build.json`, so the editor, linter and build agree on module resolution
- `.github/workflows/node.yaml` and `.husky/pre-commit` restored. The commit hook had never run
- `manifest.json` version returns to `0.0.0`; the build injects the real version from `package.json`

### 0.6.5

- Stream & Record state feedback fixed. The `030800` status register is now polled; it had been parsed but never requested, and the device does not push status to our session even when we issue the command, so the feedback never lit
- Stream & Record Toggle removed. Start and Stop only
- AUX Link presets are now OFF, AUTO and MANUAL as three separate buttons. AUTO and MANUAL each toggle back to Off when pressed while already active
- Fade To Black feedback renamed to "fade in progress", which is what it actually reports. `030207` pulses while a fade runs and returns to zero once it settles, whether the result is black or live. The address for the engaged state has not been identified
- Transition type feedback removed from Known Issues — confirmed working on hardware, it was the polling fault fixed in 0.6.4
- Tally, mix and wipe feedback, Stream & Record start/stop, and Image Capture all confirmed working on hardware

### 0.6.4

- **Fixed: no polled feedback had worked since 0.6.0.** The batched poll write introduced in 0.6.0 is ignored by the device. Packet capture showed 17,220 requests sent as batched writes returning 21 replies in total, all of them answers to the watchdog's separate single-command nudge. Polling is back to one command per write
- Disconnection is now detected in about 4 seconds rather than up to 10.5. The watchdog ticks every 1s instead of 2.5s, nudges a quiet link at 1.5s and gives up at 4s
- AUX Linked PGM per-bus follow no longer updates its own state optimistically, so the feedback reports what the device says rather than what was sent
- AUX Link presets are OFF, AUTO and MANUAL as separate buttons. AUTO and MANUAL each toggle back to Off when pressed while active
- Presets added for Stream & Record (toggle, start, stop), Image Capture (Still 1 to 8) and Tally (one button per physical input, red on PGM, green on PST)
- Stream & Record start/stop rewritten to `0A0800`, confirmed by packet capture against the Roland RCS software over four on/off cycles. The previous `03020F` address did not appear in that capture at all, so record almost certainly did not work as shipped in 0.6.3
- Stream & Record state feedback and variables added, reading the `030800` status register. The feedback tracks the panel and RCS as well as Companion, and reports Stopped, Starting, Running or Stopping
- Record actions renamed to Stream & Record, since the trigger starts livestreaming and recording together. Existing buttons are migrated automatically
- Stream Start and Stop removed from the roadmap — it is the same trigger, not a separate feature

### 0.6.3

- Tally feedbacks and variables added, reading the switcher's own tally register over LAN (`0C0000`-`0C0007`, HDMI In 1-4 and SDI In 1-4). No tally cable required
- Image Capture to Still restored, with the `0A0504` step sequence corrected back to the order confirmed by packet capture
- Record on and off restored, with a record-active feedback
- AUX Linked PGM per-bus follow added (`020115` / `020116`) with actions, feedback and variables. The module previously set the link mode but had no way to choose which AUX bus follows PGM, so Manual Link mode was not configurable
- AUX Linked PGM presets added — three mode buttons (Off, Auto, Manual) plus a per-bus follow toggle for AUX 1 and AUX 2
- Scene Memory control removed. It had not been implemented since the TypeScript rewrite despite the docs claiming otherwise
- Documentation corrected throughout: tally does not need a tally cable, Scene Memory was never implemented in 0.6.0, and audio level control is a deliberate omission rather than an outstanding gap

Note: 0.6.2 was built but superseded before it reached hardware, and 0.6.1 was skipped entirely. The branch carrying the upstream sync is named for 0.6.1, but no 0.6.1 build was ever produced.

### 0.6.0

- Password is sent once on the device prompt instead of twice, removing a stray ERR:0 and a retry loop that could trigger the device auth lockout
- Rejected passwords are now detected and reported as a device lockout instead of looping
- Connection watchdog added — rebuilds dead connections after 8s of receive silence, retries stalled authentication after 10s, and recycles unreachable sockets after 20s
- TCP send rejections are caught so a failed write can no longer stop the module
- Each poll cycle is batched into a single TCP write (52 packets to 1) — **this broke all polled feedback, see 0.6.4**
- Fixed false PGM and PVW input feedbacks when a still or direct source is on a bus
- Added Fade To Black, wipe pattern, wipe direction and AUX Linked PGM feedbacks
- Added per-channel audio mute and per-input freeze variables
- Fixed a hardcoded connection label in the FTB preset
- Stricter audio mute address matching and a shared input freeze address map

### 0.4.0

- First tagged release. Baseline feature set as listed above.

Note: versions 0.4.1 and 0.4.2 were local test builds only and were never tagged or published. There was no 0.5 release.

---

## Roadmap
