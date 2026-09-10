# Roland V-80HD — Companion Module v0.8.5

This module is currently in beta. It has been tested on physical hardware with firmware v1.20.201 and is provided for evaluation purposes. Use in production environments is at the operator's own discretion and risk.

Tested firmware: v1.20.201

---

## Connection Setup

1. On the V-80HD, navigate to Menu, Network, LAN Setup and note the IP address.
2. A network password must be configured on the device before LAN control will function. This is set via Menu, Network, Network Password on the unit itself.
3. In Companion, enter the device IP address, port 8023, and the password configured on the device.
4. Leave polling enabled. It is what keeps feedbacks in sync — see Network Behaviour for what turning it off costs.
5. Enable Allow advanced actions if you need the raw LAN command action. The action is always listed, but it refuses to send and logs a warning unless this is ticked.

---

## Network Behaviour

State polling is fixed at 500ms. Feedback updates may lag up to 500ms behind operations performed directly on the panel. Each polled address is requested individually — the device does not answer batched requests.

**Turning polling off does more than add lag.** Polling is the only thing that reads state back from the device, so with it disabled the module has no source of truth at all. Some actions update their own feedback locally when pressed — the mutes, the splits, PinP and DSK on air, freeze, test patterns, the AUX layer modes — and those keep working from Companion. Everything else has nothing to update it: PGM, PVW and AUX source selection, PinP and DSK sources, PinP geometry, AUX link follow, tally, and Stream & Record all freeze at whatever they last showed, and nothing done on the front panel or in RCS is seen at all. Disable polling only if you need the network traffic gone and can accept roughly half the feedbacks going stale.

A connection watchdog runs every second and recovers the link automatically:

- No data received for 4s while connected — the connection is rebuilt
- Authentication stalled for 6s — authentication is retried
- Socket unreachable for 12s — the socket is recycled

This covers silent network loss, where the socket remains open but the device is no longer reachable. If the module still does not reconnect, disable and re-enable it in Companion.

The V-80HD applies a brute-force lockout after repeated failed password attempts, and will reject even the correct password while that lockout is active. The module detects this and reports "Device auth lockout — wait and retry" rather than continuing to retry. Wait for the device to clear the lockout before reconnecting.

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
- Set AUX Linked PGM (Off, Auto Link, Manual Link) — this sets the link mode and is global
- Set AUX Linked PGM bus follow — chooses whether AUX 1 or AUX 2 follows PGM, and Toggle for the same

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
- View Position H and V (-50 to +50%) — **not finalized, see below**
- View Zoom (100 to 400%)

**View Position H and V are not finalized.** They showed no visible movement in hardware testing, but
it is not yet established whether the actions are at fault or whether the range they are given is too
small to shift the image noticeably. Everything else in this section works, including Window Position.
The actions are left in place rather than hidden so that settling this does not change anyone's button
layout. If you need view positioning before then, use the unit's own controls.

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

### Stream & Record

- Stream & Record Start, Stop

**This may start a livestream, not just a recording.** On the V-80HD the livestream, audio
recording and video recording all start and stop together and cannot be triggered separately.
Which of them actually happens is set on the unit under Menu, Stream&Record, using the Live
Streaming, Video Rec and Audio Rec settings. Those are device settings and cannot be changed
from Companion.

So if Live Streaming is enabled on the unit, Start begins a livestream. The V-80HD streams RTMP
and RTMPS to YouTube Live, Facebook Live and Twitch, plus custom RTMP destinations, and SRT to
other devices. Check the unit's Stream&Record settings before you assign this to a button.

The device reports its own Stream & Record state, so the feedback is accurate no matter what
started it — Companion, the front panel, or the Roland RCS software. Four states are reported:
Stopped, Starting, Running and Stopping. Starting and Stopping are brief and may be missed
between polls.

These actions were called Record in earlier versions. Existing buttons are migrated
automatically.

### Image Capture

- Capture Image to Still — captures the selected input into a still memory slot (1 to 32)
- Sources: HDMI In 1 to 4, SDI In 1 to 4, Video Player
- Capture Mode (toggle) — works the unit's CAPTURE IMAGE button, opening or closing the capture screen
- Capture Mode, close if open — closes the capture screen, and does nothing if it is not showing

The capture takes roughly 10 seconds and overwrites the target slot without confirmation. Most of
that is a deliberate 7-second wait: capture mode leaves its screen up on the monitor, and the unit
needs far longer than its own "capture done" reply suggests before it will accept the button press
that dismisses it. The action does that for you, so no button press on the unit is needed.

Do not fire two captures less than 7 seconds apart, or the first one's dismissal can land on the
second one's screen.

### Utility

- Sync state now — forces an immediate poll
- Send raw LAN command — always listed, but only sends when Allow advanced actions is ticked

---

## Feedbacks

The following states are polled and drive feedbacks:

- Program and Preview source
- AUX 1 and AUX 2 source
- AUX Linked PGM mode
- AUX Linked PGM per-bus follow (AUX 1 and AUX 2)
- PinP 1 and 2 PGM and PVW state
- DSK PGM and PVW state
- Split 1 and 2 state
- AUX Layer PinP state (Enable and Always On per layer per bus)
- Global freeze state
- Per-input freeze state (HDMI 1 to 4, SDI 1 to 4)
- Audio mute state (per input channel, main bus, AUX 1 bus, AUX 2 bus)
- Transition type (Mix or Wipe)
- Fade To Black active
- Wipe pattern and wipe direction
- Test pattern active
- Tally state per input (HDMI 1 to 4, SDI 1 to 4)
- Stream & Record active, and the specific state (Stopped, Starting, Running, Stopping)

Stream & Record state is polled with everything else. The device reports it on `030800`, but a
packet capture on 2026-09-04 showed it pushes that status only to the Roland RCS session and never
to ours, so the module asks for it on every cycle. The value still comes from the device's own
report rather than from what the module sent, so the feedback stays correct whether the stream was
started from Companion, the front panel or RCS.

Fade To Black, wipe pattern, wipe direction and AUX Linked PGM feedbacks were added in 0.6.0.
Tally feedbacks were added in 0.6.3, and Stream & Record state in 0.6.4.

### AUX Linked PGM

Two separate settings, and both must be right for anything to happen.

**Mode** (global): Off, Auto Link or Manual Link. Off means no AUX link at all.

**Per-bus follow** (AUX 1 and AUX 2): whether that bus follows PGM.

The mode gates the per-bus settings. With the mode set to Off, the follow buttons do nothing —
set the mode to Auto Link or Manual Link first.

Auto Link and Manual Link behave identically while the link is intact. They differ only in how the
link is restored after you break it, which you do in either mode by selecting an AUX source by hand:

- **Auto Link** — the link restores by itself at the next transition. Press AUTO or CUT and AUX
  goes back to following PGM.
- **Manual Link** — the link stays broken until you deliberately re-select the AUX source that is
  currently active. It survives transitions.

This matters when driving AUX from Companion. Under Auto Link, a Set AUX Source action is
temporary — the next CUT or AUTO undoes it. Under Manual Link it persists. If your buttons set AUX
sources directly, Manual Link is usually the mode you want.

### Tally

Tally PGM and Tally PST report which inputs the switcher itself says are on air. They read a
state register over the same LAN connection everything else uses, so they need nothing plugged
into the unit's tally port and work on a switcher with no tally hardware attached at all.

This is not the same as the Program feedbacks. Program reports which source is selected on the
PGM bus; tally reports what the switcher considers on air. Prefer tally when a source can reach
air through a PinP or DSK layer rather than the bus, and for direct HDMI and SDI sources, which
the Input 1 to 8 feedbacks deliberately do not light for.

---

## Variables

The following variables are available for use in button labels and expressions:

| Variable            | Description                            |
| ------------------- | -------------------------------------- |
| program_input       | Active program input number            |
| preview_input       | Active preview input number            |
| program_source      | Program source byte in hex             |
| preview_source      | Preview source byte in hex             |
| aux1_input          | AUX 1 active input number              |
| aux2_input          | AUX 2 active input number              |
| aux1_source         | AUX 1 source byte in hex               |
| aux2_source         | AUX 2 source byte in hex               |
| transition_type     | MIX or WIPE                            |
| mix_time            | Transition time in milliseconds        |
| wipe_type           | Active wipe pattern name               |
| wipe_direction      | Wipe direction name                    |
| pinp1_pgm           | PinP 1 PGM state (ON or OFF)           |
| pinp1_pvw           | PinP 1 PVW state (ON or OFF)           |
| pinp2_pgm           | PinP 2 PGM state (ON or OFF)           |
| pinp2_pvw           | PinP 2 PVW state (ON or OFF)           |
| dsk_pgm             | DSK PGM state (ON or OFF)              |
| dsk_pvw             | DSK PVW state (ON or OFF)              |
| split1              | Split 1 state (ON or OFF)              |
| split2              | Split 2 state (ON or OFF)              |
| aux_linked_pgm      | AUX Linked PGM mode                    |
| aux1_linked_pgm     | AUX 1 follows PGM (ON or OFF)          |
| aux2_linked_pgm     | AUX 2 follows PGM (ON or OFF)          |
| main_bus_mute       | Main bus mute state (ON or OFF)        |
| aux1_bus_mute       | AUX 1 bus mute state (ON or OFF)       |
| aux2_bus_mute       | AUX 2 bus mute state (ON or OFF)       |
| ftb                 | FADING while a fade runs, else IDLE    |
| freeze              | Global freeze state (ON or OFF)        |
| test_pattern        | Active test pattern name               |
| stream_record       | Stream & Record active (ON/OFF)        |
| stream_record_state | Stopped, Starting, Running or Stopping |

Per-channel audio mute variables, added in 0.6.0. Each reports ON or OFF:

| Variable                         | Channel        |
| -------------------------------- | -------------- |
| mute_audio_in_1                  | Audio In 1     |
| mute_audio_in_2                  | Audio In 2     |
| mute_audio_in_34                 | Audio In 3/4   |
| mute_usb_in                      | USB In         |
| mute_bluetooth_in                | Bluetooth In   |
| mute_audio_player                | Audio Player   |
| mute_hdmi_in_1 to mute_hdmi_in_4 | HDMI In 1 to 4 |
| mute_sdi_in_1 to mute_sdi_in_4   | SDI In 1 to 4  |
| mute_video_player                | Video Player   |

Per-input freeze variables, added in 0.6.0. Each reports ON or OFF:

| Variable                       | Input       |
| ------------------------------ | ----------- |
| freeze_hdmi_1 to freeze_hdmi_4 | HDMI 1 to 4 |
| freeze_sdi_1 to freeze_sdi_4   | SDI 1 to 4  |

Tally variables. Each reports OFF, PGM or PST:

| Variable                     | Input       |
| ---------------------------- | ----------- |
| tally_hdmi_1 to tally_hdmi_4 | HDMI 1 to 4 |
| tally_sdi_1 to tally_sdi_4   | SDI 1 to 4  |

Variables are accessed as $(instance_label:variable_id), for example $(v80hd:program_input).

---

## Known Limitations

- Fade To Black feedback lights while the fade is running rather than while Fade To Black is engaged. Under investigation.
- Polling is fixed at 500ms. Feedback updates may lag up to 500ms behind panel operations.
- Livestreaming and recording cannot be started separately. The V-80HD drives both from one trigger (`0A0800`), so Stream & Record Start begins whichever of Live Streaming, Video Rec and Audio Rec are enabled in the unit's menu.
- Audio control is limited to mute by design. The device supports full audio control over LAN, but the front-panel level knobs are not motorised, so a level set from Companion could not be reflected on the unit. If you need the advanced audio controls, raise an issue on the project's GitHub.
- Scene Memory control is not provided.

---

## Troubleshooting

Module shows as disconnected — check the IP address, confirm port 8023, and ensure a network password has been set on the device via Menu, Network, Network Password.

Module reports a device auth lockout — the V-80HD has locked out after repeated failed password attempts and will reject even a correct password until it clears. Confirm the password matches the one set on the device, then wait before retrying.

Feedbacks not updating — confirm polling is enabled. Allow up to 500ms for the next poll cycle. If feedbacks remain static, disable and re-enable the module.

AUX routing not responding as expected — confirm AUX Linked PGM is set to Off for independent AUX control.

PinP appearing on the wrong output — use the AUX Layer PinP and Key actions to control PinP on the AUX bus independently. The PinP PGM Toggle action affects the main program output layer only.
