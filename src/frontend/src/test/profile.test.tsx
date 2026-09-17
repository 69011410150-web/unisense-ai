import { AppStateProvider } from "@/context/AppStateContext";
import { Profile } from "@/pages/Profile";
import {
  DEMO_PROFILE,
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

function renderProfile() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppStateProvider>
        <Outlet />
      </AppStateProvider>
    ),
  });
  const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile",
    component: Profile,
  });
  const navigateRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/navigate",
    component: () => <p>Smart Navigation</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([profileRoute, navigateRoute]),
    history: createMemoryHistory({ initialEntries: ["/profile"] }),
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

describe("Profile", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("shows the demo student details", async () => {
    renderProfile();

    expect(
      await screen.findByText(DEMO_PROFILE.displayName),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`รหัสนักศึกษา ${DEMO_PROFILE.studentId}`),
    ).toBeInTheDocument();
    expect(screen.getByText(DEMO_PROFILE.faculty)).toBeInTheDocument();
    expect(screen.getByText("ชั้นปีที่ 1")).toBeInTheDocument();
  });

  it("shows today's class summary and the usual campus route", async () => {
    // The demo schedule is pinned to Monday, so pin the clock to a Monday to
    // exercise the populated "today" summary rather than the empty state.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 8, 14, 8, 0, 0));
    renderProfile();

    expect(await screen.findByTestId("profile.today.list")).toBeInTheDocument();
    expect(screen.getByText("ชีววิทยา")).toBeInTheDocument();
    expect(screen.getByText("เส้นทางประจำของฉัน")).toBeInTheDocument();
    expect(
      screen.getByText(/หอพักนักศึกษา อาคาร C → อาคารวิศวกรรมศาสตร์ 3/),
    ).toBeInTheDocument();
  });

  it("shows the prototype notice about simulated data", async () => {
    renderProfile();

    const notice = await screen.findByTestId("profile.notice.section");
    expect(notice).toHaveTextContent("ข้อมูลจำลอง");
    expect(notice).toHaveTextContent("ไม่มีข้อมูลส่วนบุคคลของนักศึกษาจริง");
    expect(notice).toHaveTextContent("ไม่มีการติดตามตำแหน่ง GPS จริง");
  });

  it("toggles preferences and updates the active count", async () => {
    const user = userEvent.setup();
    renderProfile();

    const status = await screen.findByTestId("profile.preferences.status");
    expect(status).toHaveTextContent("3");

    // "โหมดเงียบระหว่างเรียน" defaults off; turning it on raises the count.
    await user.click(
      screen.getByRole("switch", { name: "โหมดเงียบระหว่างเรียน" }),
    );
    await waitFor(() => {
      expect(
        screen.getByTestId("profile.preferences.status"),
      ).toHaveTextContent("4");
    });

    // Turning a default-on preference off lowers it again.
    await user.click(
      screen.getByRole("switch", { name: "การแจ้งเตือนคลาสเรียน" }),
    );
    await waitFor(() => {
      expect(
        screen.getByTestId("profile.preferences.status"),
      ).toHaveTextContent("3");
    });
  });

  it("opens the usual route in Smart Navigation", async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(
      await screen.findByTestId("profile.route.navigate_button"),
    );
    await waitFor(() => {
      expect(screen.getByText("Smart Navigation")).toBeInTheDocument();
    });
  });
});
