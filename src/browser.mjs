// Resolved through the "browser" export condition.
//
// No browser is ever going to be Bun, so demanding it there would only break
// client bundles for no reason. This entry keeps the same API surface and
// does nothing on load.
import core from './core.cjs';

export const isBun = core.isBun;
export const getBunVersion = core.getBunVersion;
export const getRuntime = core.getRuntime;
export const assertBun = core.assertBun;
export const terminateIfNotBun = core.terminateIfNotBun;

export default core;
