"use client";

import React, { useEffect, useState } from "react";
import { User, Shield, Building2, Mail, Calendar, IdCard, ArrowLeft } from "lucide-react";
import useRouter from "next/navigation";
import Link from "next/link";

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  role: string;
  branch_name?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (typeof window !== "undefined") {
      const session = localStorage.getItem("user_session");
      if (session) {
        const user = JSON.parse(session);
        
        setProfile({
          id: user.id || 1,
          username: user.username || "Nimantha",
          email: user.email || "nimantharavindu713@gmail.com",
          role: user.role || "ADMIN",
          branch_name: user.branch_name || "Mahiyanganaya (Regional)",
          created_at: user.created_at || "2026-06-22 14:02:21"
        });
      }
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center font-mono text-xs text-slate-500">
        LOADING ADMINISTRATIVE IDENTITY LOGS...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-300 font-mono text-xs p-6 select-none">
      {/* Back to Dashboard Button */}
      <div className="max-w-2xl mx-auto mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors uppercase font-bold tracking-wider text-[10px]">
          <ArrowLeft size={14} /> Back to Core Dashboard
        </Link>
      </div>

      {/* Profile Card Container */}
      <div className="max-w-2xl mx-auto bg-[#0d1527]/60 border border-slate-900 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        {/* Top Gradient Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500" />

        {/* Header Section */}
        <div className="flex items-center gap-4 border-b border-slate-900 pb-5 mb-5">
          <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg font-bold uppercase">
            {profile?.username.substring(0, 2)}
          </div>
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">{profile?.username}</h1>
            <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5 tracking-widest">
              Account Security Clearance Statement
            </p>
          </div>
        </div>

        {/* Data Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* User ID */}
          <div className="bg-slate-950/50 border border-slate-900 p-3 rounded-lg flex items-center gap-3">
            <div className="text-slate-500"><IdCard size={16} /></div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Identity Token ID</p>
              <p className="text-slate-200 font-mono mt-0.5">#000{profile?.id}</p>
            </div>
          </div>

          {/* Username */}
          <div className="bg-slate-950/50 border border-slate-900 p-3 rounded-lg flex items-center gap-3">
            <div className="text-slate-500"><User size={16} /></div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Account Username</p>
              <p className="text-slate-200 mt-0.5">{profile?.username}</p>
            </div>
          </div>

          {/* Security Role */}
          <div className="bg-slate-950/50 border border-slate-900 p-3 rounded-lg flex items-center gap-3">
            <div className="text-slate-500"><Shield size={16} /></div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Assigned System Role</p>
              <p className="text-cyan-400 font-bold uppercase mt-0.5 tracking-wide">{profile?.role}</p>
            </div>
          </div>

          {/* Branch Name */}
          <div className="bg-slate-950/50 border border-slate-900 p-3 rounded-lg flex items-center gap-3">
            <div className="text-slate-500"><Building2 size={16} /></div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Operational Branch</p>
              <p className="text-slate-200 mt-0.5">{profile?.branch_name}</p>
            </div>
          </div>

          {/* Email Address */}
          <div className="bg-slate-950/50 border border-slate-900 p-3 rounded-lg flex items-center gap-3 sm:col-span-2">
            <div className="text-slate-500"><Mail size={16} /></div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Registered Email Node</p>
              <p className="text-slate-300 font-mono mt-0.5 break-all">{profile?.email}</p>
            </div>
          </div>

          {/* Created At */}
          <div className="bg-slate-950/50 border border-slate-900 p-3 rounded-lg flex items-center gap-3 sm:col-span-2">
            <div className="text-slate-500"><Calendar size={16} /></div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Node Initialization Timestamp</p>
              <p className="text-slate-400 font-mono mt-0.5">{profile?.created_at}</p>
            </div>
          </div>

        </div>

        {/* System Notice Footer */}
        <div className="mt-6 pt-4 border-t border-slate-900 text-center text-[10px] text-slate-600 font-medium tracking-wide uppercase">
          Dearo Tunnel Security Gateway Encryption Active
        </div>
      </div>
    </div>
  );
}