"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, FileSpreadsheet, RefreshCw } from "lucide-react";

export default function RemainingBalancePage() {
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSum, setTotalSum] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalanceBreakdown = async () => {
    try {
      const response = await fetch("/api/dashboard/summary");
      if (response.ok) {
        const json = await response.json();
        setBranches(json.branches || []);
        setTotalSum(json.cards?.totalRemaining || 0);
      }
    } catch (err) {
      console.error("Failed to load liability breakdown matrix:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalanceBreakdown();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
        <div className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="uppercase tracking-widest text-[10px]">Compiling Balance Portfolio Sheets...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#070a12] min-h-screen text-slate-300 font-mono text-xs selection:bg-amber-500/20 selection:text-amber-300">
      
      {/* 🔹 Navigation & Dynamic Total Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
        <div className="space-y-1.5">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white uppercase font-bold transition-colors"
          >
            <ArrowLeft size={12} /> Back To Main Control Panel
          </button>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={15} className="text-amber-500" /> Outstanding Balances Portfolio Sub-Ledger
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setRefreshing(true); fetchBalanceBreakdown(); }}
            disabled={refreshing}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <div className="text-right bg-amber-950/20 border border-amber-900/40 rounded-xl px-4 py-2 min-w-[180px]">
            <span className="text-[9px] text-amber-400 font-bold uppercase block tracking-wider mb-0.5">Aggregate Remaining Balance</span>
            <span className="text-sm font-bold font-sans text-white">
              LKR {totalSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 🔹 Compact Spreadsheet Data Table */}
      <div className="bg-[#0d1527]/30 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-[#0a0f1d] border-b border-slate-900 flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <FileSpreadsheet size={13} className="text-slate-500" /> Infrastructure Outstanding Liability Ledger Matrix
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider bg-[#090e1a]/30">
                <th className="py-2.5 px-4">Node / Branch Identity</th>
                <th className="py-2.5 px-4 text-right">Salary Expenses Liability</th>
                <th className="py-2.5 px-4 text-right">Other Expenses Liability</th>
                <th className="py-2.5 px-4 text-right text-amber-500 bg-amber-950/10">Cumulative Net Liability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-400 font-sans">
              {branches.map((branch: any) => {
                const hasBalances = branch.salary_balance > 0 || branch.other_balance > 0;
                return (
                  <tr 
                    key={branch.id} 
                    className={`hover:bg-slate-900/10 transition-all ${!hasBalances ? "opacity-30 bg-slate-950/5" : ""}`}
                  >
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-300">
                      {branch.branch_name} <span className="text-slate-600 font-normal text-[10px]">({branch.branch_code})</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {branch.salary_balance > 0 ? branch.salary_balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {branch.other_balance > 0 ? branch.other_balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold bg-amber-950/5 text-slate-200">
                      {branch.total_balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}