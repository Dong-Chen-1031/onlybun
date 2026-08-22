export type Runtime = 'bun' | 'node' | 'deno' | 'browser' | 'unknown';

export interface TerminateOptions {
  /** Extra text appended to the default message. */
  message?: string;
  /** Exit code used when terminating. Defaults to 1 (or ONLYBUN_EXIT_CODE). */
  exitCode?: number;
}

export interface AssertOptions {
  /** Custom message for the thrown Error. */
  message?: string;
}

export interface BunRequiredError extends Error {
  code: 'ERR_BUN_REQUIRED';
  runtime: Runtime;
}

/** Whether the current runtime is Bun. */
export function isBun(): boolean;

/** The Bun version string, or null when not running on Bun. */
export function getBunVersion(): string | null;

/** Identifies the current runtime. */
export function getRuntime(): Runtime;

/** Throws a BunRequiredError on Node or Deno, does nothing otherwise. */
export function assertBun(options?: AssertOptions): void;

/**
 * Prints a message and calls process.exit() on Node or Deno; returns false on
 * Bun, in a browser, or when ONLYBUN_DISABLE=1 is set.
 */
export function terminateIfNotBun(options?: TerminateOptions): boolean;

declare const onlybun: {
  isBun: typeof isBun;
  getBunVersion: typeof getBunVersion;
  getRuntime: typeof getRuntime;
  assertBun: typeof assertBun;
  terminateIfNotBun: typeof terminateIfNotBun;
};

export default onlybun;
