"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Phone, Mail, Globe, LogOut, Bell } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import BranchSearch from "./BranchSearch";
import ProfileMenu from "./ProfileMenu";

interface Branch {
  id: number;
  branch_name: string;
  branch_code: string;
}

interface NavbarProps {
  branches: Branch[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({ branches, searchQuery, setSearchQuery }: NavbarProps) {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col shrink-0 z-40 select-none">
      
      {/* 1. TOP UTILITY STRIP */}
      <div className="w-full bg-[#0a0d18] text-slate-400 px-6 py-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] print:hidden">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
            <Phone size={12} className="text-blue-500" />
            <Link href="https://www.dearoinvestment.com/contact" className="hover:text-blue-400 transition-colors">
              011 478 2400
            </Link>
          </span>
          
          <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
            <Mail size={12} className="text-blue-500" />
            <Link href="https://www.dearoinvestment.com" className="hover:text-blue-400 transition-colors">
              info@dearoinvestment.com
            </Link>
          </span>
        </div>

        <div className="flex items-center gap-4 mt-1 sm:mt-0 self-end sm:self-auto">
          <span className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-medium">
            <Globe size={12} className="text-slate-500" /> English
          </span>
          
          <span className="text-slate-700">|</span>
          
          <button 
            onClick={() => router.push("/")} 
            className="flex items-center gap-1 hover:text-rose-400 transition-colors font-medium"
          >
            <LogOut size={12} className="text-slate-500" /> Logout
          </button>
        </div>
      </div>

      {/* 2. MAIN NAVBAR ROW */}
      <header className="bg-[#0d1527] border-b border-slate-800/60 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-100 dark:border-slate-700">
            <Image src="/dearo2.png" alt="Logo" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">DEARO</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">INVESTMENT LIMITED</p>
          </div>
        </Link>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* 🔍 1. Imported Branch Search Component */}
     
          <BranchSearch 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />

          {/* 🔔 Notification Icon */}
          <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg relative transition-colors">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-[#0d1527]" />
          </button>

          {/* 👤 2. Imported Profile Menu Component */}
          <ProfileMenu />
        </div>
      </header>

    </div>
  );
}