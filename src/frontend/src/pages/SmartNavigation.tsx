import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/context/AppStateContext";
import {
  useCurrentLocation,
  useLocations,
  useNextClass,
  usePlanRoute,
} from "@/hooks/useQueries";
import { estimateArrival, formatDuration } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import type { NavigationSession, RoutePlan } from "@/types";
import {
  ArrowDown,
  ArrowRight,
  BusFront,
  CheckCircle2,
  CircleAlert,
  Compass,
  Flag,
  Footprints,
  Info,
  MapPin,
  Navigation,
  RotateCcw,
  Sparkles,
  Square,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TravelMode = "walk" | "ev";

/** Fallback origin when nothing has been handed to the screen yet. */
const DEFAULT_ORIGIN = "ตำแหน่งปัจจุบันของฉัน";
/** Fallback destination so the screen is never empty on first visit. */
const DEFAULT_DESTINATION = "อาคารวิทยาศาสตร์ 2 ห้อง SC-204";

/** How long the simulated active navigation takes to reach the destination. */
const NAVIGATION_DURATION_MS = 12_000;

const MODE_META: Record<
  TravelMode,
  { label: string; hint: string; icon: typeof Footprints }
> = {
  walk: {
    label: "เดินเท้า",
    hint: "เส้นทางเดินภายในมหาวิทยาลัย",
    icon: Footprints,
  },
  ev: {
    label: "รถ EV",
    hint: "เดินไปป้าย แล้วนั่งรถ EV ต่อ",
    icon: BusFront,
  },
};

/** Live "now" that ticks every second while navigation is running. */
function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function modeSteps(plan: RoutePlan, mode: TravelMode): string[] {
  return mode === "walk" ? plan.walkingSteps : plan.evSteps;
}

/** The three legs of the journey, in the order the student travels them. */
function buildLegs(plan: RoutePlan, mode: TravelMode) {
  const walk = Number(plan.walkingMinutes);
  const ev = Number(plan.evMinutes);
  const finalWalk = Number(plan.finalWalkingMinutes);

  if (mode === "walk") {
    return [
      { key: "walk", label: "เดินเท้า", minutes: walk, icon: Footprints },
      { key: "final", label: "เดินถึงห้องเรียน", minutes: finalWalk, icon: Flag },
    ];
  }

  return [
    { key: "walk", label: "เดินไปป้าย EV", minutes: walk, icon: Footprints },
    { key: "ev", label: "นั่งรถ EV", minutes: ev, icon: BusFront },
    { key: "final", label: "เดินถึงห้องเรียน", minutes: finalWalk, icon: Flag },
  ];
}

/** A schematic campus route diagram — stylised, never real map imagery. */
function RouteDiagram({
  plan,
  mode,
  progress,
}: {
  plan: RoutePlan;
  mode: TravelMode;
  progress: number;
}) {
  const stops = useMemo(() => {
    const middle =
      mode === "ev"
        ? ["ป้ายรถ EV หน้าคณะ", "ป้ายรถ EV กลางมหาวิทยาลัย"]
        : ["ทางเดินหลัก", "ลานกลางมหาวิทยาลัย"];
    return [plan.originName, ...middle, plan.destinationName];
  }, [plan.originName, plan.destinationName, mode]);

  const activeIndex = Math.min(
    stops.length - 1,
    Math.floor(progress * stops.length),
  );

  return (
    <div
      data-ocid="navigate.route_diagram"
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-subtle p-4"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(var(--border) / 0.55) 1px, transparent 1px), linear-gradient(90deg, oklch(var(--border) / 0.55) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          แผนผังเส้นทาง (จำลอง)
        </p>
        <Badge
          variant="secondary"
          className="rounded-full border-0 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground"
        >
          {stops.length} จุดแวะ
        </Badge>
      </div>

      <ol className="relative z-10 mt-4 space-y-0">
        {stops.map((stop, index) => {
          const isOrigin = index === 0;
          const isDestination = index === stops.length - 1;
          const isActive = index === activeIndex;
          const isPassed = index < activeIndex;
          const isLast = isDestination;

          return (
            <li
              key={`${index}-${stop}`}
              data-ocid={`navigate.route_stop.${index + 1}`}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[13px] top-7 h-full w-[3px] rounded-full",
                    isPassed ? "bg-primary/45" : "bg-border",
                  )}
                />
              )}

              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-snappy",
                  isOrigin
                    ? "border-primary bg-primary text-primary-foreground"
                    : isDestination
                      ? "border-accent bg-accent text-accent-foreground"
                      : isActive
                        ? "border-primary bg-card text-primary shadow-soft"
                        : isPassed
                          ? "border-primary/45 bg-primary/20 text-primary"
                          : "border-border bg-card text-muted-foreground",
                )}
              >
                {isOrigin ? (
                  <Navigation className="size-3.5" />
                ) : isDestination ? (
                  <Flag className="size-3.5" />
                ) : (
                  <span className="size-2 rounded-full bg-current" />
                )}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    "truncate text-sm",
                    isActive
                      ? "font-bold text-foreground"
                      : "font-medium text-foreground/85",
                  )}
                >
                  {stop}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                  {isOrigin
                    ? "จุดเริ่มต้น"
                    : isDestination
                      ? "ปลายทาง"
                      : mode === "ev"
                        ? "จุดขึ้น–ลงรถ EV"
                        : "จุดสังเกตระหว่างทาง"}
                </p>
              </div>

              {isActive && (
                <span className="mt-1 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  ตำแหน่งจำลอง
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepList({
  steps,
  mode,
  activeStep,
}: {
  steps: string[];
  mode: TravelMode;
  activeStep: number;
}) {
  const Icon = MODE_META[mode].icon;

  if (steps.length === 0) {
    return (
      <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        ยังไม่มีคำแนะนำแบบทีละขั้นสำหรับโหมดนี้
      </p>
    );
  }

  return (
    <ol data-ocid="navigate.step_list" className="space-y-2.5">
      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isDone = index < activeStep;
        return (
          <li
            key={`${index}-${step}`}
            data-ocid={`navigate.step.${index + 1}`}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-snappy",
              isActive
                ? "border-primary/40 bg-primary/5 shadow-soft"
                : "border-border bg-card",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                isDone
                  ? "bg-success/15 text-success"
                  : isActive
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-secondary text-primary",
              )}
            >
              {isDone ? <CheckCircle2 className="size-4" /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-foreground/90">
                {step}
              </p>
              {isActive && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary">
                  <Icon className="size-3.5" aria-hidden="true" />
                  ขั้นตอนปัจจุบัน
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PlanSkeleton() {
  return (
    <Card
      data-ocid="navigate.loading_state"
      className="rounded-2xl border-border p-5 shadow-soft"
    >
      <Skeleton className="h-5 w-40 rounded-lg" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => `navigate-skeleton-${i}`).map(
          (id) => (
            <Skeleton key={id} className="h-20 rounded-xl" />
          ),
        )}
      </div>
      <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
    </Card>
  );
}

export function SmartNavigation() {
  const {
    routeRequest,
    clearRouteRequest,
    navigation,
    startNavigation,
    stopNavigation,
  } = useAppState();
  const { data: locations } = useLocations();
  const { data: currentLocation } = useCurrentLocation();
  const { data: nextClass } = useNextClass();
  const planRoute = usePlanRoute();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState<TravelMode>("walk");
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);

  const { mutate: planRouteMutation } = planRoute;
  const consumedRequest = useRef<string | null>(null);
  const autoPlannedRequest = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const locationNames = useMemo(
    () => (locations ?? []).map((item) => item.name),
    [locations],
  );

  const runPlan = useCallback(
    (nextOrigin: string, nextDestination: string) => {
      const trimmedOrigin = nextOrigin.trim();
      const trimmedDestination = nextDestination.trim();
      if (!trimmedOrigin || !trimmedDestination) return;

      setError(null);
      setCompleted(false);
      stopNavigation();

      planRouteMutation(
        { originName: trimmedOrigin, destinationName: trimmedDestination },
        {
          onSuccess: (data) => {
            setPlan(data);
            setMode("walk");
          },
          onError: () => {
            setPlan(null);
            setError(
              "ไม่สามารถวางแผนเส้นทางได้ในขณะนี้ กรุณาตรวจสอบจุดเริ่มต้นและปลายทางแล้วลองอีกครั้ง",
            );
          },
        },
      );
    },
    [planRouteMutation, stopNavigation],
  );

  const originOptions = useMemo(() => {
    const base = [DEFAULT_ORIGIN, ...locationNames];
    return origin && !base.includes(origin) ? [origin, ...base] : base;
  }, [locationNames, origin]);

  const destinationOptions = useMemo(() => {
    const base = [...locationNames, DEFAULT_DESTINATION];
    return destination && !base.includes(destination)
      ? [destination, ...base]
      : base;
  }, [locationNames, destination]);

  /** One-time prefill from the AI answer, tapped class, scan or EV line. */
  useEffect(() => {
    if (routeRequest) {
      const requestId = routeRequest.id ?? "";
      if (consumedRequest.current === requestId) return;
      consumedRequest.current = requestId;
      setOrigin(routeRequest.originName);
      setDestination(routeRequest.destinationName);
      setPrefillNotice(
        `เติมเส้นทางจาก "${routeRequest.originName}" ให้แล้ว แก้ไขได้ตามต้องการ`,
      );
      clearRouteRequest();
      return;
    }

    if (origin || destination) return;

    const fallbackOrigin = currentLocation?.name ?? DEFAULT_ORIGIN;
    const fallbackDestination = nextClass
      ? `${nextClass.buildingName} ห้อง ${nextClass.roomCode}`
      : DEFAULT_DESTINATION;
    setOrigin(fallbackOrigin);
    setDestination(fallbackDestination);
  }, [
    routeRequest,
    clearRouteRequest,
    currentLocation,
    nextClass,
    origin,
    destination,
  ]);

  /**
   * A request handed over with `autoPlan` (e.g. "🧭 พาฉันไป" on the route card)
   * plans the route immediately, so the student lands on a finished route
   * instead of an empty form.
   */
  const autoPlanRequest = routeRequest?.autoPlan ? routeRequest : null;
  useEffect(() => {
    if (!autoPlanRequest) return;
    const requestId = autoPlanRequest.id ?? "";
    if (autoPlannedRequest.current === requestId) return;
    autoPlannedRequest.current = requestId;
    runPlan(autoPlanRequest.originName, autoPlanRequest.destinationName);
  }, [autoPlanRequest, runPlan]);

  /** Simulated navigation progress: 0 → 1 over NAVIGATION_DURATION_MS. */
  useEffect(() => {
    if (!navigation) {
      startedAtRef.current = null;
      setElapsedMs(0);
      setCompleted(false);
      return;
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }

    const timer = window.setInterval(() => {
      const started = startedAtRef.current ?? Date.now();
      const next = Date.now() - started;
      setElapsedMs(next);
      if (next >= NAVIGATION_DURATION_MS) {
        setCompleted(true);
        window.clearInterval(timer);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [navigation]);

  const now = useNow(navigation ? 1000 : 30_000);

  const progress = navigation
    ? Math.min(1, elapsedMs / NAVIGATION_DURATION_MS)
    : 0;
  const progressPercent = Math.round(progress * 100);

  const steps = plan ? modeSteps(plan, mode) : [];
  const activeStep = Math.min(
    Math.max(steps.length - 1, 0),
    Math.floor(progress * Math.max(steps.length, 1)),
  );

  const legs = plan ? buildLegs(plan, mode) : [];
  const modeMinutes = plan
    ? mode === "walk"
      ? Number(plan.walkingMinutes) + Number(plan.finalWalkingMinutes)
      : Number(plan.totalMinutes)
    : 0;

  const remainingMinutes = Math.max(0, Math.ceil(modeMinutes * (1 - progress)));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runPlan(origin, destination);
  }

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
    setPrefillNotice(null);
  }

  function handleStart() {
    if (!plan) return;
    const session: NavigationSession = {
      plan,
      mode,
      startedAt: Date.now(),
    };
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setCompleted(false);
    startNavigation(session);
  }

  function handleStop() {
    stopNavigation();
    setCompleted(false);
  }

  function handleRestart() {
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setCompleted(false);
  }

  const isPlanning = planRoute.isPending;
  const isNavigating = navigation !== null;

  return (
    <div data-ocid="navigate.page" className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          แผนที่และเส้นทาง
        </h1>
        <p className="text-sm text-muted-foreground">
          วางแผนเส้นทางเดินหรือรถ EV ไปยังอาคารเรียน พร้อมเวลาถึงโดยประมาณ
        </p>
      </header>

      <div
        data-ocid="navigate.demo_notice"
        className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5"
      >
        <Info
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-foreground/80">
          แผนผังเส้นทางในหน้านี้เป็น
          <strong className="font-semibold text-foreground">
            ภาพจำลองเชิงสัญลักษณ์
          </strong>{" "}
          ไม่ใช่แผนที่จริง และไม่มีการติดตามตำแหน่ง GPS ของคุณ
        </p>
      </div>

      {/* ---------------- Origin / destination ---------------- */}
      <Card className="rounded-2xl border-border shadow-soft">
        <CardContent className="space-y-4 p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="navigate-origin"
                className="text-xs font-bold text-foreground"
              >
                จุดเริ่มต้น
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 shadow-soft transition-snappy focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/25">
                <Navigation
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <input
                  id="navigate-origin"
                  data-ocid="navigate.origin_input"
                  list="navigate-origin-options"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  placeholder="พิมพ์หรือเลือกจุดเริ่มต้น"
                  autoComplete="off"
                  className="min-h-[44px] min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <datalist id="navigate-origin-options">
                {originOptions.map((name) => (
                  <option key={`origin-${name}`} value={name} />
                ))}
              </datalist>
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="navigate.swap_button"
                onClick={handleSwap}
                aria-label="สลับจุดเริ่มต้นและปลายทาง"
                className="h-8 rounded-full px-3 text-xs font-bold text-muted-foreground"
              >
                <ArrowDown className="size-3.5" aria-hidden="true" />
                สลับจุดหมาย
              </Button>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="navigate-destination"
                className="text-xs font-bold text-foreground"
              >
                ปลายทาง
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 shadow-soft transition-snappy focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/25">
                <MapPin
                  className="size-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <input
                  id="navigate-destination"
                  data-ocid="navigate.destination_input"
                  list="navigate-destination-options"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="พิมพ์หรือเลือกปลายทาง"
                  autoComplete="off"
                  className="min-h-[44px] min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <datalist id="navigate-destination-options">
                {destinationOptions.map((name) => (
                  <option key={`destination-${name}`} value={name} />
                ))}
              </datalist>
            </div>

            <Button
              type="submit"
              data-ocid="navigate.plan_button"
              disabled={isPlanning || !origin.trim() || !destination.trim()}
              className="h-11 w-full rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated disabled:opacity-50"
            >
              {isPlanning ? (
                <>
                  <Sparkles
                    className="size-4 animate-pulse"
                    aria-hidden="true"
                  />
                  กำลังวางแผนเส้นทาง…
                </>
              ) : (
                <>
                  <Compass className="size-4" aria-hidden="true" />
                  วางแผนเส้นทาง
                </>
              )}
            </Button>
          </form>

          {prefillNotice && (
            <p
              data-ocid="navigate.prefill_notice"
              className="flex items-start gap-2 rounded-xl bg-secondary px-3.5 py-2.5 text-xs leading-relaxed text-secondary-foreground"
            >
              <Sparkles
                className="mt-0.5 size-3.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              {prefillNotice}
            </p>
          )}

          {error && (
            <div
              data-ocid="navigate.error_state"
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p className="min-w-0 flex-1 leading-relaxed">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isPlanning && <PlanSkeleton />}

      {!isPlanning && !plan && !error && (
        <Card
          data-ocid="navigate.empty_state"
          className="rounded-2xl border-dashed border-border bg-card shadow-soft"
        >
          <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Compass className="size-6" aria-hidden="true" />
            </span>
            <h2 className="font-display text-base font-bold">
              ยังไม่มีเส้นทางที่วางแผนไว้
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              เลือกจุดเริ่มต้นและปลายทาง แล้วกด “วางแผนเส้นทาง” ระบบจะแสดงเวลาเดิน
              เวลารถ EV และขั้นตอนแบบทีละขั้นให้ทันที
            </p>
          </CardContent>
        </Card>
      )}

      {!isPlanning && plan && (
        <>
          {/* ---------------- Mode toggle ---------------- */}
          <section
            data-ocid="navigate.mode_section"
            aria-labelledby="navigate-mode-heading"
            className="space-y-3"
          >
            <h2
              id="navigate-mode-heading"
              className="text-base font-bold tracking-tight text-foreground"
            >
              เลือกวิธีเดินทาง
            </h2>
            <fieldset
              aria-label="เลือกวิธีเดินทาง"
              className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-soft"
            >
              {(Object.keys(MODE_META) as TravelMode[]).map((key) => {
                const meta = MODE_META[key];
                const Icon = meta.icon;
                const selected = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    data-ocid={`navigate.mode.${key}`}
                    aria-pressed={selected}
                    onClick={() => setMode(key)}
                    className={cn(
                      "flex min-h-[56px] flex-col items-start gap-0.5 rounded-xl px-3.5 py-2.5 text-left transition-snappy",
                      selected
                        ? "bg-gradient-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <Icon className="size-4" aria-hidden="true" />
                      {meta.label}
                    </span>
                    <span
                      className={cn(
                        "text-[11px]",
                        selected ? "opacity-90" : "text-muted-foreground",
                      )}
                    >
                      {meta.hint}
                    </span>
                  </button>
                );
              })}
            </fieldset>
          </section>

          {/* ---------------- Route plan ---------------- */}
          <section
            data-ocid="navigate.plan_section"
            aria-labelledby="navigate-plan-heading"
            className="space-y-3"
          >
            <h2
              id="navigate-plan-heading"
              className="text-base font-bold tracking-tight text-foreground"
            >
              แผนการเดินทาง
            </h2>

            <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-elevated">
              <div className="bg-gradient-primary px-5 py-4 text-primary-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-90">
                    <Timer className="size-3.5" aria-hidden="true" />
                    เวลารวมโดยประมาณ
                  </span>
                  <span className="nums-tabular rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[11px] font-bold">
                    ถึงราว {plan.estimatedArrival} น.
                  </span>
                </div>
                <p
                  data-ocid="navigate.total_minutes"
                  className="nums-tabular mt-2 font-display text-3xl font-bold leading-none tracking-tight"
                >
                  ใช้เวลาประมาณ {Number(plan.totalMinutes)} นาที
                </p>
                <p className="mt-2 truncate text-xs opacity-90">
                  {plan.originName} → {plan.destinationName}
                </p>
              </div>

              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <Footprints className="size-3.5" aria-hidden="true" />
                      เดินเท้า
                    </p>
                    <p
                      data-ocid="navigate.walking_minutes"
                      className="nums-tabular mt-1 font-display text-lg font-bold text-foreground"
                    >
                      {Number(plan.walkingMinutes)} นาที
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <BusFront className="size-3.5" aria-hidden="true" />
                      รถ EV
                    </p>
                    <p
                      data-ocid="navigate.ev_minutes"
                      className="nums-tabular mt-1 font-display text-lg font-bold text-foreground"
                    >
                      {Number(plan.evMinutes)} นาที
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <Flag className="size-3.5" aria-hidden="true" />
                      เดินช่วงท้าย
                    </p>
                    <p
                      data-ocid="navigate.final_walking_minutes"
                      className="nums-tabular mt-1 font-display text-lg font-bold text-foreground"
                    >
                      {Number(plan.finalWalkingMinutes)} นาที
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                      <Timer className="size-3.5" aria-hidden="true" />
                      รวมทั้งหมด
                    </p>
                    <p
                      data-ocid="navigate.total_minutes_card"
                      className="nums-tabular mt-1 font-display text-lg font-bold text-primary"
                    >
                      {Number(plan.totalMinutes)} นาที
                    </p>
                  </div>
                </div>

                <div
                  data-ocid="navigate.arrival_status"
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-3",
                    plan.arriveBeforeClass
                      ? "border-success/30 bg-success/10"
                      : "border-warning/35 bg-warning/10",
                  )}
                >
                  {plan.arriveBeforeClass ? (
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <CircleAlert
                      className="mt-0.5 size-4 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        plan.arriveBeforeClass
                          ? "text-success"
                          : "text-warning",
                      )}
                    >
                      {plan.arriveBeforeClass ? "ทันเรียน" : "อาจไปไม่ทันเวลาเรียน"}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      คาดว่าจะถึงประมาณ{" "}
                      <span className="nums-tabular font-semibold text-foreground">
                        {plan.estimatedArrival} น.
                      </span>{" "}
                      {plan.arriveBeforeClass
                        ? "ซึ่งก่อนเวลาเริ่มคลาส"
                        : "ลองเลือกโหมดรถ EV หรือออกเร็วขึ้นอีกเล็กน้อย"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {legs.map((leg) => {
                    const Icon = leg.icon;
                    return (
                      <span
                        key={leg.key}
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground"
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                        {leg.label}{" "}
                        <span className="nums-tabular font-bold">
                          {leg.minutes} นาที
                        </span>
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ---------------- Diagram + steps ---------------- */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
            <RouteDiagram plan={plan} mode={mode} progress={progress} />

            <section
              data-ocid="navigate.steps_section"
              aria-labelledby="navigate-steps-heading"
              className="space-y-3"
            >
              <h2
                id="navigate-steps-heading"
                className="text-base font-bold tracking-tight text-foreground"
              >
                ขั้นตอนการเดินทาง ({MODE_META[mode].label})
              </h2>
              <StepList steps={steps} mode={mode} activeStep={activeStep} />
            </section>
          </div>

          {/* ---------------- Active navigation ---------------- */}
          <section
            data-ocid="navigate.navigation_section"
            aria-labelledby="navigate-navigation-heading"
            className="space-y-3"
          >
            <h2
              id="navigate-navigation-heading"
              className="text-base font-bold tracking-tight text-foreground"
            >
              การนำทาง
            </h2>

            {!isNavigating && (
              <Card className="rounded-2xl border-border p-5 shadow-soft">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  พร้อมออกเดินทางแล้วหรือยัง? กดปุ่มด้านล่างเพื่อเริ่มนำทางแบบ ทีละขั้น
                  ระบบจะแสดงความคืบหน้าและแจ้งเมื่อถึงปลายทาง
                </p>
                <Button
                  type="button"
                  data-ocid="navigate.start_button"
                  onClick={handleStart}
                  className="mt-4 h-12 w-full rounded-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated active:scale-[0.99]"
                >
                  🧭 เริ่มนำทาง
                </Button>
              </Card>
            )}

            {isNavigating && (
              <Card
                data-ocid="navigate.active_navigation"
                className="overflow-hidden rounded-2xl border-border p-0 shadow-elevated"
              >
                <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/60 px-5 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-secondary-foreground">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2 rounded-full",
                        completed ? "bg-success" : "animate-pulse bg-primary",
                      )}
                    />
                    {completed ? "ถึงปลายทางแล้ว" : "กำลังนำทางอยู่"}
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-full border-0 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground"
                  >
                    {MODE_META[navigation.mode].label}
                  </Badge>
                </div>

                <CardContent className="space-y-4 p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {completed ? "สถานะ" : "เหลือเวลาอีกประมาณ"}
                      </p>
                      <p
                        data-ocid="navigate.remaining_minutes"
                        aria-live="polite"
                        className={cn(
                          "nums-tabular font-display text-3xl font-bold leading-none tracking-tight",
                          completed ? "text-success" : "text-primary",
                        )}
                      >
                        {completed ? "ถึงแล้ว" : `${remainingMinutes} นาที`}
                      </p>
                    </div>
                    <p className="nums-tabular shrink-0 text-right text-xs text-muted-foreground">
                      ถึงราว {estimateArrival(remainingMinutes, now)} น.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Progress
                      data-ocid="navigate.progress"
                      value={progressPercent}
                      aria-label="ความคืบหน้าการนำทาง"
                      className="h-2.5"
                    />
                    <p className="nums-tabular text-right text-[11px] font-semibold text-muted-foreground">
                      ความคืบหน้า {progressPercent}%
                    </p>
                  </div>

                  <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      ขั้นตอนปัจจุบัน
                    </p>
                    <p
                      data-ocid="navigate.current_step"
                      className="mt-1 text-sm leading-relaxed text-foreground/90"
                    >
                      {completed
                        ? `คุณมาถึง ${plan.destinationName} แล้ว`
                        : (steps[activeStep] ?? "กำลังเดินไปยังจุดหมายถัดไป")}
                    </p>
                  </div>

                  {completed && (
                    <div
                      data-ocid="navigate.completion_state"
                      className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3"
                    >
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-success">
                          ถึงปลายทางแล้ว 🎉
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          คุณอยู่ที่ {plan.destinationName} อย่าลืมเช็กเลขห้องก่อนเข้าเรียน
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    {completed ? (
                      <Button
                        type="button"
                        data-ocid="navigate.restart_button"
                        onClick={handleRestart}
                        className="h-11 flex-1 rounded-full bg-gradient-primary font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated"
                      >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        นำทางอีกครั้ง
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        data-ocid="navigate.stop_button"
                        onClick={handleStop}
                        className="h-11 flex-1 rounded-full font-bold"
                      >
                        <Square className="size-4" aria-hidden="true" />
                        หยุดนำทาง
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      data-ocid="navigate.view_steps_button"
                      onClick={() =>
                        document
                          .getElementById("navigate-steps-heading")
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          })
                      }
                      className="h-11 rounded-full font-bold text-muted-foreground hover:text-foreground"
                    >
                      ดูขั้นตอนทั้งหมด
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
