'use strict';

/**
 * Node resolves to this file via the "node" export condition, so it walks
 * into a dead end before the real entry point is ever loaded.
 *
 * The check still goes through core rather than exiting unconditionally, for
 * two reasons: ONLYBUN_DISABLE=1 has to keep working, and a Node-based
 * bundler may resolve this file at build time for output that actually runs
 * on Bun later.
 */

const core = require('./core.cjs');

core.terminateIfNotBun();

// Reaching this line means we are fine after all -- behave exactly like the
// regular entry points.
module.exports = {
  isBun: core.isBun,
  getBunVersion: core.getBunVersion,
  getRuntime: core.getRuntime,
  assertBun: core.assertBun,
  terminateIfNotBun: core.terminateIfNotBun,
};
