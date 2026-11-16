/**
 * Lets node's test runner import the app's TypeScript modules directly. The
 * app's bundler resolves `./scene` to `./scene.ts`; node does not, so this
 * registers a resolver that tries the TypeScript extensions when a relative
 * import is not found. Used through `--import` in the test scripts.
 */
import { register } from "node:module";

register("./ts-resolve-hooks.mjs", import.meta.url);
