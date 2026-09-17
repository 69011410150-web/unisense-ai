import { AppStateProvider } from "@/context/AppStateContext";
import { AiAssistant } from "@/pages/AiAssistant";
import { SmartNavigation } from "@/pages/SmartNavigation";
import {
  DEMO_ALL_CLASSES_DONE_ANSWER,
  DEMO_NEXT_CLASS_ANSWER,
  DEMO_ROUTE_PLAN,
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
 * Cover for the accepted request: the fixed 08:30 demo clock makes the quick
 * question "อีก 30 นาทีฉันมีเรียนที่ไหน?" answer with ชีววิทยา 09:00 at
 * อาคารวิทยาศาสตร์ 2 ห้อง SC-204, attach the recommended โรงอาหารกลาง → SC-204
 * route card, and let "🧭 พาฉันไป" open the แผนที่ page with the route already
 * planned — no second button press.
 *
 * The backend is mocked here; the PocketIC lane in `app/test/pocketic` is what
 * proves the real canister returns these values at the fixed demo clock.
 */

const useActorMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
}));

/** Both screens in one router so the hand-off is a real navigation journey. */
function renderAssistantAndNavigation() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppStateProvider>
        <Outlet />
      </AppStateProvider>
    ),
  });
  const aiRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/ai",
    component: AiAssistant,
  });
  const navigateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/navigate",
    component: SmartNavigation,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([aiRoute, navigateRoute]),
    history: createMemoryHistory({ initialEntries: ["/ai"] }),
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

/** Press the pinned quick question through the real suggestion button. */
async function pressQuickQuestion(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", {
      name: "อีก 30 นาทีฉันมีเรียนที่ไหน?",
    }),
  );
}

describe("Next-class answer and route hand-off (fixed 08:30 demo clock)", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("answers the quick question with Biology at 09:00 in SC-204, not the all-classes-finished reply", async () => {
    const user = userEvent.setup();
    const askCampus = vi.fn(async () => DEMO_NEXT_CLASS_ANSWER);
    withActor(createMockActor({ askCampus }));
    renderAssistantAndNavigation();

    await pressQuickQuestion(user);

    // The consumer seam: the pinned question reaches the actor unchanged.
    await waitFor(() => {
      expect(askCampus).toHaveBeenCalledWith("อีก 30 นาทีฉันมีเรียนที่ไหน?");
    });

    const answer = await screen.findByText(/อีก 30 นาทีคุณมีเรียน ชีววิทยา/);
    expect(answer).toHaveTextContent("ชีววิทยา");
    expect(answer).toHaveTextContent("อาคารวิทยาศาสตร์ 2");
    expect(answer).toHaveTextContent("SC-204");
    expect(answer).toHaveTextContent("09:00");

    // The regression this request fixes: the answer must never be the
    // all-classes-finished fallback.
    expect(
      screen.queryByText(DEMO_ALL_CLASSES_DONE_ANSWER.answer),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/เรียนครบทุกคาบ/)).not.toBeInTheDocument();
  });

  it("renders the recommended route card from โรงอาหารกลาง to SC-204 with the demo timings", async () => {
    const user = userEvent.setup();
    withActor(
      createMockActor({ askCampus: vi.fn(async () => DEMO_NEXT_CLASS_ANSWER) }),
    );
    renderAssistantAndNavigation();

    await pressQuickQuestion(user);

    const card = await screen.findByTestId("ai.route_card");
    expect(card).toHaveTextContent("🧭 เส้นทางที่แนะนำ");
    expect(card).toHaveTextContent("โรงอาหารกลาง");
    expect(card).toHaveTextContent("SC-204");
    // Walk 3 minutes, EV สาย 2 about 5 minutes, walk 2 minutes, total ~10.
    expect(card).toHaveTextContent("เดิน 3 นาที");
    expect(card).toHaveTextContent("EV สาย 2");
    expect(card).toHaveTextContent("ประมาณ 5 นาที");
    expect(card).toHaveTextContent("เดินต่ออีก 2 นาที");
    expect(card).toHaveTextContent("รวมทั้งหมดประมาณ 10 นาที");
    // Arriving about 20 minutes before class.
    expect(card).toHaveTextContent("ถึงก่อนเวลาเรียนประมาณ 20 นาที");
  });

  it("offers a '🧭 พาฉันไป' button on the route card", async () => {
    const user = userEvent.setup();
    withActor(
      createMockActor({ askCampus: vi.fn(async () => DEMO_NEXT_CLASS_ANSWER) }),
    );
    renderAssistantAndNavigation();

    await pressQuickQuestion(user);
    await screen.findByTestId("ai.route_card");

    expect(
      screen.getByRole("button", { name: /🧭 พาฉันไป/ }),
    ).toBeInTheDocument();
  });

  it("opens the แผนที่ page with the route already planned when '🧭 พาฉันไป' is pressed", async () => {
    const user = userEvent.setup();
    const planRoute = vi.fn(async () => DEMO_ROUTE_PLAN);
    withActor(
      createMockActor({
        askCampus: vi.fn(async () => DEMO_NEXT_CLASS_ANSWER),
        planRoute,
      }),
    );
    renderAssistantAndNavigation();

    await pressQuickQuestion(user);
    await screen.findByTestId("ai.route_card");

    await user.click(screen.getByRole("button", { name: /🧭 พาฉันไป/ }));

    // The map page plans the handed-over route immediately: the plan section
    // appears without pressing "วางแผนเส้นทาง" again.
    const planSection = await screen.findByTestId("navigate.plan_section");
    expect(planSection).toHaveTextContent("ใช้เวลาประมาณ 10 นาที");
    expect(screen.getByTestId("navigate.arrival_status")).toHaveTextContent(
      "ทันเรียน",
    );
    expect(planRoute).toHaveBeenCalledWith("โรงอาหารกลาง", "SC-204");
  });

  it("shows the simulated route from โรงอาหารกลาง to SC-204 on the map page", async () => {
    const user = userEvent.setup();
    withActor(
      createMockActor({
        askCampus: vi.fn(async () => DEMO_NEXT_CLASS_ANSWER),
        planRoute: vi.fn(async () => DEMO_ROUTE_PLAN),
      }),
    );
    renderAssistantAndNavigation();

    await pressQuickQuestion(user);
    await screen.findByTestId("ai.route_card");
    await user.click(screen.getByRole("button", { name: /🧭 พาฉันไป/ }));

    await screen.findByTestId("navigate.plan_section");
    expect(screen.getByTestId("navigate.total_minutes")).toHaveTextContent(
      "ใช้เวลาประมาณ 10 นาที",
    );
    // The route diagram names both endpoints of the simulated route.
    const diagram = screen.getByTestId("navigate.route_diagram");
    expect(diagram).toHaveTextContent("โรงอาหารกลาง");
    expect(diagram).toHaveTextContent("SC-204");
  });
});
