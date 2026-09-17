import { AppStateProvider } from "@/context/AppStateContext";
import { SmartNavigation } from "@/pages/SmartNavigation";
import {
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

const useActorMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
}));

function renderNavigation() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppStateProvider>
        <Outlet />
      </AppStateProvider>
    ),
  });
  const navigateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/navigate",
    component: SmartNavigation,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([navigateRoute]),
    history: createMemoryHistory({ initialEntries: ["/navigate"] }),
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

/** Plan the pinned โรงอาหารกลาง → SC-204 route through the real form. */
async function planDemoRoute(
  user: ReturnType<typeof userEvent.setup>,
  { expectPlan = true }: { expectPlan?: boolean } = {},
) {
  const origin = await screen.findByTestId("navigate.origin_input");
  const destination = screen.getByTestId("navigate.destination_input");
  await user.clear(origin);
  await user.type(origin, "โรงอาหารกลาง");
  await user.clear(destination);
  await user.type(destination, "SC-204");
  await user.click(screen.getByTestId("navigate.plan_button"));
  if (expectPlan) {
    await screen.findByTestId("navigate.plan_section");
  }
}

describe("Smart Navigation", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("shows the demo notice and an empty state before a route is planned", async () => {
    renderNavigation();

    expect(await screen.findByTestId("navigate.demo_notice")).toHaveTextContent(
      "ไม่ใช่แผนที่จริง",
    );
    expect(screen.getByTestId("navigate.empty_state")).toBeInTheDocument();
  });

  it("shows walking, EV, final walking and total minutes for โรงอาหารกลาง → SC-204", async () => {
    const user = userEvent.setup();
    renderNavigation();
    await planDemoRoute(user);

    expect(screen.getByTestId("navigate.walking_minutes")).toHaveTextContent(
      "3 นาที",
    );
    expect(screen.getByTestId("navigate.ev_minutes")).toHaveTextContent(
      "5 นาที",
    );
    expect(
      screen.getByTestId("navigate.final_walking_minutes"),
    ).toHaveTextContent("2 นาที");
    expect(screen.getByTestId("navigate.total_minutes_card")).toHaveTextContent(
      "10 นาที",
    );
    expect(screen.getByTestId("navigate.total_minutes")).toHaveTextContent(
      "10 นาที",
    );
  });

  it("shows an estimated arrival and an arrive-before-class status", async () => {
    const user = userEvent.setup();
    renderNavigation();
    await planDemoRoute(user);

    const status = screen.getByTestId("navigate.arrival_status");
    // The accepted request pins the map arrival status copy to "ทันเรียน".
    expect(status).toHaveTextContent("ทันเรียน");
    expect(status).toHaveTextContent(`${DEMO_ROUTE_PLAN.estimatedArrival} น.`);
  });

  it("toggles between walking and EV step-by-step instructions", async () => {
    const user = userEvent.setup();
    renderNavigation();
    await planDemoRoute(user);

    expect(screen.getByTestId("navigate.step_list")).toHaveTextContent(
      DEMO_ROUTE_PLAN.walkingSteps[0],
    );

    await user.click(screen.getByTestId("navigate.mode.ev"));
    await waitFor(() => {
      expect(screen.getByTestId("navigate.step_list")).toHaveTextContent(
        DEMO_ROUTE_PLAN.evSteps[0],
      );
    });
    expect(screen.getByTestId("navigate.mode.ev")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("enters an active navigation state and reaches completion", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    renderNavigation();
    await planDemoRoute(user);

    await user.click(screen.getByTestId("navigate.start_button"));

    const active = await screen.findByTestId("navigate.active_navigation");
    expect(active).toHaveTextContent("กำลังนำทางอยู่");
    expect(screen.getByTestId("navigate.progress")).toBeInTheDocument();

    // The simulated navigation runs for 12s; advance past it.
    await vi.advanceTimersByTimeAsync(13_000);

    await waitFor(() => {
      expect(screen.getByTestId("navigate.completion_state")).toHaveTextContent(
        "ถึงปลายทางแล้ว",
      );
    });
    expect(screen.getByTestId("navigate.remaining_minutes")).toHaveTextContent(
      "ถึงแล้ว",
    );
  });

  it("shows a Thai error state when planning fails", async () => {
    const user = userEvent.setup();
    withActor(
      createMockActor({
        planRoute: vi.fn(async () => {
          throw new Error("boom");
        }),
      }),
    );
    renderNavigation();
    await planDemoRoute(user, { expectPlan: false });

    const alert = await screen.findByTestId("navigate.error_state");
    expect(alert).toHaveTextContent("ไม่สามารถวางแผนเส้นทางได้ในขณะนี้");
  });
});
