import { AppStateProvider } from "@/context/AppStateContext";
import { Scan } from "@/pages/Scan";
import { SmartNavigation } from "@/pages/SmartNavigation";
import {
  DEMO_ROUTE_PLAN,
  DEMO_SCAN_RESULT,
  type MockActor,
  createMockActor,
  renderWithProviders,
} from "@/test/harness";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization baseline for the existing AI Scan screen, captured before
 * the request refines its copy and adds an auto-planned route hand-off.
 *
 * The request intentionally changes the scan screen's Thai wording and the way
 * its action button hands the route to the map page, so this file deliberately
 * does NOT assert the current copy or the current hand-off shape. It pins the
 * behavior that must survive the rewrite:
 *
 *   - the simulated viewfinder renders before any scan;
 *   - pressing the primary action calls the actor's `scan()` exactly once;
 *   - a loading state is shown while the simulated scan runs;
 *   - the result card renders the building/room/floor the actor returned;
 *   - the action button opens the map page with the scanned room as the
 *     destination;
 *   - a failed scan shows a Thai error state instead of a blank screen;
 *   - rescanning runs the scan again.
 *
 * The backend is mocked here; the PocketIC lane in `app/test/pocketic` is what
 * proves the real canister returns these values.
 */

const useActorMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
}));

/** Both screens in one router so the hand-off is a real navigation journey. */
function renderScanAndNavigation() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppStateProvider>
        <Outlet />
      </AppStateProvider>
    ),
  });
  const scanRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/scan",
    component: Scan,
  });
  const navigateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/navigate",
    component: SmartNavigation,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([scanRoute, navigateRoute]),
    history: createMemoryHistory({ initialEntries: ["/scan"] }),
  });
  return renderWithProviders(<RouterProvider router={router} />);
}

function withActor(actor: MockActor) {
  useActorMock.mockReturnValue({
    actor,
    isFetching: false,
    isError: false,
    error: null,
  });
}

/** Run the simulated scan and wait for the result card to appear. */
async function runScanToResult(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByTestId("scan.primary_button"));
  await screen.findByTestId("scan.loading_state");
  await vi.advanceTimersByTimeAsync(1_700);
  return screen.findByTestId("scan.result_card");
}

describe("AI Scan baseline (pre-existing behavior)", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("shows the simulated viewfinder before any scan", async () => {
    renderScanAndNavigation();

    expect(await screen.findByTestId("scan.viewfinder")).toBeInTheDocument();
    expect(screen.getByTestId("scan.simulation_notice")).toBeInTheDocument();
    expect(screen.getByTestId("scan.empty_state")).toBeInTheDocument();
  });

  it("calls the actor's scan() and shows a loading state while it runs", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    const scan = vi.fn(async () => DEMO_SCAN_RESULT);
    withActor(createMockActor({ scan }));
    renderScanAndNavigation();

    await user.click(await screen.findByTestId("scan.primary_button"));

    // The consumer seam: the screen runs the real scan mutation.
    await waitFor(() => {
      expect(scan).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByTestId("scan.loading_state")).toBeInTheDocument();
  });

  it("renders the building, room and floor the actor returned", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    renderScanAndNavigation();

    const result = await runScanToResult(user);

    expect(result).toHaveTextContent(DEMO_SCAN_RESULT.buildingName);
    expect(screen.getByTestId("scan.result_room")).toHaveTextContent(
      DEMO_SCAN_RESULT.roomCode,
    );
    expect(screen.getByTestId("scan.result_floor")).toHaveTextContent(
      `ชั้น ${Number(DEMO_SCAN_RESULT.floor)}`,
    );
  });

  it("opens the map page with the scanned room as the destination", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    const planRoute = vi.fn(async () => DEMO_ROUTE_PLAN);
    withActor(createMockActor({ planRoute }));
    renderScanAndNavigation();

    await runScanToResult(user);
    await user.click(screen.getByTestId("scan.navigate_button"));

    // The map page opens with the scanned room as its destination, whichever
    // way the request chooses to hand the route over.
    await screen.findByTestId("navigate.destination_input");
    await waitFor(() => {
      expect(screen.getByTestId("navigate.destination_input")).toHaveValue(
        DEMO_SCAN_RESULT.roomCode,
      );
    });
  });

  it("shows a Thai error state when the scan fails", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    withActor(
      createMockActor({
        scan: vi.fn(async () => {
          throw new Error("boom");
        }),
      }),
    );
    renderScanAndNavigation();

    await user.click(await screen.findByTestId("scan.primary_button"));
    await vi.advanceTimersByTimeAsync(1_700);

    const error = await screen.findByTestId("scan.error_state");
    expect(error).toHaveTextContent("สแกนไม่สำเร็จ");
    expect(screen.queryByTestId("scan.result_card")).not.toBeInTheDocument();
  });

  it("runs the scan again when the rescan action is pressed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    const scan = vi.fn(async () => DEMO_SCAN_RESULT);
    withActor(createMockActor({ scan }));
    renderScanAndNavigation();

    await runScanToResult(user);
    expect(scan).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("scan.rescan_button"));

    await waitFor(() => {
      expect(scan).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByTestId("scan.loading_state")).toBeInTheDocument();
  });
});
