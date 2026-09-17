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
} from "@/types";
import { SituationLevel } from "@/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

/**
 * A typed stand-in for the generated backend actor. Every method the app's
 * React Query hooks call is present, so a component test exercises the real
 * hooks, context, and rendering against deterministic demo data.
 *
 * This is a mock: it proves nothing about the Motoko canister. The PocketIC
 * lane in `app/test/pocketic` is what exercises the real backend.
 */
export interface MockActor {
  listBuildings: () => Promise<Building[]>;
  listRooms: () => Promise<Room[]>;
  listLocations: () => Promise<CampusLocation[]>;
  listRouteSegments: () => Promise<RouteSegment[]>;
  listEvLines: () => Promise<EvLine[]>;
  getCurrentLocation: () => Promise<CampusLocation>;
  listSchedule: () => Promise<ClassEntry[]>;
  getProfile: () => Promise<StudentProfile>;
  getNextClass: () => Promise<NextClass | null>;
  getSmartMoment: () => Promise<SmartMoment | null>;
  planRoute: (
    originName: string,
    destinationName: string,
  ) => Promise<RoutePlan>;
  askCampus: (question: string) => Promise<AssistantAnswer>;
  scan: () => Promise<ScanResult>;
}

export const DEMO_LOCATIONS: CampusLocation[] = [
  {
    id: 1n,
    name: "โรงอาหารกลาง",
    kind: "โรงอาหาร",
    description: "ศูนย์อาหารกลาง",
  },
  {
    id: 2n,
    name: "อาคารวิทยาศาสตร์ 2",
    kind: "อาคาร",
    description: "อาคารเรียนวิทยาศาสตร์ 2",
  },
  { id: 3n, name: "อาคารเรียนรวม", kind: "อาคาร", description: "อาคารเรียนรวม" },
];

export const DEMO_SCHEDULE: ClassEntry[] = [
  {
    id: 1n,
    subject: "ชีววิทยา",
    day: "จันทร์",
    startTime: "09:00",
    endTime: "11:00",
    buildingName: "อาคารวิทยาศาสตร์ 2",
    roomCode: "SC-204",
    instructor: "อ.ดร.ปรีชา วงศ์วิทย์",
  },
  {
    id: 2n,
    subject: "ภาษาอังกฤษ",
    day: "จันทร์",
    startTime: "13:00",
    endTime: "15:00",
    buildingName: "อาคารเรียนรวม",
    roomCode: "EN-302",
    instructor: "อ.สุนิสา ใจดี",
  },
  {
    id: 3n,
    subject: "สาธารณสุข",
    day: "จันทร์",
    startTime: "15:00",
    endTime: "17:00",
    buildingName: "อาคารสาธารณสุข",
    roomCode: "PH-401",
    instructor: "ผศ.ดร.กมล ทองสุข",
  },
];

export const DEMO_EV_LINES: EvLine[] = [
  {
    id: 1n,
    name: "EV สาย 1",
    stops: ["ป้ายรถ EV หน้าหอสมุด", "อาคารเรียนรวม", "อาคารวิทยาศาสตร์ 2"],
    nextStation: "อาคารเรียนรวม",
    arrivalMinutes: 4n,
    crowdLevel: "ปานกลาง",
  },
  {
    id: 2n,
    name: "EV สาย 2",
    stops: ["ป้ายรถ EV หน้าโรงอาหาร", "โรงอาหารกลาง", "อาคารสำนักงานมหาวิทยาลัย"],
    nextStation: "โรงอาหารกลาง",
    arrivalMinutes: 7n,
    crowdLevel: "น้อย",
  },
];

export const DEMO_PROFILE: StudentProfile = {
  displayName: "นางสาวพิมพ์ชนก ใจดี",
  studentId: "66010001",
  faculty: "คณะวิทยาศาสตร์และสาธารณสุขศาสตร์",
  year: 1n,
  avatarPlaceholder: "พ",
};

export const DEMO_NEXT_CLASS: NextClass = {
  subject: "ชีววิทยา",
  startTime: "09:00",
  endTime: "11:00",
  buildingName: "อาคารวิทยาศาสตร์ 2",
  roomCode: "SC-204",
  minutesUntil: 30n,
  locationName: "อาคารวิทยาศาสตร์ 2",
};

/**
 * The Smart Moment the real backend produces at the fixed 08:30 demo clock:
 * ชีววิทยา 09:00 in SC-204, 30 minutes remaining, the โรงอาหารกลาง → SC-204
 * route (walk 3, EV 5, total 10), arriving 08:40, situation A. Mirrors
 * `getSmartMoment()` in `lib/smart-moment.mo`; the PocketIC lane is what proves
 * the real canister returns it.
 */
export const DEMO_SMART_MOMENT: SmartMoment = {
  subject: "ชีววิทยา",
  startTime: "09:00",
  buildingName: "อาคารวิทยาศาสตร์ 2",
  roomCode: "SC-204",
  minutesRemaining: 30n,
  walkingMinutes: 3n,
  evMinutes: 5n,
  finalWalkingMinutes: 2n,
  totalMinutes: 10n,
  estimatedArrival: "08:40",
  arriveBeforeClass: true,
  situation: SituationLevel.A,
  situationMessage: "คุณยังมีเวลา 20 นาที แนะนำให้ออกเดินทางตอนนี้",
  explanation: "AI วิเคราะห์จากตารางเรียน เวลา และเส้นทาง",
  originName: "โรงอาหารกลาง",
  destinationName: "SC-204",
};

export const DEMO_SCAN_RESULT: ScanResult = {
  buildingName: "อาคารวิทยาศาสตร์ 2",
  roomCode: "SC-204",
  floor: 2n,
  instruction: "เดินตรง 50 เมตร แล้วเลี้ยวขวา",
};

/** The โรงอาหารกลาง → SC-204 plan the acceptance criteria pin down. */
export const DEMO_ROUTE_PLAN: RoutePlan = {
  originName: "โรงอาหารกลาง",
  destinationName: "SC-204",
  walkingMinutes: 3n,
  evMinutes: 5n,
  finalWalkingMinutes: 2n,
  totalMinutes: 10n,
  estimatedArrival: "09:10",
  arriveBeforeClass: true,
  walkingSteps: [
    "เดินออกจากโรงอาหารกลางตรงไปทางทิศเหนือ 220 เมตร",
    "ถึง อาคารวิทยาศาสตร์ 2 แล้วขึ้นไปห้อง SC-204 ชั้น 2",
  ],
  evSteps: [
    "ขึ้น EV สาย 1 ที่ โรงอาหารกลาง (รถมาถึงใน 4 นาที)",
    "ลงที่ อาคารเรียนรวม แล้วเดินต่อเข้า อาคารวิทยาศาสตร์ 2",
  ],
};

export const DEMO_ANSWER: AssistantAnswer = {
  intent: "next_class",
  answer:
    "คาบต่อไปของวันนี้คือ ชีววิทยา เวลา 09:00 - 11:00 ที่ห้อง SC-204 อาคารวิทยาศาสตร์ 2 อีก 30 นาทีจะเริ่มเรียน",
};

/**
 * The next-class answer the real backend produces at the fixed 08:30 demo
 * clock: ชีววิทยา 09:00 at อาคารวิทยาศาสตร์ 2 ห้อง SC-204, carrying the
 * recommended โรงอาหารกลาง → SC-204 route. Mirrors `nextClassAnswer()` in
 * `lib/navigation.mo` so the frontend journey can be exercised without the
 * canister; the PocketIC lane is what proves the real backend returns it.
 */
export const DEMO_NEXT_CLASS_ANSWER: AssistantAnswer = {
  intent: "next_class",
  answer:
    "อีก 30 นาทีคุณมีเรียน ชีววิทยา\n📍 อาคารวิทยาศาสตร์ 2 ห้อง SC-204\n⏰ เริ่มเรียน 09:00 น.",
  route: DEMO_ROUTE_PLAN,
};

/** The all-classes-finished reply the next-class answer must never fall back to. */
export const DEMO_ALL_CLASSES_DONE_ANSWER: AssistantAnswer = {
  intent: "next_class",
  answer: "วันนี้คุณเรียนครบทุกคาบแล้ว พักผ่อนให้เต็มที่นะ ?",
};

export const DEMO_ROUTE_ANSWER: AssistantAnswer = {
  intent: "route",
  answer:
    "เส้นทางจาก โรงอาหารกลาง ไป SC-204 เดิน 3 นาที หรือนั่งรถ EV 5 นาที แล้วเดินต่อ 2 นาที รวมประมาณ 10 นาที ถึงประมาณ 09:10",
  route: DEMO_ROUTE_PLAN,
};

export function createMockActor(overrides: Partial<MockActor> = {}): MockActor {
  return {
    listBuildings: vi.fn(async () => []),
    listRooms: vi.fn(async () => []),
    listLocations: vi.fn(async () => DEMO_LOCATIONS),
    listRouteSegments: vi.fn(async () => []),
    listEvLines: vi.fn(async () => DEMO_EV_LINES),
    getCurrentLocation: vi.fn(async () => DEMO_LOCATIONS[0]),
    listSchedule: vi.fn(async () => DEMO_SCHEDULE),
    getProfile: vi.fn(async () => DEMO_PROFILE),
    getNextClass: vi.fn(async () => DEMO_NEXT_CLASS),
    getSmartMoment: vi.fn(async () => DEMO_SMART_MOMENT),
    planRoute: vi.fn(async () => DEMO_ROUTE_PLAN),
    askCampus: vi.fn(async () => DEMO_ANSWER),
    scan: vi.fn(async () => DEMO_SCAN_RESULT),
    ...overrides,
  };
}

/**
 * The app's `useActor(createActor)` seam. `@caffeineai/core-infrastructure`
 * resolves the actor through this hook, so replacing it is how a component
 * test supplies the typed mock above without touching production code.
 */
export function mockUseActor(actor: MockActor) {
  return {
    actor,
    isFetching: false,
    isError: false,
    error: null,
  };
}

/**
 * A fresh React Query client per render. Retries are disabled so a rejected
 * mutation surfaces its error state immediately instead of after backoff.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Render helper kept intentionally thin so tests read like user journeys.
 *
 * Every page in this app reads through React Query hooks, so a bare `render`
 * throws "No QueryClient set". Always render through this helper (or a test's
 * own wrapper built on it) rather than calling `render` directly.
 */
export function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      {ui}
    </QueryClientProvider>,
  );
}
