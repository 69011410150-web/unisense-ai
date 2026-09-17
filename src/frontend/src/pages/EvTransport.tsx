import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/context/AppStateContext";
import { useEvLines } from "@/hooks/useQueries";
import { estimateArrival } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import type { EvLine } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BusFront,
  ChevronRight,
  Info,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/** Crowd levels arrive as Thai labels from the backend. */
type CrowdTone = "low" | "medium" | "high";

interface CrowdMeta {
  tone: CrowdTone;
  label: string;
  dot: string;
  chip: string;
  bars: number;
}

const CROWD_META: Record<CrowdTone, CrowdMeta> = {
  low: {
    tone: "low",
    label: "น้อย",
    dot: "bg-success",
    chip: "border-success/30 bg-success/10 text-success",
    bars: 1,
  },
  medium: {
    tone: "medium",
    label: "ปานกลาง",
    dot: "bg-warning",
    chip: "border-warning/40 bg-warning/12 text-warning",
    bars: 2,
  },
  high: {
    tone: "high",
    label: "หนาแน่น",
    dot: "bg-destructive",
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    bars: 3,
  },
};

function crowdMeta(level: string): CrowdMeta {
  const value = level.trim();
  if (value.includes("หนาแน่น") || value.includes("มาก")) return CROWD_META.high;
  if (value.includes("ปานกลาง")) return CROWD_META.medium;
  if (value.includes("น้อย")) return CROWD_META.low;
  return CROWD_META.medium;
}

function CrowdIndicator({ meta }: { meta: CrowdMeta }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        meta.chip,
      )}
    >
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[0, 1, 2].map((bar) => (
          <span
            key={`bar-${bar}`}
            className={cn(
              "w-[3px] rounded-full transition-snappy",
              bar < meta.bars ? meta.dot : "bg-current opacity-25",
              bar === 0 && "h-1.5",
              bar === 1 && "h-2.5",
              bar === 2 && "h-3.5",
            )}
          />
        ))}
      </span>
      {meta.label}
    </span>
  );
}

function StopSequence({ line }: { line: EvLine }) {
  const nextIndex = line.stops.indexOf(line.nextStation);

  return (
    <ol className="relative space-y-0">
      {line.stops.map((stop, index) => {
        const isNext = index === nextIndex;
        const isPassed = nextIndex >= 0 && index < nextIndex;
        const isLast = index === line.stops.length - 1;
        return (
          <li
            key={`${line.id}-${stop}`}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[7px] top-4 h-full w-[2px] rounded-full",
                  isPassed ? "bg-primary/40" : "bg-border",
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-1 grid size-4 shrink-0 place-items-center rounded-full border-2 transition-snappy",
                isNext
                  ? "border-primary bg-primary"
                  : isPassed
                    ? "border-primary/50 bg-primary/25"
                    : "border-border bg-card",
              )}
            >
              {isNext && (
                <span className="size-1.5 rounded-full bg-primary-foreground" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm",
                  isNext
                    ? "font-bold text-foreground"
                    : isPassed
                      ? "font-medium text-muted-foreground"
                      : "font-medium text-foreground/80",
                )}
              >
                {stop}
              </p>
              {isNext && (
                <p className="mt-0.5 text-xs font-semibold text-primary">
                  สถานีถัดไป · ถึงใน {Number(line.arrivalMinutes)} นาที
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LineCard({
  line,
  seconds,
  expanded,
  onToggle,
  onNavigate,
}: {
  line: EvLine;
  seconds: number;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const meta = crowdMeta(line.crowdLevel);
  const totalSeconds = Number(line.arrivalMinutes) * 60;
  const remaining = Math.max(0, totalSeconds - seconds);
  const minutesLeft = Math.floor(remaining / 60);
  const secondsLeft = remaining % 60;
  const arriving = remaining <= 0;
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 1;

  return (
    <Card
      data-ocid={`ev.line_card.${Number(line.id)}`}
      className="overflow-hidden rounded-2xl border-border shadow-soft transition-snappy hover:shadow-elevated"
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
              <BusFront className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold tracking-tight text-foreground">
                {line.name}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  สถานีถัดไป:{" "}
                  <span className="font-semibold text-foreground">
                    {line.nextStation}
                  </span>
                </span>
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <CrowdIndicator meta={meta} />
                <Badge
                  variant="secondary"
                  className="rounded-full border-0 px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                >
                  {line.stops.length} สถานี
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
            <div className="text-left sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                ถึงใน
              </p>
              <p
                data-ocid={`ev.arrival.${Number(line.id)}`}
                className={cn(
                  "nums-tabular font-display text-3xl font-bold leading-none tracking-tight",
                  arriving ? "text-success" : "text-primary",
                )}
              >
                {arriving ? "ถึงแล้ว" : minutesLeft}
                {!arriving && (
                  <span className="ml-1 text-sm font-semibold text-muted-foreground">
                    นาที
                  </span>
                )}
              </p>
              <p className="nums-tabular mt-1 text-xs text-muted-foreground">
                {arriving
                  ? "รถเข้าเทียบสถานีแล้ว"
                  : `ประมาณ ${estimateArrival(minutesLeft)} น. · อีก ${secondsLeft} วินาที`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-smooth",
                arriving ? "bg-success" : "bg-gradient-primary",
              )}
              style={{
                width: `${Math.min(100, Math.max(4, progress * 100))}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-border bg-muted/30 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            data-ocid={`ev.toggle_stops.${Number(line.id)}`}
            aria-expanded={expanded}
            onClick={onToggle}
            className="justify-start rounded-full px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronRight
              className={cn(
                "size-4 transition-snappy",
                expanded && "rotate-90",
              )}
              aria-hidden="true"
            />
            {expanded ? "ซ่อนลำดับสถานี" : "ดูลำดับสถานี"}
          </Button>
          <Button
            type="button"
            data-ocid={`ev.navigate_button.${Number(line.id)}`}
            onClick={onNavigate}
            className="rounded-full bg-gradient-primary font-semibold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated"
          >
            นำทางไปสถานีถัดไป
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {expanded && (
          <div
            data-ocid={`ev.stop_sequence.${Number(line.id)}`}
            className="border-t border-border px-5 py-4"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              ลำดับสถานี
            </p>
            <StopSequence line={line} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LineSkeleton() {
  return (
    <Card className="rounded-2xl border-border shadow-soft">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-11 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="h-3.5 w-2/3 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-9 w-44 rounded-full" />
      </CardContent>
    </Card>
  );
}

export function EvTransport() {
  const { data: lines, isLoading, isError, refetch, isFetching } = useEvLines();
  const { requestRoute } = useAppState();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const lineList = useMemo(() => lines ?? [], [lines]);

  /** When the shortest countdown runs out, pull fresh arrival times. */
  const shortestArrivalSeconds = useMemo(
    () =>
      lineList.reduce(
        (min, line) => Math.min(min, Number(line.arrivalMinutes) * 60),
        Number.POSITIVE_INFINITY,
      ),
    [lineList],
  );

  useEffect(() => {
    if (!Number.isFinite(shortestArrivalSeconds)) return;
    if (seconds < shortestArrivalSeconds) return;
    setSeconds(0);
    void refetch();
  }, [seconds, shortestArrivalSeconds, refetch]);

  const handleNavigate = (line: EvLine) => {
    requestRoute({
      originName: "ตำแหน่งปัจจุบันของฉัน",
      destinationName: line.nextStation,
    });
    void navigate({ to: "/navigate" });
  };

  return (
    <div data-ocid="ev.page" className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          รถ EV ภายในมหาวิทยาลัย
        </h1>
        <p className="text-sm text-muted-foreground">
          ติดตามสายรถ EV สถานีถัดไป เวลาถึง และระดับความหนาแน่นของผู้โดยสาร
        </p>
      </header>

      <div
        data-ocid="ev.demo_notice"
        className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5"
      >
        <Info
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-foreground/80">
          ข้อมูลรถ EV ทั้งหมดเป็น
          <strong className="font-semibold text-foreground">
            ข้อมูลจำลองเพื่อการสาธิต
          </strong>{" "}
          ไม่ได้เชื่อมต่อกับระบบติดตามรถจริงของมหาวิทยาลัย
        </p>
      </div>

      <section aria-labelledby="ev-lines-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="ev-lines-heading"
            className="font-display text-lg font-bold tracking-tight"
          >
            สายรถที่ให้บริการ
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid="ev.refresh_button"
            onClick={() => {
              setSeconds(0);
              void refetch();
            }}
            disabled={isFetching}
            className="rounded-full px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={cn("size-4", isFetching && "animate-spin")}
              aria-hidden="true"
            />
            รีเฟรช
          </Button>
        </div>

        {isLoading && (
          <div data-ocid="ev.loading_state" className="space-y-3">
            {Array.from({ length: 2 }, (_, i) => `ev-skeleton-${i}`).map(
              (id) => (
                <LineSkeleton key={id} />
              ),
            )}
          </div>
        )}

        {isError && (
          <Card
            data-ocid="ev.error_state"
            className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-soft"
          >
            <CardContent className="flex flex-col items-start gap-3 p-5">
              <p className="text-sm font-semibold text-foreground">
                ไม่สามารถโหลดข้อมูลรถ EV ได้ในขณะนี้
              </p>
              <Button
                type="button"
                variant="outline"
                data-ocid="ev.retry_button"
                onClick={() => void refetch()}
                className="rounded-full font-semibold"
              >
                ลองอีกครั้ง
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && lineList.length === 0 && (
          <Card
            data-ocid="ev.empty_state"
            className="rounded-2xl border-border shadow-soft"
          >
            <CardContent className="flex flex-col items-center gap-3 px-5 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <BusFront className="size-6" aria-hidden="true" />
              </span>
              <p className="font-display text-base font-bold">
                ยังไม่มีสายรถให้บริการ
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                ขณะนี้ยังไม่มีรถ EV ออกวิ่งในระบบ ลองรีเฟรชอีกครั้งเพื่อดูข้อมูลล่าสุด
              </p>
              <Button
                type="button"
                data-ocid="ev.empty_refresh_button"
                onClick={() => void refetch()}
                className="rounded-full bg-gradient-primary font-semibold text-primary-foreground shadow-soft"
              >
                รีเฟรชข้อมูล
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && lineList.length > 0 && (
          <div data-ocid="ev.line_list" className="space-y-3">
            {lineList.map((line) => (
              <LineCard
                key={String(line.id)}
                line={line}
                seconds={seconds}
                expanded={expandedId === Number(line.id)}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === Number(line.id) ? null : Number(line.id),
                  )
                }
                onNavigate={() => handleNavigate(line)}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="ev-crowd-heading" className="space-y-3">
        <h2
          id="ev-crowd-heading"
          className="font-display text-lg font-bold tracking-tight"
        >
          ระดับความหนาแน่น
        </h2>
        <Card className="rounded-2xl border-border shadow-soft">
          <CardContent className="space-y-3 p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              ระดับผู้โดยสารบนรถแต่ละสาย ณ ขณะนี้
            </p>
            <ul className="space-y-2.5">
              {lineList.map((line) => {
                const meta = crowdMeta(line.crowdLevel);
                return (
                  <li
                    key={`crowd-${line.id}`}
                    data-ocid={`ev.crowd_row.${Number(line.id)}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3.5 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {line.name}
                    </span>
                    <CrowdIndicator meta={meta} />
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full bg-success"
                  aria-hidden="true"
                />
                น้อย — มีที่นั่งว่าง
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full bg-warning"
                  aria-hidden="true"
                />
                ปานกลาง — อาจต้องยืน
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full bg-destructive"
                  aria-hidden="true"
                />
                หนาแน่น — แนะนำรอคันถัดไป
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
