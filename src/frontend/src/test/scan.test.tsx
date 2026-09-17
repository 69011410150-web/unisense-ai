import { AppStateProvider } from "@/context/AppStateContext";
import { Scan } from "@/pages/Scan";
import {
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

const useActorMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
}));

function renderScan() {
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
    component: () => <p>Smart Navigation</p>,
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

describe("AI Scan", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("shows the simulated viewfinder and the demo disclosure", async () => {
    renderScan();

    expect(await screen.findByTestId("scan.viewfinder")).toBeInTheDocument();
    expect(screen.getByTestId("scan.simulation_notice")).toHaveTextContent(
      "ไม่ขออนุญาตใช้กล้อง",
    );
    expect(screen.getByTestId("scan.empty_state")).toBeInTheDocument();
  });

  it("shows a scanning animation then the detected result card", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    renderScan();

    await user.click(await screen.findByTestId("scan.primary_button"));

    expect(await screen.findByTestId("scan.loading_state")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1_700);

    const result = await screen.findByTestId("scan.result_card");
    // The accepted request replaces the old "ตรวจพบ: …" line with the
    // "✦ AI ตรวจพบ" result header.
    expect(result).toHaveTextContent("✦ AI ตรวจพบ");
    expect(result).toHaveTextContent(DEMO_SCAN_RESULT.buildingName);
    expect(screen.getByTestId("scan.result_room")).toHaveTextContent("SC-204");
    expect(screen.getByTestId("scan.result_floor")).toHaveTextContent("ชั้น 2");
    expect(screen.getByTestId("scan.result_instruction")).toHaveTextContent(
      "เดินตรง 50 เมตร แล้วเลี้ยวขวา",
    );
  });

  it("opens Smart Navigation with the scanned room as destination", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    renderScan();

    await user.click(await screen.findByTestId("scan.primary_button"));
    await vi.advanceTimersByTimeAsync(1_700);
    await screen.findByTestId("scan.result_card");

    await user.click(screen.getByTestId("scan.navigate_button"));
    await waitFor(() => {
      expect(screen.getByText("Smart Navigation")).toBeInTheDocument();
    });
  });

  it("offers a rescan action after a result", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    renderScan();

    await user.click(await screen.findByTestId("scan.primary_button"));
    await vi.advanceTimersByTimeAsync(1_700);
    await screen.findByTestId("scan.result_card");

    await user.click(screen.getByTestId("scan.rescan_button"));
    expect(await screen.findByTestId("scan.loading_state")).toBeInTheDocument();
  });
});
