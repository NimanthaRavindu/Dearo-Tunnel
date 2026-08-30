"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileSpreadsheet, RefreshCw, Filter, X, ChevronDown, DollarSign } from "lucide-react";

interface BranchExpense {
  id: number | string;
  branch_name: string;
  branch_code: string;
  total_expenses?: number;
  salary_expenses?: number;
  sales_expenses?: number;
  capital_expenses?: number;
  other_expenses?: number;
}

function TotalExpensesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [branches, setBranches] = useState<BranchExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalSum, setTotalSum] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [salesList, setSalesList] = useState<any[]>([]);
  const [capitalList, setCapitalList] = useState<any[]>([]);
  const [showSalesDropdown, setShowSalesDropdown] = useState<boolean>(false);
  const [showCapitalDropdown, setShowCapitalDropdown] = useState<boolean>(false);

  const fetchExpensesBreakdown = useCallback(async () => {
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
        setTotalSum(json.cards?.totalExpenses || 0);
        setSalesList(json.sales || []);
        setCapitalList(json.capital || []);
      }
    } catch (err) {
      console.error("Failed to load total expenses breakdown:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId]);

  useEffect(() => {
    fetchExpensesBreakdown();
  }, [fetchExpensesBreakdown]);

  const handleSelectSales = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected_sales_id", id);
    router.push(`/dashboard/total-expenses?${params.toString()}`);
    setShowSalesDropdown(false);
  };

  const handleSelectCapital = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected_capital_id", id);
    router.push(`/dashboard/total-expenses?${params.toString()}`);
    setShowCapitalDropdown(false);
  };

  const clearSalesFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("selected_sales_id");
    const qs = params.toString();
    router.push(qs ? `/dashboard/total-expenses?${qs}` : "/dashboard/total-expenses");
  };

  const clearCapitalFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("selected_capital_id");
    const qs = params.toString();
    router.push(qs ? `/dashboard/total-expenses?${qs}` : "/dashboard/total-expenses");
  };

  const handleBackToDashboard = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);
    const query = params.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
        <div className="h-5 w-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="uppercase tracking-widest text-[10px]">Compiling Total Expenses Sheets...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#070a12] min-h-screen text-slate-300 font-mono text-xs selection:bg-rose-500/20 selection:text-rose-300">
      
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-4">
        <div className="space-y-1.5">
          <button 
            onClick={handleBackToDashboard} 
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white uppercase font-bold transition-colors"
          >
            <ArrowLeft size={12} /> Back To Main Control Panel
          </button>
          
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={15} className="text-rose-500" /> Total Expenses Ledger Sub-Matrix
            </h2>

            {/* Sales Filter Tag */}
            {selectedSalesId ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px]">
                <Filter size={10} /> Sales #{selectedSalesId}
                <button onClick={clearSalesFilter} className="hover:text-white ml-1"><X size={10} /></button>
              </span>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setShowSalesDropdown(!showSalesDropdown)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 text-[10px] hover:text-white"
                >
                  + Add Sales Filter <ChevronDown size={10} />
                </button>
                {showSalesDropdown && (
                  <div className="absolute top-full mt-1 left-0 bg-slate-900 border border-slate-700 rounded-md shadow-xl z-50 p-2 min-w-[220px] max-h-60 overflow-y-auto">
                    {salesList.map((item) => {
                      const id = typeof item === "object" ? item.id : item;
                      return (
                        <div key={id} onClick={() => handleSelectSales(id.toString())} className="px-2 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800 rounded cursor-pointer">
                          <span className="font-semibold text-emerald-400">{item.name || `Entry #${id}`}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setRefreshing(true); fetchExpensesBreakdown(); }}
            disabled={refreshing}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <div className="text-right bg-rose-950/20 border border-rose-900/40 rounded-xl px-4 py-2 min-w-[180px]">
            <span className="text-[9px] text-rose-400 font-bold uppercase block tracking-wider mb-0.5">Aggregate Total Expenses</span>
            <span className="text-sm font-bold font-sans text-white">
              LKR {totalSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1527]/30 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-bold tracking-wider bg-[#090e1a]/30">
                <th className="py-2.5 px-3">Node / Branch Identity</th>
                <th className="py-2.5 px-3 text-right">Salary Expenses</th>
                <th className="py-2.5 px-3 text-right">Sales Expenses</th>
                <th className="py-2.5 px-3 text-right">Capital Expenses</th>
                <th className="py-2.5 px-3 text-right">Other Expenses</th>
                <th className="py-2.5 px-3 text-right text-rose-500 bg-rose-950/10">Total Expenses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-400 font-sans">
              {branches.map((branch: any) => {
                const totalExp = Number(branch.total_expenses ?? (Number(branch.salary_expenses||0) + Number(branch.sales_expenses||0) + Number(branch.capital_expenses||0) + Number(branch.other_expenses||0)));
                return (
                  <tr key={branch.id} className="hover:bg-slate-900/10">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-300">{branch.branch_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{Number(branch.salary_expenses || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{Number(branch.sales_expenses || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-cyan-400">{Number(branch.capital_expenses || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{Number(branch.other_expenses || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold bg-rose-950/5 text-slate-200">{totalExp.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
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
  return (<Suspense fallback={<div>Loading...</div>}><TotalExpensesContent /></Suspense>);
}