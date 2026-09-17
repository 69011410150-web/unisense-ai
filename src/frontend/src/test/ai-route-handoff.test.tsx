import { AppStateProvider } from "@/context/AppStateContext";
import { AiAssistant } from "@/pages/AiAssistant";
import { SmartNavigation } from "@/pages/SmartNavigation";
import {
  DEMO_ANSWER,
  DEMO_ROUTE_ANSWER,
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
 * Characterization baseline for the AI-answer → route-card → Smart Navigation
 * hand-off. The request adds a route card to the next-class answer and renames
 * the card's action button, so these tests pin the surrounding behavior that
 * must survive: the card's full contents, the requestRoute/navigate seam, and
 * Smart Navigation's consumption of a handed-over route request.
 *
 * The button is located by its stable `data-ocid`, never by its label, because
 * the label is exactly what the request intentionally changes.
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

/** Ask a question through the real input so the mutation path is exercised. */
async function ask(user: ReturnType<typeof userEvent.setup>, question: string) {
  const input = await screen.findByTestId("ai.input");
  await user.type(input, question);
  await user.click(screen.getByTestId("ai.submit_button"));
}

describe("AI answer route hand-off", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("renders the full recommended route card for a route answer", async () => {
    const user = userEvent.setup();
    const askCampus = vi.fn(async () => DEMO_ROUTE_ANSWER);
    withActor(createMockActor({ askCampus }));
    renderAssistantAndNavigation();

    const question = "จากโรงอาหารไปตึกวิทยาศาสตร์ยังไง?";
    await ask(user, question);

    // The consumer seam: the typed question reaches the actor unchanged.
    await waitFor(() => {
      expect(askCampus).toHaveBeenCalledWith(question);
    });

    const card = await screen.findByTestId("ai.route_card");
    expect(card).toHaveTextContent("เส้นทางที่แนะนำ");
    expect(card).toHaveTextContent(DEMO_ROUTE_PLAN.originName);
    expect(card).toHaveTextContent(DEMO_ROUTE_PLAN.destinationName);
    // The three legs and the total, as the plan reports them.
    expect(card).toHaveTextContent(
      `เดิน ${Number(DEMO_ROUTE_PLAN.walkingMinutes)} นาที`,
    );
    expect(card).toHaveTextContent(
      `ถึงประมาณ ${DEMO_ROUTE_PLAN.estimatedArrival} น.`,
    );
    // The accepted request replaces the old badge with the "arriving about 20
    // minutes before class" line on the route card.
    expect(card).toHaveTextContent("ถึงก่อนเวลาเรียนประมาณ 20 นาที");
  });

  it("hands the route to Smart Navigation and pre-fills the map form", async () => {
    const user = userEvent.setup();
    withActor(
      createMockActor({ askCampus: vi.fn(async () => DEMO_ROUTE_ANSWER) }),
    );
    renderAssistantAndNavigation();

    await ask(user, "จากโรงอาหารไปตึกวิทยาศาสตร์ยังไง?");
    await screen.findByTestId("ai.route_card");

    await user.click(screen.getByTestId("ai.open_navigation_button"));

    // The map page opens with the handed-over origin/destination already in
    // the form, plus the prefill notice. Planning itself is a separate action.
    await screen.findByTestId("navigate.prefill_notice");
    expect(screen.getByTestId("navigate.origin_input")).toHaveValue(
      DEMO_ROUTE_PLAN.originName,
    );
    expect(screen.getByTestId("navigate.destination_input")).toHaveValue(
      DEMO_ROUTE_PLAN.destinationName,
    );
  });

  it("plans the pre-filled route and shows its total and arrival status", async () => {
    const user = userEvent.setup();
    withActor(
      createMockActor({ askCampus: vi.fn(async () => DEMO_ROUTE_ANSWER) }),
    );
    renderAssistantAndNavigation();

    await ask(user, "จากโรงอาหารไปตึกวิทยาศาสตร์ยังไง?");
    await screen.findByTestId("ai.route_card");
    await user.click(screen.getByTestId("ai.open_navigation_button"));
    await screen.findByTestId("navigate.prefill_notice");

    await user.click(screen.getByTestId("navigate.plan_button"));

    await screen.findByTestId("navigate.plan_section");
    expect(screen.getByTestId("navigate.total_minutes")).toHaveTextContent(
      `${Number(DEMO_ROUTE_PLAN.totalMinutes)} นาที`,
    );
    // The accepted request pins the map arrival status copy to "ทันเรียน".
    expect(screen.getByTestId("navigate.arrival_status")).toHaveTextContent(
      "ทันเรียน",
    );
  });

  it("shows no route card for an answer that carries no route", async () => {
    const user = userEvent.setup();
    withActor(createMockActor({ askCampus: vi.fn(async () => DEMO_ANSWER) }));
    renderAssistantAndNavigation();

    await ask(user, "อีก 30 นาทีฉันมีเรียนที่ไหน?");

    await waitFor(() => {
      expect(screen.getByText(DEMO_ANSWER.answer)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("ai.route_card")).not.toBeInTheDocument();
  });
});
