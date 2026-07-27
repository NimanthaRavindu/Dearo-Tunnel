"use client";

import { useParams, useRouter } from "next/navigation";
import React from "react";
import { ArrowLeft, Wallet, Coins } from "lucide-react";

export default function AddExpensesMainPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id; // current branch ID

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Header Console */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <button
            onClick={() => router.push(`/dashboard/branches/${id}`)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 text-slate-400 hover:text-white"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wide uppercase text-slate-100">Financial Ledger Hub</h1>
            <p className="text-xs text-slate-400">Select the expense category matrix to allocate transaction data</p>
          </div>
        </div>

        {/* 2 Main Interaction Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* Card 01 - Salary Expenses Subpage Trigger */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/branches/${id}/add-expenses/salary`)}
            className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all text-left flex items-start gap-4 group"
          >
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 group-hover:text-cyan-400 transition-all">
              <Coins size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 group-hover:text-cyan-400 transition-colors">Salary Expenses</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Disburse individual employee compensation metrics, tracking base pay, bonuses, and ledger balances.
              </p>
            </div>
          </button>

          {/* Card 02 - Other Expenses Subpage Trigger */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/branches/${id}/add-expenses/other`)}
            className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all text-left flex items-start gap-4 group"
          >
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 group-hover:text-purple-400 transition-all">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 group-hover:text-purple-400 transition-colors">Other Expenses</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Log localized physical utility invoices, including structural water, electricity, food, and miscellaneous payments.
              </p>
            </div>
          </button>

        </div>

      </div>
    </div>
  );
}