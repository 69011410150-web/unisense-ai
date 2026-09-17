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
import { SituationLevel } from "@/backend";

export type {
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
};

// `SituationLevel` is a generated value enum, so it is re-exported as a value.
export { SituationLevel };

/** A single turn in the AI Campus Assistant conversation. */
export interface ChatMessage {
  id: string;
  sender: "student" | "assistant";
  text: string;
  route?: RoutePlan;
  createdAt: number;
}

/** Origin/destination pair handed to Smart Navigation. */
export interface RouteRequest {
  /** Unique id so a repeated identical request is still consumed. */
  id?: string;
  originName: string;
  destinationName: string;
  /**
   * When true the map page plans the route as soon as it receives the request,
   * so the student sees the route without pressing "วางแผนเส้นทาง" again.
   */
  autoPlan?: boolean;
}

/** An active navigation session driven by a planned route. */
export interface NavigationSession {
  plan: RoutePlan;
  mode: "walk" | "ev";
  startedAt: number;
}

/** The primary destinations of the app shell. */
export type NavKey =
  | "home"
  | "ai"
  | "scan"
  | "schedule"
  | "navigate"
  | "profile";
