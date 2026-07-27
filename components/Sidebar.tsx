"use client";

import { useState } from "react";
import { LayoutDashboard, LogOut, Settings, Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  branches: any[];
  nic: string;
  password: string;
}

export default function Sidebar({ branches, nic, password }: SidebarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* --- MOBILE HAMBURGER BUTTON --- */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[70] p-2.5 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 active:scale-95 transition-all"
      >
        <Menu size={20} />
      </button>

      {/* --- SIDEBAR CONTAINER --- */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-64 bg-slate-950 text-slate-300 transform transition-transform duration-300 ease-in-out lg:fixed lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} border-r border-slate-800/60`}>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsSidebarOpen(false)} 
          className="lg:hidden absolute right-4 top-4 p-2 text-slate-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col h-full">
          
          
          <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div>
              <h1 className="text-white font-black text-lg tracking-tighter uppercase leading-none">Dearo App</h1>
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">Management</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2 mt-4">
            <Link 
              href={`/dashboard?nic=${nic}&password=${password}`}
              className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500"
            >
              <LayoutDashboard size={20} />
              <span className="text-sm">Dashboard</span>
            </Link>

            
            <div className="pt-4 px-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Branches</p>
              <div className="relative group">
                <select className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 appearance-none cursor-pointer group-hover:border-slate-700 transition-all">
                  <option value="">Select a Branch</option>
                  {branches.map((branch: any) => (
                    <option key={branch.id} value={branch.id} className="bg-slate-950">
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-blue-500 transition-colors" />
              </div>
            </div>

            {/* Settings Link */}
            <div className="pt-4 mt-2 border-t border-slate-800/40">
              <Link 
                href={`/dashboard/settings?nic=${nic}&password=${password}`}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
              >
                <Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" />
                <span className="text-sm font-medium">Settings</span>
              </Link>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-800/50">
            <Link href="/">
              <div className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl font-bold transition-all group">
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm">Logout</span>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}