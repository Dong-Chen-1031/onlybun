'use strict';

const core = require('./core.cjs');

// Side effect: loading this module checks the runtime and bails out unless
// we are on Bun.
core.terminateIfNotBun();

module.exports = {
  isBun: core.isBun,
  getBunVersion: core.getBunVersion,
  getRuntime: core.getRuntime,
  assertBun: core.assertBun,
  terminateIfNotBun: core.terminateIfNotBun,
};
