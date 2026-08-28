"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, TrendingUp, FileSpreadsheet, RefreshCw } from "lucide-react";

interface BranchBalance {
  id: number | string;
  branch_name: string;
  branch_code: string;
  salary_balance?: number;
  salary_expenses?: number;
  sales_expenses?: number;
  capital_expenses?: number;
  other_balance?: number;
  other_expenses?: number;
}

const formatCurrency = (val: number) =>
  Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function RemainingBalanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [branches, setBranches] = useState<BranchBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchBalanceBreakdown = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
      if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);

      const url = `/api/dashboard/summary${params.toString() ? `?${params.toString()}` : ""}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        setBranches(json.branches || []);
      }
    } catch (err) {
      console.error("Failed to load liability breakdown matrix:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId]);

  useEffect(() => {
    fetchBalanceBreakdown();
  }, [fetchBalanceBreakdown]);

  const handleBackToDashboard = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);
    const query = params.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  // Compute calculated cumulative total dynamically to stay safe
  const calculatedTotalSum = branches.reduce((acc, branch) => {
    const salaryBal = Number(branch.salary_balance ?? branch.salary_expenses ?? 0);
    const salesAmt = Number(branch.sales_expenses ?? 0);
    const capitalAmt = Number(branch.capital_expenses ?? 0);
    const otherBal = Number(branch.other_balance ?? branch.other_expenses ?? 0);
    return acc + (salaryBal + salesAmt + capitalAmt + otherBal);
  }, 0);

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
      
      {/* Navigation & Dynamic Total Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
        <div className="space-y-1.5">
          <button 
            onClick={handleBackToDashboard} 
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
              LKR {formatCurrency(calculatedTotalSum)}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Spreadsheet Data Table */}
      <div className="bg-[#0d1527]/30 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-[#0a0f1d] border-b border-slate-900 flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet size={13} className="text-slate-500" /> Infrastructure Outstanding Liability Ledger Matrix
          </div>
          {(selectedSalesId || selectedCapitalId) && (
            <span className="text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
              Filtered View Active
            </span>
          )}
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider bg-[#090e1a]/30">
                <th className="py-2.5 px-3">Node / Branch Identity</th>
                <th className="py-2.5 px-3 text-right">Salary Expenses</th>
                <th className="py-2.5 px-3 text-right">Sales Expenses</th>
                <th className="py-2.5 px-3 text-right">Capital Expenses</th>
                <th className="py-2.5 px-3 text-right">Other Expenses</th>
                <th className="py-2.5 px-3 text-right text-amber-500 bg-amber-950/10">Cumulative Net Liability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-400 font-sans">
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono uppercase tracking-widest text-[10px]">
                    No Outstanding Balance Records Found
                  </td>
                </tr>
              ) : (
                branches.map((branch) => {
                  const salaryBal = Number(branch.salary_balance ?? branch.salary_expenses ?? 0);
                  const salesAmt = Number(branch.sales_expenses ?? 0);
                  const capitalAmt = Number(branch.capital_expenses ?? 0);
                  const otherBal = Number(branch.other_balance ?? branch.other_expenses ?? 0);
                  
                  const netLiability = salaryBal + salesAmt + capitalAmt + otherBal;
                  const hasBalances = netLiability > 0;

                  return (
                    <tr 
                      key={branch.id} 
                      className={`hover:bg-slate-900/10 transition-all ${!hasBalances ? "opacity-30 bg-slate-950/5" : ""}`}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-300">
                        {branch.branch_name} <span className="text-slate-600 font-normal text-[10px]">({branch.branch_code})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatCurrency(salaryBal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        {formatCurrency(salesAmt)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-cyan-400">
                        {formatCurrency(capitalAmt)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatCurrency(otherBal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold bg-amber-950/5 text-slate-200">
                        {formatCurrency(netLiability)}
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
  );
}

export default function RemainingBalancePage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
        <div className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="uppercase tracking-widest text-[10px]">Loading Balance Portfolio...</p>
      </div>
    }>
      <RemainingBalanceContent />
    </Suspense>
  );
}