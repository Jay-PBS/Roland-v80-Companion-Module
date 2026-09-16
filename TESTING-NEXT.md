# Hardware Test Sheet — OPEN TASKS

> **Open tasks only.** Cleared items are deleted, not recorded — the closed record lives in git
> history and in `PROTOCOL.md`. `TESTING.md` is the 2026-09-08 run and is not edited.

**Last updated:** 2026-09-16 · **Tester:** Jay · **Device firmware:** v1.20.201

**Last build tested:** `roland-v80hd-0.8.10.tgz`. Eight of its ten checks passed and both protocol
questions are answered — see below for the two that did not close. **Three further changes have
landed since that package** and need a new build: the Split relabel, and the doc corrections.

---

## Cleared 2026-09-16 — do not retest

| Check  | Result                                                                   |
| ------ | ------------------------------------------------------------------------ |
| V1     | Capture works, **no `Call timed out` error** — the timeout fix holds     |
| V2     | `Connection ready` once, one state burst                                 |
| V3     | Recovered from `ECONNRESET` and logged ready again — the guard is safe   |
| V4     | Freeze On, Off and Toggle all light the feedback identically             |
| V5     | One line per action; only `Advanced` carries a second                    |
| V6     | `Note` blocks present on Mix/Wipe Time, AUX Layer PinP, both Croppings   |
| V7     | Stream & Record Start still shows its livestream `Warning` on the button |
| V10    | Both View Position actions show the raise-the-zoom `Note`                |
| **B1** | **Block reads do not work** — settled, see below                         |
| **B2** | **The device does not push `0A0504` to us** — settled, see below         |
| **F1** | **Split 1 is vertical, Split 2 is horizontal** — confirmed on the panel  |

### What B1 and B2 settled

**B1 — block reads return nothing.** `RQH:030200,000030;` produced no reply. The 142 frames that
arrived over the following two seconds were **every one a single-byte answer to the ordinary poll**,
and no `0302xx` frame appeared other than the poll's own `030207`. The 2026-09-04 "returned all 48
bytes" claim is disproven; the 2026-09-08 "returned nothing" was right. `PROTOCOL.md` §8.6 carries
the full account, including why the wrong result was so plausible.

**Consequence:** the Fade To Black block-diff plan is dead. `PROTOCOL.md` §10.1 now lists what is
left — capture RCS toggling FTB, walk `03xxxx` a byte at a time, or try Roland's other command set,
which documents a direct query and is one line in a terminal.

**B2 — `0A0504` never reaches us.** No `Image capture complete`, and no `0A0504` traffic in either
direction during a capture that otherwise completed correctly. That is the `030800` trap for the
second time: a push seen in an RCS recording is not proof it reaches your session.

### Two findings that came free with the log

Both now in `PROTOCOL.md` §2.3 and §2.4:

- **Every answered read produces two frames** — `DTH:` then `ACK;`. Measured at 142 and 142, exactly
  paired. `ACK;` is not only a write acknowledgement.
- **The device batches its replies** even though it refuses batched requests — up to 22 frames in one
  242-byte segment, and frames split across segment boundaries. Never assume one frame per read.

---

## Still open

### V8 — raw echo, needs the `Raw TX:` line

The `Raw RX` half is proven beyond doubt: 24 lines, 3172 bytes, correctly framed. **The `Raw TX:`
line was not in the pasted log**, so the send side is unconfirmed.

It almost certainly fired — the RX echo only arms inside `cmdRaw`, so nothing would have been logged
at all otherwise. But the point of the echo is that both directions are visible, so it is worth one
look.

**Turn polling off first** — connection config, untick `Enable polling`. The echo arms for two
seconds, and with polling on that catches four poll cycles and buries the reply. Your 2026-09-16 log
had 142 frames in it for exactly this reason. Turn it back on afterwards.

| #   | Step                                                                               | Expected                                                        | Result |
| --- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| V8a | Polling off. Fire `RQH:001500,000001;` — a read of the PGM source, changes nothing | `Raw TX:` then one `Raw RX` holding `DTH:001500,xx;` and `ACK;` |        |
| V8b | Fire `DTH:02015E,00;` — test pattern off, a no-op if none is running               | `Raw TX:` then a `Raw RX` holding `ACK;` and no `DTH:`          |        |
| V8c | Fire `RQH:030200,000030;` — the block read, now cleanly isolated                   | `Raw TX:` and **no `Raw RX` at all**. Confirms B1 in one line   |        |

**The echo now renders frames readably**, so the expected output of V8a is literally:

```
Raw TX: RQH:001500,000001;
Raw RX [22b]: <STX>DTH:001500,29;<LF><STX>ACK;<LF>
```

`29` is the PGM source byte — `0x29` is Input 1. The byte count stays first, because it is the only
thing that distinguishes a real multi-byte reply from a one-byte one.

### V9 — PinP Reset presets could not be found

Expected in the preset browser under **`PinP & Key`**, alongside PiP1/PiP2 PGM and PVW:

```
PinP & Key
  PinP1 PGM     PinP1 PVW
  PinP2 PGM     PinP2 PVW
  PiP1 Reset    <- these two
  PiP2 Reset
```

Verified present in the 0.8.10 bundle — `pinp1_reset`, `pinp2_reset` and the label `PiP1 Reset` are
all in the shipped `main.js`, under category `PinP & Key`.

| #   | Step                                                                                  | Result |
| --- | ------------------------------------------------------------------------------------- | ------ |
| V9a | Confirm the installed module is **0.8.10** — Companion caches by version              |        |
| V9b | Look under **`PinP & Key`**, not Aux 1 or Aux 2. Six presets expected, not four       |        |
| V9c | If still missing, restart the connection — the preset list is sent at connection init |        |

If they are genuinely absent on a confirmed 0.8.10, that is a new finding and worth a log.

### D1 — detail on the button, desk work

| #   | Item                 | What to check                                                                                                                    | Result |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------ |
| D1  | Detail on the button | Place Capture Image and both Stream & Record actions on buttons — a labelled `Note` or `Warning` block appears above the options |        |

Largely implied by V6 and V7 passing, but it covers Capture Image specifically, which those did not.

---

## N. Next build — verify the Split relabel

Written 2026-09-16 after F1 was confirmed. **Not yet packaged.**

| #   | Check                                                                                               | Result |
| --- | --------------------------------------------------------------------------------------------------- | ------ |
| N1  | Action list reads `Split 1 (Vertical) – On/Off/Toggle` and `Split 2 (Horizontal) – …`               |        |
| N2  | Presets read `Split 1 – Vertical` / `Split 2 – Horizontal`, faces `SPLIT / VERT` and `SPLIT / HORZ` |        |
| N3  | **An existing split button built before the rename still fires** — ids unchanged, so it must        |        |
| N4  | Feedback names read `Split 1 (Vertical) – active`; variables `$(v80hd:split1)` still resolve        |        |

**N3 is the one that matters.** The rename is display-only and every id was left alone —
`split1_on`, `split1_off`, `split1_toggle`, `split2_*`, both `*_active` feedbacks and both variable
ids. N3 is what proves it.

---

## Deferred

- **Raw-command button built on an older version still fires.** No such button exists. Fold into the
  next regression pass, where a 0.8.8-era button will exist naturally.
