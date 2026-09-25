# companion-module-roland-v80hd

Bitfocus Companion module for the Roland V-80HD Direct Streaming Video Switcher, controlled over LAN.

- **Released module:** [bitfocus/companion-module-roland-v80hd](https://github.com/bitfocus/companion-module-roland-v80hd) — report issues with released versions here
- **Development repository:** [Jay-PBS/Roland-v80-Companion-Module](https://github.com/Jay-PBS/Roland-v80-Companion-Module) — may contain untested work; use the release for shows. Report issues with development builds here

Developed and maintained by Purple Badger Solutions — projects@purplebadgersolutions.co.uk

**Version 1.0.1.** Every feature is tested on a V-80HD (firmware v1.20.201).

---

## Features

- **Switching** — CUT, AUTO, Fade To Black; Mix and Wipe with time, pattern and direction
- **Routing** — Program, Preview, AUX 1 and 2, Input Assign slots 1–8, AUX Linked PGM with per-bus follow
- **PinP & Key** — source, PGM/PVW on-off-toggle, window position, size and cropping, view position and zoom, AUX layer control
- **Split 1 and 2, DSK** — source, PGM and PVW
- **Audio** — mute for every input channel, the main bus and both AUX buses
- **Freeze, test patterns, Stream & Record, Image Capture to Still**
- **Feedback** — polled state for all of the above, including tally for every physical input (no tally cable needed) and whether Fade To Black is engaged
- **Variables and presets** for everything above

The full list of actions, feedbacks and variables is in [companion/HELP.md](companion/HELP.md).

---

## Setup

1. On the V-80HD, set a network password under **Menu → Network → Network Password**. LAN control
   will not work without one.
2. Find the unit's IP address under **Menu → Network → LAN Setup**.
3. In Companion, add the connection with that IP, port **8023** and the same password.

Repeated wrong passwords trigger the device's lockout, which rejects even the right password until it
clears. The module reports "Device auth lockout — wait and retry"; wait before reconnecting.

---

## Good to know

- **Feedback usually updates within half a second, but sometimes takes a few seconds.** The device
  answers only about 58% of polls. A very brief event can be missed. See HELP.md, Network Behaviour.
- **Stream & Record Start may start a livestream.** The V-80HD starts streaming and recording from
  one trigger. What actually happens depends on the unit's Stream&Record menu, so check that
  before putting it on a button.
- **PinP View Position is only visible once View Zoom is raised.**
- **Transition type feedback is partial.** It can show the wrong state after the transition is
  changed on the front panel.
- **Audio control is mute only, by design.** The front-panel level knobs are not motorised, so a
  level set from Companion would silently disagree with the unit. Level control and metering could
  be added on request — [raise an issue](https://github.com/bitfocus/companion-module-roland-v80hd/issues).
- **Scene Memory is not supported.**
- **Existing buttons keep their look.** Companion copies a preset's style when you drop it, so
  preset changes in a new version only show on freshly dropped presets.

---

## Install

The module is intended for Companion's module store. To install a specific build, run
`yarn package` (see [DEVELOPMENT.md](DEVELOPMENT.md)) and load the `.tgz` under **Settings → Module
store → Install from file**. Then point the connection at the new version and check the version
Companion reports.

---

## More

| Document                               | What's in it                                                 |
| -------------------------------------- | ------------------------------------------------------------ |
| [companion/HELP.md](companion/HELP.md) | Every action, feedback and variable; troubleshooting         |
| [CHANGELOG.md](CHANGELOG.md)           | Every release, with the reasoning behind each change         |
| [PROTOCOL.md](PROTOCOL.md)             | The V-80HD LAN protocol as established by packet capture     |
| [DEVELOPMENT.md](DEVELOPMENT.md)       | Building, packaging and releasing                            |
| [CONTRIBUTING.md](CONTRIBUTING.md)     | Reporting bugs; why unsolicited pull requests are not merged |
