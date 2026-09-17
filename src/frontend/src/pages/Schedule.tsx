import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/context/AppStateContext";
import { useSchedule } from "@/hooks/useQueries";
import {
  WEEK_ORDER,
  daySortIndex,
  formatCountdown,
  minutesUntilTime,
  thaiDayName,
  thaiLongDate,
  timeToMinutes,
} from "@/lib/datetime";
import type { ClassEntry } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Clock,
  Compass,
  DoorOpen,
  MapPin,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/** Live "now" that ticks once a minute so the today highlight stays honest. */
function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function sortByStart(entries: ClassEntry[]): ClassEntry[] {
  return [...entries].sort((a, b) => {
    const left = timeToMinutes(a.startTime) ?? 0;
    const right = timeToMinutes(b.startTime) ?? 0;
    return left - right;
  });
}

/** One class row: time rail, subject, room, and the navigate action. */
function ClassRow({
  entry,
  index,
  isToday,
  now,
}: {
  entry: ClassEntry;
  index: number;
  isToday: boolean;
  now: Date;
}) {
  const navigate = useNavigate();
  const { requestRoute } = useAppState();

  const remaining = isToday ? minutesUntilTime(entry.startTime, now) : null;
  const inProgress = remaining !== null && remaining <= 0;
  const finished =
    isToday &&
    (timeToMinutes(entry.endTime) ?? 0) <=
      now.getHours() * 60 + now.getMinutes();

  function handleNavigate() {
    requestRoute({
      originName: "ตำแหน่งปัจจุบัน",
      destinationName: `${entry.buildingName} ห้อง ${entry.roomCode}`,
    });
    void navigate({ to: "/navigate" });
  }

  return (
    <Card
      data-ocid={`schedule.class.item.${index + 1}`}
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-soft transition-snappy hover:shadow-elevated ${
        isToday ? "border-primary/30 bg-card" : "border-border bg-card"
      }`}
    >
      {isToday && (
        <span
          className="absolute inset-y-0 left-0 w-1 bg-gradient-primary"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-3.5">
        <div
          className={`flex w-14 shrink-0 flex-col items-center rounded-xl px-1.5 py-2 ${
            isToday ? "bg-primary/10" : "bg-secondary"
          }`}
        >
          <span
            className={`nums-tabular text-sm font-bold leading-none ${
              isToday ? "text-primary" : "text-foreground"
            }`}
          >
            {entry.startTime}
          </span>
          <span className="my-1 h-4 w-px bg-border" aria-hidden="true" />
          <span className="nums-tabular text-[11px] font-medium leading-none text-muted-foreground">
            {entry.endTime}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate text-base font-bold tracking-tight text-foreground">
              {entry.subject}
            </h3>
            {isToday && inProgress && !finished && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold text-success">
                <span
                  className="size-1.5 rounded-full bg-success"
                  aria-hidden="true"
                />
                กำลังเรียน
              </span>
            )}
            {isToday && finished && (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                จบแล้ว
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin
                className="size-3.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate font-medium text-foreground">
                {entry.buildingName}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <DoorOpen
                className="size-3.5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="nums-tabular font-medium text-foreground">
                {entry.roomCode}
              </span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <User className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{entry.instructor}</span>
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              className="nums-tabular text-[11px] font-semibold text-muted-foreground"
              aria-live={isToday ? "polite" : undefined}
            >
              {isToday && remaining !== null
                ? finished
                  ? "คลาสนี้จบแล้ว"
                  : formatCountdown(remaining)
                : `${entry.startTime} – ${entry.endTime} น.`}
            </span>
            <Button
              type="button"
              onClick={handleNavigate}
              data-ocid={`schedule.class.navigate_button.${index + 1}`}
              aria-label={`นำทางไป ${entry.buildingName} ห้อง ${entry.roomCode}`}
              className="h-9 shrink-0 rounded-full bg-gradient-primary px-3.5 text-xs font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated"
            >
              <Compass className="size-3.5" aria-hidden="true" />
              ไปห้องเรียน
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Compact Monday-first grid so the whole week reads at a glance. */
function WeekOverview({
  byDay,
  selectedDay,
  todayName,
  onSelect,
}: {
  byDay: Map<string, ClassEntry[]>;
  selectedDay: string;
  todayName: string;
  onSelect: (day: string) => void;
}) {
  return (
    <Card
      data-ocid="schedule.week_overview.card"
      className="rounded-2xl border-border bg-gradient-subtle p-4 shadow-soft"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold tracking-tight text-foreground">
          ภาพรวมสัปดาห์นี้
        </h2>
        <span className="text-[11px] font-semibold text-muted-foreground">
          แตะวันเพื่อดูรายละเอียด
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_ORDER.map((day) => {
          const entries = byDay.get(day) ?? [];
          const isToday = day === todayName;
          const isSelected = day === selectedDay;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              data-ocid={`schedule.week_overview.day.${daySortIndex(day) + 1}`}
              aria-pressed={isSelected}
              aria-label={`${day} ${entries.length} คลาส`}
              className={`flex min-h-[68px] flex-col items-center justify-between rounded-xl border px-1 py-2 transition-snappy ${
                isSelected
                  ? "border-primary/40 bg-card shadow-soft"
                  : "border-transparent bg-card/60 hover:border-primary/25 hover:bg-card"
              }`}
            >
              <span
                className={`text-[11px] font-bold ${
                  isToday ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {day.slice(0, 2)}
              </span>
              <span className="flex flex-col items-center gap-1">
                {entries.length > 0 ? (
                  entries
                    .slice(0, 3)
                    .map((entry) => (
                      <span
                        key={entry.id.toString()}
                        className={`h-1.5 w-1.5 rounded-full ${
                          isToday ? "bg-primary" : "bg-primary/35"
                        }`}
                        aria-hidden="true"
                      />
                    ))
                ) : (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-border"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span
                className={`nums-tabular text-[10px] font-semibold ${
                  entries.length > 0
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {entries.length > 0 ? `${entries.length} คลาส` : "ว่าง"}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/** The backend demo data is pinned to Monday, so the view opens there. */
const DEMO_DAY = "จันทร์";

export function Schedule() {
  const { data: schedule, isLoading } = useSchedule();
  const now = useNow();
  const todayName = thaiDayName(now);
  const [selectedDay, setSelectedDay] = useState<string>(DEMO_DAY);

  const byDay = useMemo(() => {
    const grouped = new Map<string, ClassEntry[]>();
    for (const day of WEEK_ORDER) grouped.set(day, []);
    for (const entry of schedule ?? []) {
      const bucket = grouped.get(entry.day);
      if (bucket) bucket.push(entry);
      else grouped.set(entry.day, [entry]);
    }
    for (const [day, entries] of grouped)
      grouped.set(day, sortByStart(entries));
    return grouped;
  }, [schedule]);

  const selectedEntries = byDay.get(selectedDay) ?? [];
  const isTodaySelected = selectedDay === todayName;
  const totalClasses = schedule?.length ?? 0;

  return (
    <div className="space-y-5">
      <section
        data-ocid="schedule.header.section"
        className="ambient-blue relative"
      >
        <div className="relative z-10">
          <p className="text-xs font-semibold text-muted-foreground">
            {thaiDayName(now)}ที่ {thaiLongDate(now)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            ตารางเรียน
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "กำลังโหลดตารางเรียน..."
              : `สัปดาห์นี้มี ${totalClasses} คลาส · วันนี้ ${byDay.get(todayName)?.length ?? 0} คลาส`}
          </p>
        </div>
      </section>

      {isLoading ? (
        <div
          data-ocid="schedule.loading_state"
          className="space-y-3"
          aria-busy="true"
        >
          {Array.from({ length: 3 }, (_, i) => `schedule-skeleton-${i}`).map(
            (id) => (
              <Card
                key={id}
                className="rounded-2xl border-border p-4 shadow-soft"
              >
                <div className="flex gap-3.5">
                  <Skeleton className="h-16 w-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-9 w-28 rounded-full" />
                  </div>
                </div>
              </Card>
            ),
          )}
        </div>
      ) : (
        <>
          <WeekOverview
            byDay={byDay}
            selectedDay={selectedDay}
            todayName={todayName}
            onSelect={setSelectedDay}
          />

          <section data-ocid="schedule.day.section">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  วัน{selectedDay}
                </h2>
                {isTodaySelected && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    วันนี้
                  </span>
                )}
              </div>
              {!isTodaySelected && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedDay(todayName)}
                  data-ocid="schedule.today_button"
                  className="h-8 rounded-full px-3 text-xs font-bold text-primary transition-snappy hover:bg-primary/8"
                >
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  กลับไปวันนี้
                </Button>
              )}
            </div>

            {selectedEntries.length === 0 ? (
              <Card
                data-ocid="schedule.empty_state"
                className="rounded-2xl border-border bg-card p-8 text-center shadow-soft"
              >
                <span
                  className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary"
                  aria-hidden="true"
                >
                  <CalendarDays className="size-7" />
                </span>
                <h3 className="mt-3 text-base font-bold tracking-tight text-foreground">
                  วัน{selectedDay}ไม่มีคลาส
                </h3>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  {isTodaySelected
                    ? "วันนี้ว่างทั้งวัน ลองใช้เวลาอ่านหนังสือหรือพักผ่อนได้เลย"
                    : "วันนี้ยังไม่มีคลาสในตาราง เลือกวันอื่นเพื่อดูตารางเรียนได้"}
                </p>
                {!isTodaySelected && (
                  <Button
                    type="button"
                    onClick={() => setSelectedDay(todayName)}
                    data-ocid="schedule.empty_state.today_button"
                    className="mt-4 h-10 rounded-full bg-gradient-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated"
                  >
                    <CalendarDays className="size-4" aria-hidden="true" />
                    ดูตารางวันนี้
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-3">
                {selectedEntries.map((entry, index) => (
                  <ClassRow
                    key={entry.id.toString()}
                    entry={entry}
                    index={index}
                    isToday={isTodaySelected}
                    now={now}
                  />
                ))}
              </div>
            )}
          </section>

          <p className="flex items-center justify-center gap-1.5 pb-1 text-[11px] text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            ข้อมูลตารางเรียนเป็นตัวอย่างสำหรับการสาธิตเท่านั้น
          </p>
        </>
      )}
    </div>
  );
}
