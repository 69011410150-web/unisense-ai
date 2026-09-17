import { PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
    return;
  }
  // `[baseline, current]`, the same install contract the hosted deploy uses for
  // a converted project. The upgrade replays the chain from the legacy schema.
  const installed = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BASELINE_WASM });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  actor = installed.actor;
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

// ---- Every public method the acceptance criteria touch ---------------------

it("serves the demo campus reads without trapping", async () => {
  const buildings = await actor.listBuildings();
  expect(buildings.length).toBeGreaterThan(0);
  expect(buildings.map((b) => b.name)).toContain("อาคารวิทยาศาสตร์ 2");

  const rooms = await actor.listRooms();
  expect(rooms.map((r) => r.code)).toContain("SC-204");

  const locations = await actor.listLocations();
  expect(locations.map((l) => l.name)).toContain("โรงอาหารกลาง");

  const segments = await actor.listRouteSegments();
  expect(segments.length).toBeGreaterThan(0);

  const evLines = await actor.listEvLines();
  expect(evLines.map((l) => l.name)).toEqual(["EV สาย 1", "EV สาย 2"]);

  const current = await actor.getCurrentLocation();
  expect(current.name).toBe("โรงอาหารกลาง");
});

it("serves the demo schedule, profile and next class", async () => {
  const schedule = await actor.listSchedule();
  const monday = schedule.filter((entry) => entry.day === "จันทร์");
  expect(monday.map((entry) => `${entry.startTime} ${entry.subject} — ${entry.roomCode}`)).toEqual([
    "09:00 ชีววิทยา — SC-204",
    "13:00 ภาษาอังกฤษ — EN-302",
    "15:00 สาธารณสุข — PH-401",
  ]);

  const profile = await actor.getProfile();
  expect(profile.displayName).toBe("นางสาวพิมพ์ชนก ใจดี");
  expect(profile.studentId).toBe("66010001");

  // The demo clock is fixed at 08:30 and the demo day is pinned to Monday, so
  // the next class is always ชีววิทยา 09:00 in SC-204 — never `null`, at any
  // real-world time.
  const nextClass = await actor.getNextClass();
  expect(nextClass.length).toBe(1);
  expect(nextClass[0].subject).toBe("ชีววิทยา");
  expect(nextClass[0].startTime).toBe("09:00");
  expect(nextClass[0].buildingName).toBe("อาคารวิทยาศาสตร์ 2");
  expect(nextClass[0].roomCode).toBe("SC-204");
  expect(nextClass[0].minutesUntil).toBe(30n);
});

it("plans the โรงอาหารกลาง → SC-204 route with the demo timings", async () => {
  const plan = await actor.planRoute("โรงอาหารกลาง", "SC-204");
  expect(plan.originName).toBe("โรงอาหารกลาง");
  expect(plan.destinationName).toBe("SC-204");
  expect(plan.walkingMinutes).toBe(3n);
  expect(plan.evMinutes).toBe(5n);
  expect(plan.finalWalkingMinutes).toBe(2n);
  expect(plan.totalMinutes).toBe(10n);
  // The demo clock is fixed at 08:30, so the arrival is always 08:40 and the
  // route always arrives before the 09:00 class.
  expect(plan.estimatedArrival).toBe("08:40");
  expect(plan.arriveBeforeClass).toBe(true);
  expect(plan.walkingSteps.length).toBeGreaterThan(0);
  expect(plan.evSteps.length).toBeGreaterThan(0);
});

it("serves the deterministic Smart Moment recommendation at the fixed demo clock", async () => {
  const moment = await actor.getSmartMoment();
  // The demo clock is fixed at 08:30 and the demo day is pinned to Monday, so
  // this is deterministic at any real-world time.
  expect(moment.length).toBe(1);
  const value = moment[0];
  expect(value.subject).toBe("ชีววิทยา");
  expect(value.startTime).toBe("09:00");
  expect(value.buildingName).toBe("อาคารวิทยาศาสตร์ 2");
  expect(value.roomCode).toBe("SC-204");
  expect(value.minutesRemaining).toBe(30n);
  expect(value.walkingMinutes).toBe(3n);
  expect(value.evMinutes).toBe(5n);
  expect(value.finalWalkingMinutes).toBe(2n);
  expect(value.totalMinutes).toBe(10n);
  expect(value.estimatedArrival).toBe("08:40");
  expect(value.arriveBeforeClass).toBe(true);
  // 30 remaining > 10 total + 5 buffer, so the situation is A.
  expect(value.situation).toEqual({ A: null });
  expect(value.situationMessage).toBe(
    "คุณยังมีเวลา 20 นาที แนะนำให้ออกเดินทางตอนนี้",
  );
  expect(value.explanation).toBe("AI วิเคราะห์จากตารางเรียน เวลา และเส้นทาง");
  // The route hand-off the map page consumes.
  expect(value.originName).toBe("โรงอาหารกลาง");
  expect(value.destinationName).toBe("SC-204");
});

it("answers a next-class question in Thai naming the class, building and room", async () => {
  const answer = await actor.askCampus("อีก 30 นาทีฉันมีเรียนที่ไหน?");
  // The demo clock is fixed at 08:30 and the demo day is pinned to Monday, so
  // this answer is deterministic at any real-world time: ชีววิทยา 09:00 in
  // อาคารวิทยาศาสตร์ 2 ห้อง SC-204, never the all-classes-finished fallback.
  expect(answer.intent).toBe("next_class");
  expect(answer.answer).toContain("ชีววิทยา");
  expect(answer.answer).toContain("อาคารวิทยาศาสตร์ 2");
  expect(answer.answer).toContain("SC-204");
  expect(answer.answer).toContain("09:00");
  expect(answer.answer).not.toContain("เรียนครบทุกคาบ");

  // The answer carries the recommended โรงอาหารกลาง → SC-204 route so the
  // frontend can render the route card and hand it to the map page.
  expect(answer.route.length).toBe(1);
  expect(answer.route[0].originName).toBe("โรงอาหารกลาง");
  expect(answer.route[0].destinationName).toBe("SC-204");
});

it("answers a route question with a route the frontend can pre-fill", async () => {
  const answer = await actor.askCampus("จากโรงอาหารไปตึกวิทยาศาสตร์ยังไง?");
  expect(answer.intent).toBe("route");
  expect(answer.route.length).toBe(1);
  const route = answer.route[0];
  expect(route.originName).toBe("โรงอาหารกลาง");
  expect(route.destinationName).toBe("SC-204");
});

it("returns the fixed demo scan detection on every call", async () => {
  // The accepted request pins the simulated scan to a single detection so the
  // "🧭 พาฉันไป" hand-off always routes to SC-204; it no longer cycles.
  const first = await actor.scan();
  expect(first.buildingName).toBe("อาคารวิทยาศาสตร์ 2");
  expect(first.roomCode).toBe("SC-204");
  expect(first.floor).toBe(2n);
  expect(first.instruction).toBe("เดินตรง 50 เมตร แล้วเลี้ยวขวา");

  const second = await actor.scan();
  expect(second.buildingName).toBe("อาคารวิทยาศาสตร์ 2");
  expect(second.roomCode).toBe("SC-204");
  expect(second.floor).toBe(2n);
});

it("serves the API doc and the OQL schema without trapping", async () => {
  const doc = await actor.getApiDoc();
  expect(doc).toContain("UniSense AI");
  const schema = await actor.schema();
  expect(schema.length).toBeGreaterThan(0);
});

// ---- Empty / fallback path -------------------------------------------------

it("falls back instead of trapping on an unknown question and unknown place", async () => {
  const answer = await actor.askCampus("คำถามที่ไม่มีในระบบเลย");
  expect(answer.intent).toBe("fallback");
  expect(answer.answer.length).toBeGreaterThan(0);

  // Unknown names resolve to the demo current location rather than trapping.
  const plan = await actor.planRoute("ที่ที่ไม่รู้จัก", "ที่อื่นที่ไม่รู้จัก");
  expect(plan.originName).toBe("โรงอาหารกลาง");
  expect(plan.totalMinutes).toBe(0n);
});
