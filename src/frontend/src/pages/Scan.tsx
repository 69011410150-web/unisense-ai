import { ScanResultCard } from "@/components/ScanResultCard";
import { type ScanPhase, ScanViewfinder } from "@/components/ScanViewfinder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppState } from "@/context/AppStateContext";
import { useScan } from "@/hooks/useQueries";
import type { ScanResult } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Info,
  MapPin,
  RotateCcw,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** How long the simulated viewfinder "thinks" before revealing a result. */
const SCAN_DURATION_MS = 1600;

export function Scan() {
  const navigate = useNavigate();
  const { requestRoute } = useAppState();
  const scan = useScan();

  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function runScan() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setPhase("scanning");
    setResult(null);

    scan.mutate(undefined, {
      onSuccess: (data) => {
        timerRef.current = window.setTimeout(() => {
          setResult(data);
          setPhase("result");
          timerRef.current = null;
        }, SCAN_DURATION_MS);
      },
      onError: () => {
        timerRef.current = window.setTimeout(() => {
          setPhase("error");
          timerRef.current = null;
        }, SCAN_DURATION_MS);
      },
    });
  }

  /** Hand the scanned room to Smart Navigation and let it plan on arrival. */
  function handleNavigate() {
    if (!result) return;
    requestRoute({
      originName: "ตำแหน่งปัจจุบันของคุณ",
      destinationName: result.roomCode,
      autoPlan: true,
    });
    void navigate({ to: "/navigate" });
  }

  const isScanning = phase === "scanning";

  return (
    <div data-ocid="scan.page" className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ScanLine className="size-5" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            สแกนป้ายด้วย AI
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          ส่องกล้องไปที่ป้ายอาคาร แล้ว UniSense AI จะอ่านชื่ออาคาร ชั้น และเลขห้อง
          พร้อมพาไปยังห้องนั้นทันที
        </p>
      </header>

      {/* Simulation disclosure — the prototype must never be mistaken for a
          real camera feature. */}
      <div
        data-ocid="scan.simulation_notice"
        className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4"
      >
        <Info
          className="mt-0.5 size-4 shrink-0 text-accent"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-foreground/80">
          <span className="font-bold">โหมดสาธิต:</span> การสแกนนี้เป็นสถานการณ์จำลอง
          ระบบจะไม่ขออนุญาตใช้กล้อง และไม่เข้าถึงกล้องจริงบนอุปกรณ์ของคุณ
          ผลลัพธ์เป็นข้อมูลตัวอย่างเท่านั้น
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        {/* ---------------- Viewfinder ---------------- */}
        <Card className="overflow-hidden rounded-2xl border-border p-0 shadow-elevated">
          <ScanViewfinder phase={phase} />

          <CardContent className="space-y-3 p-5">
            <Button
              type="button"
              data-ocid="scan.primary_button"
              onClick={runScan}
              disabled={isScanning}
              className="h-12 w-full rounded-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated active:scale-[0.99] disabled:opacity-60"
            >
              {isScanning ? (
                <>
                  <ScanLine
                    className="size-5 animate-pulse"
                    aria-hidden="true"
                  />
                  กำลังสแกน…
                </>
              ) : (
                <>
                  <ScanLine className="size-5" aria-hidden="true" />
                  {phase === "result" ? "สแกนป้ายอีกครั้ง" : "เริ่มสแกนป้าย"}
                </>
              )}
            </Button>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              ใช้เวลาประมาณ 2 วินาที · ผลลัพธ์เป็นข้อมูลตัวอย่างของมหาวิทยาลัย
            </p>
          </CardContent>
        </Card>

        {/* ---------------- Result column ---------------- */}
        <div className="space-y-4">
          {phase === "idle" && (
            <Card
              data-ocid="scan.empty_state"
              className="rounded-2xl border-dashed border-border bg-card shadow-soft"
            >
              <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                  <MapPin className="size-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-base font-bold">
                  ยังไม่มีผลการสแกน
                </h2>
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                  กด “เริ่มสแกนป้าย” เพื่อให้ AI ตรวจจับอาคารและห้องเรียน
                  แล้วระบบจะแนะนำเส้นทางให้ทันที
                </p>
              </CardContent>
            </Card>
          )}

          {phase === "scanning" && (
            <Card
              data-ocid="scan.loading_state"
              className="rounded-2xl border-border shadow-soft"
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <Sparkles
                    className="size-4 animate-pulse text-primary"
                    aria-hidden="true"
                  />
                  AI กำลังวิเคราะห์สถานที่...
                </div>
                <div className="space-y-3">
                  <div className="h-5 w-2/3 animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-5/6 animate-pulse rounded-lg bg-muted" />
                </div>
              </CardContent>
            </Card>
          )}

          {phase === "error" && (
            <Card
              data-ocid="scan.error_state"
              className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-soft"
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-destructive">
                  <AlertCircle className="size-4" aria-hidden="true" />
                  สแกนไม่สำเร็จ
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  ระบบไม่สามารถอ่านป้ายได้ในขณะนี้ กรุณาลองสแกนอีกครั้ง
                </p>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="scan.retry_button"
                  onClick={runScan}
                  className="h-11 rounded-full font-bold"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  ลองอีกครั้ง
                </Button>
              </CardContent>
            </Card>
          )}

          {phase === "result" && result && (
            <ScanResultCard
              result={result}
              onNavigate={handleNavigate}
              onRescan={runScan}
            />
          )}

          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-xs leading-relaxed text-muted-foreground">
              เคล็ดลับ: หลังสแกนแล้ว กด “🧭 พาฉันไป”
              เพื่อเปิดแผนที่นำทางอัจฉริยะพร้อมเส้นทางเดินและจุดขึ้นรถ EV ที่ใกล้ที่สุด
              โดยไม่ต้องวางแผนเส้นทางซ้ำ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
