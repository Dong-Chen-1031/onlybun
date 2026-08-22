<p align="center">
  <img src="./assets/logo.svg" alt="A very much alive bun" width="150">
</p>

<p align="center">
  <em>This bun is thriving. Your Node process, less so.</em>
</p>

# onlybun

> ⚠️ **This project is for people who like Bun. If you don't like Bun, please go look at [neverbun](https://github.com/Dong-Chen-1031/neverbun) instead.**

> [Traditional Chinese Readme](./docs/README.zh-TW.md)

Import it once, and your program refuses to run anywhere that isn't Bun. Zero dependencies, CJS and ESM, no opinions about anything else.

The evil twin of [neverbun](https://github.com/Dong-Chen-1031/neverbun), same machinery, opposite conclusion.

## Install

```sh
bun add onlybun
```

Yes, with Bun. Obviously.

## Usage

Put this at the very top of your entry file and forget about it:

```js
import 'onlybun';      // ESM
require('onlybun');    // CJS
```

On Bun: absolutely nothing happens. That's the good ending.

On Node.js:

```
  ✗ This project requires Bun.

    Detected runtime: Node.js v26.5.0
    Please use Bun instead (e.g. `bun run`, `bun install`).

    To skip this check anyway: ONLYBUN_DISABLE=1
```

...followed immediately by `process.exit(1)`. Deno gets the same treatment, for consistency.

## Two layers of defence

Because one layer would be complacent.

1. **Module resolution.** The `exports` map declares a `"node"` condition
   pointing at `src/unsupported.js`. Node walks confidently into a dead end
   before the real entry point is ever loaded.
2. **Runtime detection.** The entry points check `process.versions.bun` and the
   global `Bun` object on load. This catches every bundler that ignores export
   conditions (which, as it turns out, is most of them).

## Browsers are left alone

No browser is ever going to be Bun, so refusing to run in one would just break
your client bundle for no reason. There's a `"browser"` export condition that
resolves to a passive entry point, and even the normal entry only terminates on
`node` or `deno` specifically — never on "anything that isn't Bun".

So `getRuntime()` returning `'browser'` is fine. `'node'` is not.

## API

If you'd rather not have an import that terminates your process, use
`onlybun/check`. That subpath has **no side effects whatsoever**.

```js
import { isBun, getRuntime, getBunVersion, assertBun, terminateIfNotBun } from 'onlybun/check';

isBun();              // boolean
getRuntime();         // 'bun' | 'node' | 'deno' | 'browser' | 'unknown'
getBunVersion();      // '1.4.0' | null
assertBun();          // throws on Node/Deno (code: 'ERR_BUN_REQUIRED')
terminateIfNotBun({ message: 'Please run `bun server.js`', exitCode: 2 });
```

The main entry point re-exports the same functions, it just also pulls the
trigger on the way in.

## Environment variables

| Variable | What it does |
| --- | --- |
| `ONLYBUN_DISABLE=1` | The escape hatch. Disables the check entirely, even on Node. |
| `ONLYBUN_EXIT_CODE` | Exit code used when terminating. Defaults to `1`. |

## Where to put this in a framework project

The one rule: **this package only helps when the runtime actually executes that
import.** Bundlers *bundle* your app code, they don't *run* it — so putting the
import in the wrong file buys you exactly nothing.

The reliable spot is your config file, which is always evaluated directly by
whichever runtime is running the CLI:

```js
// vite.config.js / astro.config.mjs / next.config.mjs
import 'onlybun';
export default { /* ... */ };
```

### Blocking everything

An import can't stop `npm install`, because by then it's too late. For total
coverage, add one more layer in `package.json`:

```json
{
  "scripts": {
    "preinstall": "bun -e \"if(!process.versions.bun)throw new Error('Use bun, not npm')\""
  }
}
```

Which, admittedly, requires Bun to be installed to tell you that you need Bun
installed. We're comfortable with that.

## Tests

```sh
bun test/run.cjs
```

This builds a real consumer fixture (with a `node_modules` symlink) and runs it
under both Bun and Node. If Bun isn't installed locally, those tests are skipped
— and so, frankly, is the point of this package.

## License

MIT
