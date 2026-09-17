/**
 * Test-only stand-in for `@caffeineai/object-storage`.
 *
 * The generated `src/backend.ts` imports `ExternalBlob` from that package at
 * runtime, but the installed `@caffeineai/object-storage@1.1.1` build is
 * incomplete: its `dist/index.js` imports `./blob`, which is not shipped, so
 * loading it throws `Cannot find module .../dist/blob` under Vitest.
 *
 * The app only ever uses `ExternalBlob` as a type in generated bindings and
 * never exercises object storage in these journeys, so a type-compatible stub
 * is enough to let the module graph load. This stub is aliased in
 * `vitest.config.ts` and is never part of the production bundle.
 */
export class ExternalBlob {
  constructor(
    public readonly bytes: Uint8Array = new Uint8Array(),
    public readonly contentType: string = "application/octet-stream",
  ) {}
}
