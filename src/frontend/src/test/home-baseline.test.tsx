import { AppStateProvider } from "@/context/AppStateContext";
import { Home } from "@/pages/Home";
import {
  DEMO_EV_LINES,
  DEMO_NEXT_CLASS,
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
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization baseline for the existing Home page, captured before a new
 * proactive recommendation card is added to it.
 *
 * The request inserts a new card into the Home page, which is exactly the kind
 * of change that can reorder, displace, or silently drop the sections that are
 * already there. These tests pin the surrounding behavior that must survive:
 * the section order, the next-class card's contents and its navigate link, and
 * the existing recommendation card's demo-derived copy and ask hand-off.
 *
 * The new card's own behavior is deliberately NOT asserted here — it does not
 * exist yet, and characterizing it would freeze the very thing being added.
 */

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

function withActor(actor: MockActor) {
  useActorMock.mockReturnValue({
    actor,
    isFetching: false,
    isError: false,
    error: null,
  });
}

describe("Home page baseline (pre-existing sections)", () => {
  beforeEach(() => {
    navigateSpy.mockReset();
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("keeps the existing home sections in their established order", async () => {
    renderHome();

    // Wait for the async next-class card so every section has rendered.
    await screen.findByTestId("home.next_class.card");

    const sections = [
      "home.hero.section",
      "home.quick_actions.section",
      "home.next_class.section",
      "home.recommendation.section",
    ].map((ocid) => screen.getByTestId(ocid));

    // Each section must still exist and appear in the original document order.
    for (let i = 1; i < sections.length; i += 1) {
      const previous = sections[i - 1];
      const current = sections[i];
      expect(
        previous.compareDocumentPosition(current) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("keeps the next-class card's demo contents and its navigate link", async () => {
    renderHome();

    const card = await screen.findByTestId("home.next_class.card");
    expect(card).toHaveTextContent(DEMO_NEXT_CLASS.subject);
    expect(card).toHaveTextContent(DEMO_NEXT_CLASS.buildingName);
    expect(card).toHaveTextContent(`ห้อง ${DEMO_NEXT_CLASS.roomCode}`);
    expect(card).toHaveTextContent(
      `${DEMO_NEXT_CLASS.startTime} – ${DEMO_NEXT_CLASS.endTime}`,
    );

    // The card's action is a link into the map page, not a JS navigation.
    const navigateLink = within(card).getByTestId(
      "home.next_class.navigate_button",
    );
    expect(navigateLink).toHaveAttribute("href", "/navigate");
    expect(navigateLink).toHaveAccessibleName(
      `นำทางไป ${DEMO_NEXT_CLASS.buildingName} ห้อง ${DEMO_NEXT_CLASS.roomCode}`,
    );
  });

  it("keeps the existing recommendation card's demo-derived copy", async () => {
    // Pin the clock to 08:30 so the recommendation is deterministic: the demo
    // next class is 30 minutes away and EV สาย 1 arrives in 4 minutes.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 8, 17, 8, 30, 0));
    renderHome();

    const card = await screen.findByTestId("home.recommendation.card");
    expect(card).toHaveTextContent("AI แนะนำสำหรับคุณ");

    // leaveIn = 30 remaining - (4 EV minutes + 8 walk minutes) = 18.
    expect(card).toHaveTextContent("ควรออกจากที่พักอีก 18 นาที");
    expect(card).toHaveTextContent(DEMO_EV_LINES[0].name);
    expect(card).toHaveTextContent(DEMO_NEXT_CLASS.buildingName);

    // The CTA is the EV question, and pressing it hands that exact question to
    // the assistant before opening the AI screen.
    const askButton = within(card).getByTestId(
      "home.recommendation.ask_button",
    );
    expect(askButton).toHaveTextContent("ดูรถ EV ตอนนี้");

    const user = userEvent.setup();
    await user.click(askButton);
    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith({ to: "/ai" });
    });
  });

  it("keeps the empty next-class state when the backend reports no class", async () => {
    withActor(createMockActor({ getNextClass: vi.fn(async () => null) }));
    renderHome();

    expect(
      await screen.findByTestId("home.next_class.empty_state"),
    ).toHaveTextContent("วันนี้เรียนครบแล้ว");
    expect(
      screen.queryByTestId("home.next_class.card"),
    ).not.toBeInTheDocument();
  });
});
