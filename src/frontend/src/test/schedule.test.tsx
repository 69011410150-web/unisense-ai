import { AppStateProvider } from "@/context/AppStateContext";
import { Schedule } from "@/pages/Schedule";
import {
  DEMO_SCHEDULE,
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

function renderSchedule() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppStateProvider>
        <Outlet />
      </AppStateProvider>
    ),
  });
  const scheduleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/schedule",
    component: Schedule,
  });
  const navigateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/navigate",
    component: () => <p>Smart Navigation</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([scheduleRoute, navigateRoute]),
    history: createMemoryHistory({ initialEntries: ["/schedule"] }),
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

describe("Schedule", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("defaults to the demo day จันทร์ and lists the three Monday classes", async () => {
    renderSchedule();

    expect(await screen.findByText("วันจันทร์")).toBeInTheDocument();

    for (const entry of DEMO_SCHEDULE) {
      expect(screen.getByText(entry.subject)).toBeInTheDocument();
      expect(screen.getByText(entry.roomCode)).toBeInTheDocument();
    }
    expect(screen.getAllByText("09:00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("13:00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("15:00").length).toBeGreaterThan(0);
  });

  it("opens Smart Navigation with the Biology room as destination", async () => {
    const user = userEvent.setup();
    renderSchedule();

    // The first Monday row is 09:00 Biology — SC-204.
    const navigateButton = await screen.findByTestId(
      "schedule.class.navigate_button.1",
    );
    expect(navigateButton).toHaveAccessibleName(
      "นำทางไป อาคารวิทยาศาสตร์ 2 ห้อง SC-204",
    );

    await user.click(navigateButton);
    await waitFor(() => {
      expect(screen.getByText("Smart Navigation")).toBeInTheDocument();
    });
  });

  it("switches to another day and shows that day's state", async () => {
    const user = userEvent.setup();
    renderSchedule();

    // อังคาร is the second day in the Monday-first week overview. The demo
    // dataset only has Monday classes, so Tuesday shows its empty state.
    await user.click(await screen.findByTestId("schedule.week_overview.day.2"));

    expect(await screen.findByText("วันอังคาร")).toBeInTheDocument();
    expect(screen.getByTestId("schedule.empty_state")).toHaveTextContent(
      "วันอังคารไม่มีคลาส",
    );
  });
});
