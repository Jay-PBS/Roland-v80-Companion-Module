# Changelog

Every release of the Roland V-80HD Companion module, newest first. The [README](README.md) has the
short version; this is the full record, including why things changed.

Not every version below is a commit. Only 0.4.0, 0.6.0, 0.6.5, 0.7.0, 0.8.2, 0.8.4, 0.8.5, 0.8.6, 0.8.7 and
0.8.8 were ever committed; the rest — 0.6.1 to 0.6.4, 0.8.0, 0.8.1 and 0.8.3 — were local builds that
went straight to hardware, so their entries record what changed rather than something you can check
out. Tags exist for `v0.4.0`, `v0.6.5` and `v0.8.5`, which are the states worth returning to.

### 1.0.0 — first stable release

**Every action, feedback, variable and preset has been tested on a V-80HD** (firmware v1.20.201), and
0.9.0–0.9.2 passed their hardware checks on 2026-09-25. No protocol or id changes since 0.9.2, so
buttons built on any 0.9.x version carry straight over.

- **Muted bus buttons use black text.** The dark red #990000 on lavender was hard to read at a
  distance, at about 2.7:1; black on the same #8080FF is about 6.4:1. Drop the Audio presets again
  to pick it up.
- **HELP.md corrected on polling off.** The Program source keeps updating, about every 1.5 seconds,
  because the connection watchdog reads it. Everything else stops until **Sync state now** is pressed.

### 0.9.2 — preset text size corrected

**0.9.1's 24pt faces arrived at 40.** Companion's newer button editor measures Text Size as a
percentage of the button height and scales a preset's size by 5/3 on the way in, so the 24 the
module sent became 40. Presets now send 14, which the editor shows as 23.3 — confirmed on the surface. Presentation only; nothing else changed.

### 0.9.1 — preset faces, second pass

**Presentation only, like 0.9.0.** No ids, protocol or behaviour changed. Companion copies a preset's
face onto a button when you drop it, so buttons you have already built keep their old look — drop the
preset again to pick up the new one.

- **Every preset face was meant to be 24** — it arrived at 40; see 0.9.2.
- **The PiP enable buttons read `PiP 1` / `TOGGLE`**, not `PiP 1` / `EN`, because the button toggles.
  The preset names follow: `AUX1 PiP 1 Toggle` rather than `AUX1 PiP 1 Enable`.
- **The Image Capture buttons read `Capture` / `1`–`8`**, not `CAP`.
- **Bus mutes are lavender, not amber.** The Main, AUX 1 and AUX 2 mute buttons now read `MUTED`, and
  when muted they show #8080FF with dark red #990000 text. Added by hand, the `Main Bus – Muted` and
  `AUX Bus – Muted` feedbacks now default to #C0C0FF with black text. Per-channel input mutes stay
  amber.

### 0.9.0 — the aesthetic and consistency pass

**Presentation only. No protocol changes, no action or feedback ids changed, and no behaviour change
to any existing button.** Everything here is a display name, a button face or a default colour — all
of which Companion copies onto a button when you drop a preset rather than referencing, so nothing
you have already built moves.

**Feedback default colours now match the palette.** Every feedback's default style carried white text
on its bright background. 0.8.5 measured white against all seven brights at 1.53–3.96:1, under the
4.5 threshold, and moved the _presets_ to black — the feedback defaults never followed, so a feedback
added by hand still arrived with the combination 0.8.5 had rejected. All thirty now carry black.

**Action names follow one scheme.** The list is `Group – Name` throughout, and the stragglers have
been brought in:

- `PinP and Key` is now `PinP & Key` in the nine action names that used it, matching the feedbacks,
  the preset category and the panel, which all said `&` already
- `Stream & Record - Start` / `- Stop` and both Stream & Record feedbacks used a hyphen where the
  rest of the surface uses an en dash
- `Test Pattern All Outputs (toggle)` and `Test Pattern Off` are now `Test Pattern – All Outputs
(toggle)` and `Test Pattern – Off`
- `Set AUX Linked PGM` and `AUX Linked PGM mode (toggle)` are now `Set AUX Linked PGM – mode` and
  `Toggle AUX Linked PGM – mode`, so the mode pair reads the same way as the bus-follow pair
- `Sync state now` is now `Utility – Sync state now`, finishing what 0.8.6 started — that entry
  named this action as the one still sitting loose in the list

**PinP button faces are consistent.** The Aux categories wrote `PiP 1`, PinP & Key wrote `PiP1`.
All of them now read `PiP 1` and `PiP 2`, and the preset names follow — `AUX1 PiP 1 Always On` rather
than `AUX1 PiP1 AlwOn`.

Also in this release, from the pre-0.9 documentation sweep: twenty stale or self-contradicting
statements corrected across the source comments, `working_doc.md`, `CODE_REVIEW.md`, `PROTOCOL.md`,
this file and the CI workflow. Mostly claims overtaken by the Fade To Black answer on 2026-09-16 and
by the 0.8.8 capture-action removal. `TESTING.md` was left as written, with a pointer added to the
two findings later overturned.

### 0.8.13 — the FTB fade colour

The fade-in-progress feedback was borrowing the transition colour, which put purple on a button whose other state is red. It is now orange, and red is reserved for the one thing that matters on that button: the output is actually black.

Only a freshly dropped preset picks this up — an existing button keeps the styling it was created with.

**Confirmed on hardware:** Fade To Black now reports the engaged state correctly, including when it is driven from the V-80's own panel, and the fade flag clears on a dropped connection instead of sticking lit.

### 0.8.12 — the FTB button uses the engaged state

0.8.11 added the _Fade To Black – engaged_ feedback but left the FTB preset wired to _fade in progress_, so the button still lit for a second during the fade and went dark again while the output was black. The preset now carries both: the transition colour while the fade runs, then red for as long as the output is actually black.

**An FTB button you have already built will not change on its own.** Presets are copied onto a button when you drop them, not referenced, so an existing button keeps the feedback it was created with. Either add _Fade To Black – engaged_ to it by hand, or drop a fresh FTB preset from the Transitions category.

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

> **Partly superseded by 0.8.8.** The `Capture Mode – close if open` action referred to below was
> removed in 0.8.8, along with `Capture Mode (toggle)`. The entry is left as written.

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
