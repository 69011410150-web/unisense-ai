import { AppStateProvider } from "@/context/AppStateContext";
import { Home } from "@/pages/Home";
import { Scan } from "@/pages/Scan";
import { createMockActor, renderWithProviders } from "@/test/harness";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization baseline for the Home page's quick-action shortcuts,
 * captured before the request refines the AI Scan shortcut's wording.
 *
 * The request intentionally changes the scan shortcut's label, so this file
 * does NOT assert the current "Scan" text. It pins the behavior that must
 * survive: the scan shortcut still opens the /scan screen, and the other
 * pre-existing shortcuts still open their own screens.
 */

const useActorMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
}));

/** Home plus the screens its shortcuts open, so navigation is observable. */
function renderHomeWithDestinations() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppStateProvider>
        <Outlet />
      </AppStateProvider>
    ),
  });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: Home,
  });
  const scanRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/scan",
    component: Scan,
  });
  const scheduleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/schedule",
    component: () => <p>ตารางเรียน</p>,
  });
  const navigateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/navigate",
    component: () => <p>แผนที่</p>,
  });
  const evRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/ev",
    component: () => <p>รถ EV</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      homeRoute,
      scanRoute,
      scheduleRoute,
      navigateRoute,
      evRoute,
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return renderWithProviders(<RouterProvider router={router} />);
}

describe("Home quick-action shortcuts (pre-existing behavior)", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    useActorMock.mockReturnValue({
      actor: createMockActor(),
      isFetching: false,
      isError: false,
      error: null,
    });
  });

  it("keeps the scan shortcut pointing at the /scan screen", async () => {
    renderHomeWithDestinations();

    const scanShortcut = await screen.findByTestId("home.quick_action.scan");
    expect(scanShortcut).toHaveAttribute("href", "/scan");
  });

  it("opens the scan screen when the scan shortcut is pressed", async () => {
    const user = userEvent.setup();
    renderHomeWithDestinations();

    await user.click(await screen.findByTestId("home.quick_action.scan"));

    expect(await screen.findByTestId("scan.viewfinder")).toBeInTheDocument();
  });

  it("keeps the other shortcuts pointing at their own screens", async () => {
    renderHomeWithDestinations();

    const actions = await screen.findByTestId("home.quick_actions.section");
    expect(
      within(actions).getByTestId("home.quick_action.schedule"),
    ).toHaveAttribute("href", "/schedule");
    expect(
      within(actions).getByTestId("home.quick_action.navigate"),
    ).toHaveAttribute("href", "/navigate");
    expect(within(actions).getByTestId("home.quick_action.ev")).toHaveAttribute(
      "href",
      "/ev",
    );
  });

  it("opens the schedule screen from its shortcut", async () => {
    const user = userEvent.setup();
    renderHomeWithDestinations();

    await user.click(await screen.findByTestId("home.quick_action.schedule"));

    await waitFor(() => {
      expect(screen.getByText("ตารางเรียน")).toBeInTheDocument();
    });
  });
});
