# Hardware Test Sheet — OPEN TASKS

> **Open tasks only.** Cleared items are deleted, not recorded — the closed record lives in git
> history and in `PROTOCOL.md`. `TESTING.md` is the 2026-09-08 run and is not edited.

**Last updated:** 2026-09-15 · **Tester:** Jay · **Device firmware:** v1.20.201

**The build under test is about to change.** Everything here except §B was verified against
`roland-v80hd-0.8.8.tgz`. Four code changes have since landed unbuilt — see §V. **Bump the version
before packaging**, or Companion will serve a cached 0.8.8.

---

## V. Verify the four unbuilt changes

Written 2026-09-15, typechecked and linted, **never run**. One build, one session.

| #   | Change              | What to check                                                                                                     | Result |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ |
| V1  | Capture timeout fix | Fire `Capture Image to Still`. Still captured, screen closes itself, **and no `Call timed out` error in the log** |        |
| V2  | Duplicate poll      | Connect with debug on: `Connection ready` appears **once**, one state burst not two                               |        |
| V3  | Duplicate poll      | **Pull the network, let it recover.** It reconnects and logs ready again                                          |        |
| V4  | Freeze consistency  | Freeze On, Off and Toggle on three buttons — all three light the feedback identically                             |        |
| V5  | Browse list         | Every action shows **one line**. Only `Advanced – Send raw LAN command` has a second                              |        |
| V8  | Raw command echo    | Fire any raw command — `Raw TX:` and `Raw RX [Nb]:` both appear at info level                                     |        |
| V6  | Browse list         | Mix/Wipe Time, AUX Layer PinP and both Croppings show a `Note` block **on the button**                            |        |
| V7  | Browse list         | Stream & Record Start still shows its livestream `Warning` **on the button**                                      |        |

**V3 is the one not to skip.** It is what proves the idempotency guard did not break reconnect, which
is the only way that change could bite.

**V1 supersedes the old capture item.** The completion-log question moves to §B2.

---

## B. Two protocol questions — one session, needs the device

Both were attempted on 2026-09-15 and **neither produced a result, for the same reason.**

### Why the last two attempts produced nothing — now fixed in code

Three attempts on 2026-09-15 produced only `Surface/Handler` button lines: once with the module's
debug flag off, and **once with it on**. Not even a `TX:` line either time.

Everything on that path was gated behind `config.debug`, so a reply could be invisible because of the
config checkbox _or_ Companion's log-level filter, and there was no way to tell "command never sent"
from "reply not shown".

**The raw command action now logs both directions at info level**, armed for 2 s after each send:

```
Raw TX: RQH:030200,000030;
Raw RX [48b]: 01 00 00 ...
```

So §B no longer depends on any checkbox. If the send is refused, `sendCmd`'s warn follows
immediately, which distinguishes the two cases.

**Still worth checking once:** Companion's log page has its own level filter. If `Raw TX` does not
appear on the new build, confirm the filter includes Info before concluding anything about the
device.

### B1 — Do block reads work?

Contradictory hardware results on record: 2026-09-04 says `RQH:030200,000030;` returned all 48 bytes,
2026-09-08 says it returned nothing. **This gates the entire Fade To Black search.**

| #   | Step                                                           | Result |
| --- | -------------------------------------------------------------- | ------ |
| B1a | Fire raw command `RQH:030200,000030;`                          |        |
| B1b | Confirm `Raw TX:` appears — proves the command left the module |        |
| B1c | Record the `Raw RX [Nb]:` byte count — ~48, 1, or no line      |        |

| `Raw RX` shows | Verdict                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| **~48 bytes**  | Block reads work. Proceed to the FTB diff, and the multi-byte decoder becomes worth building |
| **1 byte**     | The device truncates. Block reads useless; FTB needs the RCS capture route instead           |
| **no line**    | The device ignores multi-byte requests entirely. Same conclusion, harder stop                |

**If bytes come back:** repeat with FTB engaged and settled, then diff. Whichever byte differs is the
steady Fade To Black state — the one open question `README.md` publicly asks for help with.

### B2 — Does the device push `0A0504` to our session?

`Image capture complete` never appeared on 2026-09-15. That log is **info** level and ungated by the
debug flag, so it would have shown had `0A0504,08` arrived. `0A0504` is push-only and never polled.

**This is the `030800` trap again** — the 16-cycle capture that established `0A0504`'s behaviour
recorded RCS's session, not ours.

| #   | Step                                                                                    | Result |
| --- | --------------------------------------------------------------------------------------- | ------ |
| B2a | Fire one capture with debug on, and record **any** `0A0504` traffic in either direction |        |

If nothing arrives, the options are to poll `0A0504` like `030800`, or to drop the completion log and
the `screen reported closed` diagnostic as things that cannot work. `PROTOCOL.md` §4.11 and §7.4
carry the caveat.

---

## D. Desk item — Companion only, no device

| #   | Item                 | What to check                                                                                                                    | Result |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------ |
| D1  | Detail on the button | Place Capture Image and both Stream & Record actions on buttons — a labelled `Note` or `Warning` block appears above the options |        |

D1 is the mechanism the browse-list cleanup depends on, so it is worth confirming independently of V6
and V7.

---

## F1 — Split 1 and Split 2 need naming for what they do

Both splits work and sit in the right place, but are labelled only by number. **Split 1 is reportedly
the vertical split and Split 2 the horizontal** — and nothing in the module says so.

**Blocked on one observation: confirm which is which against the panel.**

**Roland's documentation does not answer it** — checked 2026-09-15. The spec confirms the V-80HD has
SPLIT 1 and 2 and documents their centre positions, but never says which is vertical and which is
horizontal. Don't re-check the PDF; it has to be the panel.

Display-only when it goes ahead. **The ids must not change** — `split1_on`, `split1_off`,
`split1_toggle`, `split2_*`, the `split1_active` / `split2_active` feedbacks and the `split1` /
`split2` variables all stay, or existing buttons break.

| File                                              | What                                             |
| ------------------------------------------------- | ------------------------------------------------ |
| [src/actions.ts:281-286](src/actions.ts#L281)     | Six action names                                 |
| [src/feedbacks.ts:218-230](src/feedbacks.ts#L218) | Two feedback names                               |
| [src/variables.ts:27-28](src/variables.ts#L27)    | Two variable display names, not the variable ids |
| [src/presets.ts:422-437](src/presets.ts#L422)     | Two preset names and both button faces           |
| [companion/HELP.md:66-68](companion/HELP.md#L66)  | The Split section and the variable table         |

Also undecided: button faces as `SPLIT / VERT` and `SPLIT / HORZ`, or keep the numbers and carry the
orientation in the name only.

---

## Deferred

- **Raw-command button built on an older version still fires.** No such button exists and
  manufacturing an old build is not worth it. **Fold into the next build's regression pass**, where a
  0.8.8-era raw-command button will exist naturally.
