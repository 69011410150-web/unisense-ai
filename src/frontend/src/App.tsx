import { Layout } from "@/components/Layout";
import { AppStateProvider } from "@/context/AppStateContext";
import { AiAssistant } from "@/pages/AiAssistant";
import { EvTransport } from "@/pages/EvTransport";
import { Home } from "@/pages/Home";
import { Profile } from "@/pages/Profile";
import { Scan } from "@/pages/Scan";
import { Schedule } from "@/pages/Schedule";
import { SmartNavigation } from "@/pages/SmartNavigation";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <AppStateProvider>
      <Layout>
        <Outlet />
      </Layout>
    </AppStateProvider>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
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

const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schedule",
  component: Schedule,
});

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan",
  component: Scan,
});

const evRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ev",
  component: EvTransport,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: Profile,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  aiRoute,
  navigateRoute,
  scheduleRoute,
  scanRoute,
  evRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
