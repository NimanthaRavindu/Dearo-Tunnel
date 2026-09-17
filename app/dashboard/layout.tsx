"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import {usePathname,useSearchParams} from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import { ClipboardList,LayoutDashboard,LogOut,Settings} from "lucide-react";

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
  const isViewEntries = pathname.startsWith(
    "/dashboard/view-entries",
  );

  const dashboardHref = `/dashboard${
    currentQuery ? `?${currentQuery}` : ""
  }`;

  const viewEntriesHref = `/dashboard/view-entries${
    currentQuery ? `?${currentQuery}` : ""
  }`;

  return (
    <div className="flex min-h-screen select-none flex-col bg-[#070a13] font-sans text-slate-100">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        branches={[]}
      />

      <div className="relative flex min-h-0 w-full flex-1 flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col justify-between border-b border-slate-800/60 bg-[#0d1527] p-5 md:w-64 md:border-b-0 md:border-r print:hidden">
          <div>
            <div className="mb-8 flex items-center gap-3 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-blue-950/40">
                DE
              </div>

              <div>
                <h1 className="text-sm font-bold uppercase tracking-wider text-white">
                  DEARO TUNNEL
                </h1>

                <p className="text-[9px] font-bold tracking-widest text-slate-500">
                  CENTRAL SYSTEM
                </p>
              </div>
            </div>

            <nav className="space-y-1.5">
              <Link
                href={dashboardHref}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  isDashboard
                    ? "bg-blue-600/15 text-blue-400 shadow-sm shadow-blue-950/20"
                    : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                }`}
              >
                <LayoutDashboard
                  size={16}
                  className={
                    isDashboard
                      ? "text-blue-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  }
                />

                <span>Core Dashboard</span>

                {isDashboard && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                )}
              </Link>

              <Link
                href="/dashboard/settings"
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  isSettings
                    ? "bg-slate-700/40 text-slate-100 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
                }`}
              >
                <Settings
                  size={16}
                  className={`transition-all duration-200 ${
                    isSettings
                      ? "rotate-45 text-slate-200"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />

                <span>Settings</span>

                {isSettings && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </Link>

              <Link
                href={viewEntriesHref}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  isViewEntries
                    ? "bg-cyan-500/10 text-cyan-400 shadow-sm shadow-cyan-950/20 ring-1 ring-cyan-500/10"
                    : "text-slate-400 hover:bg-cyan-500/5 hover:text-cyan-400"
                }`}
              >
                {isViewEntries && (
                  <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                )}

                <ClipboardList
                  size={16}
                  className={
                    isViewEntries
                      ? "text-cyan-400"
                      : "text-slate-500 group-hover:text-cyan-400"
                  }
                />

                <span>View Entries</span>

                {isViewEntries && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                )}
              </Link>
            </nav>

            <div className="mt-4 border-t border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-all duration-200 hover:bg-red-500/5 hover:text-red-400"
              >
                <LogOut
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />

                <span>Exit System</span>
              </button>
            </div>
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
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </Suspense>
  );
}