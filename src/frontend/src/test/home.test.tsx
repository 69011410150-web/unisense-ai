import { AppStateProvider } from "@/context/AppStateContext";
import { Home } from "@/pages/Home";
import {
  DEMO_NEXT_CLASS,
  DEMO_PROFILE,
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

/** Records where the Home screen navigates, so the AI hand-off is observable. */
const navigateSpy = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

function renderHome() {
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
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return renderWithProviders(<RouterProvider router={router} />);
}

describe("Home", () => {
  beforeEach(() => {
    navigateSpy.mockReset();
    useActorMock.mockReset();
    useActorMock.mockReturnValue({
      actor: createMockActor(),
      isFetching: false,
      isError: false,
      error: null,
    });
  });

  it("shows the Thai greeting and the four quick actions", async () => {
    renderHome();

    expect(
      await screen.findByText("สวัสดี 👋 วันนี้ให้ UniSense ช่วยอะไร?"),
    ).toBeInTheDocument();

    // The accepted request renames the scan shortcut to "AI Scan 📷".
    for (const label of ["ตารางเรียน", "ไปเรียน", "AI Scan 📷", "รถ EV"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("shows the next class card with a live countdown", async () => {
    // Pin the clock to 08:30 so the 09:00 demo class is genuinely upcoming and
    // the countdown is deterministic rather than dependent on the wall clock.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 8, 17, 8, 30, 0));
    renderHome();

    const card = await screen.findByTestId("home.next_class.card");
    expect(card).toHaveTextContent(DEMO_NEXT_CLASS.subject);
    expect(card).toHaveTextContent(DEMO_NEXT_CLASS.buildingName);
    expect(card).toHaveTextContent(`ห้อง ${DEMO_NEXT_CLASS.roomCode}`);

    const countdown = screen.getByTestId("home.next_class.countdown");
    expect(countdown.textContent).toMatch(/อีก \d+ (นาที|ชั่วโมง)/);
  });

  it("greets the student by first name from the demo profile", async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/คุณนางสาวพิมพ์ชนก/)).toBeInTheDocument();
    });
    expect(DEMO_PROFILE.displayName).toContain("พิมพ์ชนก");
  });

  it("hands a typed question to the AI assistant and opens it", async () => {
    const user = userEvent.setup();
    renderHome();

    const input = await screen.findByTestId("home.ask.input");
    await user.type(input, "อีก 30 นาทีฉันมีเรียนที่ไหน?");
    await user.click(screen.getByTestId("home.ask.submit_button"));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith({ to: "/ai" });
    });
  });

  it("shows the AI recommendation card with a working ask action", async () => {
    const user = userEvent.setup();
    renderHome();

    const card = await screen.findByTestId("home.recommendation.card");
    expect(card).toHaveTextContent("AI แนะนำสำหรับคุณ");

    await user.click(screen.getByTestId("home.recommendation.ask_button"));
    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith({ to: "/ai" });
    });
  });
});
