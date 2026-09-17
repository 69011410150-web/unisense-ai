import { createActor } from "@/backend";
import type {
  AssistantAnswer,
  Building,
  CampusLocation,
  ClassEntry,
  EvLine,
  NextClass,
  Room,
  RoutePlan,
  RouteSegment,
  ScanResult,
  SmartMoment,
  StudentProfile,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * The generated actor is the production data layer. Every read goes through a
 * shared React Query hook so the demo dataset is cached and shared across the
 * seven screens.
 */

export function useBuildings() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Building[]>({
    queryKey: ["buildings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listBuildings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRooms() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRooms();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLocations() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CampusLocation[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listLocations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRouteSegments() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<RouteSegment[]>({
    queryKey: ["route-segments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRouteSegments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEvLines() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<EvLine[]>({
    queryKey: ["ev-lines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listEvLines();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCurrentLocation() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CampusLocation | null>({
    queryKey: ["current-location"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCurrentLocation();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSchedule() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<ClassEntry[]>({
    queryKey: ["schedule"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSchedule();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<StudentProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useNextClass() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<NextClass | null>({
    queryKey: ["next-class"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getNextClass();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Proactive Smart Moment recommendation for the demo student's situation. */
export function useSmartMoment() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SmartMoment | null>({
    queryKey: ["smart-moment"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSmartMoment();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Plan a route between two named campus locations. */
export function usePlanRoute() {
  const { actor } = useActor(createActor);
  return useMutation<
    RoutePlan,
    Error,
    { originName: string; destinationName: string }
  >({
    mutationFn: async ({ originName, destinationName }) => {
      if (!actor) throw new Error("ระบบยังไม่พร้อมใช้งาน");
      return actor.planRoute(originName, destinationName);
    },
  });
}

/** Ask the AI Campus Assistant a question. */
export function useAskCampus() {
  const { actor } = useActor(createActor);
  return useMutation<AssistantAnswer, Error, string>({
    mutationFn: async (question: string) => {
      if (!actor) throw new Error("ระบบยังไม่พร้อมใช้งาน");
      return actor.askCampus(question);
    },
  });
}

/** Run a simulated AI scan of a room sign. */
export function useScan() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<ScanResult, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("ระบบยังไม่พร้อมใช้งาน");
      return actor.scan();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["current-location"] });
    },
  });
}
