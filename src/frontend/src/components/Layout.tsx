import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  CalendarDays,
  Camera,
  Home,
  type LucideIcon,
  Map as MapIcon,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  key: string;
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", to: "/", label: "หน้าหลัก", icon: Home },
  { key: "ai", to: "/ai", label: "AI", icon: Bot },
  { key: "scan", to: "/scan", label: "AI Scan 📷", icon: Camera },
  { key: "schedule", to: "/schedule", label: "ตารางเรียน", icon: CalendarDays },
  { key: "navigate", to: "/navigate", label: "แผนที่", icon: MapIcon },
  { key: "profile", to: "/profile", label: "โปรไฟล์", icon: UserRound },
];

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      data-ocid="nav.brand_link"
      className="group flex min-w-0 items-center gap-2.5 rounded-2xl px-1 py-1 transition-snappy hover:opacity-90"
    >
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
        <Sparkles className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-bold leading-tight tracking-tight text-foreground">
          UniSense AI
        </span>
        {!compact && (
          <span className="block truncate text-[11px] font-medium leading-tight text-muted-foreground">
            เพื่อนคู่คิดในรั้วมหาวิทยาลัย
          </span>
        )}
      </span>
    </Link>
  );
}

function SidebarNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <nav
      data-ocid="nav.sidebar"
      aria-label="เมนูหลัก"
      className="flex flex-1 flex-col gap-1 px-3 py-4"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            to={item.to}
            data-ocid={`nav.sidebar.${item.key}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-snappy",
              active
                ? "bg-primary/10 text-primary shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <nav
      data-ocid="nav.bottom"
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-safe pt-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.to);
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex-1">
              <Link
                to={item.to}
                data-ocid={`nav.bottom.${item.key}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition-snappy",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full transition-snappy",
                    active ? "bg-primary/12 shadow-soft" : "bg-transparent",
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    "max-w-full truncate text-[10px] leading-none",
                    active ? "font-bold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center border-b border-border px-4">
          <BrandMark />
        </div>
        <SidebarNav />
        <div className="border-t border-border px-4 py-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            ข้อมูลตัวอย่างสำหรับสาธิตเท่านั้น
          </p>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 md:px-8">
            <BrandMark compact />
            <p className="hidden font-display text-sm font-semibold tracking-tight text-muted-foreground md:block">
              ผู้ช่วยอัจฉริยะสำหรับชีวิตในมหาวิทยาลัย
            </p>
            <Link
              to="/profile"
              data-ocid="nav.header_profile_link"
              aria-label="ไปที่โปรไฟล์ของฉัน"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-secondary text-secondary-foreground transition-snappy hover:shadow-soft"
            >
              <UserRound className="size-[18px]" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-safe-nav pt-5 md:px-8 md:pb-12 md:pt-8">
          {children}
        </main>

        <footer className="border-t border-border bg-muted/40 px-4 py-6 pb-safe-nav md:px-8 md:pb-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 text-xs text-muted-foreground">
            <p>UniSense AI — ต้นแบบสาธิต ข้อมูลทั้งหมดเป็นข้อมูลจำลอง</p>
            <p>
              © {new Date().getFullYear()}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </footer>
      </div>

      <BottomNav />
    </div>
  );
}
