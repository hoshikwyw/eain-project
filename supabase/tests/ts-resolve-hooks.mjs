import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const EXTENSIONS = [".ts", ".tsx", "/index.ts"];

/** Resolves a relative import without an extension to its TypeScript file, if that is what exists. */
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || !relative || !context.parentURL) throw error;
    for (const ext of EXTENSIONS) {
      const candidate = new URL(specifier + ext, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
    }
    throw error;
  }
}
