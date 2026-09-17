import { SmartMomentCard } from "@/components/SmartMomentCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/context/AppStateContext";
import { useEvLines, useNextClass, useProfile } from "@/hooks/useQueries";
import {
  estimateArrival,
  formatCountdown,
  minutesUntilTime,
  thaiDayName,
  thaiGreeting,
  thaiLongDate,
} from "@/lib/datetime";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bus,
  CalendarDays,
  Camera,
  Clock,
  Compass,
  DoorOpen,
  type LucideIcon,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface QuickAction {
  key: string;
  to: string;
  label: string;
  hint: string;
  emoji: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "schedule",
    to: "/schedule",
    label: "ตารางเรียน",
    hint: "ดูคลาสทั้งสัปดาห์",
    emoji: "📚",
    icon: CalendarDays,
  },
  {
    key: "navigate",
    to: "/navigate",
    label: "ไปเรียน",
    hint: "นำทางไปห้องเรียน",
    emoji: "🧭",
    icon: Compass,
  },
  {
    key: "scan",
    to: "/scan",
    label: "AI Scan 📷",
    hint: "สแกนป้ายห้องเรียน",
    emoji: "📷",
    icon: Camera,
  },
  {
    key: "ev",
    to: "/ev",
    label: "รถ EV",
    hint: "รถรับส่งภายในมหาวิทยาลัย",
    emoji: "🚌",
    icon: Bus,
  },
];

/** Live "now" that ticks once a minute so countdowns stay honest. */
function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-base font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {action && (
        <Link
          to={action.to}
          data-ocid="home.section_link"
          className="inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-primary transition-snappy hover:gap-1.5"
        >
          {action.label}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function NextClassCard() {
  const { data: nextClass, isLoading } = useNextClass();
  const now = useNow();

  if (isLoading) {
    return (
      <Card
        data-ocid="home.next_class.loading_state"
        className="rounded-2xl border-border p-5 shadow-soft"
      >
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-6 w-3/4" />
        <Skeleton className="mt-3 h-4 w-1/2" />
      </Card>
    );
  }

  if (!nextClass) {
    return (
      <Card
        data-ocid="home.next_class.empty_state"
        className="rounded-2xl border-border p-5 shadow-soft"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/12 text-success">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              วันนี้เรียนครบแล้ว 🎉
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              ไม่มีคลาสเหลือแล้ว พักผ่อนได้เลย
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const liveMinutes = minutesUntilTime(nextClass.startTime, now);
  const remaining =
    liveMinutes === null ? Number(nextClass.minutesUntil) : liveMinutes;
  const inProgress = remaining <= 0;

  return (
    <Card
      data-ocid="home.next_class.card"
      className="relative overflow-hidden rounded-2xl border-border p-0 shadow-elevated"
    >
      <div className="bg-gradient-primary px-5 py-4 text-primary-foreground">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-90">
            <Clock className="size-3.5" aria-hidden="true" />
            คลาสถัดไป
          </span>
          <span className="nums-tabular rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[11px] font-bold">
            {nextClass.startTime} – {nextClass.endTime}
          </span>
        </div>
        <h3 className="mt-2 truncate text-xl font-bold tracking-tight">
          {nextClass.subject}
        </h3>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate font-medium text-foreground">
              {nextClass.buildingName}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <DoorOpen
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="nums-tabular font-medium text-foreground">
              ห้อง {nextClass.roomCode}
            </span>
          </span>
        </div>

        <div
          data-ocid="home.next_class.countdown"
          className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3"
        >
          <span className="text-xs font-semibold text-muted-foreground">
            {inProgress ? "สถานะตอนนี้" : "เหลือเวลาอีก"}
          </span>
          <span
            className="nums-tabular text-lg font-bold tracking-tight text-primary"
            aria-live="polite"
          >
            {formatCountdown(remaining)}
          </span>
        </div>

        <Button
          asChild
          className="h-11 w-full rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated"
        >
          <Link
            to="/navigate"
            data-ocid="home.next_class.navigate_button"
            aria-label={`นำทางไป ${nextClass.buildingName} ห้อง ${nextClass.roomCode}`}
          >
            <Compass className="size-4" aria-hidden="true" />
            นำทางไปห้องเรียน
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function RecommendationCard({ ask }: { ask: (question: string) => void }) {
  const { data: nextClass } = useNextClass();
  const { data: evLines } = useEvLines();
  const now = useNow();

  const recommendation = useMemo(() => {
    if (!nextClass) {
      return {
        title: "วันนี้ไม่มีคลาสแล้ว",
        body: "ลองให้ AI ช่วยวางแผนอ่านหนังสือหรือหาที่นั่งเงียบ ๆ ในห้องสมุดดูไหม",
        cta: "ถาม AI เรื่องห้องสมุด",
        question: "ช่วยแนะนำที่อ่านหนังสือเงียบ ๆ ในมหาวิทยาลัยหน่อย",
      };
    }

    const remaining = minutesUntilTime(nextClass.startTime, now) ?? 0;
    const line = evLines?.[0];
    const evMinutes = line ? Number(line.arrivalMinutes) : 0;
    const walkMinutes = 8;
    const leaveIn = Math.max(remaining - (evMinutes + walkMinutes), 0);

    if (remaining <= 0) {
      return {
        title: "กำลังเรียนอยู่",
        body: `คลาส ${nextClass.subject} เริ่มแล้วที่ห้อง ${nextClass.roomCode} ถ้ามีคำถามระหว่างเรียนถาม AI ได้เลย`,
        cta: "ถาม AI เกี่ยวกับคลาสนี้",
        question: `สรุปเนื้อหาคลาส ${nextClass.subject} ให้หน่อย`,
      };
    }

    if (line) {
      return {
        title: `ควรออกจากที่พักอีก ${leaveIn} นาที`,
        body: `รถ EV สาย ${line.name} จะถึงป้ายในอีก ${evMinutes} นาที แล้วเดินต่ออีก ${walkMinutes} นาทีถึง ${nextClass.buildingName} จะถึงราว ${estimateArrival(evMinutes + walkMinutes, now)} น.`,
        cta: "ดูรถ EV ตอนนี้",
        question: `รถ EV สายไหนไป ${nextClass.buildingName} เร็วที่สุด`,
      };
    }

    return {
      title: `ควรออกเดินทางอีก ${leaveIn} นาที`,
      body: `เดินจากจุดปัจจุบันไป ${nextClass.buildingName} ห้อง ${nextClass.roomCode} ใช้เวลาราว ${walkMinutes} นาที`,
      cta: "วางแผนเส้นทาง",
      question: `ขอเส้นทางไป ${nextClass.buildingName} ห้อง ${nextClass.roomCode}`,
    };
  }, [nextClass, evLines, now]);

  return (
    <Card
      data-ocid="home.recommendation.card"
      className="relative overflow-hidden rounded-2xl border-border bg-gradient-subtle p-5 shadow-soft"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            AI แนะนำสำหรับคุณ
          </p>
          <h3 className="mt-1 text-base font-bold tracking-tight text-foreground">
            {recommendation.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {recommendation.body}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => ask(recommendation.question)}
            data-ocid="home.recommendation.ask_button"
            className="mt-3 h-9 rounded-full border-primary/25 bg-card px-4 text-xs font-bold text-primary shadow-none transition-snappy hover:bg-primary/8"
          >
            {recommendation.cta}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { askAssistant } = useAppState();
  const { data: profile } = useProfile();
  const [question, setQuestion] = useState("");
  const now = useNow(60_000);

  const firstName = profile?.displayName?.split(" ")[0] ?? "";

  /** Hand a question to the AI Campus Assistant, which sends it on arrival. */
  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    askAssistant(trimmed);
    void navigate({ to: "/ai" });
  }

  function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setQuestion("");
    ask(trimmed);
  }

  return (
    <div className="space-y-6">
      <section data-ocid="home.hero.section" className="ambient-blue relative">
        <div className="relative z-10">
          <p className="text-xs font-semibold text-muted-foreground">
            {thaiDayName(now)}ที่ {thaiLongDate(now)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            สวัสดี 👋 วันนี้ให้ UniSense ช่วยอะไร?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {thaiGreeting(now)}
            {firstName ? ` คุณ${firstName}` : ""} · พร้อมช่วยทั้งวันเลย
          </p>

          <form onSubmit={handleAsk} className="mt-4">
            <label htmlFor="home-ask" className="sr-only">
              ถามคำถามเกี่ยวกับมหาวิทยาลัย
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-elevated transition-snappy focus-within:border-primary/40 focus-within:shadow-floating">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-[18px]" aria-hidden="true" />
              </span>
              <input
                id="home-ask"
                data-ocid="home.ask.input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="ถามอะไรก็ได้เกี่ยวกับมหาวิทยาลัย..."
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                data-ocid="home.ask.submit_button"
                disabled={question.trim().length === 0}
                aria-label="ส่งคำถามไปยัง AI"
                className="size-10 shrink-0 rounded-xl bg-gradient-primary p-0 text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated disabled:opacity-40"
              >
                <Send className="size-[18px]" aria-hidden="true" />
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section data-ocid="home.quick_actions.section">
        <SectionHeading title="ทางลัด" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.key}
                to={action.to}
                data-ocid={`home.quick_action.${action.key}`}
                className="group flex min-h-[92px] flex-col justify-between rounded-2xl border border-border bg-card p-3.5 shadow-soft transition-snappy hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
              >
                <span className="flex items-center justify-between">
                  <span
                    className="grid size-9 place-items-center rounded-xl bg-secondary text-primary transition-snappy group-hover:bg-primary/12"
                    aria-hidden="true"
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="text-lg leading-none" aria-hidden="true">
                    {action.emoji}
                  </span>
                </span>
                <span className="mt-2 block">
                  <span className="block truncate text-sm font-bold text-foreground">
                    {action.label}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {action.hint}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section data-ocid="home.smart_moment.section">
        <SmartMomentCard />
      </section>

      <section data-ocid="home.next_class.section">
        <SectionHeading
          title="คลาสถัดไปของวันนี้"
          action={{ to: "/schedule", label: "ดูตารางทั้งสัปดาห์" }}
        />
        <NextClassCard />
      </section>

      <section data-ocid="home.recommendation.section">
        <SectionHeading title="ผู้ช่วยอัจฉริยะ" />
        <RecommendationCard ask={ask} />
      </section>
    </div>
  );
}
