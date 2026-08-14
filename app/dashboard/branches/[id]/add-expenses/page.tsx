"use client";

import { useParams, useRouter } from "next/navigation";
import React from "react";
import { ArrowLeft, Wallet, Coins, Building2, TrendingUp } from "lucide-react";

export default function AddExpensesMainPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id; // current branch ID

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header Console */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/branches/${id}`)}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all border border-slate-700/60 text-slate-400 hover:text-white shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wide uppercase text-slate-100">
              Financial Ledger Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Select the expense category matrix to allocate transaction data
            </p>
          </div>
        </div>

        {/* 4 Interaction Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Card 01 - Salary Expenses */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/branches/${id}/add-expenses/salary`)}
            className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/5 transition-all text-left flex items-start gap-4 group"
          >
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-all shrink-0">
              <Coins size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 group-hover:text-cyan-400 transition-colors">
                Salary Expenses
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Disburse individual employee compensation metrics, tracking base pay, bonuses, and ledger balances.
              </p>
            </div>
          </button>

          {/* Card 02 - Other Expenses */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/branches/${id}/add-expenses/other`)}
            className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all text-left flex items-start gap-4 group"
          >
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:text-purple-400 transition-all shrink-0">
              <Wallet size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 group-hover:text-purple-400 transition-colors">
                Other Expenses
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Log localized physical utility invoices, including structural water, electricity, food, and miscellaneous payments.
              </p>
            </div>
          </button>

          {/* Card 03 - Capital Expenses */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/branches/${id}/add-expenses/capital`)}
            className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-left flex items-start gap-4 group"
          >
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-all shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 group-hover:text-emerald-400 transition-colors">
                Capital Expenses
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Track long-term fixed assets, infrastructure investments, machinery, property acquisitions, and major upgrades.
              </p>
            </div>
          </button>

          {/* Card 04 - Sales Expenses */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/branches/${id}/add-expenses/sales`)}
            className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all text-left flex items-start gap-4 group"
          >
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:bg-amber-500/10 group-hover:border-amber-500/30 group-hover:text-amber-400 transition-all shrink-0">
              <TrendingUp size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 group-hover:text-amber-400 transition-colors">
                Sales Expenses
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Record marketing allocations, client acquisition costs, distribution logistics, and sales pipeline expenditures.
              </p>
            </div>
          </button>

        </div>

      </div>
    </div>
  );
}