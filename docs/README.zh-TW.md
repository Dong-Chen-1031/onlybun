<p align="center">
  <img src="../assets/logo.svg" alt="一顆活得好好的 bun" width="150">
</p>

<p align="center">
  <em>這顆 bun 過得很好。你的 Node process 就沒那麼好了。</em>
</p>

# onlybun

> ⚠️ **這個專案是給喜歡 Bun 的人用的。不喜歡 Bun 的話，請左轉 [neverbun](https://github.com/Dong-Chen-1031/neverbun)。**

> [English Readme](../README.md)

Import 一次，你的程式就拒絕在任何不是 Bun 的地方執行。零依賴，CJS 和 ESM 都支援，其他事情一概不管。

[neverbun](https://github.com/Dong-Chen-1031/neverbun) 的邪惡雙胞胎，同一套機制，相反的結論。

## 安裝

```sh
bun add onlybun
```

對，用 Bun。不然呢。

## 使用

放在進入點（entry file）的最上面，然後就可以忘記它了：

```js
import 'onlybun';      // ESM
require('onlybun');    // CJS
```

跑在 Bun 上：什麼都不會發生。這是好結局。

跑在 Node.js 上：

```
  ✗ This project requires Bun.

    Detected runtime: Node.js v26.5.0
    Please use Bun instead (e.g. `bun run`, `bun install`).

    To skip this check anyway: ONLYBUN_DISABLE=1
```

然後立刻 `process.exit(1)`。Deno 也享有同等待遇，一視同仁。

## 兩層防護

只有一層的話太鬆懈了。

1. **模組解析層。** `exports` 有一個 `"node"` condition 指向 `src/unsupported.js`。
   Node 會信心滿滿地走進死路，連真正的進入點都碰不到。
2. **Runtime 偵測層。** 進入點載入時檢查 `process.versions.bun` 和全域 `Bun` 物件。
   這層負責接住所有會忽略 export conditions 的 bundler——而事實證明，那是大部分的 bundler。

## 瀏覽器不在追殺範圍內

瀏覽器永遠不可能是 Bun，所以在那裡拒絕執行只會毫無理由地弄壞你的 client bundle。
套件有一個 `"browser"` export condition 指向一個被動的進入點，而且就算走到一般的進入點，
它也只會對 `node` 和 `deno` 動手——不是「所有不是 Bun 的東西」。

所以 `getRuntime()` 回傳 `'browser'` 沒問題，回傳 `'node'` 才有事。

## API

如果你不想要一個「import 就會終止 process」的東西，請用 `onlybun/check`。
這個子路徑**完全沒有任何副作用**。

```js
import { isBun, getRuntime, getBunVersion, assertBun, terminateIfNotBun } from 'onlybun/check';

isBun();              // boolean
getRuntime();         // 'bun' | 'node' | 'deno' | 'browser' | 'unknown'
getBunVersion();      // '1.4.0' | null
assertBun();          // 在 Node/Deno 上丟出 Error（code: 'ERR_BUN_REQUIRED'）
terminateIfNotBun({ message: '請執行 `bun server.js`', exitCode: 2 });
```

主進入點會 re-export 同一組函式，只是它進門的時候順手扣了扳機。

## 環境變數

| 變數 | 說明 |
| --- | --- |
| `ONLYBUN_DISABLE=1` | 逃生門。完全停用檢查，就算在 Node 上也照跑。 |
| `ONLYBUN_EXIT_CODE` | 終止時使用的 exit code，預設 `1`。 |

## 在框架專案裡該放哪裡

唯一的原則：**這個套件只在「runtime 真的執行到那行 import」的時候才有用。**
Bundler 只是「打包」你的 app code，不會「執行」它——所以放錯檔案，你得到的防護是零。

可靠的位置是 config 檔，它一定是由「執行 CLI 的那個 runtime」直接 evaluate：

```js
// vite.config.js / astro.config.mjs / next.config.mjs
import 'onlybun';
export default { /* ... */ };
```

### 想擋住所有東西

Import 擋不到 `npm install`，因為那時候已經太遲了。要全面覆蓋的話，在 `package.json`
再加一層：

```json
{
  "scripts": {
    "preinstall": "bun -e \"if(!process.versions.bun)throw new Error('請用 bun，不要用 npm')\""
  }
}
```

坦白說，這需要你先裝好 Bun，才能被告知你需要裝 Bun。我們覺得這樣沒問題。

## 測試

```sh
bun test/run.cjs
```

它會建一個真實的 consumer fixture（用 `node_modules` symlink），然後分別用 Bun 和 Node 跑一遍。
本機沒裝 Bun 的話那組會自動略過——連同這個套件存在的意義一起。

## 授權

MIT
