import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AssistantAnswer {
    answer: string;
    intent: string;
    route?: RoutePlan;
}
export interface Building {
    id: Id;
    floors: bigint;
    code: string;
    name: string;
    description: string;
}
export interface CampusLocation {
    id: Id;
    kind: string;
    name: string;
    description: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface ClassEntry {
    id: Id;
    day: DayOfWeek;
    startTime: ClockTime;
    subject: string;
    endTime: ClockTime;
    instructor: string;
    buildingName: string;
    roomCode: string;
}
export type ClockTime = string;
export type DayOfWeek = string;
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface EvLine {
    id: Id;
    nextStation: string;
    name: string;
    crowdLevel: string;
    stops: Array<string>;
    arrivalMinutes: Minutes;
}
export type Id = bigint;
export type Metres = bigint;
export type Minutes = bigint;
export interface NextClass {
    startTime: ClockTime;
    subject: string;
    endTime: ClockTime;
    minutesUntil: Minutes;
    locationName: string;
    buildingName: string;
    roomCode: string;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Room {
    id: Id;
    floor: bigint;
    code: string;
    description: string;
    buildingId: Id;
    buildingName: string;
}
export interface RoutePlan {
    originName: string;
    walkingMinutes: Minutes;
    walkingSteps: Array<string>;
    arriveBeforeClass: boolean;
    destinationName: string;
    evSteps: Array<string>;
    evMinutes: Minutes;
    estimatedArrival: ClockTime;
    totalMinutes: Minutes;
    finalWalkingMinutes: Minutes;
}
export interface RouteSegment {
    walkingMinutes: Minutes;
    toLocationId: Id;
    fromLocationId: Id;
    instruction: string;
    distanceMetres: Metres;
}
export interface ScanResult {
    floor: bigint;
    instruction: string;
    buildingName: string;
    roomCode: string;
}
export interface SmartMoment {
    startTime: ClockTime;
    originName: string;
    subject: string;
    walkingMinutes: Minutes;
    explanation: string;
    situationMessage: string;
    arriveBeforeClass: boolean;
    destinationName: string;
    evMinutes: Minutes;
    buildingName: string;
    roomCode: string;
    minutesRemaining: Minutes;
    estimatedArrival: ClockTime;
    totalMinutes: Minutes;
    finalWalkingMinutes: Minutes;
    situation: SituationLevel;
}
export interface StudentProfile {
    studentId: string;
    displayName: string;
    year: bigint;
    avatarPlaceholder: string;
    faculty: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum SituationLevel {
    A = "A",
    B = "B",
    C = "C"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    askCampus(question: string): Promise<AssistantAnswer>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentLocation(): Promise<CampusLocation>;
    getNextClass(): Promise<NextClass | null>;
    getProfile(): Promise<StudentProfile>;
    getSmartMoment(): Promise<SmartMoment | null>;
    isCallerAdmin(): Promise<boolean>;
    listBuildings(): Promise<Array<Building>>;
    listEvLines(): Promise<Array<EvLine>>;
    listLocations(): Promise<Array<CampusLocation>>;
    listRooms(): Promise<Array<Room>>;
    listRouteSegments(): Promise<Array<RouteSegment>>;
    listSchedule(): Promise<Array<ClassEntry>>;
    planRoute(originName: string, destinationName: string): Promise<RoutePlan>;
    scan(): Promise<ScanResult>;
    schema(): Promise<string>;
}
