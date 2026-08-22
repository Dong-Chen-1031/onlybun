import core from './core.cjs';

// Side effect: loading this module checks the runtime and bails out unless
// we are on Bun.
core.terminateIfNotBun();

export const isBun = core.isBun;
export const getBunVersion = core.getBunVersion;
export const getRuntime = core.getRuntime;
export const assertBun = core.assertBun;
export const terminateIfNotBun = core.terminateIfNotBun;

export default core;
