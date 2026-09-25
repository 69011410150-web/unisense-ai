import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAppState } from "@/context/AppStateContext";
import { useProfile, useSchedule } from "@/hooks/useQueries";
import {
  formatDuration,
  thaiDayName,
  thaiLongDate,
  timeToMinutes,
} from "@/lib/datetime";
import type { ClassEntry } from "@/types";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Bus,
  CalendarDays,
  Camera,
  Compass,
  GraduationCap,
  Info,
  Languages,
  Library,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  UserRound,
  Utensils,
} from "lucide-react";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";

const PROFILE_PHOTO_STORAGE_KEY = "unisense.profile-photo";
const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;

/** The student's usual campus commute, shown as a demo summary. */
const USUAL_ROUTE = {
  origin: "หอพักนักศึกษา อาคาร C",
  destination: "อาคารวิศวกรรมศาสตร์ 3",
  evLine: "EV สาย 2 (หอพัก – วิศวะ)",
  walkMinutes: 7,
  evMinutes: 6,
};

/** Campus places associated with this fictional student's demo routine. */
const RELATED_PLACES = [
  {
    name: "จุดเริ่มต้น – จากหอพักเข้าถนนหลัก",
    detail: "หากอยู่โซนท่าขอนยาง/หน้ามอ ให้เดินเข้าประตู มมส. แล้วมองหาทางเท้าป้ายสีเหลืองข้างทาง",
    context: "จุดเริ่มต้นการเดินทาง",
    icon: MapPin,
  },
  {
    name: "ประตูทางเข้าตึก PH (มี 5 ทางเข้า)",
    detail: "1) หน้าคณะหลังรูปปั้นพระบิดา 2) ลานจอดฝั่งขวา 3) ลานจอดฝั่งซ้าย (เปิดตลอด) 4-5) ประตูหลังตึก",
    context: "ทางเข้าอาคาร PH",
    icon: Route,
  },
  {
    name: "ที่จอดรถตึก PH",
    detail: "หลัก: ข้างคณะติดถนนฝั่งเข้ามอ (หลังตึกจอดอาจารย์) / เพิ่มเติม: ตรงข้ามคณะหลังศูนย์เสริมความร่วมมือฯ",
    context: "จุดจอดรถยนต์ / จักรยานยนต์",
    icon: MapPin,
  },
  {
    name: "ลิฟต์และผังอาคาร ตึก PH",
    detail: "ชั้น 1: สำนักงานคณบดี/ลิฟต์ 2 ฝั่ง / ชั้น 2-3: ห้องบรรยาย PH201-314 / ชั้น 4: ห้องแลป / ชั้น 5: ห้องสัมมนา",
    context: "แผนผังอาคาร PH ชั้น 1-5",
    icon: BookOpen,
  },
  {
    name: "เข้าทางหน้าตึก RN (อาคารราชนครินทร์)",
    detail: "อยู่ตรงข้ามโรงเรียนสาธิตฯ ข้ามถนนมาจะเจอตึก RN หรือมาจากไฟแดงคณะบัญชีกลับรถแล้วเลี้ยวซ้าย",
    context: "ทางเข้าอาคาร RN",
    icon: Route,
  },
  {
    name: "ที่จอดรถตึก RN – ด้านหน้า/ด้านข้าง/ด้านหลัง",
    detail: "หน้าตึก/ขวา: รถยนต์ / ซ้าย: มอเตอร์ไซค์ 100+ คัน / หลังตึก: ลานจอดใหญ่สุด (หากเต็มจอดคณะมนุษย์ฯ)",
    context: "จุดจอดรถยนต์ / จักรยานยนต์",
    icon: MapPin,
  },
  {
    name: "ไปตึก EN – คณะวิศวกรรมศาสตร์",
    detail: "มุ่งหน้าไปด้านหลังตึกคณะสุขภาพฯ และวิทยาการสารสนเทศ สังเกตฝั่งตรงข้ามศูนย์นวัตกรรมใหม่",
    context: "เส้นทางไปตึก EN",
    icon: Route,
  },
  {
    name: "ไปตึก SC – คณะวิทยาศาสตร์ชีวภาพ",
    detail: "เข้าทางประตูหน้า ม.ใหม่ ขับตรงมาผ่านวงเวียนแรก สังเกตฝั่งขวาผ่านตึก RN เลี้ยวขวาเข้าสู่ตึก SC2",
    context: "เส้นทางไปตึก SC",
    icon: Route,
  },
  {
    name: "ที่จอดรถตึก SC2 / SC3",
    detail: "มีจุดจอดหน้าตึก ข้างตึก และหลังตึก SC2 รวมถึงลานจอดโซนรถยนต์/จักรยานยนต์หน้าตึก SC3",
    context: "จุดจอดรถยนต์ / จักรยานยนต์",
    icon: MapPin,
  },
] satisfies Array<{
  name: string;
  detail: string;
  context: string;
  icon: LucideIcon;
}>;

  {
    name: "ไปตึก RN – อาคารราชนครินทร์",
    detail: "อาคารเรียนรวมมุ่งตรงไปทางโชนคณะมนุษยศาสตร์ฯ ตัวอาคารตั้งอยู่ใกล้กลุ่มตึกเรียนรวมและสำนักวิทยบริการ",
    context: "เส้นทางไปตึก RN",
    icon: BookOpen,
  },
  {
    name: "ที่จอดรถ SC2 / SC3",
    detail: "มีจุดจอดหน้าตึก ข้างตึก และหลังตึก SC2 รวมถึงลานจอดโซนรถยนต์/จักรยานยนต์หน้าตึก SC3",
    context: "จุดจอดรถยนต์ / จักรยานยนต์",
    icon: MapPin,
  },
] satisfies Array<{
  name: string;
  detail: string;
  context: string;
  icon: LucideIcon;
}>;

  {
    name: "แผงผังตึก SC3",
    detail: "ผังตึกและห้องแลปปี 1 (ใช้เรียนชั้น 5 ชีววิทยา และชั้น 6 เคมี)",
    context: "แผนผังอาคาร SC3",
    icon: BookOpen,
  },
] satisfies Array<{
  name: string;
  detail: string;
  context: string;
  icon: LucideIcon;
}>;


interface Preference {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  defaultOn: boolean;
}

const PREFERENCES: Preference[] = [
  {
    key: "notifications",
    label: "การแจ้งเตือนคลาสเรียน",
    hint: "เตือนก่อนถึงเวลาเรียนในแอป",
    icon: Bell,
    defaultOn: true,
  },
  {
    key: "ev_alerts",
    label: "แจ้งเตือนรถ EV",
    hint: "บอกเมื่อรถ EV ใกล้ถึงป้าย",
    icon: Bus,
    defaultOn: true,
  },
  {
    key: "thai_display",
    label: "แสดงผลภาษาไทย",
    hint: "ใช้ภาษาไทยเป็นภาษาหลักของแอป",
    icon: Languages,
    defaultOn: true,
  },
  {
    key: "quiet_hours",
    label: "โหมดเงียบระหว่างเรียน",
    hint: "ปิดการแจ้งเตือนขณะอยู่ในคลาส",
    icon: ShieldCheck,
    defaultOn: false,
  },
];

function SectionHeading({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: LucideIcon;
  action?: { to: string; label: string };
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {title}
      </h2>
      {action && (
        <Link
          to={action.to}
          data-ocid="profile.section_link"
          className="rounded-lg text-xs font-semibold text-primary transition-snappy hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function ProfileHeader() {
  const { data: profile, isLoading } = useProfile();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    try {
      setPhoto(window.localStorage.getItem(PROFILE_PHOTO_STORAGE_KEY));
    } catch {
      setPhotoError("ไม่สามารถอ่านรูปที่บันทึกไว้ในเครื่องได้");
    }
  }, []);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setPhotoError("รูปต้องมีขนาดไม่เกิน 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setPhotoError("ไม่สามารถอ่านรูปนี้ได้ กรุณาลองรูปอื่น");
        return;
      }
      try {
        window.localStorage.setItem(PROFILE_PHOTO_STORAGE_KEY, reader.result);
        setPhoto(reader.result);
        setPhotoError("");
      } catch {
        setPhotoError("พื้นที่จัดเก็บในเครื่องไม่เพียงพอ กรุณาเลือกรูปที่เล็กลง");
      }
    };
    reader.onerror = () => setPhotoError("ไม่สามารถอ่านรูปนี้ได้ กรุณาลองรูปอื่น");
    reader.readAsDataURL(file);
  }

  if (isLoading) {
    return (
      <Card
        data-ocid="profile.header.loading_state"
        className="rounded-2xl border-border p-5 shadow-soft"
      >
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </Card>
    );
  }

  const displayName = profile?.displayName ?? "นักศึกษาตัวอย่าง";
  const initial = displayName.trim().charAt(0) || "U";

  return (
    <Card
      data-ocid="profile.header.card"
      className="relative overflow-hidden rounded-2xl border-border p-0 shadow-elevated"
    >
      <div className="bg-gradient-primary px-5 pb-12 pt-5 text-primary-foreground">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-90">
            <UserRound className="size-3.5" aria-hidden="true" />
            โปรไฟล์ของฉัน
          </span>
          <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[11px] font-bold">
            ข้อมูลตัวอย่าง
          </span>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="-mt-10 flex items-end gap-4">
          <div className="relative shrink-0">
            <span
              data-ocid="profile.avatar"
              className="grid size-20 overflow-hidden rounded-full border-4 border-card bg-secondary font-display text-2xl font-bold text-primary shadow-elevated"
            >
              {photo ? (
                <img
                  src={photo}
                  alt={`รูปโปรไฟล์ของ ${displayName}`}
                  className="size-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid size-full place-items-center"
                >
                  {initial}
                </span>
              )}
            </span>
            <label
              htmlFor="profile-photo-input"
              data-ocid="profile.photo.upload_button"
              className="absolute -bottom-1 -right-1 grid size-9 cursor-pointer place-items-center rounded-full border-[3px] border-card bg-primary text-primary-foreground shadow-soft transition-snappy hover:scale-105 hover:shadow-elevated focus-within:ring-2 focus-within:ring-ring/40"
              aria-label={photo ? "เปลี่ยนรูปโปรไฟล์" : "เลือกรูปโปรไฟล์"}
              title={photo ? "เปลี่ยนรูปโปรไฟล์" : "เลือกรูปโปรไฟล์"}
            >
              <Camera className="size-4" aria-hidden="true" />
              <input
                id="profile-photo-input"
                data-ocid="profile.photo.upload_input"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
              {displayName}
            </h1>
            <p className="nums-tabular truncate text-xs font-medium text-muted-foreground">
              รหัสนักศึกษา {profile?.studentId ?? "—"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              แตะไอคอนกล้องเพื่อ{photo ? "เปลี่ยนรูป" : "เลือกรูป"}
            </p>
          </div>
        </div>

        {photoError && (
          <p
            data-ocid="profile.photo.error_state"
            role="alert"
            className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
          >
            {photoError}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-secondary px-3.5 py-2.5">
            <GraduationCap
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-muted-foreground">
                คณะ
              </dt>
              <dd className="truncate text-sm font-bold text-foreground">
                {profile?.faculty ?? "—"}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-secondary px-3.5 py-2.5">
            <BadgeCheck
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-muted-foreground">
                ชั้นปี
              </dt>
              <dd className="nums-tabular truncate text-sm font-bold text-foreground">
                {profile ? `ชั้นปีที่ ${Number(profile.year)}` : "—"}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </Card>
  );
}

function TodaySummary() {
  const { data: schedule, isLoading } = useSchedule();
  const today = useMemo(() => new Date(), []);

  const todayClasses = useMemo(() => {
    if (!schedule) return [];
    const todayName = thaiDayName(today);
    return schedule
      .filter((entry) => entry.day === todayName)
      .sort(
        (a, b) =>
          (timeToMinutes(a.startTime) ?? 0) - (timeToMinutes(b.startTime) ?? 0),
      );
  }, [schedule, today]);

  const totalMinutes = useMemo(
    () =>
      todayClasses.reduce((sum, entry) => {
        const start = timeToMinutes(entry.startTime);
        const end = timeToMinutes(entry.endTime);
        return start !== null && end !== null
          ? sum + Math.max(end - start, 0)
          : sum;
      }, 0),
    [todayClasses],
  );

  const weekDays = useMemo(() => {
    if (!schedule) return 0;
    return new Set(schedule.map((entry: ClassEntry) => entry.day)).size;
  }, [schedule]);

  return (
    <section data-ocid="profile.today.section">
      <SectionHeading
        title="สรุปวันนี้"
        icon={CalendarDays}
        action={{ to: "/schedule", label: "ดูตารางทั้งสัปดาห์" }}
      />

      <Card className="rounded-2xl border-border p-5 shadow-soft">
        <p className="text-xs font-semibold text-muted-foreground">
          {thaiDayName(today)}ที่ {thaiLongDate(today)}
        </p>

        {isLoading ? (
          <div
            data-ocid="profile.today.loading_state"
            className="mt-3 space-y-2"
          >
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : todayClasses.length === 0 ? (
          <div
            data-ocid="profile.today.empty_state"
            className="mt-3 flex items-start gap-3 rounded-xl bg-secondary px-4 py-3"
          >
            <Sparkles
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">
                วันนี้ไม่มีคลาสเรียน
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                ใช้เวลาว่างอ่านหนังสือหรือทำกิจกรรมในมหาวิทยาลัยได้เลย
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul data-ocid="profile.today.list" className="mt-3 space-y-2">
              {todayClasses.map((entry, index) => (
                <li
                  key={entry.id.toString()}
                  data-ocid={`profile.today.item.${index + 1}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 transition-snappy hover:border-primary/30 hover:shadow-soft"
                >
                  <span className="nums-tabular w-24 shrink-0 text-xs font-bold text-primary">
                    {entry.startTime} – {entry.endTime}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {entry.subject}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {entry.buildingName} · ห้อง {entry.roomCode}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="nums-tabular rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                {todayClasses.length} คลาสวันนี้
              </span>
              <span className="nums-tabular rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-secondary-foreground">
                รวม {formatDuration(totalMinutes)}
              </span>
              <span className="nums-tabular rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-secondary-foreground">
                เรียน {weekDays} วัน/สัปดาห์
              </span>
            </div>
          </>
        )}
      </Card>
    </section>
  );
}

function UsualRoute() {
  const { requestRoute } = useAppState();

  return (
    <section data-ocid="profile.route.section">
      <SectionHeading title="เส้นทางประจำของฉัน" icon={Route} />

      <Card className="rounded-2xl border-border p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Compass className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              เส้นทางที่ใช้บ่อย
            </p>
            <h3 className="mt-1 truncate text-base font-bold tracking-tight text-foreground">
              {USUAL_ROUTE.origin} → {USUAL_ROUTE.destination}
            </h3>
          </div>
        </div>

        <ol className="mt-4 space-y-2.5">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-bold text-primary">
              1
            </span>
            <p className="min-w-0 text-sm text-muted-foreground">
              ขึ้น{" "}
              <span className="font-semibold text-foreground">
                {USUAL_ROUTE.evLine}
              </span>{" "}
              ที่ป้ายหน้าหอพัก ใช้เวลาราว{" "}
              <span className="nums-tabular font-semibold text-foreground">
                {USUAL_ROUTE.evMinutes} นาที
              </span>
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-bold text-primary">
              2
            </span>
            <p className="min-w-0 text-sm text-muted-foreground">
              ลงป้ายหน้าอาคารเรียน แล้วเดินต่ออีก{" "}
              <span className="nums-tabular font-semibold text-foreground">
                {USUAL_ROUTE.walkMinutes} นาที
              </span>{" "}
              ถึงห้องเรียน
            </p>
          </li>
        </ol>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
            เวลารวมโดยประมาณ
          </span>
          <span className="nums-tabular text-base font-bold text-primary">
            {formatDuration(USUAL_ROUTE.evMinutes + USUAL_ROUTE.walkMinutes)}
          </span>
        </div>

        <Button
          asChild
          className="mt-3 h-11 w-full rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-soft transition-snappy hover:shadow-elevated"
        >
          <Link
            to="/navigate"
            data-ocid="profile.route.navigate_button"
            onClick={() =>
              requestRoute({
                originName: USUAL_ROUTE.origin,
                destinationName: USUAL_ROUTE.destination,
              })
            }
          >
            <Compass className="size-4" aria-hidden="true" />
            เปิดเส้นทางนี้ในแผนที่
          </Link>
        </Button>
      </Card>
    </section>
  );
}

function RelatedPlaces() {
  return (
    <section data-ocid="profile.places.section">
      <SectionHeading title="สถานที่ที่เกี่ยวข้อง" icon={MapPin} />

      <div className="grid gap-3 sm:grid-cols-3">
        {RELATED_PLACES.map((place, index) => {
          const Icon = place.icon;
          return (
            <Card
              key={place.name}
              data-ocid={`profile.places.item.${index + 1}`}
              className="group relative overflow-hidden rounded-2xl border-border p-4 shadow-soft transition-snappy hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-elevated"
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-primary/70" />
              <div className="flex items-start gap-3 sm:block">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-snappy group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0 sm:mt-4">
                  <p className="text-[11px] font-bold text-primary">
                    {place.context}
                  </p>
                  <h3 className="mt-0.5 truncate text-sm font-bold text-foreground">
                    {place.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {place.detail}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-[11px] text-muted-foreground">
        สถานที่เป็นข้อมูลประกอบสถานการณ์จำลอง ไม่มีการบันทึกหรือติดตามตำแหน่งจริง
      </p>
    </section>
  );
}

function Preferences() {
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PREFERENCES.map((item) => [item.key, item.defaultOn])),
  );

  function toggle(key: string, next: boolean) {
    setValues((current) => ({ ...current, [key]: next }));
  }

  return (
    <section data-ocid="profile.preferences.section">
      <SectionHeading title="การตั้งค่า" icon={Bell} />

      <Card className="divide-y divide-border rounded-2xl border-border p-0 shadow-soft">
        {PREFERENCES.map((item) => {
          const Icon = item.icon;
          const checked = values[item.key] ?? false;
          return (
            <div
              key={item.key}
              data-ocid={`profile.preference.${item.key}`}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {item.label}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {item.hint}
                </p>
              </div>
              <Switch
                data-ocid={`profile.preference.${item.key}.switch`}
                checked={checked}
                onCheckedChange={(next) => toggle(item.key, next)}
                aria-label={item.label}
              />
            </div>
          );
        })}
      </Card>

      <p
        data-ocid="profile.preferences.status"
        aria-live="polite"
        className="mt-2 px-1 text-[11px] text-muted-foreground"
      >
        เปิดใช้งานอยู่{" "}
        <span className="nums-tabular font-bold text-foreground">
          {Object.values(values).filter(Boolean).length}
        </span>{" "}
        จาก {PREFERENCES.length} รายการ
      </p>
    </section>
  );
}

function PrototypeNotice() {
  return (
    <section data-ocid="profile.notice.section">
      <Card className="rounded-2xl border-border bg-gradient-subtle p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
            <Info className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              ต้นแบบสาธิต
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              UniSense AI เวอร์ชันนี้เป็นต้นแบบเพื่อการสาธิต ข้อมูลทั้งหมดเป็น ข้อมูลจำลอง
              ไม่ได้เชื่อมต่อกับระบบทะเบียนของมหาวิทยาลัย ไม่มีข้อมูลส่วนบุคคลของนักศึกษาจริง
              และไม่มีการติดตามตำแหน่ง GPS จริงแต่อย่างใด
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}

function AboutSection() {
  return (
    <section data-ocid="profile.about.section">
      <SectionHeading title="เกี่ยวกับ UniSense AI" icon={Sparkles} />

      <Card className="rounded-2xl border-border p-5 shadow-soft">
        <p className="text-sm leading-relaxed text-muted-foreground">
          UniSense AI คือผู้ช่วยอัจฉริยะสำหรับชีวิตในมหาวิทยาลัย ช่วยวางแผนเส้นทางไปห้องเรียน
          ดูตารางเรียนทั้งสัปดาห์ สแกนป้ายห้องเพื่อบอกตำแหน่งปัจจุบัน ติดตามรถ EV
          ภายในมหาวิทยาลัย และตอบคำถามเกี่ยวกับมหาวิทยาลัยผ่านผู้ช่วย AI
          ทั้งหมดออกแบบให้เข้าใจง่ายและใช้งานได้จริงบนมือถือ
        </p>

        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { icon: Compass, text: "นำทางไปห้องเรียนแบบทีละขั้น" },
            { icon: CalendarDays, text: "ตารางเรียนและคลาสถัดไป" },
            { icon: Bus, text: "ติดตามรถ EV ภายในมหาวิทยาลัย" },
            { icon: Sparkles, text: "ผู้ช่วย AI ตอบคำถามมหาวิทยาลัย" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.text}
                className="flex items-center gap-2.5 rounded-xl bg-secondary px-3.5 py-2.5"
              >
                <Icon
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate text-xs font-semibold text-foreground">
                  {item.text}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}

export function Profile() {
  return (
    <div data-ocid="profile.page" className="space-y-6">
      <ProfileHeader />
      <TodaySummary />
      <RelatedPlaces />
      <UsualRoute />
      <Preferences />
      <PrototypeNotice />
      <AboutSection />
    </div>
  );
}
