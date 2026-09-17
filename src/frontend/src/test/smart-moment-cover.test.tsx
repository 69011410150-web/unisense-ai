import { AppStateProvider } from "@/context/AppStateContext";
import { Home } from "@/pages/Home";
import { SmartNavigation } from "@/pages/SmartNavigation";
import {
  DEMO_ROUTE_PLAN,
  DEMO_SMART_MOMENT,
  type MockActor,
  createMockActor,
  renderWithProviders,
} from "@/test/harness";
import { SituationLevel } from "@/types";
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
 * Cover for the accepted request: the Home page gains a proactive Smart Moment
 * card ("✦ AI แนะนำสำหรับคุณ") that shows the demo student's situation, the
 * route analysis and four timing metrics, and whose "🧭 เริ่มเดินทาง" button
 * opens the แผนที่ page with the โรงอาหารกลาง → SC-204 route already planned.
 *
 * The backend is mocked here; the PocketIC lane in `app/test/pocketic` is what
 * proves the real canister returns these values at the fixed demo clock.
 */

const useActorMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
}));

/** Both screens in one router so the hand-off is a real navigation journey. */
function renderHomeAndNavigation() {
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
  const navigateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/navigate",
    component: SmartNavigation,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute, navigateRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
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

describe("Smart Moment proactive recommendation card", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("renders the card heading, situation line and room on the home page", async () => {
    renderHomeAndNavigation();

    const card = await screen.findByTestId("home.smart_moment.card");
    expect(card).toHaveTextContent("✦ AI แนะนำสำหรับคุณ");
    expect(card).toHaveTextContent("อีก 30 นาทีคุณมีเรียน ชีววิทยา");
    expect(card).toHaveTextContent("อาคารวิทยาศาสตร์ 2 ห้อง SC-204");
  });

  it("renders the route analysis line, the four metrics and the arrival time", async () => {
    renderHomeAndNavigation();

    const card = await screen.findByTestId("home.smart_moment.card");
    expect(card).toHaveTextContent("ฉันวิเคราะห์เส้นทางให้แล้ว");
    expect(card).toHaveTextContent("⏱️ ใช้เวลาเดินทางประมาณ 10 นาที");
    expect(card).toHaveTextContent("✅ หากออกตอนนี้ คุณจะถึงก่อนเรียนประมาณ 20 นาที");

    // The four timing metrics: remaining 30, walk 3, EV 5, total 10.
    expect(card).toHaveTextContent("เหลือ");
    expect(card).toHaveTextContent("เดิน");
    expect(card).toHaveTextContent("รถ EV");
    expect(card).toHaveTextContent("รวม");
    for (const value of ["30", "3", "5", "10"]) {
      expect(within(card).getAllByText(value).length).toBeGreaterThan(0);
    }

    expect(card).toHaveTextContent("ถึงประมาณ 08:40 น.");
    expect(card).toHaveTextContent("AI วิเคราะห์จากตารางเรียน เวลา และเส้นทาง");
  });

  it("shows situation A at the fixed 08:30 demo clock", async () => {
    renderHomeAndNavigation();

    const situation = await screen.findByTestId("home.smart_moment.situation");
    expect(situation).toHaveTextContent(
      "คุณยังมีเวลา 20 นาที แนะนำให้ออกเดินทางตอนนี้",
    );
  });

  it("selects situation B when the remaining time is tight but still arriving", async () => {
    // 12 minutes remaining vs 10 minutes of travel: not comfortably ahead
    // (12 <= 10 + 5) but the route still arrives before class.
    withActor(
      createMockActor({
        getSmartMoment: vi.fn(async () => ({
          ...DEMO_SMART_MOMENT,
          minutesRemaining: 12n,
          situation: SituationLevel.B,
          situationMessage: "⚠️ เวลาค่อนข้างกระชั้น ฉันแนะนำเส้นทางที่เร็วที่สุด",
        })),
      }),
    );
    renderHomeAndNavigation();

    const situation = await screen.findByTestId("home.smart_moment.situation");
    expect(situation).toHaveTextContent(
      "⚠️ เวลาค่อนข้างกระชั้น ฉันแนะนำเส้นทางที่เร็วที่สุด",
    );
  });

  it("selects situation C when the route cannot arrive before class", async () => {
    withActor(
      createMockActor({
        getSmartMoment: vi.fn(async () => ({
          ...DEMO_SMART_MOMENT,
          minutesRemaining: 4n,
          arriveBeforeClass: false,
          situation: SituationLevel.C,
          situationMessage: "⚠️ เส้นทางปกติอาจไปไม่ทัน ฉันเลือกเส้นทางที่เร็วที่สุดให้แล้ว",
        })),
      }),
    );
    renderHomeAndNavigation();

    const situation = await screen.findByTestId("home.smart_moment.situation");
    expect(situation).toHaveTextContent(
      "⚠️ เส้นทางปกติอาจไปไม่ทัน ฉันเลือกเส้นทางที่เร็วที่สุดให้แล้ว",
    );
    // The "arrive before class" line is replaced by the warning.
    expect(screen.getByTestId("home.smart_moment.card")).toHaveTextContent(
      "⚠️ หากออกตอนนี้ อาจไปไม่ทันเวลาเรียน",
    );
  });

  it("shows the no-class empty state when the backend reports no Smart Moment", async () => {
    withActor(createMockActor({ getSmartMoment: vi.fn(async () => null) }));
    renderHomeAndNavigation();

    expect(
      await screen.findByTestId("home.smart_moment.empty_state"),
    ).toHaveTextContent("วันนี้ไม่มีคลาสเหลือแล้ว");
    expect(
      screen.queryByTestId("home.smart_moment.card"),
    ).not.toBeInTheDocument();
  });

  it("opens the map page with the route already planned when เริ่มเดินทาง is pressed", async () => {
    const user = userEvent.setup();
    const planRoute = vi.fn(async () => DEMO_ROUTE_PLAN);
    withActor(createMockActor({ planRoute }));
    renderHomeAndNavigation();

    await screen.findByTestId("home.smart_moment.card");
    await user.click(screen.getByTestId("home.smart_moment.start_button"));

    // The map page plans the handed-over route immediately: the plan section
    // appears without pressing "วางแผนเส้นทาง" again.
    const planSection = await screen.findByTestId("navigate.plan_section");
    expect(planSection).toHaveTextContent("ใช้เวลาประมาณ 10 นาที");
    expect(planSection).toHaveTextContent(
      `ถึงราว ${DEMO_ROUTE_PLAN.estimatedArrival} น.`,
    );
    expect(screen.getByTestId("navigate.arrival_status")).toHaveTextContent(
      "ทันเรียน",
    );
    expect(planRoute).toHaveBeenCalledWith("โรงอาหารกลาง", "SC-204");
  });

  it("shows the progress bar and reaches completion after เริ่มเดินทาง", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    renderHomeAndNavigation();

    await screen.findByTestId("home.smart_moment.card");
    await user.click(screen.getByTestId("home.smart_moment.start_button"));
    await screen.findByTestId("navigate.plan_section");

    await user.click(screen.getByTestId("navigate.start_button"));
    await screen.findByTestId("navigate.active_navigation");
    expect(screen.getByTestId("navigate.progress")).toBeInTheDocument();

    // The simulated navigation runs for 12s; advance past it.
    await vi.advanceTimersByTimeAsync(13_000);

    await waitFor(() => {
      expect(screen.getByTestId("navigate.completion_state")).toHaveTextContent(
        "ถึงปลายทางแล้ว",
      );
    });
    expect(
      screen.getByRole("button", { name: /นำทางอีกครั้ง/ }),
    ).toBeInTheDocument();
  });
});
