"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, User, LogOut } from "lucide-react";

export default function ProfileMenu() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState({ username: "", role: "" });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 🔄 User Profile දත්ත ලබා ගැනීම
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionData = localStorage.getItem("user_session");
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          setUserData({
            username:parsed.username || "UNKNOWN",
            role:parsed.role || "OPERATOR"
          });
        } catch (error) {
          console.error("Failed to parse user session:",error);
          
        }
      }
    }
  }, []);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogOut =() =>{
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_session");
    }
    router.push("/");
  };

  return (
    <div className="relative border-l border-slate-800/80 pl-4" ref={dropdownRef}>
      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="flex items-center gap-2 text-left hover:bg-slate-800/30 p-1.5 rounded-lg transition focus:outline-none"
      >
        {/* User Initial Circle */}
        <div className="h-7 w-7 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold flex items-center justify-center uppercase shadow-inner">
          {userData.username.substring(0, 2).toUpperCase()}
        </div>
        <div className="hidden sm:block">
          <p className="text-[11px] font-bold text-slate-200 leading-none flex items-center gap-1 uppercase tracking-wide">
            {userData.username} <ChevronDown size={10} className="text-slate-500" />
          </p>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{userData.role}</p>
        </div>
      </button>

      {isProfileOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0d1527] border border-slate-800 rounded-xl shadow-xl py-1 z-50">
          <div className="px-4 py-2 border-b border-slate-800/60">
            <p className="text-xs font-bold text-white capitalize">{userData.username}</p>
            <p className="text-[10px] text-slate-500 font-mono">system.active@dearo.local</p>
          </div>
          <button className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/50 transition text-left">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsProfileOpen(false)}
              className="w-full flex  items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/50 transition text-left">
                 <User size={14} className="text-slate-500" /> My Profile
            </Link>
          </button>
          <div className="border-t border-slate-800/60 my-1"></div>
          <button
            onClick={handleLogOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition text-left font-semibold"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}