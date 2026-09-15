# Hardware Test Sheet — OPEN ITEMS

> Live queue. Completed items are deleted, not struck through — same convention as
> `working_doc.md`. `TESTING.md` is the closed record of the 2026-09-08 run and should not be
> edited except to record where a finding went.

**Build under test:** `roland-v80hd-0.8.8.tgz` · **Tester:** Jay · **Base:** 0.8.8
**Device firmware:** v1.20.201 · **Last updated:** 2026-09-15

**Section numbers are deliberately non-contiguous** so cross-references in `working_doc.md` stay
valid. Item numbers are likewise unchanged.

## Cleared — do not retest

| §   | Subject                                | Cleared    |
| --- | -------------------------------------- | ---------- |
| 1   | **C7 PinP View Position — works**      | 2026-09-15 |
| 2   | C5 Split action order, and still fires | 2026-09-14 |
| 3   | 0.8.5 palette, 0.8.4 wording, HELP.md  | 2026-09-11 |
| 4   | Transition type feedback — no repro    | 2026-09-14 |
| 5   | 0.8.6 Advanced action and preset       | 2026-09-14 |
| 6   | 0.8.7 Aux categories — items 20-25     | 2026-09-15 |
| 7   | 0.8.8 capture removal — 27, 31, 32     | 2026-09-15 |

**§1 is the headline. View Position H and V work.** It was an observation problem, exactly as the
section hypothesised — not a protocol fault. Zoom raised first, then position moved, and the travel
is visible. **This closes the last open finding from the 2026-09-08 run.** `PROTOCOL.md` §10.2 and
§4.5 are updated. **`README.md` Known Issues still says View Position is unverified** — correct it at
the 1.0 docs pass.

Section 4 is closed as no-repro rather than proven fixed — if it resurfaces it comes back fresh.

## Still open

Two blocked items, one inconclusive test, and three findings.

---

## 1b. Block reads — INCONCLUSIVE, needs one re-run

**The test did not produce a result.** The log showed only two `Surface/Handler` lines for the button
press and release — no TX, no RX, no warning, nothing from the connection at all.

**Why: the module has its own debug switch, separate from Companion's log level.** It is a checkbox
in the _connection config_ — **"Enable debug logging (verbose TX/RX)"** — and it defaults to **off**.
With it off, `TX:` and `RX RAW:` lines are never emitted, so the command and any reply are invisible
whatever Companion's log filter is set to.

One thing the run did establish: **no warning appeared**, and an advanced action that is blocked logs
`Raw LAN command ignored`. So "Allow advanced actions" was on and the command almost certainly did
send. We simply could not see the answer.

| #   | Step                                                                                           | Result | Notes |
| --- | ---------------------------------------------------------------------------------------------- | ------ | ----- |
| B1  | Connection config → tick **Enable debug logging (verbose TX/RX)**. Not the Companion log level |        |       |
| B2  | Fire `Advanced – Send raw LAN command` with command string `RQH:030200,000030;`                |        |       |
| B3  | Find the `RX RAW [Nb]:` line and record **N** — 48 bytes, 1 byte, or no line at all            |        |       |

**`RX RAW` is the line that settles it**, because it logs the raw byte count before any parsing.
`parseDth` truncates every reply to its first byte, so a 48-byte reply and a 1-byte reply are
identical downstream.

**If bytes come back:** repeat with FTB engaged and settled, then diff. Whichever byte differs is the
steady Fade To Black state — the one open question `README.md` publicly asks for help with.

--26.09.15 09:51:38 Surface/Handler/streamdeck:A00SA4502K9QLM: Button 1/0/2 pressed
--26.09.15 09:51:38 Surface/Handler/streamdeck:A00SA4502K9QLM: Button 1/0/2 released
--Only thing from button press of raw RQH:030200,000030;

## 6. Aux preset categories — one item blocked

Items 20-25 all **PASS**, 2026-09-15. Category order correct, all 33 presets present, AUX dropdowns
unchanged, button faces unchanged, browse list terse, detail shows on the button.

| #   | Item                        | Result      | Notes                                                  |
| --- | --------------------------- | ----------- | ------------------------------------------------------ |
| 26  | Existing buttons unaffected | **BLOCKED** | No pre-0.8.6 raw-command button exists to test against |

**Item 26 cannot be run as written** and is not worth manufacturing a build to satisfy. Either mark
it N/A with that reason, or fold it into the next build's regression pass where a 0.8.8-era
raw-command button will exist naturally. Recommend the latter.

Note on item 24: confirmed terse for `raw_command`, and **other actions still carry their second
line** — expected, that is precisely what the queued browse-list cleanup removes.

---

## 7. Capture actions removed — two findings raised

| #   | Item                            | Result       | Notes                                                    |
| --- | ------------------------------- | ------------ | -------------------------------------------------------- |
| 27  | Capture actions gone            | **PASS**     | Only `Capture Image to Still` offered                    |
| 28  | Old buttons flagged, not hidden | **DROPPED**  | See below                                                |
| 29  | Short descriptions              | **DEFERRED** | Superseded by the queued cleanup — retest after it lands |
| 30  | Detail on the button            |              | Explained below, still to run                            |
| 31  | Stream hazard still visible     | **PASS**     | Livestream risk named in the browse list before picking  |
| 32  | **Image capture still works**   | **PASS**     | Still captured, screen closed itself                     |
| 33  | Capture completion log          | **FAIL**     | Raised **F2** and **F3**                                 |

**Item 28 dropped, 2026-09-15.** It tested Companion's handling of an action id that no longer
exists, needed a pre-0.8.8 button nobody has, and the behaviour it was guarding is now written up in
`PROTOCOL.md`. Not worth manufacturing an old build for.

### Item 30 — what it actually means

Two different mechanisms put text on screen, and the item checks the second one.

|                      | Browse list (picking an action) | On the button (after placing it) |
| -------------------- | ------------------------------- | -------------------------------- |
| `description`        | shows                           | shows — **same string**          |
| `static-text` option | never                           | shows                            |

So `description` is one string rendered in both places, while a `static-text` option only appears
once the action is on a button — because the browse list has no option values to draw yet.

**Item 30 asks you to place `Capture Image to Still`, `Stream & Record - Start` and
`Stream & Record - Stop` on a button and confirm a labelled block appears above the options** — a
`Note` for capture (the 10-second warning), a `Warning` for both Stream & Record actions (the
livestream caution). Item 29 was the browse-list half of the same check; item 30 is the button half.

This matters because the queued cleanup moves text _from_ the first column _to_ the second. Item 30
is the mechanism that has to keep working for that cleanup to be safe.

---

## Findings

### F1 — Split 1 and Split 2 need naming for what they do

Raised 2026-09-14. Both splits work and sit in the right place, but are labelled only by number.
**Split 1 is reportedly the vertical split and Split 2 the horizontal** — and nothing in the module
says so.

Display-only. **The ids must not change** — `split1_on`, `split1_off`, `split1_toggle`, `split2_*`,
the `split1_active` / `split2_active` feedbacks and the `split1` / `split2` variables all stay, or
existing buttons break.

| File                                              | What                                             |
| ------------------------------------------------- | ------------------------------------------------ |
| [src/actions.ts:281-286](src/actions.ts#L281)     | Six action names                                 |
| [src/feedbacks.ts:218-230](src/feedbacks.ts#L218) | Two feedback names                               |
| [src/variables.ts:27-28](src/variables.ts#L27)    | Two variable display names, not the variable ids |
| [src/presets.ts:422-437](src/presets.ts#L422)     | Two preset names and both button faces           |
| [companion/HELP.md:66-68](companion/HELP.md#L66)  | The Split section and the variable table         |

**Still open: confirm which is which against the panel** before writing it. Also undecided: button
faces as `SPLIT / VERT` and `SPLIT / HORZ`, or keep the numbers and carry orientation in the name.

### F2 — every capture logs a Companion timeout error

**Raised 2026-09-15 from item 33. This is a real defect and it should not ship at 1.0.**

The capture works. But Companion times the action out and writes a stack trace to the log every
time:

```
08:59:47  Capture requested: Still 1 <- hdmi_2
08:59:51  Error executing action: Error: Call timed out
08:59:54  Exiting capture function (screen reported closed)
```

**Cause.** `cmdCaptureImage` awaits its whole sequence — 250 + 800 + 250 ms, then **7000 ms**, then
the two-press exit. That is about 8.5 seconds after the execute before the promise resolves, and
Companion gives up long before.

**The code comment already states the correct design and the code does not follow it** —
[api.ts:1178](src/api.ts#L1178) says the 7-second hold "is deliberately the last thing in the
sequence and nothing waits on it", but line 1185 is `await this.delay(7000)` inside the action's own
promise chain.

**Fix:** return after the execute and let the dismissal run detached, so the action resolves in
~1.3 s while the 7-second hold and the exit still happen. Behaviour on the device is unchanged; the
error disappears. Needs care — a detached promise must not swallow its own errors.

### F3 — the device may not push `0A0504` to our session

**Raised 2026-09-15 from item 33.** `Image capture complete` never appeared in the log. It is
**info** level and ungated by the debug flag, so it would have shown if the device had pushed
`0A0504,08`. It did not.

`0A0504` is **push-only — it is never polled.** So if the device does not volunteer it to our
session, the module never learns the capture finished, and `captureModeOpen` stays at its `false`
default. That also makes the `screen reported closed` diagnostic worthless: it prints "closed"
whether or not any push ever arrived.

**This is the `030800` trap again.** The 16-cycle capture that established `0A0504`'s behaviour was a
recording of **RCS's** session. The same lesson applies: a push seen in one client's session does not
necessarily reach yours.

**Not yet proven** — the run had the module's debug switch off, so `RX RAW` would not have shown a
push that arrived and failed to parse. Settle it on the same re-run as §1b: debug on, fire a capture,
look for any `0A0504` traffic at all.

**If confirmed**, the options are to poll `0A0504` like `030800`, or to drop the completion log and
the diagnostic as things that cannot work. `PROTOCOL.md` §4.11 and §7.4 currently list `0A0504` as
pushed, on the strength of the RCS capture — both now carry a caveat pointing here.

---

## Next session — short list

1. **§1b and F3 together** — tick the connection's debug checkbox first, then one raw block read and
   one capture. Settles two questions in five minutes.
2. **Item 30** — place the three actions on buttons, confirm the `Note` / `Warning` blocks appear.
3. **Confirm F1's orientation** against the panel.

**Then the build queue clears:** F2 fix, the duplicate initial poll guard, the browse-list cleanup,
and the §5.3 freeze-trio consistency. All four are code, none has been written, and `working_doc.md`
holds the detail.
