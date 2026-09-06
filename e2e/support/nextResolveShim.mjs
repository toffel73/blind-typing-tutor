// Test-only Node ESM loader hook.
//
// Node's native ESM resolver requires exact file extensions for bare
// specifiers that aren't covered by a package "exports" map. The "next"
// package doesn't declare one for subpaths like "next/server", so importing
// Next.js route handlers (which do `import { NextRequest } from "next/server"`)
// outside of Next's own bundler fails with ERR_MODULE_NOT_FOUND.
//
// This hook only kicks in as a fallback: it first tries Node's normal
// resolution, and only appends ".js" to bare "next/..." specifiers if that
// fails, so it never changes behavior for specifiers that already resolve.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("next/") && !specifier.endsWith(".js")) {
    try {
      return await nextResolve(specifier, context);
    } catch {
      return nextResolve(`${specifier}.js`, context);
    }
  }
  return nextResolve(specifier, context);
}
