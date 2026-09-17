import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ScanResult } from "@/types";
import { Building2, Compass, DoorOpen, Layers, RotateCcw } from "lucide-react";

interface ScanResultCardProps {
  result: ScanResult;
  onNavigate: () => void;
  onRescan: () => void;
}

/** One labelled place detail: 📍 อาคาร / 🏢 ชั้น / 🚪 ห้อง. */
function DetailRow({
  emoji,
  label,
  value,
  ocid,
}: {
  emoji: string;
  label: string;
  value: string;
  ocid: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
      <span aria-hidden="true" className="text-base leading-none">
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-muted-foreground">
          {label}
        </p>
        <p
          data-ocid={ocid}
          className="nums-tabular truncate font-display text-sm font-bold text-foreground"
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/**
 * The demo detection result: the building, floor and room the simulated scan
 * returned, the walking hint, and the hand-off into Smart Navigation.
 */
export function ScanResultCard({
  result,
  onNavigate,
  onRescan,
}: ScanResultCardProps) {
  return (
    <Card
      data-ocid="scan.result_card"
      className="animate-fade-rise overflow-hidden rounded-2xl border-border p-0 shadow-elevated"
    >
      <div className="flex items-center gap-2 border-b border-border bg-success/10 px-5 py-3">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
          <Compass className="size-3.5" aria-hidden="true" />
        </span>
        <p className="font-display text-sm font-bold text-foreground">
          ✦ AI ตรวจพบ
        </p>
      </div>

      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            อาคารที่ตรวจพบ
          </p>
          <p
            data-ocid="scan.result_building"
            className="font-display text-xl font-bold tracking-tight text-foreground"
          >
            {result.buildingName}
          </p>
        </div>

        <div className="space-y-2">
          <DetailRow
            emoji="📍"
            label="อาคาร"
            value={result.buildingName}
            ocid="scan.result_location"
          />
          <DetailRow
            emoji="🏢"
            label="ชั้น"
            value={`ชั้น ${Number(result.floor)}`}
            ocid="scan.result_floor"
          />
          <DetailRow
            emoji="🚪"
            label="ห้อง"
            value={result.roomCode}
            ocid="scan.result_room"
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <Layers
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-bold text-primary">คำแนะนำการเดิน</p>
            <p
              data-ocid="scan.result_instruction"
              className="text-sm leading-relaxed text-foreground/85"
            >
              {result.instruction}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-secondary/50 p-4">
          <p className="flex items-start gap-2 text-sm font-bold text-foreground">
            <Building2
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            ต้องการให้ AI พาไปยังห้องนี้ไหม?
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              data-ocid="scan.navigate_button"
              onClick={onNavigate}
              className="h-11 flex-1 rounded-full bg-gradient-primary font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated active:scale-[0.99]"
            >
              🧭 พาฉันไป
            </Button>
            <Button
              type="button"
              variant="outline"
              data-ocid="scan.rescan_button"
              onClick={onRescan}
              className="h-11 rounded-full font-bold sm:w-auto"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              สแกนใหม่
            </Button>
          </div>
        </div>

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <DoorOpen className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          ผลลัพธ์นี้เป็นชุดข้อมูลตัวอย่างของมหาวิทยาลัย (อาคารวิทยาศาสตร์ 2 / SC-204)
          ไม่ใช่การอ่านป้ายจริง
        </p>
      </CardContent>
    </Card>
  );
}
