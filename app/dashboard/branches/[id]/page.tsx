"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { UserPlus, CircleDollarSign, Users, Receipt, ArrowLeft, Building2 } from "lucide-react";

export default function BranchDashboardPage() {
  const router = useRouter();
  const { id: branchId } = useParams();
  const [branchName, setBranchName] = useState("Loading Branch...");

  useEffect(() => {
    const fetchBranchDetails = async () => {
      try {
        
        const response = await fetch(`/api/branches/summary/${branchId}`);
        if (response.ok) {
          const data = await response.json();
          setBranchName(data.branchName);
        } else {
          setBranchName("Branch Console");
        }
      } catch (error) {
        setBranchName("Branch Console");
      }
    };

    if (branchId) {
      fetchBranchDetails();
    }
  }, [branchId]);

  
  const managementCards = [
    {
      title: "Add Employee",
      description: "Register new staff profile metadata",
      icon: <UserPlus className="w-5 h-5 text-sky-400" />,
      path: "add-employee",
      hoverColor: "hover:border-sky-500/50 hover:bg-sky-500/5",
    },
    {
      title: "Add Expenses",
      description: "Log operational expenditures & wages",
      icon: <CircleDollarSign className="w-5 h-5 text-emerald-400" />,
      path: "add-expenses",
      hoverColor: "hover:border-emerald-500/50 hover:bg-emerald-500/5",
    },
    {
      title: "View Employee",
      description: "Browse registered staff rosters",
      icon: <Users className="w-5 h-5 text-purple-400" />,
      path: "view-employee",
      hoverColor: "hover:border-purple-500/50 hover:bg-purple-500/5",
    },
    {
      title: "View Expenses",
      description: "Audit balance statements & sheets",
      icon: <Receipt className="w-5 h-5 text-amber-400" />,
      path: "view-expences",
      hoverColor: "hover:border-amber-500/50 hover:bg-amber-500/5",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto text-white space-y-6 animate-in fade-in duration-200">
      
      {/* 🔝 Top Breadcrumb Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sky-400 shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-100">{branchName}</h2>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Operational Control Center</p>
          </div>
        </div>

        <button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 rounded text-xs font-semibold text-slate-300 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Core Dashboard
        </button>
      </div>

      {/* 🎴 4-Card Control Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {managementCards.map((card) => (
          <div
            key={card.path}
            onClick={() => router.push(`/dashboard/branches/${branchId}/${card.path}`)}
            className={`bg-slate-900 border border-slate-800/80 p-5 rounded-xl flex flex-col items-center justify-center gap-3.5 cursor-pointer transition-all duration-200 text-center shadow-lg group ${card.hoverColor}`}
          >
            {/* Icon Wrapper */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60 transition group-hover:scale-105 duration-150">
              {card.icon}
            </div>

            {/* Typography */}
            <div className="space-y-1">
              <span className="block text-xs font-bold tracking-wide text-slate-200 group-hover:text-slate-100">
                {card.title}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium leading-relaxed px-1">
                {card.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 📊 Bottom Branding Segment */}
      <div className="border-t border-slate-900 pt-4 flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <span>DEARO TUNNEL SECURITY CONSOLE v2.6</span>
        <span>STATUS: AUTHENTICATED & SECURE</span>
      </div>

    </div>
  );
}