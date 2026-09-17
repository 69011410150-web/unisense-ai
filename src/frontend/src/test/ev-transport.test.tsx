import { AppStateProvider } from "@/context/AppStateContext";
import { EvTransport } from "@/pages/EvTransport";
import {
  DEMO_EV_LINES,
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

function renderEv() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppStateProvider>
        <Outlet />
      </AppStateProvider>
    ),
  });
  const evRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/ev",
    component: EvTransport,
  });
  const navigateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/navigate",
    component: () => <p>Smart Navigation</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([evRoute, navigateRoute]),
    history: createMemoryHistory({ initialEntries: ["/ev"] }),
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

describe("EV Transport", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("shows both demo lines with next station, arrival minutes and Thai crowd level", async () => {
    renderEv();

    const line1 = await screen.findByTestId("ev.line_card.1");
    expect(line1).toHaveTextContent("EV สาย 1");
    expect(line1).toHaveTextContent("สถานีถัดไป:");
    expect(line1).toHaveTextContent("อาคารเรียนรวม");
    expect(line1).toHaveTextContent("ปานกลาง");

    const line2 = screen.getByTestId("ev.line_card.2");
    expect(line2).toHaveTextContent("EV สาย 2");
    expect(line2).toHaveTextContent("โรงอาหารกลาง");
    expect(line2).toHaveTextContent("น้อย");
  });

  it("counts down over time", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderEv();

    const arrival = await screen.findByTestId("ev.arrival.1");
    expect(arrival).toHaveTextContent("4");

    // EV สาย 1 arrives in 4 minutes (240s). After 60s the countdown reads 3.
    await vi.advanceTimersByTimeAsync(60_000);

    await waitFor(() => {
      expect(screen.getByTestId("ev.arrival.1")).toHaveTextContent("3");
    });
  });

  it("expands and collapses the stop sequence", async () => {
    const user = userEvent.setup();
    renderEv();

    const toggle = await screen.findByTestId("ev.toggle_stops.1");
    expect(screen.queryByTestId("ev.stop_sequence.1")).not.toBeInTheDocument();

    await user.click(toggle);
    const sequence = await screen.findByTestId("ev.stop_sequence.1");
    expect(sequence).toHaveTextContent("ป้ายรถ EV หน้าหอสมุด");
    expect(sequence).toHaveTextContent("อาคารวิทยาศาสตร์ 2");

    await user.click(toggle);
    await waitFor(() => {
      expect(
        screen.queryByTestId("ev.stop_sequence.1"),
      ).not.toBeInTheDocument();
    });
  });

  it("opens Smart Navigation toward the next station", async () => {
    const user = userEvent.setup();
    renderEv();

    await user.click(await screen.findByTestId("ev.navigate_button.1"));
    await waitFor(() => {
      expect(screen.getByText("Smart Navigation")).toBeInTheDocument();
    });
  });

  it("shows the demo disclosure", async () => {
    renderEv();
    expect(await screen.findByTestId("ev.demo_notice")).toHaveTextContent(
      "ข้อมูลจำลองเพื่อการสาธิต",
    );
    expect(DEMO_EV_LINES).toHaveLength(2);
  });
});
