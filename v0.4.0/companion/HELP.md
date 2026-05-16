# Roland V-80HD — Companion Module v0.4.0

This module is currently in beta. It has been tested on physical hardware with firmware v1.20.201 and is provided for evaluation purposes. Use in production environments is at the operator's own discretion and risk.

Tested firmware: v1.20.201

---

## Connection Setup

1. On the V-80HD, navigate to Menu, Network, LAN Setup and note the IP address.
2. A network password must be configured on the device before LAN control will function. This is set via Menu, Network, Network Password on the unit itself.
3. In Companion, enter the device IP address, port 8023, and the password configured on the device.
4. Enable polling to keep feedbacks in sync with the device state.
5. Enable Show advanced actions to reveal the raw LAN command action.

---

## Network Behaviour

The module will reconnect automatically if the network connection is briefly interrupted. This typically takes around 10 seconds. If the module does not reconnect, disable and re-enable it in Companion.

State polling is fixed at 500ms. Feedback updates may lag up to 500ms behind operations performed directly on the panel.

---

## Supported Actions

### Transitions
- CUT, AUTO, Fade To Black
- Set Transition Type (Mix or Wipe)
- Set Mix and Wipe Time (0.0 to 4.0 seconds)
- Set Wipe Pattern (8 patterns)
- Set Wipe Direction (Normal, Reverse, Round Trip)

### Program and Preview
- Set Source — Inputs 1 to 8, HDMI 1 to 4, SDI 1 to 4, Stills 1 to 32, Video Player

### Input Assign
- Assign physical sources to crosspoint slots 1 to 8
- Available sources: HDMI 1 to 4, SDI 1 to 4, Stills 1 to 32, Video Player

### AUX
- Set AUX 1 and AUX 2 Source — full source list
- Set AUX Linked PGM (Off, Auto Link, Manual Link)
- Set AUX Layer PinP and Key — Disable, Enable, Always On, per layer per bus
- Toggle AUX Layer PinP and Key between Disable and Enable
- Toggle AUX Layer PinP and Key between Disable and Always On

### Split
- Split 1 and Split 2 — On, Off, Toggle

### PinP and Key
- Set Source per layer — full source list
- PGM On, Off, Toggle per layer
- PVW On, Off, Toggle per layer
- Window Position H and V (-100 to +100%)
- Window Size (0 to 100%)
- Window Cropping H and V (0 to 100%) — 100% is no crop, 0% is fully cropped
- View Position H and V (-50 to +50%)
- View Zoom (100 to 400%)

### DSK
- Set Source — full source list
- PGM On, Off, Toggle
- PVW On, Off, Toggle

### Audio
- Input Mute On, Off, Toggle per channel
- Main Bus Mute On, Off, Toggle
- AUX Bus Mute On, Off, Toggle

### Freeze
- Global Freeze On, Off, Toggle
- Per-input Freeze On, Off, Toggle (HDMI 1 to 4, SDI 1 to 4)

### Test Pattern
- All outputs — 12 patterns available plus Test Pattern Off

### Utility
- Sync state now — forces an immediate poll
- Send raw LAN command — visible when Show advanced actions is enabled

---

## Feedbacks

The following states are polled and drive feedbacks:

- Program and Preview source
- AUX 1 and AUX 2 source
- PinP 1 and 2 PGM and PVW state
- DSK PGM and PVW state
- Split 1 and 2 state
- AUX Layer PinP state (Enable and Always On per layer per bus)
- Global freeze state
- Per-input freeze state (HDMI 1 to 4, SDI 1 to 4)
- Audio mute state (main bus, AUX 1 bus, AUX 2 bus)
- Transition type (Mix or Wipe)
- Test pattern active

Note: Fade To Black does not have a feedback in this version. The FTB state is available as the variable $(instance_label:ftb) and can be displayed in a button label.

---

## Variables

The following variables are available for use in button labels and expressions:

| Variable | Description |
|---|---|
| program_input | Active program input number |
| preview_input | Active preview input number |
| program_source | Program source byte in hex |
| preview_source | Preview source byte in hex |
| aux1_input | AUX 1 active input number |
| aux2_input | AUX 2 active input number |
| aux1_source | AUX 1 source byte in hex |
| aux2_source | AUX 2 source byte in hex |
| transition_type | MIX or WIPE |
| mix_time | Transition time in milliseconds |
| wipe_type | Active wipe pattern name |
| wipe_direction | Wipe direction name |
| pinp1_pgm | PinP 1 PGM state (ON or OFF) |
| pinp1_pvw | PinP 1 PVW state (ON or OFF) |
| pinp2_pgm | PinP 2 PGM state (ON or OFF) |
| pinp2_pvw | PinP 2 PVW state (ON or OFF) |
| dsk_pgm | DSK PGM state (ON or OFF) |
| dsk_pvw | DSK PVW state (ON or OFF) |
| split1 | Split 1 state (ON or OFF) |
| split2 | Split 2 state (ON or OFF) |
| aux_linked_pgm | AUX Linked PGM mode |
| main_bus_mute | Main bus mute state (ON or OFF) |
| aux1_bus_mute | AUX 1 bus mute state (ON or OFF) |
| aux2_bus_mute | AUX 2 bus mute state (ON or OFF) |
| ftb | Fade To Black state (ON or OFF) |
| freeze | Global freeze state (ON or OFF) |
| test_pattern | Active test pattern name |

Variables are accessed as $(instance_label:variable_id), for example $(v80hd:program_input).

---

## Known Limitations

- Fade To Black does not have a button feedback in this version. The state is available via the ftb variable.
- Audio mute feedback does not update when mutes are changed directly on the panel. Changes made via Companion are reflected correctly.
- Transition type feedback responds to panel activity but may display in an unexpected state when operated from the panel directly.
- Polling is fixed at 500ms. Feedback updates may lag up to 500ms behind panel operations.
- Tally feedbacks are not yet implemented.
- Stream Start and Stop are not yet implemented.
- Audio level control is not yet implemented (mute only).
- Scene Memory Load and Save are planned for a future version.

---

## Troubleshooting

Module shows as disconnected — check the IP address, confirm port 8023, and ensure a network password has been set on the device via Menu, Network, Network Password.

Feedbacks not updating — confirm polling is enabled. Allow up to 500ms for the next poll cycle. If feedbacks remain static, disable and re-enable the module.

AUX routing not responding as expected — confirm AUX Linked PGM is set to Off for independent AUX control.

PinP appearing on the wrong output — use the AUX Layer PinP and Key actions to control PinP on the AUX bus independently. The PinP PGM Toggle action affects the main program output layer only.
