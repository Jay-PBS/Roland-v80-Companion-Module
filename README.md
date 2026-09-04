# companion-module-roland-v80hd

Bitfocus Companion module for the Roland V-80HD Direct Streaming Video Switcher.

Developed and maintained by Purple Badger Solutions.
Contact: projects@purplebadgersolutions.co.uk
Repository: https://github.com/Jay-PBS/companion-module-roland-v80hd

This module is currently in beta. It has been tested on physical hardware and is provided for evaluation. Use in production environments is at the operator's own discretion and risk.

Current version: 0.6.5

---

## Supported Hardware

| Hardware      | Firmware Tested |
| ------------- | --------------- |
| Roland V-80HD | v1.20.201       |

---

## Feature Status

| Feature                             | Status                                     |
| ----------------------------------- | ------------------------------------------ |
| CUT, AUTO, Fade To Black            | Confirmed working                          |
| Transition Type Mix and Wipe        | Confirmed working                          |
| Mix and Wipe Time                   | Confirmed working                          |
| Wipe Pattern and Direction          | Confirmed working                          |
| Program Source routing              | Confirmed working                          |
| Preview Source routing              | Confirmed working                          |
| Input Assign slots 1 to 8           | Confirmed working                          |
| AUX 1 and 2 Source routing          | Confirmed working                          |
| AUX Linked PGM                      | Confirmed working                          |
| AUX Layer PinP and Key control      | Confirmed working                          |
| Split 1 and 2                       | Confirmed working                          |
| PinP and Key Source                 | Confirmed working                          |
| PinP PGM and PVW On, Off, Toggle    | Confirmed working                          |
| PinP Window Position H and V        | Confirmed working                          |
| PinP Window Size                    | Confirmed working                          |
| PinP Window Cropping H and V        | Confirmed working                          |
| PinP View Position H and V          | Confirmed working                          |
| PinP View Zoom                      | Confirmed working                          |
| DSK Source, PGM, PVW                | Confirmed working                          |
| Audio Input Mute all channels       | Confirmed working                          |
| Main Bus Mute                       | Confirmed working                          |
| AUX Bus Mute                        | Confirmed working                          |
| Feedback for all polled state       | Confirmed working                          |
| Test Patterns 12 patterns           | Confirmed working                          |
| Fade To Black feedback              | Confirmed working — added in 0.6.0         |
| Wipe Pattern and Direction feedback | Confirmed working — added in 0.6.0         |
| AUX Linked PGM feedback             | Confirmed working — added in 0.6.0         |
| AUX Linked PGM per-bus follow       | Confirmed working — added in 0.6.3         |
| AUX Linked PGM presets              | Confirmed working — added in 0.6.3         |
| Per-channel audio mute variables    | Confirmed working — added in 0.6.0         |
| Per-input freeze variables          | Confirmed working — added in 0.6.0         |
| Audio mute feedback via panel       | Confirmed working                          |
| Transition type feedback via panel  | Partial                                    |
| Stream & Record start/stop          | Confirmed working — added in 0.6.4         |
| Stream & Record state feedback      | Fixed in 0.6.5 — awaiting verification     |
| Image Capture to Still              | Confirmed working — added in 0.6.4         |
| Tally feedbacks                     | Confirmed working — added in 0.6.4         |
| Audio level control                 | Mute only by design — raise a GitHub issue |

---

## Connection Requirements

The V-80HD requires a network password to be configured before LAN control will function. This is set on the device itself via Menu, Network, Network Password. The same password must be entered in the Companion module connection settings.

The device IP address can be found at Menu, Network, LAN Setup.

Default port: 8023

Note: the V-80HD applies a brute-force lockout after repeated failed password attempts, and will reject even a correct password while the lockout is active. If this happens the module reports "Device auth lockout — wait and retry". Wait for the device to clear the lockout before reconnecting.

---

## Polling and Feedback

State is polled every 500ms. Feedback updates may lag up to 500ms behind operations performed on the panel.

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

---

## Known Issues

Fade To Black feedback is unreliable. It lights while the fade is running rather than while Fade To Black is engaged, because it reads a transition-in-progress flag rather than the steady state. Under investigation.

Audio mute feedback may not update when mutes are changed directly on the panel. This was previously documented as a device limitation; it is more likely to have been the polling fault fixed in 0.6.4 and needs re-testing.

The Stream & Record actions may start a livestream, not only a recording. On the V-80HD the livestream, audio recording and video recording all start and stop together and cannot be triggered separately; only whether each one occurs is separately configurable, and only on the unit itself under Menu, Stream&Record. If Live Streaming is enabled there, the module's Start action begins a livestream — the unit supports RTMP and RTMPS to YouTube Live, Facebook Live and Twitch as well as custom RTMP and SRT destinations. Check the device's Stream&Record settings before assigning this to a button.

Scene Memory control is not provided and is not planned.

Audio control is limited to mute on purpose. The V-80HD exposes full audio control over LAN — input levels, bus levels and the rest — and it does work, but the front-panel level knobs are not motorised, so a level set from Companion cannot be reflected on the unit and the two will silently disagree. Mute is the only audio control the module surfaces.

If you want the advanced audio controls, please raise an issue on GitHub (https://github.com/Jay-PBS/companion-module-roland-v80hd/issues). They are not planned otherwise, as the effort is hard to justify without someone who actually needs them.

---

## Changelog

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

- Stream Start and Stop
