/**
 * Shared Thai date/time helpers for UniSense AI.
 * All schedule times are "HH:MM" strings; all durations are whole minutes.
 */

const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/** "08:30" -> 510 minutes since midnight. Returns null when unparseable. */
export function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 510 -> "08:30" */
export function minutesToTime(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Thai weekday name for a JS Date. */
export function thaiDayName(date: Date): string {
  return THAI_DAYS[date.getDay()];
}

/** Thai long date, e.g. "17 กันยายน 2569". */
export function thaiLongDate(date: Date): string {
  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
}

/** Thai short date, e.g. "17 ก.ย." */
export function thaiShortDate(date: Date): string {
  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()].slice(0, 3)}.`;
}

/** Thai greeting that matches the current hour. */
export function thaiGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "สวัสดีตอนเช้า";
  if (hour < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

/** Minutes from now until a "HH:MM" time today. Negative when already past. */
export function minutesUntilTime(
  time: string,
  now: Date = new Date(),
): number | null {
  const target = timeToMinutes(time);
  if (target === null) return null;
  const current = now.getHours() * 60 + now.getMinutes();
  return target - current;
}

/** Human Thai countdown, e.g. "อีก 25 นาที" or "กำลังเรียนอยู่". */
export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "กำลังเรียนอยู่";
  if (minutes < 60) return `อีก ${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `อีก ${hours} ชั่วโมง` : `อีก ${hours} ชม. ${rest} นาที`;
}

/** Estimated arrival clock time, `minutes` from `now`. */
export function estimateArrival(
  minutes: number,
  now: Date = new Date(),
): string {
  return minutesToTime(now.getHours() * 60 + now.getMinutes() + minutes);
}

/** Duration in Thai, e.g. "1 ชม. 15 นาที". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ชม.` : `${hours} ชม. ${rest} นาที`;
}

/** Distance in Thai, metres below 1 km. */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${metres} ม.`;
  return `${(metres / 1000).toFixed(1)} กม.`;
}

/** Order the Thai week starting on Monday, for schedule grouping. */
export const WEEK_ORDER = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
];

export function daySortIndex(day: string): number {
  const index = WEEK_ORDER.indexOf(day);
  return index === -1 ? WEEK_ORDER.length : index;
}
