/**
 * Stale-page recovery: recognising the error a page from an older deploy
 * throws, and reloading at most once a minute. Pure functions, no server.
 * Run:  pnpm test:stale-page
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STALE_RELOAD_KEY,
  STALE_RELOAD_WINDOW_MS,
  claimStaleReload,
  isStaleActionError,
  staleReloadAllowed,
} from "../../lib/stale-page.ts";

const fakeStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
};

describe("stale page recovery", () => {
  it("recognises the error by name, by message and by digest", () => {
    const byName = Object.assign(new Error("anything"), { name: "UnrecognizedActionError" });
    assert.equal(isStaleActionError(byName), true);
    assert.equal(
      isStaleActionError(
        new Error(
          'Server Action "00e7099d733f328d86d65cafb1655926fd93388780" was not found on the server. Read more: https://nextjs.org/docs/messages/failed-to-find-server-action',
        ),
      ),
      true,
    );
    assert.equal(
      isStaleActionError(Object.assign(new Error("x"), { digest: "failed-to-find-server-action" })),
      true,
    );
  });

  it("leaves every other error alone", () => {
    assert.equal(isStaleActionError(new Error("Could not update the password")), false);
    assert.equal(isStaleActionError(new TypeError("Failed to fetch")), false);
    assert.equal(isStaleActionError("Server Action was not found"), false);
    assert.equal(isStaleActionError(null), false);
    assert.equal(isStaleActionError(undefined), false);
  });

  it("reloads once, then waits a minute before allowing another", () => {
    const storage = fakeStorage();
    const t0 = 1_700_000_000_000;
    assert.equal(staleReloadAllowed(storage, t0), true);
    assert.equal(claimStaleReload(storage, t0), true);
    assert.equal(storage.getItem(STALE_RELOAD_KEY), String(t0));
    assert.equal(staleReloadAllowed(storage, t0 + 1000), false);
    assert.equal(claimStaleReload(storage, t0 + 1000), false, "a loop is cut short");
    assert.equal(claimStaleReload(storage, t0 + STALE_RELOAD_WINDOW_MS), true);
  });

  it("copes with junk in storage", () => {
    const storage = fakeStorage();
    storage.setItem(STALE_RELOAD_KEY, "not a number");
    assert.equal(staleReloadAllowed(storage), true);
  });
});
