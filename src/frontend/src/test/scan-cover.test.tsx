import { Layout } from "@/components/Layout";
import { AppStateProvider } from "@/context/AppStateContext";
import { Home } from "@/pages/Home";
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
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted AI Scan request:
 *
 *   - "AI Scan 📷" is a destination in both the desktop sidebar and the mobile
 *     bottom bar, and pressing it opens /scan;
 *   - the Home quick-action "AI Scan 📷" opens /scan;
 *   - the AI Scan destination is highlighted as the current item on /scan;
 *   - the simulated viewfinder shows "ส่องกล้องไปที่ป้ายอาคาร" before scanning
 *     and "AI กำลังวิเคราะห์สถานที่..." while scanning;
 *   - the result card shows "✦ AI ตรวจพบ", the building, floor and room, the
 *     "ต้องการให้ AI พาไปยังห้องนี้ไหม?" question and the "🧭 พาฉันไป" button;
 *   - "🧭 พาฉันไป" opens /navigate with the SC-204 route already planned
 *     (about 10 minutes, arriving about 08:40), without pressing
 *     "วางแผนเส้นทาง" again;
 *   - the screen states plainly that the scan is simulated and uses no real
 *     camera or GPS.
 *
 * The backend is mocked here; the PocketIC lane in `app/test/pocketic` is what
 * proves the real canister returns the fixed SC-204 detection.
 */

const useActorMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
}));

function withActor(actor: MockActor) {
  useActorMock.mockReturnValue({
    actor,
    isFetching: false,
    isError: false,
    error: null,
  });
}

/**
 * The whole shell plus the screens the request touches, so the nav entry, the
 * Home shortcut and the scan → map hand-off are all real navigations.
 */
function renderApp(initialPath = "/") {
  const rootRoute = createRootRoute({
    component: () => (
      <AppStateProvider>
        <Layout>
          <Outlet />
        </Layout>
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
  const navigateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/navigate",
    component: SmartNavigation,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute, scanRoute, navigateRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return renderWithProviders(<RouterProvider router={router} />);
}

/** Run the simulated scan and wait for the result card to appear. */
async function runScanToResult(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByTestId("scan.primary_button"));
  await screen.findByTestId("scan.loading_state");
  await vi.advanceTimersByTimeAsync(1_700);
  return screen.findByTestId("scan.result_card");
}

describe("AI Scan cover", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("lists AI Scan in both the desktop sidebar and the mobile bottom bar", async () => {
    renderApp();

    const sidebar = await screen.findByTestId("nav.sidebar");
    const sidebarScan = within(sidebar).getByTestId("nav.sidebar.scan");
    expect(sidebarScan).toHaveTextContent("AI Scan 📷");
    expect(sidebarScan).toHaveAttribute("href", "/scan");

    const bottom = screen.getByTestId("nav.bottom");
    const bottomScan = within(bottom).getByTestId("nav.bottom.scan");
    expect(bottomScan).toHaveTextContent("AI Scan 📷");
    expect(bottomScan).toHaveAttribute("href", "/scan");
  });

  it("opens the scan screen from the main menu", async () => {
    const user = userEvent.setup();
    renderApp();

    const bottom = await screen.findByTestId("nav.bottom");
    await user.click(within(bottom).getByTestId("nav.bottom.scan"));

    expect(await screen.findByTestId("scan.viewfinder")).toBeInTheDocument();
  });

  it("opens the scan screen from the Home quick action", async () => {
    const user = userEvent.setup();
    renderApp();

    const shortcut = await screen.findByTestId("home.quick_action.scan");
    expect(shortcut).toHaveTextContent("AI Scan 📷");
    await user.click(shortcut);

    expect(await screen.findByTestId("scan.viewfinder")).toBeInTheDocument();
  });

  it("highlights the AI Scan destination as current on the scan screen", async () => {
    renderApp("/scan");

    await screen.findByTestId("scan.viewfinder");

    const active = document.querySelector(
      '[data-ocid="nav.bottom.scan"][aria-current="page"]',
    );
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain("AI Scan 📷");

    const sidebarActive = document.querySelector(
      '[data-ocid="nav.sidebar.scan"][aria-current="page"]',
    );
    expect(sidebarActive).not.toBeNull();
  });

  it("shows the simulated viewfinder prompt and the no-camera disclosure", async () => {
    renderApp("/scan");

    const viewfinder = await screen.findByTestId("scan.viewfinder");
    expect(viewfinder).toHaveTextContent("ส่องกล้องไปที่ป้ายอาคาร");

    // The screen must state plainly that this is a simulation.
    const notice = screen.getByTestId("scan.simulation_notice");
    expect(notice).toHaveTextContent("โหมดสาธิต");
    expect(notice).toHaveTextContent("ไม่ขออนุญาตใช้กล้อง");
  });

  it("shows the analysing status while the simulated scan runs", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    renderApp("/scan");

    await user.click(await screen.findByTestId("scan.primary_button"));

    const loading = await screen.findByTestId("scan.loading_state");
    expect(loading).toHaveTextContent("AI กำลังวิเคราะห์สถานที่...");
  });

  it("renders the full detection result card after scanning", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    renderApp("/scan");

    const result = await runScanToResult(user);

    expect(result).toHaveTextContent("✦ AI ตรวจพบ");
    expect(screen.getByTestId("scan.result_building")).toHaveTextContent(
      "อาคารวิทยาศาสตร์ 2",
    );
    expect(screen.getByTestId("scan.result_location")).toHaveTextContent(
      "อาคารวิทยาศาสตร์ 2",
    );
    expect(screen.getByTestId("scan.result_floor")).toHaveTextContent("ชั้น 2");
    expect(screen.getByTestId("scan.result_room")).toHaveTextContent("SC-204");
    expect(result).toHaveTextContent("ต้องการให้ AI พาไปยังห้องนี้ไหม?");
    expect(screen.getByTestId("scan.navigate_button")).toHaveTextContent(
      "🧭 พาฉันไป",
    );
    // The rescan action is offered after a result.
    expect(screen.getByTestId("scan.rescan_button")).toHaveTextContent(
      "สแกนใหม่",
    );
  });

  it("opens the map with the SC-204 route already planned when พาฉันไป is pressed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    const planRoute = vi.fn(async () => DEMO_ROUTE_PLAN);
    withActor(createMockActor({ planRoute }));
    renderApp("/scan");

    await runScanToResult(user);
    await user.click(screen.getByTestId("scan.navigate_button"));

    // The map page plans the handed-over route immediately: the plan section
    // appears without pressing "วางแผนเส้นทาง" again.
    const planSection = await screen.findByTestId("navigate.plan_section");
    expect(planSection).toHaveTextContent("ใช้เวลาประมาณ 10 นาที");
    expect(planSection).toHaveTextContent(
      `ถึงราว ${DEMO_ROUTE_PLAN.estimatedArrival} น.`,
    );
    expect(screen.getByTestId("navigate.total_minutes")).toHaveTextContent(
      "10 นาที",
    );
    expect(screen.getByTestId("navigate.arrival_status")).toHaveTextContent(
      "ทันเรียน",
    );
    // The scanned room is the destination the map planned for.
    expect(planRoute).toHaveBeenCalledWith(
      "ตำแหน่งปัจจุบันของคุณ",
      DEMO_SCAN_RESULT.roomCode,
    );
  });

  it("shows a Thai error state and a retry action when the scan fails", async () => {
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
    renderApp("/scan");

    await user.click(await screen.findByTestId("scan.primary_button"));
    await vi.advanceTimersByTimeAsync(1_700);

    const error = await screen.findByTestId("scan.error_state");
    expect(error).toHaveTextContent("สแกนไม่สำเร็จ");
    expect(screen.getByTestId("scan.retry_button")).toHaveTextContent(
      "ลองอีกครั้ง",
    );
    expect(screen.queryByTestId("scan.result_card")).not.toBeInTheDocument();
  });

  it("keeps the pre-existing destinations in the main menu", async () => {
    renderApp();

    const bottom = await screen.findByTestId("nav.bottom");
    for (const key of ["home", "ai", "schedule", "navigate", "profile"]) {
      expect(
        within(bottom).getByTestId(`nav.bottom.${key}`),
      ).toBeInTheDocument();
    }

    const sidebar = screen.getByTestId("nav.sidebar");
    for (const key of ["home", "ai", "schedule", "navigate", "profile"]) {
      expect(
        within(sidebar).getByTestId(`nav.sidebar.${key}`),
      ).toBeInTheDocument();
    }
  });
});
