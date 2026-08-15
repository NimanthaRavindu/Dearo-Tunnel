"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Wallet, 
  Coins, 
  Building2, 
  TrendingUp, 
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function AddExpensesMainPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const expenseCategories = [
    {
      id: "salary",
      title: "Salary Expenses",
      description: "Disburse individual employee compensation metrics, tracking base pay, bonuses, and ledger balances.",
      icon: Coins,
      accentColor: "cyan",
      hoverBorder: "hover:border-cyan-500/50",
      hoverShadow: "hover:shadow-cyan-500/10",
      iconBg: "group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 group-hover:text-cyan-400",
      titleHover: "group-hover:text-cyan-400",
      chevronHover: "group-hover:text-cyan-400"
    },
    {
      id: "other",
      title: "Other Expenses",
      description: "Log localized physical utility invoices, including structural water, electricity, food, and miscellaneous payments.",
      icon: Wallet,
      accentColor: "purple",
      hoverBorder: "hover:border-purple-500/50",
      hoverShadow: "hover:shadow-purple-500/10",
      iconBg: "group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:text-purple-400",
      titleHover: "group-hover:text-purple-400",
      chevronHover: "group-hover:text-purple-400"
    },
    {
      id: "capital",
      title: "Capital Expenses",
      description: "Track long-term fixed assets, infrastructure investments, machinery, property acquisitions, and major upgrades.",
      icon: Building2,
      accentColor: "emerald",
      hoverBorder: "hover:border-emerald-500/50",
      hoverShadow: "hover:shadow-emerald-500/10",
      iconBg: "group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:text-emerald-400",
      titleHover: "group-hover:text-emerald-400",
      chevronHover: "group-hover:text-emerald-400"
    },
    {
      id: "sales",
      title: "Sales Expenses",
      description: "Record marketing allocations, client acquisition costs, distribution logistics, and sales pipeline expenditures.",
      icon: TrendingUp,
      accentColor: "amber",
      hoverBorder: "hover:border-amber-500/50",
      hoverShadow: "hover:shadow-amber-500/10",
      iconBg: "group-hover:bg-amber-500/10 group-hover:border-amber-500/30 group-hover:text-amber-400",
      titleHover: "group-hover:text-amber-400",
      chevronHover: "group-hover:text-amber-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-4xl space-y-8 relative z-10">
        
        {/* Header Console */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/branches/${id}`)}
              className="p-2.5 bg-slate-900/90 hover:bg-slate-800 rounded-xl transition-all border border-slate-800/80 text-slate-400 hover:text-white shadow-sm hover:scale-105 active:scale-95"
              title="Back to Branch"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <h1 className="text-xl font-extrabold tracking-wide uppercase text-slate-100">
                  Financial Ledger Hub
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Select the expense category matrix to allocate transaction data
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-semibold text-slate-400">
            <Sparkles size={13} className="text-amber-400" />
            <span>Branch ID: <strong className="text-slate-200">#{id}</strong></span>
          </div>
        </div>

        {/* 4 Interaction Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {expenseCategories.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/dashboard/branches/${id}/add-expenses/${item.id}`)}
                className={`group relative p-6 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-slate-800/80 ${item.hoverBorder} hover:shadow-2xl ${item.hoverShadow} -translate-y-0 hover:-translate-y-1 transition-all duration-300 text-left flex items-start gap-4`}
              >
                <div className={`p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-slate-400 ${item.iconBg} transition-all duration-300 shrink-0`}>
                  <IconComponent size={22} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold uppercase tracking-wider text-slate-200 ${item.titleHover} transition-colors`}>
                      {item.title}
                    </h3>
                    <ChevronRight size={16} className={`text-slate-600 ${item.chevronHover} group-hover:translate-x-1 transition-all duration-300`} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}