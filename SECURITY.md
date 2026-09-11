# Security Policy

## Supported versions

Only the current release is supported. The module is in beta and versions are superseded rather than patched — if you are not on the latest release, update before reporting.

| Version | Supported |
| ------- | --------- |
| 0.8.5   | Yes       |
| < 0.8.5 | No        |

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Use GitHub's [private vulnerability reporting](https://github.com/Jay-PBS/Roland-v80-Companion-Module/security/advisories/new) on this repository, or email projects@purplebadgersolutions.co.uk.

Please include the module and Companion versions, the V-80HD firmware version, what an attacker would gain, and enough detail to reproduce. You will get an acknowledgement, and a view on whether it is in scope and what happens next.

## Scope

The module is a TCP client. It authenticates to a V-80HD on the local network and issues LAN commands; it opens no listening sockets and contacts no external service. The device password is held in Companion's secrets store rather than the plaintext connection config.

In scope: anything that discloses the stored password, executes code by way of device responses, or lets a party on the network drive the switcher through this module in a way the operator did not authorise.

Out of scope: the V-80HD's own LAN protocol, which is unencrypted by design and offers no transport security — treat the switcher's control network as trusted infrastructure and segment it accordingly. Weaknesses in Companion itself belong with [Companion](https://github.com/bitfocus/companion/security).
