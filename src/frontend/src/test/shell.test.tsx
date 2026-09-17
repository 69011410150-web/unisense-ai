import { Layout } from "@/components/Layout";
import { AppStateProvider } from "@/context/AppStateContext";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

/**
 * The app shell: the Thai destinations in a mobile bottom bar and a desktop
 * sidebar, plus the UniSense AI brand mark. Rendered through a real TanStack
 * Router so the active-route wiring is exercised, not stubbed.
 *
 * The request intentionally adds an "AI Scan" destination to the main menu, so
 * these tests pin the destinations that must survive rather than the exact
 * item list: every pre-existing destination is still present, still points at
 * its route, and still navigates there.
 */

/** The destinations that existed before the AI Scan entry was added. */
const EXISTING_DESTINATIONS = [
  { key: "home", path: "/", label: "หน้าหลัก" },
  { key: "ai", path: "/ai", label: "AI" },
  { key: "schedule", path: "/schedule", label: "ตารางเรียน" },
  { key: "navigate", path: "/navigate", label: "แผนที่" },
  { key: "profile", path: "/profile", label: "โปรไฟล์" },
] as const;

function renderShell(initialPath = "/") {
  const rootRoute = createRootRoute({
    component: () => (
      <AppStateProvider>
        <Layout>
          <Outlet />
        </Layout>
      </AppStateProvider>
    ),
  });

  const routes = EXISTING_DESTINATIONS.map(({ path, label }) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => <p>{label}</p>,
    }),
  );

  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  return render(<RouterProvider router={router} />);
}

describe("app shell navigation", () => {
  it("keeps every pre-existing destination in the mobile bottom bar", async () => {
    renderShell();

    const bottom = await screen.findByTestId("nav.bottom");
    for (const { key, path, label } of EXISTING_DESTINATIONS) {
      const link = within(bottom).getByTestId(`nav.bottom.${key}`);
      expect(link).toHaveTextContent(label);
      expect(link).toHaveAttribute("href", path);
    }
  });

  it("keeps every pre-existing destination in the desktop sidebar", async () => {
    renderShell();

    const sidebar = await screen.findByTestId("nav.sidebar");
    for (const { key, path, label } of EXISTING_DESTINATIONS) {
      const link = within(sidebar).getByTestId(`nav.sidebar.${key}`);
      expect(link).toHaveTextContent(label);
      expect(link).toHaveAttribute("href", path);
    }
  });

  it("renders the initial route without a blank screen", async () => {
    renderShell("/");

    // The shell chrome and the routed page both render at the default path.
    expect(await screen.findByTestId("nav.bottom")).toBeInTheDocument();
    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(within(main as HTMLElement).getByText("หน้าหลัก")).toBeInTheDocument();
  });

  it("navigates to each pre-existing destination from the bottom bar", async () => {
    const user = userEvent.setup();
    renderShell();

    const bottom = await screen.findByTestId("nav.bottom");
    for (const { key, label } of EXISTING_DESTINATIONS) {
      await user.click(within(bottom).getByTestId(`nav.bottom.${key}`));
      await waitFor(() => {
        const main = document.querySelector("main");
        expect(main).not.toBeNull();
        expect(
          within(main as HTMLElement).getByText(label),
        ).toBeInTheDocument();
      });
    }
  });

  it("renders the UniSense AI brand mark and marks the active destination", async () => {
    renderShell("/schedule");

    expect((await screen.findAllByText("UniSense AI")).length).toBeGreaterThan(
      0,
    );

    const active = document.querySelector(
      '[data-ocid="nav.bottom.schedule"][aria-current="page"]',
    );
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain("ตารางเรียน");
  });
});
