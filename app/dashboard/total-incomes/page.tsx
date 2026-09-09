"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, TrendingUp, Building2, Loader2, Layers, Filter, X } from "lucide-react";

interface BranchIncomeSummary {
  branchId: string;
  branchName: string;
  totalAmount: number;
  entriesCount: number;
}

function TotalIncomesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [summaries, setSummaries] = useState<BranchIncomeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    fetchTotalIncomesSummary();
  }, [selectedSalesId, selectedCapitalId]);

  const fetchTotalIncomesSummary = async () => {
    try {
      const params = new URLSearchParams();
      params.append("summary", "true");
      if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
      if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);
      const queryString = params.toString();
      
      const url = `/api/expences/sales-incomes?${queryString}`;

      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setSummaries(result.data);
        setGrandTotal(result.grandTotal);
      }
    } catch (error) {
      console.error("Failed to fetch total incomes summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilter = (type: "sales" | "capital") => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "sales") params.delete("selected_sales_id");
    if (type === "capital") params.delete("selected_capital_id");

    const query = params.toString();
    router.push(`/dashboard/total-incomes${query ? `?${query}` : ""}`);
  };

  const handleBackToDashboard = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);
    const query = params.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-6 sm:p-10 flex flex-col items-center relative overflow-hidden font-mono text-xs">
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-red-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[250px] bg-rose-600/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="p-3 bg-slate-900/90 hover:bg-slate-800/90 rounded-xl transition-all duration-200 border border-slate-800 text-slate-400 hover:text-white shadow-lg hover:scale-105 active:scale-95 group"
              title="Return to Dashboard"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-100">
                  Total Sales Incomes Ledger
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Real-time aggregated financial revenue tracking across all active corporate infrastructure branches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {selectedCapitalId && (
              <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-400 text-[11px]">
                <Filter size={12} />
                <span>Capital Record #{selectedCapitalId}</span>
                <button onClick={() => clearFilter("capital")} className="hover:text-white p-0.5 rounded transition-colors" title="Clear Capital Filter">
                  <X size={13} />
                </button>
              </div>
            )}
            {selectedSalesId && (
              <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-400 text-[11px]">
                <Filter size={12} />
                <span>Sales Record #{selectedSalesId}</span>
                <button onClick={() => clearFilter("sales")} className="hover:text-white p-0.5 rounded transition-colors" title="Clear Sales Filter">
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-[#0d1527]/60 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 shadow-inner">
              <TrendingUp size={28} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grand Cumulative Revenue</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight mt-1">
                LKR {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-4 py-2.5 rounded-xl shadow-inner">
            <div className="p-2 rounded-lg bg-slate-900 text-slate-400">
              <Layers size={16} />
            </div>
            <div className="text-xs">
              <p className="text-slate-400 font-medium">Database Status</p>
              <p className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Synchronized
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-red-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                Branch-Wise Revenue Breakdown
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {summaries.length} Operating Units Active
            </span>
          </div>

          {isLoading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 size={28} className="text-red-500 animate-spin" />
              <p className="text-[11px] font-medium text-slate-400">Aggregating branch database nodes...</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-600">
                <Building2 size={28} />
              </div>
              <p className="text-[11px] font-medium text-slate-400">No active branch sales income records detected.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Branch Name</th>
                    <th className="py-3.5 px-4 text-center">Logged Entries</th>
                    <th className="py-3.5 px-4 text-right">Total Revenue (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {summaries.map((item) => {
                    const rowParams = new URLSearchParams();
                    if (selectedSalesId) rowParams.append("selected_sales_id", selectedSalesId);
                    if (selectedCapitalId) rowParams.append("selected_capital_id", selectedCapitalId);
                    const rowQuery = rowParams.toString();

                    return (
                      <tr 
                        key={item.branchId} 
                        onClick={() => router.push(`/dashboard/branches/${item.branchId}/add-expenses${rowQuery ? `?${rowQuery}` : ""}`)}
                        className="hover:bg-slate-900/70 transition-colors cursor-pointer group"
                        title="Click to view branch details"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-200 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-red-400 group-hover:scale-110 transition-transform">
                            <Building2 size={14} />
                          </div>
                          <div>
                            <span className="text-white font-bold block">{item.branchName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {item.branchId}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-300 font-semibold">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px]">
                            {item.entriesCount} entries
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-red-400 text-sm">
                          LKR {item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalIncomesFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
      <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="uppercase tracking-widest text-[10px]">Loading Revenue Ledger...</p>
    </div>
  );
}

export default function TotalIncomesSummaryPage() {
  return (
    <Suspense fallback={<TotalIncomesFallback />}>
      <TotalIncomesContent />
    </Suspense>
  );
}