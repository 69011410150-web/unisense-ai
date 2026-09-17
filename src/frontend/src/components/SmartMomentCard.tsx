import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/context/AppStateContext";
import { useSmartMoment } from "@/hooks/useQueries";
import { SituationLevel } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  Clock,
  Compass,
  Footprints,
  MapPin,
  Route,
  Sparkles,
} from "lucide-react";

/** Visual treatment for each situation level, using the existing tokens. */
const SITUATION_STYLES: Record<
  SituationLevel,
  { container: string; icon: typeof CheckCircle2 }
> = {
  [SituationLevel.A]: {
    container: "bg-success/12 text-success",
    icon: CheckCircle2,
  },
  [SituationLevel.B]: {
    container: "bg-warning/16 text-warning",
    icon: AlertTriangle,
  },
  [SituationLevel.C]: {
    container: "bg-destructive/12 text-destructive",
    icon: AlertTriangle,
  },
};

interface MetricProps {
  icon: typeof Clock;
  label: string;
  value: string;
}

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-2.5 py-2.5 text-center">
      <span className="flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground">
        <Icon className="size-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span className="nums-tabular mt-1 block text-lg font-bold leading-none tracking-tight text-foreground">
        {value}
      </span>
      <span className="mt-0.5 block text-[10px] text-muted-foreground">
        นาที
      </span>
    </div>
  );
}

export function SmartMomentCard() {
  const navigate = useNavigate();
  const { requestRoute } = useAppState();
  const { data: moment, isLoading } = useSmartMoment();

  if (isLoading) {
    return (
      <Card
        data-ocid="home.smart_moment.loading_state"
        className="rounded-2xl border-border p-5 shadow-elevated"
      >
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-6 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Array.from(
            { length: 4 },
            (_, i) => `smart-moment-skeleton-${i}`,
          ).map((id) => (
            <Skeleton key={id} className="h-16 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-4 h-11 w-full rounded-xl" />
      </Card>
    );
  }

  if (!moment) {
    return (
      <Card
        data-ocid="home.smart_moment.empty_state"
        className="rounded-2xl border-border bg-gradient-subtle p-5 shadow-soft"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success/12 text-success">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              ✦ AI แนะนำสำหรับคุณ
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              วันนี้ไม่มีคลาสเหลือแล้ว 🎉
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              ยังไม่มีแผนการเดินทางใหม่ พักผ่อนได้เลย
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const style = SITUATION_STYLES[moment.situation];
  const SituationIcon = style.icon;

  function startJourney() {
    if (!moment) return;
    requestRoute({
      originName: moment.originName,
      destinationName: moment.destinationName,
      autoPlan: true,
    });
    void navigate({ to: "/navigate" });
  }

  return (
    <Card
      data-ocid="home.smart_moment.card"
      className="relative overflow-hidden rounded-2xl border-border p-0 shadow-elevated"
    >
      <div className="bg-gradient-primary px-5 py-4 text-primary-foreground">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-90">
          <Sparkles className="size-3.5" aria-hidden="true" />✦ AI แนะนำสำหรับคุณ
        </span>
        <h3 className="mt-2 text-lg font-bold tracking-tight">
          อีก {Number(moment.minutesRemaining)} นาทีคุณมีเรียน {moment.subject}
        </h3>
        <p className="mt-1 inline-flex min-w-0 items-center gap-1.5 text-sm opacity-95">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {moment.buildingName} ห้อง {moment.roomCode}
          </span>
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div
          data-ocid="home.smart_moment.situation"
          className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 ${style.container}`}
        >
          <SituationIcon
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm font-bold leading-snug">
            {moment.situationMessage}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Route
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            ฉันวิเคราะห์เส้นทางให้แล้ว
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            ⏱️ ใช้เวลาเดินทางประมาณ {Number(moment.totalMinutes)} นาที
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2
              className="size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            {moment.arriveBeforeClass
              ? `✅ หากออกตอนนี้ คุณจะถึงก่อนเรียนประมาณ ${Number(
                  moment.minutesRemaining - moment.totalMinutes,
                )} นาที`
              : "⚠️ หากออกตอนนี้ อาจไปไม่ทันเวลาเรียน"}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Metric
            icon={Clock}
            label="เหลือ"
            value={String(Number(moment.minutesRemaining))}
          />
          <Metric
            icon={Footprints}
            label="เดิน"
            value={String(Number(moment.walkingMinutes))}
          />
          <Metric
            icon={Bus}
            label="รถ EV"
            value={String(Number(moment.evMinutes))}
          />
          <Metric
            icon={Route}
            label="รวม"
            value={String(Number(moment.totalMinutes))}
          />
        </div>

        <p className="nums-tabular text-sm font-semibold text-foreground">
          ถึงประมาณ {moment.estimatedArrival} น.
        </p>

        <Button
          type="button"
          onClick={startJourney}
          data-ocid="home.smart_moment.start_button"
          className="h-12 w-full rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated"
        >
          <Compass className="size-4" aria-hidden="true" />🧭 เริ่มเดินทาง
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          {moment.explanation}
        </p>
      </div>
    </Card>
  );
}
