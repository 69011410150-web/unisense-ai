import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Camera, ScanLine, Sparkles } from "lucide-react";

export type ScanPhase = "idle" | "scanning" | "result" | "error";

/** The four corner brackets that frame the simulated camera stage. */
const BRACKETS = [
  "left-[10%] top-[14%] rounded-tl-2xl border-l-2 border-t-2",
  "right-[10%] top-[14%] rounded-tr-2xl border-r-2 border-t-2",
  "bottom-[14%] left-[10%] rounded-bl-2xl border-b-2 border-l-2",
  "bottom-[14%] right-[10%] rounded-br-2xl border-b-2 border-r-2",
] as const;

/**
 * The simulated camera stage. It is a deliberate "optical device" surface that
 * stays dark in both themes, so it never reads as an ordinary page section.
 * No camera permission is ever requested — the stage is pure CSS.
 */
export function ScanViewfinder({ phase }: { phase: ScanPhase }) {
  const isScanning = phase === "scanning";

  return (
    <div
      data-ocid="scan.viewfinder"
      className="relative aspect-[4/3] w-full overflow-hidden bg-viewfinder sm:aspect-[16/10]"
    >
      {/* Faux campus corridor backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 50% 0%, oklch(var(--viewfinder-border)) 0%, oklch(var(--viewfinder)) 62%), linear-gradient(180deg, oklch(var(--viewfinder-border) / 0.7) 0%, oklch(var(--viewfinder)) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, oklch(var(--viewfinder-border) / 0.55) 0px, oklch(var(--viewfinder-border) / 0.55) 2px, transparent 2px, transparent 46px)",
        }}
      />

      {/* Corner brackets */}
      <div aria-hidden="true" className="absolute inset-0">
        {BRACKETS.map((position) => (
          <span
            key={position}
            className={cn(
              "absolute size-10 border-viewfinder-bracket/85 transition-snappy",
              position,
              isScanning && "border-primary",
            )}
          />
        ))}
      </div>

      {/* Sweeping scan line */}
      {isScanning && (
        <div
          aria-hidden="true"
          className="absolute inset-x-[10%] top-[14%] h-0.5 animate-scan-line bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_18px_2px_oklch(var(--primary)/0.55)]"
        />
      )}

      {/* Status chip */}
      <div className="absolute left-4 top-4">
        <Badge
          variant="secondary"
          className="gap-1.5 rounded-full border border-viewfinder-bracket/25 bg-viewfinder/70 px-3 py-1 text-[11px] font-medium text-viewfinder-foreground backdrop-blur-sm"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              isScanning ? "animate-pulse bg-accent" : "bg-viewfinder-muted",
            )}
          />
          {isScanning ? "กำลังสแกน…" : "กล้องจำลอง"}
        </Badge>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
        {isScanning ? (
          <>
            <span className="relative flex size-14 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-ping rounded-full bg-primary/30"
              />
              <span className="relative flex size-14 items-center justify-center rounded-full bg-primary/25 text-viewfinder-foreground backdrop-blur-sm">
                <Sparkles className="size-6" aria-hidden="true" />
              </span>
            </span>
            <p
              data-ocid="scan.scanning_state"
              aria-live="polite"
              className="font-display text-sm font-semibold tracking-wide text-viewfinder-foreground"
            >
              AI กำลังวิเคราะห์สถานที่...
            </p>
            <p className="text-xs text-viewfinder-muted">
              อ่านชื่ออาคาร ชั้น และเลขห้องจากป้าย
            </p>
          </>
        ) : (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-viewfinder-foreground/10 text-viewfinder-foreground/85 backdrop-blur-sm">
              <Camera className="size-6" aria-hidden="true" />
            </span>
            <p className="font-display text-sm font-semibold tracking-wide text-viewfinder-foreground">
              ส่องกล้องไปที่ป้ายอาคาร
            </p>
            <p className="text-xs text-viewfinder-muted">
              ตัวอย่างป้าย: “อาคารวิทยาศาสตร์ 2 · SC-204”
            </p>
          </>
        )}
      </div>

      {/* Bottom hint strip */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-viewfinder/70 px-4 py-2 backdrop-blur-sm">
        <ScanLine
          className="size-3.5 text-viewfinder-muted"
          aria-hidden="true"
        />
        <p className="text-[11px] font-medium text-viewfinder-muted">
          กรอบมุมช่วยจัดป้ายให้อยู่กลางภาพ
        </p>
      </div>
    </div>
  );
}
