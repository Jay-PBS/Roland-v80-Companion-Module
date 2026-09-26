# Roland V-80HD — Companion Module v1.0.1

Tested on a Roland V-80HD with firmware v1.20.201. Every action and feedback has been tested on hardware.

---

## Connection Setup

1. On the V-80HD, navigate to Menu, Network, LAN Setup and note the IP address.
2. A network password must be configured on the device before LAN control will function. This is set via Menu, Network, Network Password on the unit itself.
3. In Companion, enter the device IP address, port 8023, and the password configured on the device. The module will not connect until the password is filled in.
4. Enable Allow advanced actions if you need the raw LAN command action. The action is always listed, but it refuses to send and logs a warning unless this is ticked.

---

## Network Behaviour

State polling is fixed at 500ms, and each address is requested individually — the device does not answer batched requests.

**The device answers only about 58% of those polls.** That is measured on hardware with no packet loss, so it is the unit's behaviour rather than a network fault. Most feedbacks still update within half a second; the gap between readings of a given value reaches 5 seconds at the 99th percentile and 6.5 at worst.

In practice this is invisible for steady states — sources, mutes, on-air flags — because the next reading corrects anything missed. It matters for brief events: a one-second fade can pass entirely between two readings of the same address.

**Polling is always on.** It is the only way the module reads state back from the device, which pushes nothing unprompted, so there is no setting to turn it off. **Utility – Sync state now** reads everything once, immediately, without waiting for the next poll.

A connection watchdog runs every second and recovers the link automatically:

- No data received for 4s while connected — the connection is rebuilt
- Authentication stalled for 6s — authentication is retried
- Socket unreachable for 12s — the socket is recycled

This covers silent network loss, where the socket remains open but the device is no longer reachable. If the module still does not reconnect, disable and re-enable it in Companion.

The V-80HD applies a brute-force lockout after repeated failed password attempts, and will reject even the correct password while that lockout is active. So the module never retries a password on its own. If the device rejects the password or reports the lockout, the module closes the connection and shows the reason in the connection status. It stays stopped until you save the connection config, or disable and re-enable the connection. After a lockout, wait for the device to clear it first.

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

- Set AUX Layer – PinP & Key — Disable, Enable, Always On, per layer per bus
- Toggle AUX Layer – PinP & Key between Disable and Enable
- Toggle AUX Layer – PinP & Key between Disable and Always On

### Split

- Split 1 (Vertical) and Split 2 (Horizontal) — On, Off, Toggle

**Split 1 is the vertical split; Split 2 is the horizontal split.** Confirmed against the panel on
2026-09-16. The device numbers them rather than naming them, so the orientation is carried in the
action names here.

### PinP & Key

- Set Source per layer — full source list
- PGM On, Off, Toggle per layer
- PVW On, Off, Toggle per layer
- Window Position H and V (-100 to +100%)
- Window Size (0 to 100%)
- Window Cropping H and V (0 to 100%) — 100% is no crop, 0% is fully cropped
- View Position H and V (-50 to +50%) — **raise View Zoom to see these work, see below**
- View Zoom (100 to 400%)

**View Position H and V only show their effect once View Zoom is raised.** At the default 100% zoom
the travel over the -50 to +50 span is too small to see, which is why these were recorded as "not
working" through two test sessions. Raise View Zoom first and the movement is obvious. Confirmed on
hardware 2026-09-15.

Everything in this section works, including Window Position. If a View Position button appears to do
nothing, check the zoom before anything else.

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

- Test Pattern – All Outputs (toggle) — 12 patterns, plus Test Pattern – Off

### Stream & Record

- Stream & Record – Start, Stop

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

Capture Image to Still is the only capture action. It opens the capture screen, takes the still and
closes the screen again by itself, so there is nothing to drive by hand.

**The target slot is overwritten without confirmation.** There is no undo.

**The button returns straight away.** The still is written in about a second, and the capture screen
then clears itself roughly seven seconds later with nothing further from you. Nothing to wait on, and
no button to press on the unit.

That seven-second wait is deliberate and cannot be shortened. Capture mode leaves its screen up on
the monitor, and the unit needs far longer than its own "capture done" reply suggests before it will
accept the press that dismisses it. Shorter waits were tried and broke the capture outright.

Do not fire two captures less than 7 seconds apart, or the first one's dismissal can land on the
second one's screen.

If the connection drops or the connection config is saved while a capture is running, the module
stops the capture rather than pressing buttons on the new connection, and logs a warning. Check the
still, and close the capture screen on the unit if it was left open.

### Utility

- Utility – Sync state now — forces an immediate poll

### Advanced

- Advanced – Send raw LAN command — always listed, but only sends when Allow advanced actions is ticked

There is a matching preset in its own **Advanced** preset category. It ships with an empty command
string, so fill the command in on the button after dropping it on a page. It is kept in a category
of its own so it is not picked up by accident while browsing the ordinary presets.

Several actions carry a fuller note or warning that appears once the action is on a button, above
its options — Send raw LAN command, Capture Image to Still, Stream & Record Start and Stop, Test
Pattern, and the two AUX Linked PGM actions. The ones that can do something you cannot take back —
Send raw LAN command, Capture Image to Still, and Stream & Record Start and Stop — also show a
one-line warning in the action list, before you pick them.

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
- Fade To Black – fade in progress, and Fade To Black – engaged

**Use _engaged_ for an FTB button.** It lights for as long as the output is black, however that
happened — from Companion, the V-80's panel, or the Roland RCS software. _Fade in progress_ lights
only during the one-second transition, which is why a button using it alone appears to flash and
then go dark while the output is still black.

The FTB preset in the Transitions category carries both, so a button dropped from it shows the
transition and then stays lit. **A button built before this will not update itself** — presets are
copied when dropped rather than linked, so add the _engaged_ feedback by hand or drop a fresh one.

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
| split1              | Split 1 Vertical state (ON or OFF)     |
| split2              | Split 2 Horizontal state (ON or OFF)   |
| aux_linked_pgm      | AUX Linked PGM mode                    |
| aux1_linked_pgm     | AUX 1 follows PGM (ON or OFF)          |
| aux2_linked_pgm     | AUX 2 follows PGM (ON or OFF)          |
| main_bus_mute       | Main bus mute state (ON or OFF)        |
| aux1_bus_mute       | AUX 1 bus mute state (ON or OFF)       |
| aux2_bus_mute       | AUX 2 bus mute state (ON or OFF)       |
| ftb                 | ENGAGED, CLEAR or UNKNOWN              |
| ftb_fading          | Fade in progress (ON or OFF)           |
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

- Polling is fixed at 500ms, but the device answers only about 58% of polls, so an individual feedback can occasionally take several seconds. See Network Behaviour.
- Livestreaming and recording cannot be started separately. The V-80HD drives both from one trigger (`0A0800`), so Stream & Record Start begins whichever of Live Streaming, Video Rec and Audio Rec are enabled in the unit's menu.
- Audio control is limited to mute by design. The device supports full audio control over LAN, but the front-panel level knobs are not motorised, so a level set from Companion could not be reflected on the unit. If you need the advanced audio controls, raise an issue on the project's GitHub.
- Scene Memory control is not provided.

---

## Troubleshooting

Module shows as disconnected — check the IP address, confirm port 8023, and ensure a network password has been set on the device via Menu, Network, Network Password.

Module reports authentication failed — the device rejected the password. Correct it in the connection config and save; the module does not retry a rejected password by itself.

Module reports a device auth lockout — the V-80HD has locked out after repeated failed password attempts and will reject even a correct password until it clears. Confirm the password matches the one set on the device, wait for the lockout to clear, then disable and re-enable the connection.

Feedbacks not updating — allow a few seconds rather than half a second, since the device does not answer every poll. If feedbacks remain static after that, disable and re-enable the connection.

AUX routing not responding as expected — confirm AUX Linked PGM is set to Off for independent AUX control.

PinP appearing on the wrong output — use the AUX Layer – PinP & Key actions to control PinP on the AUX bus independently. The PinP PGM Toggle action affects the main program output layer only.
