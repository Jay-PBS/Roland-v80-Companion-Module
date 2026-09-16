# Contributing

Thanks for taking an interest in this module.

This is a single-maintainer project, developed and maintained by Purple Badger Solutions. Every behavioural change is verified against a physical Roland V-80HD before it ships — the command set was established by packet capture against Roland's own control software, not from the documentation alone, and the documentation is wrong or incomplete in several places. A change that reads correctly can still be wrong on the wire.

That constraint shapes what can and cannot be accepted.

## Bug reports are welcome

**Issues belong on the released repository: [bitfocus/companion-module-roland-v80hd](https://github.com/bitfocus/companion-module-roland-v80hd).**
Open one using the [bug report form](https://github.com/bitfocus/companion-module-roland-v80hd/issues/new/choose). The repository you may have found
this in, `Jay-PBS/Roland-v80-Companion-Module`, is where development happens and carries
experimental work; keeping reports on the released module is what stops a bug in something
half-finished being mistaken for a bug in the shipped version. The more of the following you can include, the faster it gets resolved:

- V-80HD firmware version, and the Companion and module versions.
- What you did, what you expected, and what happened instead.
- A debug log covering the failure. Tick **Enable debug logging (verbose TX/RX)** in the connection config, reproduce the problem, then attach the `TX` and `RX RAW` lines from the Companion log. These show exactly what went to the device and what came back, and are usually the difference between a diagnosis and a guess.

If the problem is with Companion itself rather than this module, report it against [Companion](https://github.com/bitfocus/companion/issues) instead.

## Pull requests

**Unsolicited pull requests are closed unmerged.** This is not a comment on their quality. Code that cannot be verified on the bench is not merged, and hardware sessions are scheduled rather than continuous, so an open pull request would sit unactionable for weeks and then be re-implemented anyway to fit the capture evidence behind the surrounding code.

If you have found a genuine defect, open an issue describing it. That is the useful contribution — the diagnosis is the hard part, and a clear report is acted on. If you would like to work on something, ask first and it can be agreed before you spend the time.

## Anything else

Questions, behaviour you are not sure is a bug, feature ideas, or anything that does not fit the bug report form — raise it in [issues](https://github.com/bitfocus/companion-module-roland-v80hd/issues) or [discussions](https://github.com/bitfocus/companion-module-roland-v80hd/discussions). Both are read.
