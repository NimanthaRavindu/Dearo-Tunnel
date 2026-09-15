"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import {LayoutDashboard,Settings,LogOut,ClipboardList} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const pathname = usePathname();

  // Active sidebar items
  const isDashboard =
    pathname === "/dashboard";

  const isSettings =
    pathname.startsWith("/dashboard/settings");

  const isViewEntries =
    pathname.startsWith("/dashboard/view-entries");

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans select-none">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        branches={[]}
      />

      {/* =====================================================
          LOWER CONTENT
      ====================================================== */}

      <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full relative">

        {/* ===================================================
            LEFT SIDEBAR
        ==================================================== */}

        <aside className="w-full md:w-64 bg-[#0d1527] border-b md:border-b-0 md:border-r border-slate-800/60 p-5 flex flex-col justify-between shrink-0 print:hidden">

          <div>

            {/* =================================================
                LOGO GROUP
            ================================================== */}

            <div className="flex items-center gap-3 mb-8 px-2">

              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-blue-950/40">
                DE
              </div>

              <div>
                <h1 className="text-sm font-bold tracking-wider uppercase text-white">
                  DEARO TUNNEL
                </h1>

                <p className="text-[9px] text-slate-500 font-bold tracking-widest">
                  CENTRAL SYSTEM
                </p>
              </div>

            </div>

            {/* =================================================
                NAVIGATION ITEMS
            ================================================== */}

            <nav className="space-y-1.5">

              {/* =================================================
                  CORE DASHBOARD
              ================================================== */}

              <Link
                href="/dashboard"
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                  isDashboard
                    ? "bg-blue-600/15 text-blue-400 shadow-sm shadow-blue-950/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                }`}
              >
                <LayoutDashboard
                  size={16}
                  className={`transition-colors ${
                    isDashboard
                      ? "text-blue-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />

                <span>
                  Core Dashboard
                </span>

                {isDashboard && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                )}
              </Link>

              {/* =================================================
                  SETTINGS
              ================================================== */}

              <Link
                href="/dashboard/settings"
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                  isSettings
                    ? "bg-slate-700/40 text-slate-100 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                }`}
              >
                <Settings
                  size={16}
                  className={`transition-all duration-200 ${
                    isSettings
                      ? "text-slate-200 rotate-45"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />

                <span>
                  Settings
                </span>

                {isSettings && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </Link>

              {/* =================================================
                  VIEW ENTRIES
              ================================================== */}

              <Link
                href="/dashboard/view-entries"
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                  isViewEntries
                    ? "bg-cyan-500/10 text-cyan-400 shadow-sm shadow-cyan-950/20 ring-1 ring-cyan-500/10"
                    : "text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5"
                }`}
              >

                {/* Left active indicator */}

                {isViewEntries && (
                  <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                )}

                <ClipboardList
                  size={16}
                  className={`transition-colors ${
                    isViewEntries
                      ? "text-cyan-400"
                      : "text-slate-500 group-hover:text-cyan-400"
                  }`}
                />

                <span>
                  View Entries
                </span>

                {isViewEntries && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                )}

              </Link>
            </nav>


            <div className="border-t border-slate-800/80 pt-4 mt-4">

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 group"
              >

                <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform"  />

                <span>
                  Exit System
                </span>

              </button>

            </div>
          </div>
        </aside>

 
        <main className="flex-1 min-w-0 bg-[#070a13] overflow-y-auto">
          {React.isValidElement(children)
            ? React.cloneElement(
                children as React.ReactElement<any>,
                { searchQuery }
              )
            : children}
        </main>
      </div>
    </div>
  );
}