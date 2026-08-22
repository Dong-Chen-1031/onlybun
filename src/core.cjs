'use strict';

/**
 * Core runtime detection and termination logic (free of side effects).
 * Only the entry points (index.cjs / index.mjs / unsupported.js) actually
 * terminate anything when loaded.
 */

const DEFAULT_EXIT_CODE = 1;

/** Returns the current Bun version, or null when not running on Bun. */
function getBunVersion() {
  if (typeof process !== 'undefined' && process.versions && process.versions.bun) {
    return String(process.versions.bun);
  }
  const g = typeof globalThis !== 'undefined' ? globalThis : undefined;
  if (g && g.Bun && typeof g.Bun.version === 'string') {
    return g.Bun.version;
  }
  return null;
}

/** Whether we are currently running on Bun. */
function isBun() {
  return getBunVersion() !== null;
}

/**
 * Identifies the current runtime.
 * @returns {'bun'|'node'|'deno'|'browser'|'unknown'}
 */
function getRuntime() {
  if (isBun()) return 'bun';

  const g = typeof globalThis !== 'undefined' ? globalThis : undefined;
  if (g && g.Deno && g.Deno.version) return 'deno';

  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  // A document means a browser, which can never be Bun -- refusing to run
  // there would be pointless, so it gets its own bucket.
  if (g && typeof g.document !== 'undefined') return 'browser';

  return 'unknown';
}

/** Human-readable name and version for the message. */
function describeRuntime() {
  const runtime = getRuntime();
  if (runtime === 'node') return `Node.js ${process.version}`;
  if (runtime === 'deno') return `Deno v${globalThis.Deno.version.deno}`;
  if (runtime === 'browser') return 'a browser';
  if (runtime === 'bun') return `Bun v${getBunVersion()}`;
  return 'an unknown runtime';
}

function readEnv(name) {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const value = process.env[name];
  return value === undefined || value === '' ? undefined : value;
}

/** Whether the user explicitly opted out via ONLYBUN_DISABLE=1. */
function isDisabled() {
  const value = readEnv('ONLYBUN_DISABLE');
  return value === '1' || value === 'true';
}

function resolveExitCode(override) {
  if (typeof override === 'number' && Number.isInteger(override)) return override;
  const fromEnv = Number(readEnv('ONLYBUN_EXIT_CODE'));
  if (Number.isInteger(fromEnv)) return fromEnv;
  return DEFAULT_EXIT_CODE;
}

function buildMessage(extra) {
  const lines = [
    '',
    '  ✗ This project requires Bun.',
    '',
    `    Detected runtime: ${describeRuntime()}`,
    '    Please use Bun instead (e.g. `bun run`, `bun install`).',
    '',
  ];
  if (extra) {
    lines.push(`    ${extra}`, '');
  }
  lines.push('    To skip this check anyway: ONLYBUN_DISABLE=1', '');
  return lines.join('\n');
}

/**
 * Whether this runtime should be turned away: a server-side runtime that is
 * not Bun. Browsers are deliberately left alone -- no browser is ever going
 * to be Bun, so a client bundle must not blow up over it.
 */
function shouldRefuse() {
  const runtime = getRuntime();
  return runtime === 'node' || runtime === 'deno';
}

/**
 * Throws when not on Bun, does nothing otherwise. Never terminates the
 * process -- for callers who want to decide what happens themselves.
 */
function assertBun(options) {
  const opts = options || {};
  if (!shouldRefuse() || isDisabled()) return;
  const error = new Error(opts.message || `Unsupported runtime: ${describeRuntime()} (Bun required)`);
  error.code = 'ERR_BUN_REQUIRED';
  error.runtime = getRuntime();
  throw error;
}

/**
 * Prints a message and terminates the process when not on Bun; returns false
 * otherwise. This is what `import 'onlybun'` actually calls.
 */
function terminateIfNotBun(options) {
  const opts = options || {};
  if (!shouldRefuse()) return false;
  if (isDisabled()) return false;

  const exitCode = resolveExitCode(opts.exitCode);

  try {
    if (typeof process !== 'undefined' && process.stderr && process.stderr.write) {
      process.stderr.write(buildMessage(opts.message));
    } else {
      console.error(buildMessage(opts.message));
    }
  } catch (_) {
    /* Failing to print must not block termination. */
  }

  if (typeof process !== 'undefined' && typeof process.exit === 'function') {
    process.exit(exitCode);
  }

  const error = new Error(`Unsupported runtime: ${describeRuntime()} (Bun required)`);
  error.code = 'ERR_BUN_REQUIRED';
  throw error;
}

module.exports = {
  DEFAULT_EXIT_CODE,
  getBunVersion,
  isBun,
  getRuntime,
  assertBun,
  terminateIfNotBun,
};
