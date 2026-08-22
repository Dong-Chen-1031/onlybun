// onlybun/check: helpers only, nothing happens on load.
import core from './core.cjs';

export const isBun = core.isBun;
export const getBunVersion = core.getBunVersion;
export const getRuntime = core.getRuntime;
export const assertBun = core.assertBun;
export const terminateIfNotBun = core.terminateIfNotBun;

export default core;
