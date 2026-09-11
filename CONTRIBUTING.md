# Contributing

Thanks for taking an interest in this module.

This is a single-maintainer project, developed and maintained by Purple Badger Solutions. Every behavioural change is verified against a physical Roland V-80HD before it ships — the command set was established by packet capture against Roland's own control software, not from the documentation alone, and the documentation is wrong or incomplete in several places. A change that reads correctly can still be wrong on the wire.

That constraint shapes what can and cannot be accepted.

## Bug reports are welcome

Open an issue using the [bug report form](https://github.com/Jay-PBS/Roland-v80-Companion-Module/issues/new/choose). The more of the following you can include, the faster it gets resolved:

- V-80HD firmware version, and the Companion and module versions.
- What you did, what you expected, and what happened instead.
- A debug log covering the failure. Tick **Enable debug logging (verbose TX/RX)** in the connection config, reproduce the problem, then attach the `TX` and `RX RAW` lines from the Companion log. These show exactly what went to the device and what came back, and are usually the difference between a diagnosis and a guess.

If the problem is with Companion itself rather than this module, report it against [Companion](https://github.com/bitfocus/companion/issues) instead.

## Pull requests

**Unsolicited pull requests are closed unmerged.** This is not a comment on their quality. Code that cannot be verified on the bench is not merged, and hardware sessions are scheduled rather than continuous, so an open pull request would sit unactionable for weeks and then be re-implemented anyway to fit the capture evidence behind the surrounding code.

If you have found a genuine defect, open an issue describing it. That is the useful contribution — the diagnosis is the hard part, and a clear report is acted on. If you would like to work on something, ask in an issue first and it can be agreed before you spend the time.

Security issues are the exception to the public-issue rule — see [SECURITY.md](SECURITY.md).
