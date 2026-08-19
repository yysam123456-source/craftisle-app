// Test-only stub for the `server-only` package.
// Next.js provides `server-only` at build time, but the offline esbuild test bundle
// runs in plain Node where it isn't resolvable. This empty module stands in for it
// so the standalone optimizer test can exercise the DB-overlay merge logic without
// needing the Next.js toolchain. It is referenced only by the esbuild --alias flag.
export {};
