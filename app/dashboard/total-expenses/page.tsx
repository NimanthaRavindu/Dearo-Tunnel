"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {ArrowLeft,Coins,FileSpreadsheet,RefreshCw,AlertCircle,Building2,FilterX} from "lucide-react";

interface BranchSummaryItem {
  branch_id: number;
  branch_name: string;
  branch_code?: string;
  salary_expense: number;
  other_expense: number;
  raw_sales_expense: number;
  effective_sales_expense: number;
  is_sales_ignored: boolean;
  grand_total: number;
}

interface OverallSummary {
  total_salary: number;
  total_other: number;
  total_raw_sales: number;
  total_effective_sales: number;
  grand_total: number;
}

function TotalExpensesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedBranchId = searchParams.get("branch_id");
  const selectedSalesId = searchParams.get("selected_sales_id");

  const [branches, setBranches] = useState<BranchSummaryItem[]>([]);
  const [overall, setOverall] = useState<OverallSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchExpenseBreakdown = useCallback(async () => {
    try {
      let url = "/api/dashboard/summary";
      const params = new URLSearchParams();

      if (selectedSalesId) {
        params.append("selected_sales_id", selectedSalesId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        setBranches(json.branches || []);
        setOverall(json.overall || null);
      }
    } catch (err) {
      console.error("Failed to load expense breakdown matrix:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId]);

  useEffect(() => {
    fetchExpenseBreakdown();
  }, [fetchExpenseBreakdown]);

  // Handle single branch selection vs overall aggregate calculation
  const activeBranch = selectedBranchId
    ? branches.find((b) => String(b.branch_id) === String(selectedBranchId))
    : null;

  const displayTotal = activeBranch
    ? activeBranch.grand_total
    : overall
    ? overall.grand_total
    : branches.reduce((acc, b) => acc + Number(b.grand_total || 0), 0);

  const clearBranchFilter = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("branch_id");
    router.replace(url.pathname + (url.search ? url.search : ""));
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
        <div className="h-5 w-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="uppercase tracking-widest text-[10px]">
          Compiling Expense Ledger Sheets...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#070a12] min-h-screen text-slate-300 font-mono text-xs selection:bg-sky-500/20 selection:text-sky-300">
      {/* Header Bar */}
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchExpenseBreakdown();
            }}
            disabled={refreshing}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>

          <div className="text-right bg-sky-950/20 border border-sky-900/40 rounded-xl px-4 py-2 min-w-[200px] flex items-center justify-between gap-3">
            <div>
              <span className="text-[9px] text-sky-400 font-bold uppercase block tracking-wider mb-0.5">
                {activeBranch
                  ? `Branch #${activeBranch.branch_id} Gross Expense`
                  : "Aggregate Gross Expenses"}
              </span>
              <span className="text-sm font-bold font-sans text-white">
                LKR{" "}
                {displayTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {selectedBranchId && (
              <button
                onClick={clearBranchFilter}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                title="Show All Branches"
              >
                <FilterX size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selected Branch Active Notice */}
      {activeBranch && (
        <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-sky-300">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-sky-400" />
            <span>
              Filtering for <strong>{activeBranch.branch_name}</strong> (Branch #{activeBranch.branch_id}).
              {selectedSalesId && " Selected Sales ID attached."}
            </span>
          </div>
          <button
            onClick={clearBranchFilter}
            className="text-[10px] underline uppercase tracking-wider text-slate-400 hover:text-white"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Main Table Matrix */}
      <div className="bg-[#0d1527]/30 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-[#0a0f1d] border-b border-slate-900 flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet size={13} className="text-slate-500" /> Infrastructure Financial Auditing Matrix
          </div>
          <span className="text-slate-600 font-mono">
            {branches.length} Branches Loaded
          </span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider bg-[#090e1a]/30">
                <th className="py-2.5 px-4">Node / Branch Identity</th>
                <th className="py-2.5 px-4 text-right">Salary Expense</th>
                <th className="py-2.5 px-4 text-right">Other Expense</th>
                <th className="py-2.5 px-4 text-right">
                  Sales Expense {selectedSalesId ? "(Filtered)" : "(Total)"}
                </th>
                <th className="py-2.5 px-4 text-right text-sky-400 bg-sky-950/10">
                  Gross Combined Expenses
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-400 font-sans">
              {branches.map((branch) => {
                const salary = Number(branch.salary_expense || 0);
                const other = Number(branch.other_expense || 0);
                const sales = Number(branch.effective_sales_expense || 0);
                const rawSales = Number(branch.raw_sales_expense || 0);
                const grossTotal = Number(branch.grand_total || 0);

                const isSelected = String(branch.branch_id) === String(selectedBranchId);
                const isIgnored = branch.is_sales_ignored;

                return (
                  <tr
                    key={branch.branch_id}
                    onClick={() => {
                      if (isSelected) {
                        clearBranchFilter();
                      } else {
                        router.push(
                          `/dashboard/total-expenses?branch_id=${branch.branch_id}${
                            selectedSalesId ? `&selected_sales_id=${selectedSalesId}` : ""
                          }`
                        );
                      }
                    }}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "bg-sky-950/40 border-l-2 border-sky-400"
                        : "hover:bg-slate-900/40"
                    } ${grossTotal === 0 ? "opacity-40" : ""}`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{branch.branch_name}</span>
                        {branch.branch_code && (
                          <span className="text-slate-600 font-normal text-[10px]">
                            ({branch.branch_code})
                          </span>
                        )}
                        <span className="text-[9px] text-slate-600 font-mono">
                          #{branch.branch_id}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {salary > 0
                        ? salary.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0.00"}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      {other > 0
                        ? other.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "0.00"}
                    </td>

                    <td className="py-3 px-4 text-right font-mono">
                      <div className="flex flex-col items-end">
                        <span
                          className={
                            isIgnored
                              ? "text-slate-500 line-through"
                              : "text-emerald-400 font-medium"
                          }
                        >
                          {rawSales > 0
                            ? rawSales.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0.00"}
                        </span>
                        {isIgnored && rawSales > 0 && (
                          <span
                            className="text-[9px] text-amber-400/80 flex items-center gap-0.5 mt-0.5"
                            title="Omitted because Salary or Other Expense is LKR 0.00"
                          >
                            <AlertCircle size={9} /> Ignored
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold bg-sky-950/5 text-slate-100">
                      {grossTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
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

export default function TotalExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
          <div className="h-5 w-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2"></div>
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