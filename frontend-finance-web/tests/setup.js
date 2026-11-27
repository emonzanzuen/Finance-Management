import { afterEach, vi } from "vitest";

// Tanpa jaringan: kurs mata uang jatuh ke nilai cadangan.
globalThis.fetch = vi.fn(() => Promise.reject(new Error("offline")));

// jsdom tidak memiliki matchMedia (dipakai ThemeContext).
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  });
}

afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
  try {
    globalThis.localStorage?.clear?.();
  } catch {
    /* environment tanpa localStorage */
  }
});
