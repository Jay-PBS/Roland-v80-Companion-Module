# Contributing

Thanks for taking an interest in this module.

This is a single-maintainer project, developed and maintained by Purple Badger Solutions. Every behavioural change is verified against a physical Roland V-80HD before it ships — the command set was established by packet capture against Roland's own control software, not from the documentation alone, and the documentation is wrong or incomplete in several places. A change that reads correctly can still be wrong on the wire.

That constraint shapes what can and cannot be accepted.

## Bug reports are welcome

Where to report depends on which version you are running:

- **A released version** (from the module store or a release): report it on
  [bitfocus/companion-module-roland-v80hd](https://github.com/bitfocus/companion-module-roland-v80hd/issues/new/choose).
- **A development build** (built from `Jay-PBS/Roland-v80-Companion-Module`): report it on
  [Jay-PBS/Roland-v80-Companion-Module](https://github.com/Jay-PBS/Roland-v80-Companion-Module/issues),
  and say which commit or `.tgz` version you built.

Keeping the two apart stops a bug in something half-finished being mistaken for a bug in the
shipped version. The more of the following you can include, the faster it gets resolved:

- V-80HD firmware version, and the Companion and module versions.
- What you did, what you expected, and what happened instead.
- The Companion log covering the failure, from the connection starting to the problem. If the fault is in what the device answers, the **Advanced – Send raw LAN command** action (with **Allow advanced actions** ticked) logs both what was sent and the device's reply, byte count included. The lines start `Raw TX` and `Raw RX`. Those are usually the difference between a diagnosis and a guess.

If the problem is with Companion itself rather than this module, report it against [Companion](https://github.com/bitfocus/companion/issues) instead.

## Pull requests

**Unsolicited pull requests are closed unmerged.** This is not a comment on their quality. Code that cannot be verified on the bench is not merged, and hardware sessions are scheduled rather than continuous, so an open pull request would sit unactionable for weeks and then be re-implemented anyway to fit the capture evidence behind the surrounding code.

If you have found a genuine defect, open an issue describing it. That is the useful contribution — the diagnosis is the hard part, and a clear report is acted on. If you would like to work on something, ask first and it can be agreed before you spend the time.

## Anything else

Questions, behaviour you are not sure is a bug, feature ideas, or anything that does not fit the bug report form — raise it in [issues](https://github.com/bitfocus/companion-module-roland-v80hd/issues) or [discussions](https://github.com/bitfocus/companion-module-roland-v80hd/discussions). Both are read.
