"use client";
import React, { Suspense, useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileSpreadsheet, RefreshCw, TrendingUp, MapPin, X, Filter, Search } from "lucide-react";
import { ExpenseFilters } from "@/components/ExpenseFilters";

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
  diesel_balance?: number;
  diesel_expenses?: number;
}

interface FilterItem {
  id: number | string;
  name?: string;
  branch_name?: string;
  date?: string;
  machine?: string;
  amount?: number;
  payable?: number;
  paid?: number;
  balance?: number;
}

const formatCurrency = (value: unknown) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function RemainingBalanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");
  const selectedDieselId = searchParams.get("selected_diesel_id");
  const selectedBranchId = searchParams.get("branch_id");
  const selectedDate = searchParams.get("date");

  const [branches, setBranches] = useState<BranchBalance[]>([]);
  const [allBranches, setAllBranches] = useState<BranchBalance[]>([]);
  const [salesList, setSalesList] = useState<FilterItem[]>([]);
  const [capitalList, setCapitalList] = useState<FilterItem[]>([]);
  const [dieselList, setDieselList] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const fetchBalanceBreakdown = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (selectedSalesId) params.set("selected_sales_id", selectedSalesId);
      if (selectedCapitalId) params.set("selected_capital_id", selectedCapitalId);
      if (selectedDieselId) params.set("selected_diesel_id", selectedDieselId);
      if (selectedBranchId) params.set("branch_id", selectedBranchId);
      if (selectedDate) params.set("date", selectedDate);

      const query = params.toString();
      const response = await fetch(query? `/api/dashboard/summary?${query}` : "/api/dashboard/summary", { cache: "no-store" });

      if (!response.ok) throw new Error("Failed to load balance summary.");
      const json = await response.json();

      setBranches(json.branches || []);
      setSalesList(json.sales || []);
      setCapitalList(json.capital || []);
      setDieselList(json.diesel || []);

      // all branches list eka first time witharak save karanawa dropdown ekata
      if (!selectedBranchId && json.branches?.length > 0) {
        setAllBranches(json.branches);
      }
      if (allBranches.length === 0 && json.branches?.length > 0) {
        // fallback - filtered unath atleast e list eka thiyaganna
        setAllBranches((prev) => prev.length === 0? json.branches : prev);
      }

    } catch (error) {
      console.error("Failed to load balance breakdown:", error);
      setBranches([]);
      setSalesList([]);
      setCapitalList([]);
      setDieselList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId, selectedDieselId, selectedBranchId, selectedDate]);

  // fetch all branches for filter dropdown (first load)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`/api/dashboard/summary`, { cache: "no-store" });
        const json = await res.json();
        if (json.branches) setAllBranches(json.branches);
      } catch {}
    };
    fetchAll();
  }, []);

  useEffect(() => {
    fetchBalanceBreakdown();
  }, [fetchBalanceBreakdown]);

  const updateFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.push(`/dashboard/remaining-balance${query? `?${query}` : ""}`);
  };

  const filteredBranches = useMemo(() => {
    if (!localSearch) return branches;
    return branches.filter((b: any) =>
      String(b.branch_name || "").toLowerCase().includes(localSearch.toLowerCase()) ||
      String(b.branch_code || "").toLowerCase().includes(localSearch.toLowerCase())
    );
  }, [branches, localSearch]);

  const totalBalance = filteredBranches.reduce(
    (total, branch) =>
      total +
      Number(branch.salary_balance?? branch.salary_expenses?? 0) +
      Number(branch.sales_expenses || 0) +
      Number(branch.capital_expenses || 0) +
      Number(branch.other_balance?? branch.other_expenses?? 0) +
      Number(branch.diesel_balance?? branch.diesel_expenses?? 0),
    0,
  );

  if (loading) {
    return <Loading text="Compiling Balance Portfolio Sheets..." />;
  }

  return (
    <main className="min-h-screen bg-[#070a12] p-4 font-mono text-xs text-slate-300 md:p-6">
      <div className="space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-900 pb-4 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                const query = searchParams.toString();
                router.push(`/dashboard${query? `?${query}` : ""}`);
              }}
              className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 hover:text-white"
            >
              <ArrowLeft size={12} />
              Back To Main Control Panel
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-white">
                <TrendingUp size={15} className="text-amber-500" />
                Outstanding Balances Portfolio Sub-Ledger
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { setRefreshing(true); fetchBalanceBreakdown(); }}
              disabled={refreshing}
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
            >
              <RefreshCw size={14} className={refreshing? "animate-spin" : ""} />
            </button>

            <div className="min-w-[190px] rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-2 text-right">
              <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-amber-400">
                Aggregate Remaining Balance {selectedBranchId? `(${filteredBranches.length})` : ""}
              </span>
              <span className="font-sans text-sm font-bold text-white">
                LKR {formatCurrency(totalBalance)}
              </span>
            </div>
          </div>
        </header>

        {/* FILTERS - BRANCH FILTER ADDED */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Dropdown - NEW */}
          <div className="relative flex items-center">
            <MapPin size={12} className="absolute left-2.5 text-cyan-400 pointer-events-none" />
            <select
              value={selectedBranchId || ""}
              onChange={(e) => updateFilter("branch_id", e.target.value || undefined)}
              className="bg-[#0d1527] border border-cyan-900/40 rounded-lg pl-7 pr-8 py-2 text-[11px] text-cyan-300 outline-none focus:border-cyan-500/50 cursor-pointer min-w-[220px]"
            >
              <option value="">All Branches ({allBranches.length || branches.length})</option>
              {(allBranches.length > 0? allBranches : branches).map((b: any) => (
                <option key={b.id} value={String(b.id)}>{b.branch_name} ({b.branch_code})</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search branch..."
              className="bg-[#0d1527] border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-[11px] outline-none w-[160px]"
            />
          </div>

          <ExpenseFilters
            selectedSalesId={selectedSalesId}
            selectedCapitalId={selectedCapitalId}
            selectedDieselId={selectedDieselId}
            salesList={salesList}
            capitalList={capitalList}
            dieselList={dieselList}
            onSelectSales={(id) => updateFilter("selected_sales_id", id)}
            onSelectCapital={(id) => updateFilter("selected_capital_id", id)}
            onSelectDiesel={(id) => updateFilter("selected_diesel_id", id)}
            onClearSales={() => updateFilter("selected_sales_id")}
            onClearCapital={() => updateFilter("selected_capital_id")}
            onClearDiesel={() => updateFilter("selected_diesel_id")}
          />

          {selectedBranchId && (
            <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-400 text-[11px]">
              <Filter size={12} />
              <span>Branch #{selectedBranchId}</span>
              <button type="button" onClick={() => updateFilter("branch_id")} className="hover:text-white p-0.5"><X size={13} /></button>
            </div>
          )}
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-900 bg-[#0d1527]/30 shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-slate-900 bg-[#0a0f1d] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <FileSpreadsheet size={13} />
            Infrastructure Outstanding Liability Ledger Matrix - {selectedBranchId? `Filtered (${filteredBranches.length})` : `${filteredBranches.length} Branches`}
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[1050px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5 text-left">Node / Branch Identity</th>
                  <th className="px-3 py-2.5 text-right">Salary Balance</th>
                  <th className="px-3 py-2.5 text-right">Sales Expenses</th>
                  <th className="px-3 py-2.5 text-right">Capital Expenses</th>
                  <th className="px-3 py-2.5 text-right">Other Balance</th>
                  <th className="px-3 py-2.5 text-right text-cyan-400">Diesel Balance</th>
                  <th className="px-3 py-2.5 text-right text-amber-500">Cumulative Net Liability</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-900/40 font-sans text-slate-400">
                {filteredBranches.length === 0? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-600">No Outstanding Balance Records Found</td></tr>
                ) : (
                  filteredBranches.map((branch) => {
                    const salary = Number(branch.salary_balance?? branch.salary_expenses?? 0);
                    const sales = Number(branch.sales_expenses || 0);
                    const capital = Number(branch.capital_expenses || 0);
                    const other = Number(branch.other_balance?? branch.other_expenses?? 0);
                    const diesel = Number(branch.diesel_balance?? branch.diesel_expenses?? 0);
                    const rowTotal = salary + sales + capital + other + diesel;

                    return (
                      <tr key={branch.id} className={`hover:bg-slate-900/10 ${rowTotal <= 0? "bg-slate-950/5 opacity-30" : ""}`}>
                        <td className="px-3 py-2.5 font-mono font-semibold text-slate-300">
                          {branch.branch_name} <span className="text-[10px] font-normal text-slate-600">({branch.branch_code})</span>
                        </td>
                        <MoneyCell value={salary} />
                        <MoneyCell value={sales} className="text-emerald-400" />
                        <MoneyCell value={capital} className="text-cyan-400" />
                        <MoneyCell value={other} />
                        <MoneyCell value={diesel} className="text-cyan-400" />
                        <MoneyCell value={rowTotal} className="bg-amber-950/5 font-bold text-slate-200" />
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MoneyCell({ value, className = "" }: { value: number; className?: string; }) {
  return <td className={`px-3 py-2.5 text-right font-mono ${className}`}>{formatCurrency(value)}</td>;
}

function Loading({ text }: { text: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#070a12] font-mono text-xs text-slate-500">
      <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      <p className="uppercase tracking-widest">{text}</p>
    </div>
  );
}

export default function RemainingBalancePage() {
  return (
    <Suspense fallback={<Loading text="Loading Balance Portfolio..." />}>
      <RemainingBalanceContent />
    </Suspense>
  );
}