import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// The app marks interactive elements with `data-ocid`, not `data-testid`.
// Point Testing Library's test-id queries at that attribute so tests can use
// the same stable hooks the production markup already exposes.
configure({ testIdAttribute: "data-ocid" });

// jsdom does not implement these browser APIs that the app shell touches.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

if (!window.HTMLElement.prototype.scrollTo) {
  window.HTMLElement.prototype.scrollTo = () => {};
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
