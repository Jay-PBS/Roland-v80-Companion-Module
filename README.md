# companion-module-roland-v80hd

Bitfocus Companion module for the Roland V-80HD Direct Streaming Video Switcher.

Developed and maintained by Purple Badger Solutions.
Contact: projects@purplebadgersolutions.co.uk
Repository: https://github.com/Jay-PBS/Roland-v80-Companion-Module

This module is currently in beta. It has been tested on physical hardware and is provided for evaluation. Use in production environments is at the operator's own discretion and risk.

Current version: 0.6.5

---

## Supported Hardware

| Hardware      | Firmware Tested |
| ------------- | --------------- |
| Roland V-80HD | v1.20.201       |

---

## Feature Status

| Feature                             | Status                                        |
| ----------------------------------- | --------------------------------------------- |
| CUT, AUTO, Fade To Black            | Confirmed working                             |
| Transition Type Mix and Wipe        | Confirmed working                             |
| Mix and Wipe Time                   | Confirmed working                             |
| Wipe Pattern and Direction          | Confirmed working                             |
| Program Source routing              | Confirmed working                             |
| Preview Source routing              | Confirmed working                             |
| Input Assign slots 1 to 8           | Confirmed working                             |
| AUX 1 and 2 Source routing          | Confirmed working                             |
| AUX Linked PGM                      | Confirmed working                             |
| AUX Layer PinP and Key control      | Confirmed working                             |
| Split 1 and 2                       | Confirmed working                             |
| PinP and Key Source                 | Confirmed working                             |
| PinP PGM and PVW On, Off, Toggle    | Confirmed working                             |
| PinP Window Position H and V        | Confirmed working                             |
| PinP Window Size                    | Confirmed working                             |
| PinP Window Cropping H and V        | Confirmed working                             |
| PinP View Position H and V          | Confirmed working                             |
| PinP View Zoom                      | Confirmed working                             |
| DSK Source, PGM, PVW                | Confirmed working                             |
| Audio Input Mute all channels       | Confirmed working                             |
| Main Bus Mute                       | Confirmed working                             |
| AUX Bus Mute                        | Confirmed working                             |
| Feedback for all polled state       | Confirmed working                             |
| Test Patterns 12 patterns           | Confirmed working                             |
| Fade To Black feedback              | Confirmed working — added in 0.6.0            |
| Wipe Pattern and Direction feedback | Confirmed working — added in 0.6.0            |
| AUX Linked PGM feedback             | Confirmed working — added in 0.6.0            |
| AUX Linked PGM per-bus follow       | Confirmed working — added in 0.6.3            |
| AUX Linked PGM presets              | Confirmed working — added in 0.6.3            |
| Per-channel audio mute variables    | Confirmed working — added in 0.6.0            |
| Per-input freeze variables          | Confirmed working — added in 0.6.0            |
| Audio mute feedback via panel       | Confirmed working                             |
| Transition type feedback via panel  | Partial                                       |
| Stream & Record start/stop          | Confirmed working — added in 0.6.4            |
| Stream & Record state feedback      | Fixed in 0.6.5 — awaiting verification        |
| Image Capture to Still              | Confirmed working — added in 0.6.4            |
| Capture Mode open/close             | New in 0.8.1 — `0B002A`, confirmed by capture |
| Tally feedbacks                     | Confirmed working — added in 0.6.3            |
| Audio level control                 | Mute only by design — raise a GitHub issue    |

---

## Connection Requirements

The V-80HD requires a network password to be configured before LAN control will function. This is set on the device itself via Menu, Network, Network Password. The same password must be entered in the Companion module connection settings.

The device IP address can be found at Menu, Network, LAN Setup.

Default port: 8023

Note: the V-80HD applies a brute-force lockout after repeated failed password attempts, and will reject even a correct password while the lockout is active. If this happens the module reports "Device auth lockout — wait and retry". Wait for the device to clear the lockout before reconnecting.

---

## Polling and Feedback

State is polled every 500ms. Feedback updates may lag up to 500ms behind operations performed on the panel.

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

## Build Instructions

```
cd \path\to\version\folder
yarn set version 4.12.0
yarn install
yarn build
yarn package
```

`companion/manifest.json` carries `"version": "0.0.0"` deliberately. `yarn package` injects the real
version from `package.json` into the packaged manifest and names the `.tgz` from it, so `package.json`
is the single place a release number is set.

The git pre-commit hook runs `lint-staged`. `.yarnrc.yml` sets `enableScripts: false`, inherited from
upstream, which stops the `postinstall: husky` script from installing the hook automatically — so
after a fresh clone run `yarn husky` once to enable it. Without that step commits are not linted.

---

## Known Issues

Fade To Black feedback is unreliable. It lights while the fade is running rather than while Fade To Black is engaged, because it reads a transition-in-progress flag rather than the steady state. Under investigation.

The Stream & Record actions may start a livestream, not only a recording. On the V-80HD the livestream, audio recording and video recording all start and stop together and cannot be triggered separately; only whether each one occurs is separately configurable, and only on the unit itself under Menu, Stream&Record. If Live Streaming is enabled there, the module's Start action begins a livestream — the unit supports RTMP and RTMPS to YouTube Live, Facebook Live and Twitch as well as custom RTMP and SRT destinations. Check the device's Stream&Record settings before assigning this to a button.

Scene Memory control is not provided and is not planned.

Audio control is limited to mute on purpose. The V-80HD exposes full audio control over LAN — input levels, bus levels and the rest — and it does work, but the front-panel level knobs are not motorised, so a level set from Companion cannot be reflected on the unit and the two will silently disagree. Mute is the only audio control the module surfaces.

If you want the advanced audio controls, please raise an issue on GitHub (https://github.com/Jay-PBS/Roland-v80-Companion-Module/issues). They are not planned otherwise, as the effort is hard to justify without someone who actually needs them.

---

## Changelog

### 0.8.2 — experimental

- **Capture screen close now waits 7 seconds**, up from 1.2s. Tested on hardware: the device holds the capture screen far longer than its own "capture done" reply suggests, and closing early either broke the capture (0.8.0, 500ms) or did nothing useful (0.8.1, 1200ms)

The close is still gated on the device's reported state, so it cannot open a screen that is shut. Because the wait is long, starting a second capture within 7 seconds can let the first close land on the second capture's screen — the gate keeps that to a closed screen rather than an opened one, and firing captures that fast is not a real workflow.

### 0.8.1 — experimental, awaiting hardware test

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

### 0.7.0 — experimental, awaiting hardware test

Everything in this release comes from the code review in `CODE_REVIEW.md`. It has passed lint, types, formatting, the manifest check and a set of scripted behaviour comparisons against 0.6.5, but **it has not yet been tested against a V-80HD**.

Behaviour changes to check on hardware:

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

- Fade To Black engaged state. `030207` is a fade-in-progress flag, not the engaged state — confirmed by capture — so the FTB feedback lights only while a fade runs. The address holding the steady state has not been identified yet.
