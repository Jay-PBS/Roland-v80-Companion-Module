# Development

Building, packaging and releasing the module. For using it, see [companion/HELP.md](companion/HELP.md).

## Build

Build on **Node 22**. `.nvmrc` pins 22.20.0, and `companion/manifest.json` declares
`runtime.type: node22` — the newest runtime the Companion manifest schema allows. The only valid
values are node16, node18, node20 and node22, so 22 is a ceiling rather than a preference.

```
cd \path\to\version\folder
nvm use            # or: nvm install 22.20.0 && nvm use 22.20.0
corepack enable    # restores yarn, which a Node switch removes
yarn install
yarn preflight
```

Companion runs the module in its own embedded runtime, not the Node you build with, so
`runtime.type` decides execution. Building on the matching major keeps the two aligned.

Built `.tgz` files are gitignored and none is committed, so a rebuild never shows up as a repository change. **Bump the version in `package.json` before packaging anything you intend to test** — Companion caches modules by version number, so rebuilding under a number it has already seen will leave it running the old code with no indication anything is wrong.

`companion/manifest.json` carries `"version": "0.0.0"` deliberately. `yarn package` injects the real
version from `package.json` into the packaged manifest and names the `.tgz` from it, so `package.json`
is the single place a release number is set.

### Before releasing a version

```
yarn preflight
```

That is the gate. It formats, applies auto-fixable lint, builds, and packages, in that order, and
stops at the first failure. Run it and commit whatever it tidies before tagging or publishing a
build, so a release is never the first time the full chain has been exercised.

`.yarnrc.yml` sets `enableScripts: false`, inherited from upstream. That is deliberate and worth
keeping: it stops dependency `postinstall` scripts executing on install, which is a well-known
supply-chain vector. The side effect is that this project's own `postinstall: husky` does not run
either, so the `lint-staged` pre-commit hook does not self-install on a fresh clone.

That is fine. The hook only formats staged files and auto-fixes lint — a strict subset of
`yarn preflight`, with no build, type-check or package step. It is a convenience, not a safety net,
and nothing depends on it. Run `yarn husky` once if you want it; skip it if you would rather nothing
rewrote files during a commit.

## Preset text size

Presets set `size` in the legacy point scale, but Companion's layered-button editor shows Text Size
as a percentage of the button height and scales the preset's number by 5/3 on the way in. The
presets send 14, which the editor shows as 23.3. To match a size read from the editor, divide it
by 5/3.
