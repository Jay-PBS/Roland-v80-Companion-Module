# Roland V-80HD — LAN Control Protocol

A working reference for controlling a Roland V-80HD over its LAN CONTROL port, written from the
implementation and packet captures behind the
[Bitfocus Companion module](https://github.com/Jay-PBS/Roland-v80-Companion-Module).

**This is not Roland documentation.** It records what was established by driving a real V-80HD and
by capturing the traffic Roland's own RCS software sends it. Where Roland's published specification
and observed behaviour disagree, observed behaviour is what is written down here — and said to be
such.

|                               |                                            |
| ----------------------------- | ------------------------------------------ |
| **Device**                    | Roland V-80HD                              |
| **Firmware verified against** | v1.20.201                                  |
| **Transport**                 | TCP, port 8023                             |
| **Scope**                     | The `DTH`/`RQH` parameter-address protocol |

> **A note on scope.** Roland also publishes a separate _Basic control commands_ set — mnemonic
> commands such as `VFL:1024;` — which shares the same LAN and RS-232 transport but is a completely
> different command language. This module does not use it and it is not covered here. If you are
> holding a document full of `Q`-prefixed mnemonics, you are reading about the other one.

## How to read this document

Every factual claim carries a marker saying how it is known. This is the whole point of the
document: a protocol reference that tells you which parts have been on a bench and which have not.

| Marker          | Meaning                                                         |
| --------------- | --------------------------------------------------------------- |
| **Confirmed**   | Exercised against a V-80HD on firmware v1.20.201                |
| **Captured**    | Established by packet capture of Roland RCS traffic             |
| **Implemented** | In the module and working, not separately hardware-verified     |
| **Spec**        | From Roland's documentation, not verified here                  |
| **Disproven**   | Believed true once, shown false — recorded so nobody retries it |
| **Contested**   | Contradictory evidence on record, both from hardware            |
| **Open**        | A known unknown, with the evidence so far                       |

Addresses are six hex digits, written upper case. Payload bytes are hex pairs.

---

## 1. Transport and session

### 1.1 Connecting

Plain TCP to port **8023**. No TLS, no framing layer beyond the command terminator.

**A network password must be set on the device before LAN control works at all.** Menu → Network →
Network Password on the unit itself. There is no way to disable the requirement remotely, and a unit
with no password set will not accept control. **Confirmed.**

### 1.2 The password handshake

The device prompts about **10 ms after the socket opens**. **Captured.**

```
      device →  Enter password:
      client →  <password>\r\n
      device →  Welcome to ...      (or)  VER:<version string>
```

**The prompt has no terminator.** No semicolon, no newline. A line-oriented parser will never emit
it — it has to be matched against the raw receive buffer. This is the single most common way to get
the handshake wrong.

**Do not send the password unprompted.** A password line written before the prompt arrives is parsed
by the device as a command, and shows up on the wire as `ERR:0`. **Captured.**

**Never answer a second prompt with the same password.** A re-prompt means the password was
rejected. Answering again loops, and the loop trips the device's brute-force lockout — after which
it rejects the correct password too. **Confirmed.**

```
      device →  Authentication error...      password rejected
      device →  Wait a moment...             brute-force lockout active
```

Once locked out, the only remedy is to stop and wait. **Confirmed.**

### 1.3 Two behaviours worth designing around

**The authentication window is under 100 ms.** Too short to press a button inside by hand. Two test
cases in the module's own test plan are recorded as untestable for this reason — reaching them needs
an automated harness. **Confirmed.**

**A second control session is accepted and then ignored.** The device completes the TCP handshake
for a second controller and then sends it nothing at all — no password prompt, no banner, no error.
The socket looks healthy and is dead. If you are writing a client, treat "connected but silent past
a few seconds" as a distinct failure mode, not a slow start. **Confirmed.**

### 1.4 Keeping the link honest

The device answers every query within milliseconds, so prolonged receive silence is a reliable death
signal. That matters because a network path that dies without a FIN or RST — Wi-Fi drop, cable pull,
switch power-cycle — leaves the socket looking open indefinitely. On Windows, TCP keepalive takes
roughly two hours to notice.

The thresholds the module settled on, after the first set tested as too slow:

| Condition                             | Threshold | Action                                           |
| ------------------------------------- | --------- | ------------------------------------------------ |
| Connected, authenticated, quiet       | 1.5 s     | Send a single `RQH:001500,000001;` as a nudge    |
| Connected, authenticated, still quiet | 4 s       | Tear down and rebuild the connection             |
| Connected, never authenticated        | 6 s       | Rebuild — covers the ignored-second-session case |
| Not connected                         | 12 s      | Recycle the socket                               |

Checked on a **1 s** tick. **Confirmed.**

The original values were 8 s / 4 s / 10 s / 20 s on a 2.5 s tick, which gave a worst case of 10.5 s
to notice a dead link. That was reported as too slow on hardware and halved. **Confirmed.**

One Windows-specific note: a connect attempt to an unreachable host takes about **21 s** to time
out, so recycling the socket every 12 s keeps attempts fresh rather than stacking timers.

---

## 2. Frame grammar

### 2.1 The two commands

There are only two verbs.

| Verb      | Form                       | Meaning                                 |
| --------- | -------------------------- | --------------------------------------- |
| **Write** | `DTH:<address>,<payload>;` | Set the parameter at `<address>`        |
| **Read**  | `RQH:<address>,<size>;`    | Request `<size>` bytes from `<address>` |

Both are ASCII. Both take a six-hex-digit address. Both terminate with `;`, and the module appends
`\r\n` to every line.

```
DTH:001500,29;        set Program to Input 1
RQH:001500,000001;    read the Program source back
```

`<size>` is itself six hex digits. **Always send `000001`.** Asking for more does not work — the
device returns nothing at all for a multi-byte request, confirmed on hardware 2026-09-16. See §8.6.
Read one byte at a time, or not at all.

### 2.2 Replies

| Reply                      | Meaning                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| `ACK;`                     | Write accepted                                                               |
| `ERR:<n>;`                 | Error. `ERR:0` is what a command sent on an unauthenticated session produces |
| `DTH:<address>,<payload>;` | A value, either answering an `RQH` or pushed unprompted                      |

Text lines — the password prompt, `Welcome to`, `VER:`, `Authentication error`, `Wait a moment` —
are newline-terminated and are not frames.

### 2.3 Every answered read produces two frames

A reply to `RQH` is **a `DTH:` frame followed immediately by `ACK;`** — not one or the other.
Measured over 142 consecutive replies: 142 `DTH:` frames, 142 `ACK;` frames, perfectly paired, with
nothing else on the wire. **Confirmed 2026-09-16.**

So `ACK;` is not only a write acknowledgement. Treating it as one and discarding it is fine, but do
not use its arrival to infer that a write happened.

### 2.4 The device batches replies, even though it refuses batched requests

This is the asymmetry that catches people. You must send **one command per TCP write** (§7.2), but
the device answers **many frames in a single segment** — up to 22 frames, 242 bytes, in one read
during the same measurement.

```
one 242-byte segment  =  11 x (DTH:xxxxxx,vv;  ACK;)
```

**Never assume one frame per segment, in either direction.** A parser that reads a socket chunk and
treats it as a single message will silently drop most of what the device says. Accumulate into a
buffer and split on the terminator. Frames also split _across_ segment boundaries — one `DTH:` in
that measurement had its `ACK;` arrive in the next read.

### 2.5 Frames are wrapped in control bytes

Device frames arrive wrapped in **STX (`0x02`), XON (`0x11`) and XOFF (`0x13`)**. Strip them from
the leading edge before parsing. **Confirmed** — this is in the module's receive path and was found
the hard way.

A frame can also arrive in the same TCP segment as, and behind, the unterminated password prompt. A
parser that clears its whole buffer on seeing the prompt will silently eat that frame.

**Bound your receive buffer.** Anything still unparsed after a full pass is an incomplete frame. Past
about 8 KB it is not a frame at all, and keeping a tail only hands the parser a fragment cut through
the middle of a value — which produces one silently wrong reading rather than an error. Discard it
and log that you did.

### 2.6 The truncation trap

**A one-byte read is easy; anything longer is where implementations fall down.**

The module's parser takes the first byte of any reply payload and discards the rest. That single
limitation is the direct cause of three features that were investigated, found reachable, and never
built:

- Source and still **names** at `0220xx` — 8-byte ASCII
- Audio **levels** at `01xx03` — 3 bytes
- Audio **metering** at `0F0000` / `0F0300` / `0F0600` — 36 bytes

It is also why tally is read as eight separate single-byte requests rather than one block: a block
reply would populate the first input and silently drop the other seven.

If you are writing a fresh client, write the multi-byte decoder first. Everything above becomes
available at once.

---

## 3. Address groups

| Group                  | Range              | Notes                                 |
| ---------------------- | ------------------ | ------------------------------------- |
| Input Assign           | `000000`–`000007`  | Crosspoint slots. Write only          |
| AUX routing and layers | `000018`–`000024`  | Source select, PinP-on-AUX            |
| Transitions            | `000F00`–`000F05`  | Type, time, wipe                      |
| Split                  | `001000`, `001100` |                                       |
| PinP & Key             | `0012xx`, `0013xx` | Two independent hardware layers       |
| DSK                    | `001401`–`001404`  |                                       |
| Program and Preview    | `001500`, `001501` |                                       |
| Audio                  | `01xx06`, `012x03` | Mutes only                            |
| System                 | `02xxxx`           | AUX link, test pattern, freeze        |
| Status                 | `03xxxx`           | Read only. **Undocumented by Roland** |
| Capture and Stream     | `0A05xx`, `0A08xx` |                                       |
| Panel switches         | `0B00xx`           | **Undocumented by Roland**. Momentary |
| Tally                  | `0C0000`–`0C0007`  | Read only                             |

**Two whole regions are absent from Roland's published map.** Everything in `03xxxx` and `0B00xx`
below was found by packet capture. `0A0800` is likewise undocumented despite sitting inside a
published area — the spec lists only `0A0000`–`0A0003` there.

---

## 4. Address map

### 4.1 Input Assign — `000000`–`000007`

Fills the eight crosspoints. **Write only** — the module never reads these back.

| Address  | Slot    |
| -------- | ------- |
| `000000` | Input 1 |
| …        | …       |
| `000007` | Input 8 |

Payload: one source byte (§5.1). **Implemented.**

### 4.2 AUX routing and layers

| Address  | Parameter            | R/W | Payload                                     |
| -------- | -------------------- | --- | ------------------------------------------- |
| `000018` | AUX 1 source         | R/W | Source byte                                 |
| `000019` | AUX 2 source         | R/W | Source byte                                 |
| `000020` | AUX 1 ← PinP layer 1 | R/W | `00` Disable · `01` Enable · `02` Always On |
| `000021` | AUX 1 ← PinP layer 2 | R/W | as above                                    |
| `000023` | AUX 2 ← PinP layer 1 | R/W | as above                                    |
| `000024` | AUX 2 ← PinP layer 2 | R/W | as above                                    |

**Confirmed.**

> **`000022` is not a typo.** The AUX-layer addresses genuinely skip it. Four addresses, one per
> bus × layer combination — which is also the proof that PinP 1 and 2 are independent layers that
> composite simultaneously rather than alternatives.

### 4.3 Transitions — `000Fxx`

| Address  | Parameter       | Payload                                                 |
| -------- | --------------- | ------------------------------------------------------- |
| `000F00` | Transition type | `00` Mix · `01` Wipe                                    |
| `000F02` | Mix / wipe time | One byte, **tenths of a second**, `00`–`28` (0.0–4.0 s) |
| `000F03` | Wipe pattern    | `0`–`7`                                                 |
| `000F05` | Wipe direction  | `0` Normal · `1` Reverse · `2` Round Trip               |

All R/W, all polled. **Confirmed.**

> **A common mistake: the time field is tenths.** Writing `04` gives you 0.4 seconds, not 4. The
> maximum, `28`, is 4.0 s.

Wipe patterns: `0` Horizontal, `1` Vertical, `2` Upper Left, `3` Upper Right, `4` Lower Left,
`5` Lower Right, `6` H-Center, `7` V-Center.

`000F01` and `000F04` are unused by this module — untested, not known to be absent.

### 4.4 Split — `001000` / `001100`

| Address  | Parameter | Payload            |
| -------- | --------- | ------------------ |
| `001000` | Split 1   | `01` on · `00` off |
| `001100` | Split 2   | `01` on · `00` off |

R/W, polled. **Confirmed.**

### 4.5 PinP & Key — `0012xx` / `0013xx`

**PinP 1 and PinP 2 are two real, independent hardware layers**, not one layer with a selector. Each
has a complete parallel address block carrying its own source, on-air state and full geometry, and
both composite at once. **Confirmed.**

The address is `00` + `12` (layer 1) or `13` (layer 2) + the offset below.

| Offset | Parameter         | R/W   | Range       | Encoding              |
| ------ | ----------------- | ----- | ----------- | --------------------- |
| `01`   | On PGM            | R/W   | `01`/`00`   | —                     |
| `02`   | On PVW            | R/W   | `01`/`00`   | —                     |
| `03`   | Source            | R/W   | `00`–`38`   | Source byte           |
| `05`   | Window Position H | **W** | −100…+100 % | Signed, max raw 1000  |
| `07`   | Window Position V | **W** | −100…+100 % | Signed, max raw 1000  |
| `09`   | Window Size       | **W** | 0…100 %     | Unsigned ×10          |
| `0B`   | Window Cropping H | **W** | 0…100 %     | Unsigned ×10          |
| `0D`   | Window Cropping V | **W** | 0…100 %     | Unsigned ×10          |
| `18`   | View Position H   | **W** | −50…+50 %   | Signed, max raw 500   |
| `1A`   | View Position V   | **W** | −50…+50 %   | Signed, max raw 500   |
| `1C`   | View Zoom         | **W** | 100…400 %   | 2-byte, raw = percent |

Spelled out, the six readable addresses are:

| Parameter | Layer 1  | Layer 2  |
| --------- | -------- | -------- |
| On PGM    | `001201` | `001301` |
| On PVW    | `001202` | `001302` |
| Source    | `001203` | `001303` |

Source and on-air state are **Confirmed**. Geometry is **Confirmed** except View Position.

**None of the geometry addresses can be read back.** They are write-only in this module, and no read
has been attempted.

> **Cropping is inverted.** `100 %` means _no crop_ — the full window. `0 %` is fully cropped and the
> window disappears entirely. This catches everyone once.

> **View Position needs zoom to be visible.** `18` and `1A` appeared to do nothing across two
> sessions, and the explanation turned out to be observational rather than protocol: the travel over
> the -50…+50 span is small at default zoom. Raise View Zoom first and the movement is plainly
> visible. **Confirmed 2026-09-15.** If you are testing these, change zoom before you conclude
> anything.

**The offsets were derived, not published.** Window Size working at `09` is the anchor; the
parameters before it fill `00`–`08` exactly, which places Position H at `05` and V at `07`. The
encoder emits the byte pairs the specification prints for ±100 %.

**There is no per-AUX PinP geometry.** Geometry belongs to the layer, not to the bus displaying it.
Nothing in the protocol stores or recalls a geometry set either — see §9.1.

### 4.6 DSK — `0014xx`

| Address  | Parameter  | Payload     |
| -------- | ---------- | ----------- |
| `001401` | DSK on PGM | `01`/`00`   |
| `001402` | DSK on PVW | `01`/`00`   |
| `001404` | DSK source | Source byte |

R/W, polled. **Confirmed.** `001403` unused.

### 4.7 Program and Preview — `0015xx`

| Address  | Parameter            | Payload     |
| -------- | -------------------- | ----------- |
| `001500` | Program (PGM) source | Source byte |
| `001501` | Preview (PST) source | Source byte |

R/W, polled. **Confirmed.** `001500` doubles as the module's watchdog nudge — a cheap read with a
guaranteed reply.

### 4.8 Audio

Mute only. Levels are reachable but deliberately unimplemented — see §9.2.

**Input mutes — `01<ch>06`, fifteen channels:**

| Address  | Channel      | Address  | Channel               |
| -------- | ------------ | -------- | --------------------- |
| `010106` | Audio In 1   | `010906` | HDMI In 3             |
| `010206` | Audio In 2   | `010A06` | HDMI In 4             |
| `010306` | Audio In 3/4 | `010B06` | SDI In 1              |
| `010406` | USB In       | `010C06` | SDI In 2              |
| `010506` | Bluetooth In | `010D06` | SDI In 3              |
| `010606` | Audio Player | `010E06` | SDI In 4              |
| `010706` | HDMI In 1    | `010F06` | Video Player / SRT In |
| `010806` | HDMI In 2    |          |                       |

**Bus mutes:**

| Address  | Bus   |
| -------- | ----- |
| `012103` | Main  |
| `012203` | AUX 1 |
| `012403` | AUX 2 |

All R/W, all polled, payload `01` muted / `00` unmuted. **Confirmed.**

> **`012303` is skipped.** The AUX bus mutes are `21`, `22`, `24` — not `21`, `22`, `23`. Likewise
> `010006` is not a channel; the input mutes start at `01`.

### 4.9 System — `02xxxx`

| Address           | Parameter               | Payload                                      |
| ----------------- | ----------------------- | -------------------------------------------- |
| `020114`          | AUX Linked PGM **mode** | `00` Off · `01` Auto Link · `02` Manual Link |
| `020115`          | AUX 1 follows PGM       | `01`/`00`                                    |
| `020116`          | AUX 2 follows PGM       | `01`/`00`                                    |
| `02015E`          | Test pattern            | `00` off, `01`–`0C` pattern                  |
| `020900`          | Global freeze           | `01`/`00`                                    |
| `020902`–`020909` | Per-input freeze        | `01`/`00`                                    |

All R/W, all polled. **Confirmed.**

> **The mode gates the follow bits.** With `020114` set to Off there is no AUX link at all, and
> `020115` / `020116` do nothing whatever you write to them. Set a mode first. This cost a debugging
> session — the addresses and values had been right all along.

> **AUX link state is device-driven.** Selecting an AUX source by hand breaks the link; a transition
> or a re-press restores it. Never assume a write to `020115`/`020116` stuck — read it back. Auto
> Link restores at the next transition; Manual Link holds your selection until you re-select it.

**Per-input freeze** runs `020902`–`020909` for HDMI 1-4 then SDI 1-4. Note it **starts at `02`**,
not `00`.

**Test patterns:** `01` Color Bars 75 %, `02` Color Bars 100 %, `03` Ramp, `04` Step, `05` Hatch,
`06` Diamond, `07` Circle, `08` Bars 75 %-SP, `09` Bars 100 %-SP, `0A` Ramp-SP, `0B` Step-SP,
`0C` Hatch-SP.

### 4.10 Status registers — `03xxxx`

**Read only, and entirely undocumented by Roland** — the published map has nothing in `03`.

| Address  | Parameter                            | Payload                                                     |
| -------- | ------------------------------------ | ----------------------------------------------------------- |
| `030207` | Fade To Black — **fade in progress** | `01` while a fade runs, `00` otherwise                      |
| `030800` | Stream & Record status               | `02` Stopped · `03` Stopping · `04` Starting · `05` Running |
| `030604` | Clock counter, 1 Hz                  | Not state. Observed values `07496D`, `07496E`, …            |

**Captured.**

> **`030207` is not the Fade To Black state.** Six FTB presses produced twelve transitions of this
> byte — `00`→`01` while each fade ran, back to `00` once it finished, _whether the result was black
> or live_. It is a fade-in-progress flag. The steady engaged state is at an address nobody has
> found. **Open** — see §10.1.

> **`030800` is pushed to RCS's session but not to yours.** Five start/stop cycles driven from
> Companion produced the `0A0800` writes and **no `030800` in either direction** — the device does
> not volunteer status to your session even when you issued the command. Poll it.
> **The general lesson: do not assume a push seen in one client's session reaches yours.**

### 4.11 Capture and Stream — `0A05xx` / `0A08xx`

| Address  | Parameter                 | Payload                          |
| -------- | ------------------------- | -------------------------------- |
| `0A0500` | Capture source select     | `00`–`08` (see below)            |
| `0A0501` | Capture still slot select | `00`–`1F` (slot − 1, slots 1-32) |
| `0A0504` | Capture state machine     | See §6.1                         |
| `0A0800` | Stream & Record trigger   | `01` start · `00` stop           |

**Captured**, all four. `0A0800` is undocumented despite sitting in a published area.

Capture source bytes: HDMI 1-4 = `00`–`03`, SDI 1-4 = `04`–`07`, Video Player = `08`. Note this is
**not** the general source byte map — capture cannot take a still or a crosspoint as its source.

> **`0A0504` does not reach your session. Confirmed 2026-09-16.** Its behaviour was established
> from a 16-cycle recording of **RCS's** session, and it is push-only — nothing polls it. Two
> captures run from this module, the second with full logging, completed correctly and produced
> **no `0A0504` traffic in either direction**. The client never learns the capture finished.
>
> **This is the `030800` trap again** (§4.10), and that is now twice. Treat every push documented
> from an RCS recording as unproven for your own session until you have seen it arrive in yours.
>
> **If you need capture completion, poll `0A0504`.** Waiting for a push will wait forever.

> **`0A0800` starts a livestream.** On the V-80HD, livestreaming, video recording and audio
> recording share one trigger and cannot be started separately. Whichever of Live Streaming, Video
> Rec and Audio Rec are enabled in the unit's menu will start together. Only _whether_ each occurs
> is configurable, and only on the device. Treat this address as capable of putting a stream on air.

### 4.12 Panel switches — `0B00xx`

**Undocumented by Roland.** These address physical panel switches directly. Each is **momentary** —
send `01` then `00` as a press/release pair, about 10 ms apart.

| Address  | Switch            |
| -------- | ----------------- |
| `0B001B` | `[CUT]`           |
| `0B001C` | `[AUTO]`          |
| `0B002A` | `[CAPTURE IMAGE]` |
| `0B003C` | `[FADE TO BLACK]` |

**Captured.** RCS sends exactly one press/release pair per action — not two.

> **`0B002A` is a toggle, not a close.** Fire it while the capture screen is shut and you open one.
> The device answers `0A0504,01` or `0A0504,00` within ~60 ms every time, over 16 tested cycles.

This is the same mechanism the V-160HD uses for assignable pads, so `0B00xx` is the region to
explore if you need another panel control. **The only way to map one is to capture RCS driving it**
— see §8.5.

### 4.13 Tally — `0C00xx`

**Read only.** The switcher's own on-air state, unrelated to the physical tally port — **no tally
cable required.**

| Address  | Input     | Address  | Input    |
| -------- | --------- | -------- | -------- |
| `0C0000` | HDMI In 1 | `0C0004` | SDI In 1 |
| `0C0001` | HDMI In 2 | `0C0005` | SDI In 2 |
| `0C0002` | HDMI In 3 | `0C0006` | SDI In 3 |
| `0C0003` | HDMI In 4 | `0C0007` | SDI In 4 |

Values: `0` Off · `1` PGM · `2` PST. **Confirmed.**

Entirely poll-driven — the device pushes nothing here. `0C0008` onward covers Still 1-32; see §9.4.

### 4.14 Housekeeping traffic

| Address                | Meaning                                               |
| ---------------------- | ----------------------------------------------------- |
| `0E0000`               | 1 Hz keepalive, **both directions**. Not state        |
| `0E0001,01` … `0E0002` | Brackets a full parameter dump                        |
| `0B0400`               | Present in old logs. Function **unknown** — see §10.3 |

**Captured.** Decode these before your next capture session so they do not look like findings.

### 4.15 One address that is wrong

| Address  | Status                                                                                                                                                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `03020F` | **Disproven.** Recorded in early notes as "record on/off". It did not appear once in 120 seconds of RCS driving the function. The real trigger is `0A0800`. Do not reinstate it without a fresh capture — it may be a different function, or may have changed with firmware |

---

## 5. Payload encodings

### 5.1 Source bytes

One byte, used by every routing address — PGM, PVW, AUX, PinP source, DSK source, Input Assign.

| Range     | Meaning               |
| --------- | --------------------- |
| `00`–`03` | HDMI In 1-4           |
| `04`–`07` | SDI In 1-4            |
| `08`–`27` | Still 1-32            |
| `28`      | Video Player / SRT In |
| `29`–`38` | Crosspoint Input 1-16 |

**Confirmed.** The V-80HD exposes eight crosspoints, so `29`–`30` is the useful part of that last
range; `31`–`38` are addressable but have nothing behind them on this model.

Worked example: `DTH:001500,29;` sets Program to Input 1.

> Note that "Input 1" and "HDMI In 1" are different things. The crosspoints (`29`+) are the labelled
> buttons on the panel; what each one carries is set by Input Assign (§4.1). The direct HDMI and SDI
> bytes bypass the crosspoints entirely.

### 5.2 Two-byte values

Multi-byte values use a **7-bit packed** pair — the same convention as MIDI SysEx data bytes, which
is presumably where it comes from. The low byte never exceeds `7F`.

```
    high = floor(value / 128)
    low  = value mod 128
```

Both rendered as two hex digits and concatenated.

| Value | Encoded | Working                               |
| ----- | ------- | ------------------------------------- |
| 100   | `0064`  | 100 ÷ 128 = 0 remainder 100 (`0x64`)  |
| 400   | `0310`  | 400 ÷ 128 = 3 remainder 16 (`0x10`)   |
| 1000  | `0768`  | 1000 ÷ 128 = 7 remainder 104 (`0x68`) |

Clean representable range is **0–16383** (`0000`–`7F7F`).

> **Watch the upper bound.** The module's encoder has no upper clamp: a value of 16384 or more emits
> a three-digit high group and a malformed five-character payload. No current caller can reach it,
> but a fresh implementation should clamp.

### 5.3 Signed percentages

Used by PinP Window Position and View Position. Negative values wrap in **14-bit two's complement**
— add 16384 — and are then 7-bit packed as above.

```
    raw = round(percent / percentMax * maxRaw)      clamped to ±maxRaw
    if raw < 0: raw = raw + 16384
    encode as a two-byte value
```

| Parameter           | percentMax | maxRaw | UI range    | Encoded range   |
| ------------------- | ---------- | ------ | ----------- | --------------- |
| Window Position H/V | 100        | 1000   | −100…+100 % | `7818` … `0768` |
| View Position H/V   | 50         | 500    | −50…+50 %   | `7C0C` … `0374` |

Worked example, −100 % Window Position:

```
    raw  = round(-100 / 100 * 1000)  = -1000
    wrap = -1000 + 16384             = 15384
    high = floor(15384 / 128) = 120  = 0x78
    low  = 15384 mod 128      =  24  = 0x18
    →  DTH:001205,7818;
```

### 5.4 Unsigned percentages

Used by Window Size and both Cropping axes. Percent is scaled ×10 to a raw 0–1000, then 7-bit
packed.

| Percent | Raw  | Encoded |
| ------- | ---- | ------- |
| 0 %     | 0    | `0000`  |
| 50 %    | 500  | `0374`  |
| 100 %   | 1000 | `0768`  |

### 5.5 View Zoom is the odd one out

Alone among the geometry parameters, **View Zoom's percent value is the raw value** — no ×10
scaling. Clamped 100–400, then 7-bit packed: `100 %` → `0064`, `400 %` → `0310`.

### 5.6 Single bytes

Everything else is one byte, two hex digits, clamped 0–255: source bytes, mix time, wipe type and
direction, AUX link mode, AUX layer mode, test pattern, capture slot and source.

---

## 6. Sequences

Some operations are not one write.

### 6.1 Capturing a still

**Captured** — six captures of RCS (Still 3-8, HDMI 1 and SDI 1). RCS sends exactly **four**
commands:

```
    DTH:0A0501,<slot>;     select still slot       (slot − 1, so 00–1F)
    DTH:0A0504,03;         arm
      ← device replies  DTH:0A0504,04;   ready, ~560 ms later
    DTH:0A0500,<source>;   select source
    DTH:0A0504,07;         execute
      ← device replies  DTH:0A0504,08;   done
      ← device replies  DTH:0A0504,0A;   state refreshed
```

The `0A0504` register carries both directions:

| Value | Meaning               | Direction                       |
| ----- | --------------------- | ------------------------------- |
| `00`  | Capture screen closed | device push                     |
| `01`  | Capture screen open   | device push                     |
| `03`  | Arm                   | **client write**                |
| `04`  | Armed and ready       | device reply, ~560 ms after arm |
| `07`  | Execute               | **client write**                |
| `08`  | Capture done          | device reply                    |
| `0A`  | State refreshed       | device reply                    |

> **Only `03` and `07` are commands.** An earlier implementation sent fourteen commands, having been
> reconstructed from logs that mixed both directions — so the module was replaying the device's own
> status back at it. Do not send `04`, `05`, `08`, `0A` or `00`.

**Timings that matter.** The module waits 250 ms between steps, **800 ms** after arming (the device
answers ready in ~560 ms; waiting longer beats racing it, since a premature execute is silent), and
then holds **7 seconds** before dismissing the screen.

### 6.2 Dismissing the capture screen

A capture leaves its screen up on the monitor. Clearing it needs **four things right at once**, and
this took four attempts to establish:

1. The address is **`0B002A`**, the `[CAPTURE IMAGE]` panel switch
2. The wait is **7 seconds** after execute — not 500 ms, not 1200 ms
3. It must be **ungated**
4. It takes **two** press/release pairs, **300 ms apart** — not one

**Confirmed** on hardware.

> **Why ungated.** The obvious design gates the close on the device's pushed `0A0504` `00`/`01`
> screen state. That works for a hand-driven toggle from idle — but your own capture sequence gets
> `04`/`08`/`0A` back, **never `01`**, so the gate never opens and the close silently never fires.
> This is exactly what made 1200 ms and 7000 ms behave identically on hardware while both were
> broken.

> **Do not fire two captures less than 7 seconds apart**, or the first close lands on the second
> capture's screen.

**The capture screen does not block the unit's other menus.** Open a menu while a capture runs and
the menu stays up with the capture visibly continuing behind it. The two ignore each other. That is
what makes the delayed close safe — `0B002A` addresses the capture function directly, as a panel
switch rather than a menu key, so it cannot disturb an unrelated menu. **Confirmed.**

### 6.3 Stream and Record

**Captured** — four clean on/off cycles:

```
    23.926  client   DTH:0A0800,01;     start
    23.934  device   ACK;
    23.975  device   DTH:030800,04;     starting
    24.161  device   DTH:030800,05;     running

    29.782  client   DTH:0A0800,00;     stop
    29.832  device   DTH:030800,03;     stopping
    31.919  device   DTH:030800,02;     stopped
```

Note the shape: **starting and stopping are real transitional states**, roughly 200 ms and 2 s
respectively. A client that treats the trigger as instantaneous will misreport during those windows.

And note again that `030800` reached the **RCS** session in this capture. It does not reach yours —
poll it. See §4.10.

---

## 7. Device behaviour

### 7.1 Polling

**500 ms is the floor. 250 ms locked the panel up.** **Confirmed** — this is a hardware limit, not a
preference.

The module's cycle is **64 individual reads**: 33 enumerated core addresses, 15 audio mutes, 8 input
freezes, 8 tally. At 500 ms that is about 128 commands per second.

Adding still tally (§9.4) would take the cycle to 93, which is why it was left out.

### 7.2 The batching trap

**The device does not answer a batched write. At all.** Not even an `ACK`.

Measured over one capture with Companion connected and polling:

```
    RQH sent by client      : 17220
    DTH returned by device  :    21     ← all 21 answered single-command writes
    RQH per TCP write       : 63 × 273 writes → zero replies
                                1 ×  21 writes → 21 replies
```

**Captured.** One command per TCP write is mandatory.

This is worth dwelling on because of how it failed. Batching was introduced as a traffic
optimisation — 52 packets down to 1 — and it **silently disabled every polled feedback** for four
releases. Nothing errored. The only reads that ever returned data were the watchdog's standalone
single-command nudges, which is why the link looked healthy throughout.

Fixing it was measurable in the same terms: **18,838 sent, 15,518 returned**, against 17,220 sent and
21 returned before.

> **Nothing between 1 and 63 commands per write has been tested.** If you need to reduce traffic,
> find the chunk size the device tolerates on hardware rather than assuming one.

### 7.3 Optimistic updates — when to trust your own write

A client that lights its own feedback the moment a button is pressed feels better than one that
waits up to 500 ms for the poll to confirm. Whether that is safe depends on the parameter, and the
rule this module settled on is:

**Booleans the device holds until told otherwise are updated optimistically. Value selections are
not.**

| Optimistic                                                                             | Not optimistic                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Mutes, splits, PinP and DSK on-air, freeze, input freeze, test pattern, AUX layer mode | Source selection on every bus, all PinP geometry, Stream & Record, transitions |

The reasoning is about the cost of a wrong guess. A mute that guesses wrong self-corrects within one
poll and nobody notices. A **source** selection that guesses wrong shows the operator the wrong input
lit on a tally button — briefly telling them something false about what is on air. Better to wait.

**Two exceptions worth knowing:**

- **AUX link follow (`020115` / `020116`) is never optimistic**, even though it is a boolean. The
  device changes this on its own — selecting an AUX source by hand breaks the link, a transition or
  a re-press restores it — so assuming a write stuck would make the feedback lie about a value the
  device may have overridden. Read it back. See §4.9.
- **With polling disabled**, the optimistic half keeps working from the client and the non-optimistic
  half freezes permanently at whatever it last showed. Nothing corrects it. That is the real cost of
  turning polling off, and it is larger than "feedbacks lag a bit".

### 7.4 What the device pushes unprompted

| Register                       | Behaviour                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `0E0000`                       | 1 Hz keepalive, both directions                                                    |
| `030604`                       | 1 Hz clock counter                                                                 |
| `0A0504`                       | Capture screen state, ~60 ms after a toggle — **to RCS's session only, see §4.11** |
| `0F0000` / `0F0300` / `0F0600` | Audio meters, 36-byte payloads, **only while audio is present**                    |
| `0E0001,01` … `0E0002`         | Brackets a **full parameter dump** after every capture                             |
| `030800`                       | Stream & Record status — **to RCS's session, not yours**                           |

**Captured.**

**The full dump is `000000` through `600xxx`** — the device's entire parameter set, reloaded rather
than sent as per-parameter deltas. So the device _does_ push without polling, but only as a wholesale
reload and only after a capture. Whether that could replace or reduce polling is **Open**; it would
need a multi-byte parser first.

Note the upper bound. The address space extends to `600xxx`, far beyond anything documented or
anything this module touches.

### 7.5 What the device does not do

**It does not echo physical panel presses.** Ten presses of `[CAPTURE IMAGE]` produced zero frames
attributable to the press — only the `0A0504` state change that follows. **Disproven**, definitively,
and it kills the obvious discovery method; see §8.5.

**It does not send status to a second session.** See §4.10 and §1.3.

---

## 8. Dead ends and corrections

Half the value of a protocol document is knowing what not to try again. Everything here was believed
at some point and is wrong.

### 8.1 Disproven: `03020F` is the record trigger

Carried in early notes as "record on/off" and shipped. It **did not appear once in 120 seconds** of
RCS driving the function, so the feature almost certainly never worked. The real trigger is
`0A0800`, with status on `030800`. Do not reinstate `03020F` without a fresh capture.

### 8.2 Disproven: image capture needs fourteen commands

It needs four. The fourteen-command version was reconstructed from logs that mixed both directions,
so the client was replaying the device's own status messages back at it. See §6.1.

### 8.3 Disproven: `0B003A` closes the capture screen

A guess, and a wrong one — it **broke capture outright**. The correct address is `0B002A`. Neighbouring
addresses in an undocumented region are not safe to guess at.

### 8.4 Disproven: batching reads is a harmless optimisation

It disables every polled read, silently, with no error. See §7.2.

### 8.5 Disproven: "press the button with Wireshark running and read the address"

The intuitive way to map a panel control, and it does not work — **the device does not echo physical
panel presses**. Ten presses produced nothing.

**The method that does work is to capture RCS driving the same control.** That single technique
produced `0B002A`, the capture sequence, the Stream & Record pair and the tally answer. If you want
to map something, drive it from RCS and watch.

A related correction: RCS sends **one** press/release pair per action, not two. An implementation
that doubled the send was solving a problem that did not exist.

### 8.6 Disproven: block reads work

**They do not. Settled on hardware 2026-09-16.**

`RQH:030200,000030;` — a request for 48 bytes — was fired with the raw command logging both
directions at info level. The device returned **nothing at all** for it. Over the two seconds that
followed, 142 replies arrived and **every single one was a one-byte answer to the ordinary 500 ms
poll**; not one carried a multi-byte payload, and no `0302xx` frame appeared other than the poll's
own `030207`.

This closes a contradiction that had stood since 2026-09-08:

| Date       | Claim                                      | Verdict     |
| ---------- | ------------------------------------------ | ----------- |
| 2026-09-04 | "Block reads work — returned all 48 bytes" | **Wrong**   |
| 2026-09-08 | "Returned nothing at all"                  | **Correct** |

**How the wrong result happened, and why it was so plausible.** The client truncates every reply to
its first byte, so at the application layer a 48-byte answer and a 1-byte answer are identical. With
a 500 ms poll running continuously in the background, a "successful block read" and an ordinary poll
reply arriving a moment later look exactly the same. The two recorded dumps of that block disagreed
with each other, which was the tell.

**The lesson, and it is the reason this document counts bytes everywhere:** verify at the lowest
layer you can reach. An application-level observation cannot distinguish "the device answered" from
"the device was already talking".

**Consequence:** the Fade To Black search cannot proceed by diffing a block. See §10.1.

### 8.7 Corrections to claims that were documented as fact

Three statements survived in user-facing documentation for months and were not true. Recorded because
each one shaped decisions:

| Claim                                                                      | Reality                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------ |
| "Audio mute feedback does not update from the panel — a device limitation" | Never a device limitation. It was the dead poll (§7.2) |
| "Tally needs a tally cable"                                                | It does not. `0C0000`–`0C0007` reports it over LAN     |
| "Scene Memory is implemented but unexposed"                                | It was never implemented at all                        |

The common thread: **a broken read path presents as a device limitation.** Before recording something
as a hardware constraint, confirm reads are returning data.

---

## 9. Reachable but not implemented

Everything here is known to be addressable. None of it is built, and each was a deliberate decision.

> **Three of these are blocked only by the multi-byte decoder** — levels, metering and names. Worth
> knowing before you build one: Roland's separate _Basic control commands_ set, over this same
> socket, appears to expose all three as plain ASCII values, which would sidestep the decoder
> entirely. **Spec, untested here.** If you need these, evaluate that route before writing a parser.

### 9.1 Scene Memory — `0A0000` / `0A0001`

| Address  | Operation                                           | Status                      |
| -------- | --------------------------------------------------- | --------------------------- |
| `0A0000` | **Load** memory. One write, `00`–`1F` = Memory 1-32 | Straightforward, unbuilt    |
| `0A0001` | **Save** memory                                     | **Spec marks it Read Only** |

Load is easy. Save is not, and an earlier implementation that wrote to `0A0001` almost certainly did
nothing. Establishing a working save would need a capture of a panel-driven save first.

This is the device's **only** store-and-recall, and it is whole-scene. There is no PinP layout store,
no per-parameter snapshot.

### 9.2 Audio levels — `01xx03`

Three bytes, where `xx` is `01`–`0F` matching the mute channel map in §4.8.

| Payload    | Level    |
| ---------- | -------- |
| `7E 00 00` | −INF     |
| `00 00 00` | 0.0 dB   |
| `00 00 64` | +10.0 dB |

**Verified reachable and working** — then deliberately dropped. The reason is physical: **the
front-panel level knobs are not motorised**, so a level set remotely cannot be reflected on the unit
and the two silently disagree from then on. Mute is the only audio control this module exposes.

That reasoning is about operator safety, not protocol. A client with a different use case may
reasonably decide otherwise.

### 9.3 Audio metering — `0F0000` / `0F0300` / `0F0600`

Pushed unprompted, no polling required, **only while audio is present**. 36-byte payloads, values in
L/R pairs.

**Encoding: `7F` is silence, and lower values are louder** — matching the −INF…0 dB encoding used
elsewhere. **Captured.**

Three registers on a `0300` stride, most likely Main / AUX 1 / AUX 2 — **not confirmed**, see §10.4.

Blocked only by the multi-byte decoder.

### 9.4 Still tally — `0C0008` onward

Covers Still 1-32, same values as input tally. Left out on poll budget: 32 more reads would take the
cycle from 61 to 93 commands, against a device that locked its panel at a 250 ms interval. Worth
putting behind a toggle rather than always-on.

### 9.5 Source and still names — `0220xx`

8-byte ASCII. The operator's own names, not fixed text.

| Address         | Returns                 |
| --------------- | ----------------------- |
| `022000`        | "HDMI 1"                |
| `022400`        | "SDI 1"                 |
| `022800` onward | "Still 1", "Still 2", … |

**Captured.** Blocked only by the multi-byte decoder — of everything in this section, this is the one
most worth building.

### 9.6 Panel Lock — `020300`–`020347`

**Lock state, not button presses.** It is the range you would hope provides remote panel control and
it does not: it omits `[MENU]`, `[EXIT]`, `[ENTER]` and the `[VALUE]` knob entirely.

### 9.7 Not reachable at all: menu navigation

**There is no EXIT command, no MENU command, and no general way to back out of an on-screen menu.**
Nothing in the documented set does it, and none was found by capture. **Confirmed** to the extent a
negative can be — it has been looked for deliberately, more than once.

This matters because it is easy to assume otherwise. An earlier release shipped an EXIT action that
did not exist and had to be withdrawn (§8.3). Panel Lock above is the range that looks like the
answer and is not.

The one menu the module can dismiss is the capture screen, and only because `0B002A` addresses that
function directly as a panel switch (§6.2). That is a specific escape, not a general one. If you need
to leave some other menu, the only known route is to find its own panel switch in `0B00xx` by
capturing RCS driving it.

---

## 10. Open questions

### 10.1 Open: Fade To Black engaged state

`030207` is a fade-in-progress flag (§4.10). The address carrying the steady engaged state has not
been found, and it was the only polled byte that moved during the capture that established this.

**The block-diff approach is dead.** It was the obvious plan — read `030200` with FTB off, read it
again with FTB engaged, diff the two — and it depended on block reads working. They do not (§8.6),
confirmed 2026-09-16. Nothing in that plan survives.

**What is left:**

- **Capture RCS toggling FTB.** RCS clearly knows the state, and this is the technique that produced
  `0B002A`, the capture sequence, the Stream & Record pair and the tally answer. It is the method
  with the best record in this project by a distance (§11).
- **Walk `03xxxx` one byte at a time.** Slow but possible now that single reads are known to work —
  poll a candidate range with FTB off, repeat with it engaged, and compare. The address space is
  large and `03` is entirely undocumented, so scope it before starting.
- **Roland's other command set** documents a direct query returning `OFF`, `ON`, `FADEIN` or
  `FADEOUT`. It is out of scope for this document and untested here, but it is one line in a
  terminal and would answer the question outright. Try it before either of the above.

### 10.2 Resolved: PinP View Position

Kept as a worked example of a failure mode worth recognising.

`0012`/`0013` offsets `18` and `1A` were recorded as producing no visible movement across two
hardware sessions, and were within one session of being escalated to a packet capture on the
assumption the commands were wrong.

They were not. **The question was never "does it work" but "would I see it if it did"** — the visible
travel over a -50…+50 span is small at default zoom, and the test had been run without changing zoom
first. Raising View Zoom to 400 % and then moving View Position shows the movement immediately.
**Confirmed 2026-09-15.**

The evidence that should have carried more weight at the time: the addresses are anchored on Window
Size working at `09`, the encoder emits the byte pairs the specification prints, the ranges permit
negatives, and the six neighbouring geometry parameters all worked. Every signal said the protocol
was right.

**The general lesson: before concluding a write does nothing, establish that you could see it if it
did.** That is cheaper than a capture and it was the difference here.

### 10.3 Open: what is `0B0400`?

Frames appear in older logs and were once attributed to panel presses. They are not — ten physical
presses produced zero of them. Function unknown.

### 10.4 Open: which meter register is which bus?

`0F0000`, `0F0300`, `0F0600` — "most likely Main / AUX 1 / AUX 2" on the `0300` stride, never
confirmed.

### 10.5 Open: batch chunk size

63 commands per write returns nothing; 1 returns everything. Nothing in between has been tried.

### 10.6 Open: a cleaner capture-screen exit

Two presses work (§6.2) but _why_ two are needed is not understood — the screen a capture leaves
behind is evidently not the same single toggle RCS drives from idle. If a cleaner exit exists, this
is where it would go.

### 10.7 Open: could the full dump replace polling?

The device dumps its entire parameter set after a capture (§7.4). Whether anything else triggers it,
and whether per-parameter deltas are ever sent, is unknown.

---

## 11. Method

How the findings here were established, so anything added meets the same standard.

**Capture RCS, not the panel.** Roland's own control software is the reference implementation. Drive
the control you care about in RCS with a capture running, and read what it actually sends. This
produced `0B002A`, the four-command capture sequence, the Stream & Record pair and the tally answer
— each in a single recording.

**The device does not echo panel presses**, so capturing while pressing buttons on the unit tells you
nothing (§8.5).

**Separate the two directions.** The most expensive mistake in this project's history came from
reading a capture that mixed client writes and device replies, and treating the replies as commands
(§8.2). Label every frame with its direction before drawing conclusions.

**Count bytes on the wire, not in your parser.** A client that truncates replies cannot distinguish a
48-byte answer from a 1-byte one — which is very likely what made block reads look like they worked
(§8.6).

**Check reads are returning data before concluding anything about the device.** Three "device
limitations" were documented for months and every one was a dead read path (§8.7).

**Confirm on hardware, and write down the firmware version.** Everything marked **Confirmed** here
was exercised against a V-80HD on **v1.20.201**.

---

## Contributing

Corrections and additions are welcome, particularly on anything marked **Open** or **Contested**.
Please bring evidence: a capture, a byte sequence, or a stated firmware version — and say which
marker your finding earns.

Issues: <https://github.com/Jay-PBS/Roland-v80-Companion-Module/issues>
