import { AppStateProvider } from "@/context/AppStateContext";
import { AiAssistant } from "@/pages/AiAssistant";
import {
  DEMO_ANSWER,
  DEMO_ROUTE_ANSWER,
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

function renderAssistant() {
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
    component: () => <p>Smart Navigation</p>,
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

describe("AI Campus Assistant", () => {
  beforeEach(() => {
    useActorMock.mockReset();
    withActor(createMockActor());
  });

  it("shows the Thai greeting and suggested starter questions", async () => {
    renderAssistant();

    expect(
      await screen.findByText("สวัสดีครับ ผมคือผู้ช่วย AI ของ UniSense AI"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "อีก 30 นาทีฉันมีเรียนที่ไหน?" }),
    ).toBeInTheDocument();
  });

  it("answers a next-class question in Thai naming the class, building and room", async () => {
    const user = userEvent.setup();
    renderAssistant();

    await user.click(
      await screen.findByRole("button", { name: "อีก 30 นาทีฉันมีเรียนที่ไหน?" }),
    );

    await waitFor(() => {
      expect(screen.getByText(DEMO_ANSWER.answer)).toBeInTheDocument();
    });
    expect(DEMO_ANSWER.answer).toContain("ชีววิทยา");
    expect(DEMO_ANSWER.answer).toContain("อาคารวิทยาศาสตร์ 2");
    expect(DEMO_ANSWER.answer).toContain("SC-204");
  });

  it("shows a typing indicator while the answer is in flight", async () => {
    const user = userEvent.setup();
    let resolveAnswer: ((value: typeof DEMO_ANSWER) => void) | undefined;
    const actor = createMockActor({
      askCampus: vi.fn(
        () =>
          new Promise<typeof DEMO_ANSWER>((resolve) => {
            resolveAnswer = resolve;
          }),
      ),
    });
    withActor(actor);
    renderAssistant();

    await user.click(
      await screen.findByRole("button", { name: "อีก 30 นาทีฉันมีเรียนที่ไหน?" }),
    );

    expect(await screen.findByTestId("ai.typing_state")).toBeInTheDocument();

    resolveAnswer?.(DEMO_ANSWER);
    await waitFor(() => {
      expect(screen.queryByTestId("ai.typing_state")).not.toBeInTheDocument();
    });
  });

  it("offers a route action that opens Smart Navigation pre-filled", async () => {
    const user = userEvent.setup();
    const actor = createMockActor({
      askCampus: vi.fn(async () => DEMO_ROUTE_ANSWER),
    });
    withActor(actor);
    renderAssistant();

    const input = await screen.findByTestId("ai.input");
    await user.type(input, "จากโรงอาหารไปตึกวิทยาศาสตร์ยังไง?");
    await user.click(screen.getByTestId("ai.submit_button"));

    const routeCard = await screen.findByTestId("ai.route_card");
    expect(routeCard).toHaveTextContent("โรงอาหารกลาง");
    expect(routeCard).toHaveTextContent("SC-204");

    await user.click(screen.getByTestId("ai.open_navigation_button"));
    await waitFor(() => {
      expect(screen.getByText("Smart Navigation")).toBeInTheDocument();
    });
  });

  it("shows a Thai error state when the assistant call fails", async () => {
    const user = userEvent.setup();
    const actor = createMockActor({
      askCampus: vi.fn(async () => {
        throw new Error("boom");
      }),
    });
    withActor(actor);
    renderAssistant();

    await user.click(
      await screen.findByRole("button", { name: "อีก 30 นาทีฉันมีเรียนที่ไหน?" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "ขออภัยครับ ระบบตอบคำถามขัดข้องชั่วคราว กรุณาลองถามอีกครั้ง",
    );
  });
});
