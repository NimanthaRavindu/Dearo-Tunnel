"use client";

import React, { useState } from "react";
import Navbar from "@/components/shared/Navbar"; 
import { LayoutDashboard, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans select-none">
      
      {/* 🌐 NAVBAR INTEGRATION */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} branches={[]}/>

      {/* 🗂️ LOWER CONTENT HOUSING (Sidebar + Body Content) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 w-full relative ">
        
        {/* 📁 LEFT SIDEBAR */}
        <aside className="w-full md:w-64 bg-[#0d1527] border-b md:border-b-0 md:border-r border-slate-800/60 p-5 flex flex-col justify-between shrink-0 print:hidden">
          <div>
            {/* Logo Group */}
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-lg">
                DE
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-wider uppercase text-white">DEARO TUNNEL</h1>
                <p className="text-[9px] text-slate-500 font-bold tracking-widest">CENTRAL SYSTEM</p>
              </div>
            </div>
            
            {/* Navigation Items */}
            <nav className="space-y-1.5">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-600/10 text-blue-400 text-xs font-semibold tracking-wider uppercase transition">
                <LayoutDashboard size={16} /> Core Dashboard
              </a>
              
              <a href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 text-xs font-semibold tracking-wider uppercase transition">
                <Settings size={16} /> Settings
              </a>
            </nav>

            <div className="border-t border-slate-800/80 pt-4 mt-4 md:mt-0">
               <button onClick={() => window.location.href = "/"} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase text-slate-400 hover:text-red-400 transition group">
                  <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" /> Exit System
               </button>
            </div>
          </div>
        </aside>

        {/* 📈 MAIN PAGE RENDERING CONTAINER */}
        <main className="flex-1 min-w-0 bg-[#070a13] overflow-y-auto">
          {React.isValidElement(children)
            ? React.cloneElement(children as React.ReactElement<any>, { searchQuery })
            : children}
        </main>

      </div>
    </div>
  );
}