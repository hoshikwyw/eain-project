/**
 * The avatar value stored in profiles.avatar_url: round trips, junk is
 * refused, defaults are stable, palettes are sound. No server needed.
 * Run:  pnpm test:avatar
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AVATAR_PALETTES,
  AVATAR_PALETTE_NAMES,
  AVATAR_VARIANTS,
  parseGeneratedAvatar,
  randomSeed,
  resolveAvatar,
  serializeAvatar,
} from "../../features/profile/avatar.ts";

describe("avatar value", () => {
  it("round trips through the stored form", () => {
    for (const variant of AVATAR_VARIANTS) {
      for (const palette of AVATAR_PALETTE_NAMES) {
        const avatar = { kind: "generated" as const, variant, palette, seed: "k7x2m9ab" };
        const stored = serializeAvatar(avatar);
        assert.equal(stored, `boring:${variant}:${palette}:k7x2m9ab`);
        assert.deepEqual(parseGeneratedAvatar(stored), avatar);
      }
    }
  });

  it("refuses anything that is not a known style, palette and seed", () => {
    for (const bad of [
      "",
      "boring:",
      "boring:beam",
      "boring:beam:eain",
      "boring:beam:eain:",
      "boring:beam:eain:ab:cd",
      "boring:cube:eain:abc",
      "boring:beam:neon:abc",
      "boring:beam:eain:ABC",
      "boring:beam:eain:" + "a".repeat(65),
      "https://example.com/me.png",
      "javascript:alert(1)",
    ]) {
      assert.equal(parseGeneratedAvatar(bad), null, bad);
    }
  });

  it("falls back to a picture seeded by the user id", () => {
    const id = "7e2a1d5c-2f6b-4b9a-9c1e-0a1b2c3d4e5f";
    const fallback = { kind: "generated", variant: "beam", palette: "eain", seed: id };
    assert.deepEqual(resolveAvatar(null, id), fallback);
    assert.deepEqual(resolveAvatar("boring:nope", id), fallback);
    assert.deepEqual(resolveAvatar("http://insecure.example/me.png", id), fallback);
    assert.deepEqual(resolveAvatar("https://lh3.googleusercontent.com/a/x", id), {
      kind: "photo",
      src: "https://lh3.googleusercontent.com/a/x",
    });
  });

  it("palettes hold five hex colours each and seeds match the pattern", () => {
    for (const colors of Object.values(AVATAR_PALETTES)) {
      assert.equal(colors.length, 5);
      for (const c of colors) assert.match(c, /^#[0-9a-f]{6}$/);
    }
    for (let i = 0; i < 20; i++) {
      const seed = randomSeed();
      assert.match(seed, /^[a-z0-9]{8}$/);
      assert.ok(parseGeneratedAvatar(`boring:ring:sea:${seed}`));
    }
  });
});
