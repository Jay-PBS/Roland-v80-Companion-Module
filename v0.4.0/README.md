# companion-module-roland-v80hd

Bitfocus Companion module for the Roland V-80HD Direct Streaming Video Switcher.

Developed and maintained by Purple Badger Solutions.
Contact: projects@purplebadgersolutions.co.uk
Repository: https://github.com/Jay-PBS/Roland-v80-Companion-Module

This module is currently in beta. It has been tested on physical hardware and is provided for evaluation. Use in production environments is at the operator's own discretion and risk.

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
| Audio mute feedback via panel | Not working — panel-initiated mute changes are not reflected in feedback |
| Transition type feedback via panel | Partial — feedback responds to panel activity but state may be inconsistent |
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

---

## Polling and Feedback

State is polled every 500ms. Feedback updates may lag up to 500ms behind operations performed on the panel.

The module will attempt to reconnect automatically if the network connection is interrupted, typically within 10 seconds. If the module does not reconnect, disable and re-enable it in Companion.

---

## Variables

Variables are accessed as $(instance_label:variable_id).

Available variables include: program_input, preview_input, program_source, preview_source, aux1_input, aux2_input, aux1_source, aux2_source, transition_type, mix_time, wipe_type, wipe_direction, pinp1_pgm, pinp1_pvw, pinp2_pgm, pinp2_pvw, dsk_pgm, dsk_pvw, split1, split2, aux_linked_pgm, main_bus_mute, aux1_bus_mute, aux2_bus_mute, ftb, freeze, test_pattern.

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

Fade To Black does not have a button feedback in this version. The state is available via the ftb variable.

Audio mute feedback does not update when mutes are changed directly on the panel. This is a device behaviour limitation — the V-80HD does not send spontaneous state updates for audio mute changes.

Scene Memory Load and Save are implemented in code but not exposed in the current release. These will be available in a future version once fully tested.

---

## Roadmap

- Scene Memory presets
- Re-enable image capture
- Re-enable record once tested
- Stream Start and Stop
- Tally feedbacks
- Audio level control
