"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronDown,
  Wallet,
  FileText,
  CalendarDays,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();

  const isDashboard = pathname === "/dashboard";
  const isSettings = pathname.startsWith("/dashboard/settings");
  const isViewEntries = pathname.startsWith("/dashboard/view-entries");
  const isAccountSummary = pathname.startsWith("/dashboard/account-summary");
  const isBreakerSummary = pathname.startsWith("/dashboard/account-summary/breaker-summary");
  const isDaySummary = pathname.startsWith("/dashboard/account-summary/day-summary");

  const [isAccountOpen, setIsAccountOpen] = useState(isAccountSummary);

  const dashboardHref = `/dashboard${currentQuery ? `?${currentQuery}` : ""}`;
  const viewEntriesHref = `/dashboard/view-entries${currentQuery ? `?${currentQuery}` : ""}`;

  return (
    <div className="flex min-h-screen select-none flex-col bg-[#060913] font-sans text-slate-100">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} branches={[]} />

      <div className="relative flex min-h-0 w-full flex-1 flex-col md:flex-row">
        {/* ✅ PROFESSIONAL SIDEBAR */}
        <aside className="relative flex w-full shrink-0 flex-col justify-between overflow-hidden border-b border-white/[0.06] bg-[#0B1226] p-5 md:w-[272px] md:border-b-0 md:border-r print:hidden">
          {/* Top Glow - Premium feel */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[320px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[80px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-blue-600/[0.06] to-transparent" />

          <div className="relative">
            {/* ✅ LOGO - Professional */}
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-sm font-black tracking-tight text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20">
                DE
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-black leading-tight tracking-[0.08em] text-white">
                  DEARO TUNNEL
                </h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-[9px] font-bold tracking-[0.18em] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  CENTRAL SYSTEM • LIVE
                </p>
              </div>
              <Sparkles size={15} className="ml-auto shrink-0 text-amber-400/70" />
            </div>

            {/* ✅ SECTION LABEL */}
            <p className="mb-3 px-3 text-[10px] font-black tracking-[0.2em] text-slate-500">
              MAIN MENU
            </p>

            <nav className="space-y-1.5">
              {/* Core Dashboard */}
              <Link
                href={dashboardHref}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isDashboard
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-400/30"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white hover:ring-1 hover:ring-white/[0.06]"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isDashboard ? "bg-white/20 text-white" : "bg-slate-800/80 text-slate-400 group-hover:bg-slate-700/80 group-hover:text-white"}`}>
                  <LayoutDashboard size={16} />
                </span>
                <span className="flex-1">Core Dashboard</span>
                {isDashboard && <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#fff]" />}
              </Link>

              {/* Settings */}
              <Link
                href="/dashboard/settings"
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isSettings
                    ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white hover:ring-1 hover:ring-white/[0.06]"
                }`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${isSettings ? "bg-slate-700 text-white rotate-45" : "bg-slate-800/80 text-slate-400 group-hover:bg-slate-700/80 group-hover:text-white"}`}>
                  <Settings size={16} />
                </span>
                <span className="flex-1">Settings</span>
                {isSettings && <span className="h-2 w-2 rounded-full bg-slate-300" />}
              </Link>

              {/* View Entries */}
              <Link
                href={viewEntriesHref}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isViewEntries
                    ? "bg-cyan-500/10 text-cyan-300 shadow-sm ring-1 ring-cyan-500/20"
                    : "text-slate-400 hover:bg-cyan-500/[0.06] hover:text-cyan-300"
                }`}
              >
                {isViewEntries && <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isViewEntries ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800/80 text-slate-400 group-hover:bg-cyan-500/15 group-hover:text-cyan-300"}`}>
                  <ClipboardList size={16} />
                </span>
                <span className="flex-1">View Entries</span>
                {isViewEntries && <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />}
              </Link>
            </nav>

            {/* ✅ SECTION LABEL */}
            <p className="mb-3 mt-7 px-3 text-[10px] font-black tracking-[0.2em] text-slate-500">
              REPORTS & ACCOUNTS
            </p>

            <div className="space-y-1.5">
              {/* ✅ Account Summary - Premium Dropdown */}
              <div
                className={`overflow-hidden rounded-xl transition-all duration-300 ${
                  isAccountSummary || isAccountOpen
                    ? "bg-amber-500/[0.06] ring-1 ring-amber-500/15"
                    : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className={`group flex w-full items-center gap-3 px-3.5 py-3 text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isAccountSummary ? "text-amber-300" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isAccountSummary || isAccountOpen ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30" : "bg-slate-800/80 text-slate-400 group-hover:bg-amber-500/15 group-hover:text-amber-300"}`}>
                    <Wallet size={16} />
                  </span>
                  <span className="flex-1 text-left">Account Summary</span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.04] transition-transform duration-300 ${isAccountOpen ? "rotate-180 bg-amber-500/20" : ""}`}>
                    <ChevronDown size={13} />
                  </span>
                </button>

                {/* Dropdown */}
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isAccountOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-1 px-3 pb-3 pt-1">
                      <div className="ml-[22px] border-l border-white/[0.08] pl-3">
                        <Link
                          href="/dashboard/account-summary/breaker-summary"
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[11px] font-semibold tracking-wide transition-all duration-200 ${
                            isBreakerSummary
                              ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20"
                              : "text-slate-400 hover:bg-white/[0.04] hover:text-amber-300"
                          }`}
                        >
                          <FileText size={14} className={isBreakerSummary ? "text-amber-300" : "text-slate-500"} />
                          <span className="flex-1">Breaker Summary</span>
                          {isBreakerSummary && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />}
                        </Link>

                        <Link
                          href="/dashboard/account-summary/day-summary"
                          className={`mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[11px] font-semibold tracking-wide transition-all duration-200 ${
                            isDaySummary
                              ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20"
                              : "text-slate-400 hover:bg-white/[0.04] hover:text-amber-300"
                          }`}
                        >
                          <CalendarDays size={14} className={isDaySummary ? "text-amber-300" : "text-slate-500"} />
                          <span className="flex-1">Day Summary</span>
                          {isDaySummary && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ Exit System - Professional */}
              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold tracking-wide text-slate-400 transition-all duration-200 hover:bg-red-500/[0.08] hover:text-red-400 hover:ring-1 hover:ring-red-500/20"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-slate-400 transition-all group-hover:bg-red-500/15 group-hover:text-red-400">
                  <LogOut size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
                <span className="flex-1 text-left">Exit System</span>
              </button>
            </div>
          </div>

          {/* ✅ FOOTER - Trust / Professional */}
          <div className="relative mt-8">
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400" />
                <p className="text-[11px] font-bold tracking-wide text-white">Secure System</p>
                <span className="ml-auto flex items-center gap-1 text-[9px] font-bold tracking-widest text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  ONLINE
                </span>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                All entries are saved securely. Please verify before exiting the system.
              </p>
            </div>
            <p className="mt-4 text-center text-[9px] font-medium tracking-[0.15em] text-slate-600">
              DEARO TUNNEL © 2026 • v1.0
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-[#070a13]">
          {React.isValidElement(children)
            ? React.cloneElement(
                children as React.ReactElement<{
                  searchQuery?: string;
                }>,
                { searchQuery },
              )
            : children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070a13] text-cyan-400">
          Loading dashboard...
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}