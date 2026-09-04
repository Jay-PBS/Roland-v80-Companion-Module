# companion-module-roland-v80hd

Bitfocus Companion module for the Roland V-80HD Direct Streaming Video Switcher.

Developed and maintained by Purple Badger Solutions.
Contact: projects@purplebadgersolutions.co.uk
Repository: https://github.com/Jay-PBS/Roland-v80-Companion-Module

This module is currently in beta. It has been tested on physical hardware and is provided for evaluation. Use in production environments is at the operator's own discretion and risk.

Current version: 0.6.0

---

## Supported Hardware

| Hardware | Firmware Tested |
|---|---|
| Roland V-80HD | v1.20.201 |

---

## Feature Status

| Feature | Status |
|---|---|
| CUT, AUTO, Fade To Black | Confirmed working |
| Transition Type Mix and Wipe | Confirmed working |
| Mix and Wipe Time | Confirmed working |
| Wipe Pattern and Direction | Confirmed working |
| Program Source routing | Confirmed working |
| Preview Source routing | Confirmed working |
| Input Assign slots 1 to 8 | Confirmed working |
| AUX 1 and 2 Source routing | Confirmed working |
| AUX Linked PGM | Confirmed working |
| AUX Layer PinP and Key control | Confirmed working |
| Split 1 and 2 | Confirmed working |
| PinP and Key Source | Confirmed working |
| PinP PGM and PVW On, Off, Toggle | Confirmed working |
| PinP Window Position H and V | Confirmed working |
| PinP Window Size | Confirmed working |
| PinP Window Cropping H and V | Confirmed working |
| PinP View Position H and V | Confirmed working |
| PinP View Zoom | Confirmed working |
| DSK Source, PGM, PVW | Confirmed working |
| Audio Input Mute all channels | Confirmed working |
| Main Bus Mute | Confirmed working |
| AUX Bus Mute | Confirmed working |
| Feedback for all polled state | Confirmed working |
| Test Patterns 12 patterns | Confirmed working |
| Fade To Black feedback | Confirmed working — added in 0.6.0 |
| Wipe Pattern and Direction feedback | Confirmed working — added in 0.6.0 |
| AUX Linked PGM feedback | Confirmed working — added in 0.6.0 |
| Per-channel audio mute variables | Confirmed working — added in 0.6.0 |
| Per-input freeze variables | Confirmed working — added in 0.6.0 |
| Audio mute feedback via panel | Confirmed working |
| Transition type feedback via panel | Partial |
| Record | Planned — pending hardware testing |
| Image Capture to Still | Planned — pending investigation |
| Scene Memory Load and Save | Planned — future version |
| Tally feedbacks | Planned — requires hardware tally output for testing |
| Stream Start and Stop | Planned — requires further protocol analysis |
| Audio level control | Planned |

---

## Connection Requirements

The V-80HD requires a network password to be configured before LAN control will function. This is set on the device itself via Menu, Network, Network Password. The same password must be entered in the Companion module connection settings.

The device IP address can be found at Menu, Network, LAN Setup.

Default port: 8023

Note: the V-80HD applies a brute-force lockout after repeated failed password attempts, and will reject even a correct password while the lockout is active. If this happens the module reports "Device auth lockout — wait and retry". Wait for the device to clear the lockout before reconnecting.

---

## Polling and Feedback

State is polled every 500ms. Feedback updates may lag up to 500ms behind operations performed on the panel.

From 0.6.0 each poll cycle is sent as a single batched TCP write rather than one write per address, reducing a full cycle from 52 packets to 1.

A connection watchdog runs every 2.5s and recovers the link automatically:

| Condition | Action |
|---|---|
| No data received for 8s while connected | Rebuild the connection |
| Authentication stalled for 10s | Retry authentication |
| Socket unreachable for 20s | Recycle the socket |

This handles silent network loss, where the socket stays open but the device is no longer reachable. If the module still does not reconnect, disable and re-enable it in Companion.

---

## Variables

Variables are accessed as $(instance_label:variable_id).

Core variables: program_input, preview_input, program_source, preview_source, aux1_input, aux2_input, aux1_source, aux2_source, transition_type, mix_time, wipe_type, wipe_direction, pinp1_pgm, pinp1_pvw, pinp2_pgm, pinp2_pvw, dsk_pgm, dsk_pvw, split1, split2, aux_linked_pgm, main_bus_mute, aux1_bus_mute, aux2_bus_mute, ftb, freeze, test_pattern.

Per-channel audio mute variables (added in 0.6.0): mute_audio_in_1, mute_audio_in_2, mute_audio_in_34, mute_usb_in, mute_bluetooth_in, mute_audio_player, mute_hdmi_in_1 to mute_hdmi_in_4, mute_sdi_in_1 to mute_sdi_in_4, mute_video_player.

Per-input freeze variables (added in 0.6.0): freeze_hdmi_1 to freeze_hdmi_4, freeze_sdi_1 to freeze_sdi_4.

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

Audio mute feedback does not update when mutes are changed directly on the panel. This is a device behaviour limitation — the V-80HD does not send spontaneous state updates for audio mute changes.

Transition type feedback responds to panel activity but may display in an unexpected state when operated from the panel directly.

Scene Memory Load and Save are implemented in code but not exposed in the current release. These will be available in a future version once fully tested.

---

## Changelog

### 0.6.0
- Password is sent once on the device prompt instead of twice, removing a stray ERR:0 and a retry loop that could trigger the device auth lockout
- Rejected passwords are now detected and reported as a device lockout instead of looping
- Connection watchdog added — rebuilds dead connections after 8s of receive silence, retries stalled authentication after 10s, and recycles unreachable sockets after 20s
- TCP send rejections are caught so a failed write can no longer stop the module
- Each poll cycle is batched into a single TCP write (52 packets to 1)
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

- Scene Memory presets
- Re-enable image capture
- Re-enable record once tested
- Stream Start and Stop
- Tally feedbacks
- Audio level control
