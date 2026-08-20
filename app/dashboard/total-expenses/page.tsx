"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Coins, FileSpreadsheet, RefreshCw } from "lucide-react";

interface BranchExpense {
  id: number | string;
  branch_name: string;
  branch_code: string;
  salary_expenses: number;
  other_expenses: number;
  sales_expenses?: number;
  total_expenses: number;
}

export default function TotalExpensesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<BranchExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchExpenseBreakdown = async () => {
    try {
      const response = await fetch("/api/dashboard/summary");
      if (response.ok) {
        const json = await response.json();
        setBranches(json.branches || []);
      }
    } catch (err) {
      console.error("Failed to load expense breakdown matrix:", err);
    } fontinally: {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpenseBreakdown();
  }, []);

  // Calculate overall total dynamically based on effective sales rule
  const calculatedTotalSum = branches.reduce((acc, branch) => {
    const salary = Number(branch.salary_expenses || 0);
    const other = Number(branch.other_expenses || 0);
    const rawSales = Number(branch.sales_expenses || 0);

    // Rule: Salary හෝ Other 0 නම් Sales Expenses ගණනය නොවේ
    const effectiveSales = (salary === 0 || other === 0) ? 0 : rawSales;
    
    return acc + salary + other + effectiveSales;
  }, 0);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
        <div className="h-5 w-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="uppercase tracking-widest text-[10px]">Compiling Expense Ledger Sheets...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#070a12] min-h-screen text-slate-300 font-mono text-xs selection:bg-sky-500/20 selection:text-sky-300">
      {/* Navigation & Dynamic Total Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
        <div className="space-y-1.5">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white uppercase font-bold transition-colors"
          >
            <ArrowLeft size={12} /> Back To Main Control Panel
          </button>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Coins size={15} className="text-sky-400" /> Gross Expense Breakdown Sub-Ledger
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setRefreshing(true); fetchExpenseBreakdown(); }}
            disabled={refreshing}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <div className="text-right bg-sky-950/20 border border-sky-900/40 rounded-xl px-4 py-2 min-w-[180px]">
            <span className="text-[9px] text-sky-400 font-bold uppercase block tracking-wider mb-0.5">Aggregate Gross Expenses</span>
            <span className="text-sm font-bold font-sans text-white">
              LKR {calculatedTotalSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Data Table */}
      <div className="bg-[#0d1527]/30 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-[#0a0f1d] border-b border-slate-900 flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <FileSpreadsheet size={13} className="text-slate-500" /> Infrastructure Financial Auditing Matrix
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider bg-[#090e1a]/30">
                <th className="py-2.5 px-4">Node / Branch Identity</th>
                <th className="py-2.5 px-4 text-right">Salary Expenses</th>
                <th className="py-2.5 px-4 text-right">Sales Expenses</th>
                <th className="py-2.5 px-4 text-right">Other Expenses</th>
                <th className="py-2.5 px-4 text-right text-sky-400 bg-sky-950/10">Gross Combined Expenses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-400 font-sans">
              {branches.map((branch) => {
                const salary = Number(branch.salary_expenses || 0);
                const rawSales = Number(branch.sales_expenses || 0);
                const other = Number(branch.other_expenses || 0);
                
                // Salary හෝ Other 0.00 නම් Sales Expense එක ගණනය නොකෙරේ (0 වේ)
                const isSalesIgnored = salary === 0 || other === 0;
                const effectiveSales = isSalesIgnored ? 0 : rawSales;

                // Combined Gross Total (Effective Sales පමණක් එකතු වේ)
                const grossTotal = salary + effectiveSales + other;
                const hasExpenses = grossTotal > 0;

                return (
                  <tr 
                    key={branch.id} 
                    className={`hover:bg-slate-900/10 transition-all ${!hasExpenses ? "opacity-30 bg-slate-950/5" : ""}`}
                  >
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-300">
                      {branch.branch_name} <span className="text-slate-600 font-normal text-[10px]">({branch.branch_code})</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {salary > 0 ? salary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400/90">
                      {isSalesIgnored && rawSales > 0 ? (
                        <span className="text-slate-500 line-through text-[10px] mr-1" title="Ignored because Salary or Other Expense is 0.00">
                          {rawSales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : null}
                      {effectiveSales > 0 ? effectiveSales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {other > 0 ? other.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold bg-sky-950/5 text-slate-200">
                      {grossTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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