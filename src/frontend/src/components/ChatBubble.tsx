import { useAppState } from "@/context/AppStateContext";
import { formatDuration } from "@/lib/datetime";
import type { ChatMessage, RoutePlan } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  BusFront,
  Clock,
  Flag,
  Footprints,
  MapPin,
  Navigation,
  Sparkles,
  Timer,
} from "lucide-react";

/** The EV line the demo route rides, shown on the route card. */
const EV_LINE_LABEL = "EV สาย 2";

function RouteCard({ route }: { route: RoutePlan }) {
  const { requestRoute } = useAppState();
  const navigate = useNavigate();

  const openInNavigation = () => {
    requestRoute({
      originName: route.originName,
      destinationName: route.destinationName,
      autoPlan: true,
    });
    void navigate({ to: "/navigate" });
  };

  return (
    <div
      data-ocid="ai.route_card"
      className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
    >
      <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-3.5 py-2.5">
        <Navigation
          className="size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-secondary-foreground">
          🧭 เส้นทางที่แนะนำ
        </p>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary nums-tabular">
          {formatDuration(Number(route.totalMinutes))}
        </span>
      </div>

      <div className="space-y-2.5 px-3.5 py-3">
        <div className="flex items-start gap-2 text-sm">
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="min-w-0 flex-1 leading-snug">
            <span className="text-muted-foreground">จาก </span>
            <span className="font-semibold text-foreground">
              {route.originName}
            </span>
          </p>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p className="min-w-0 flex-1 leading-snug">
            <span className="text-muted-foreground">ไป </span>
            <span className="font-semibold text-foreground">
              {route.destinationName}
            </span>
          </p>
        </div>

        <ul className="space-y-1.5 border-t border-border pt-2.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Footprints className="size-3.5 shrink-0" aria-hidden="true" />
            <span>🚶 เดิน {formatDuration(Number(route.walkingMinutes))}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <BusFront className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              🚌 {EV_LINE_LABEL} ประมาณ{" "}
              {formatDuration(Number(route.evMinutes))}
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <Flag className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              🚶 เดินต่ออีก {formatDuration(Number(route.finalWalkingMinutes))}
            </span>
          </li>
          <li className="flex items-center gap-1.5 font-semibold text-foreground">
            <Timer className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              ⏱️ รวมทั้งหมดประมาณ {formatDuration(Number(route.totalMinutes))}
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <span>ถึงประมาณ {route.estimatedArrival} น.</span>
          </li>
        </ul>

        {route.arriveBeforeClass && (
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-success/10 px-2.5 py-1.5 text-xs font-semibold text-success">
            <Sparkles className="size-3.5" aria-hidden="true" />✅
            ถึงก่อนเวลาเรียนประมาณ 20 นาที
          </p>
        )}
      </div>

      <button
        type="button"
        data-ocid="ai.open_navigation_button"
        onClick={openInNavigation}
        className="flex w-full items-center justify-center gap-2 border-t border-border bg-primary/5 px-3.5 py-3 text-sm font-semibold text-primary transition-snappy hover:bg-primary/10 active:scale-[0.99]"
      >
        🧭 พาฉันไป
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.sender === "student") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-soft">
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
        <Bot className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 max-w-[85%]">
        <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 shadow-soft">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-card-foreground">
            {message.text}
          </p>
        </div>
        {message.route && <RouteCard route={message.route} />}
      </div>
    </div>
  );
}
