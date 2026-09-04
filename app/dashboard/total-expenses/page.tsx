"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Coins, FileSpreadsheet, RefreshCw } from "lucide-react";

interface BranchExpense {
  id: number | string;
  branch_name: string;
  branch_code: string;
  salary_expenses: number;
  other_expenses: number;
  sales_expenses?: number;
  capital_expenses?: number;
  total_expenses: number;
}

interface FilterItem {
  id: number | string;
  name?: string;
}

const formatCurrency = (val: number) =>
  Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function TotalExpensesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [branches, setBranches] = useState<BranchExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [, setSalesList] = useState<FilterItem[]>([]);
  const [, setCapitalList] = useState<FilterItem[]>([]);

  const fetchExpenseBreakdown = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
      if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);

      const queryString = params.toString();
      const url = queryString ? `/api/dashboard/summary?${queryString}` : "/api/dashboard/summary";

      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        setBranches(json.branches || []);
        setSalesList(json.sales || []);
        setCapitalList(json.capital || []);
      }
    } catch (err) {
      console.error("Failed to load expense breakdown matrix:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId]);

  useEffect(() => {
    fetchExpenseBreakdown();
  }, [fetchExpenseBreakdown]);

  const handleBackToDashboard = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);
    const query = params.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  const calculatedTotalSum = branches.reduce((acc, branch) => {
    const salary = Number(branch.salary_expenses || 0);
    const sales = Number(branch.sales_expenses || 0);
    const capital = Number(branch.capital_expenses || 0);
    const other = Number(branch.other_expenses || 0);
    return acc + (salary + sales + capital + other);
  }, 0);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-slate-950 font-mono text-xs">
        <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="uppercase tracking-widest text-[10px]">Compiling Expense Ledger Sheets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800/80 gap-3">
          <div className="space-y-1">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft size={13} /> Back To Main Control Panel
            </button>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                <Coins size={14} />
              </span>
              <h1 className="text-base md:text-lg font-semibold tracking-tight text-white">
                Gross Expense Breakdown Sub-Ledger
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRefreshing(true);
                fetchExpenseBreakdown();
              }}
              disabled={refreshing}
              className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg hover:border-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
              title="Refresh Ledger"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-1.5 shadow-sm min-w-[180px]">
              <span className="text-[9px] text-emerald-400 font-medium uppercase tracking-wider block mb-0.5">
                Aggregate Gross Expenses
              </span>
              <span className="text-xs md:text-sm font-bold font-mono text-emerald-400">
                LKR {formatCurrency(calculatedTotalSum)}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Matrix Table Container */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
          <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
            <FileSpreadsheet size={14} className="text-emerald-400" /> Infrastructure Financial Auditing Matrix
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40 uppercase tracking-wider text-[9px] font-mono">
                  <th className="py-2.5 px-3">Node / Branch Identity</th>
                  <th className="py-2.5 px-3 text-right">Salary Expenses</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400/90">Sales Expenses</th>
                  <th className="py-2.5 px-3 text-right text-amber-400/90">Capital Expenses</th>
                  <th className="py-2.5 px-3 text-right">Other Expenses</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400 bg-emerald-950/10">
                    Gross Combined Expenses
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-mono uppercase tracking-widest text-[10px]">
                      No Expense Records Found
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => {
                    const salary = Number(branch.salary_expenses || 0);
                    const sales = Number(branch.sales_expenses || 0);
                    const capital = Number(branch.capital_expenses || 0);
                    const other = Number(branch.other_expenses || 0);

                    const grossTotal = salary + sales + capital + other;
                    const hasExpenses = grossTotal > 0;

                    return (
                      <tr
                        key={branch.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !hasExpenses ? "opacity-30 bg-slate-950/20" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-200">
                          {branch.branch_name}{" "}
                          <span className="text-slate-500 font-normal text-[10px]">
                            ({branch.branch_code})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                          {formatCurrency(salary)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400/90 font-medium text-[11px]">
                          {formatCurrency(sales)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-400/90 font-medium text-[11px]">
                          {formatCurrency(capital)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                          {formatCurrency(other)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold bg-emerald-950/10 text-emerald-400 text-[11px]">
                          {formatCurrency(grossTotal)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function TotalExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-slate-950 font-mono text-xs">
          <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="uppercase tracking-widest text-[10px]">
            Compiling Expense Ledger Sheets...
          </p>
        </div>
      }
    >
      <TotalExpensesContent />
    </Suspense>
  );
}