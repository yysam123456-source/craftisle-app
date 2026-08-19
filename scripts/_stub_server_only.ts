// Test-only stub for the `server-only` package.
// The real `server-only` index.js throws unconditionally ("This module cannot be
// imported from a Client Component module..."). Next.js aliases it away to an empty
// module only during its server build, so plain-Node offline test bundles would crash
// on import. This empty module stands in for it so the standalone optimizer test can
// exercise the DB-overlay merge logic without the Next.js toolchain.
// Referenced only by the esbuild `--alias:server-only=...` flag.
export {};
