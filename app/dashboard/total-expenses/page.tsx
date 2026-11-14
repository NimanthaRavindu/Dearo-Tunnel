"use client";
import React, { Suspense, useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Coins, FileSpreadsheet, Fuel, RefreshCw, MapPin, X, Search, Download, Boxes, Calendar, Building2, FileText } from "lucide-react";
import { ExpenseFilters } from "@/components/ExpenseFilters";

interface BranchExpense {
  id: number | string;
  branch_name: string;
  branch_code: string;
  salary_expenses?: number;
  other_expenses?: number;
  sales_expenses?: number;
  capital_expenses?: number;
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

interface DetailRow {
  id: number | string;
  branch_id: number | string;
  branchName: string;
  branchCode: string;
  category: "Salary" | "Sales" | "Capital" | "Other" | "Diesel";
  reason: string;
  expense_date: string;
  total_payable: number;
  total_paid: number;
  balance: number;
  crusher_load_quantity?: number | null;
  outside_load_quantity?: number | null;
  total_cube_quantity?: number | null;
  unit_cube_quantity?: number | null;
}

const DETAIL_CATEGORIES = ["All", "Salary", "Sales", "Capital", "Other", "Diesel"] as const;

const CAT_STYLE: Record<string, string> = {
  Salary: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  Sales: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Capital: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Other: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Diesel: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
};

const formatCurrency = (value: unknown) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function TotalExpensesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");
  const selectedDieselId = searchParams.get("selected_diesel_id");
  const selectedBranchId = searchParams.get("branch_id");
  const selectedBranchName = searchParams.get("branch_name");

  const [branches, setBranches] = useState<BranchExpense[]>([]);
  const [salesList, setSalesList] = useState<FilterItem[]>([]);
  const [capitalList, setCapitalList] = useState<FilterItem[]>([]);
  const [dieselList, setDieselList] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  // ✅ Detail table states
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCategory, setDetailCategory] = useState<string>("All");
  const [detailSearch, setDetailSearch] = useState("");

  // ✅ NEW: Ekama Date Filter - Summary + Detail dekata
  const [globalDate, setGlobalDate] = useState(""); // Single date - 2026-11-14
  const [globalFrom, setGlobalFrom] = useState("");
  const [globalTo, setGlobalTo] = useState("");

  const hasDateFilter = !!(globalDate || globalFrom || globalTo);

  const fetchExpenseBreakdown = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSalesId) params.set("selected_sales_id", selectedSalesId);
      if (selectedCapitalId) params.set("selected_capital_id", selectedCapitalId);
      if (selectedDieselId) params.set("selected_diesel_id", selectedDieselId);

      const query = params.toString();
      const response = await fetch(
        query ? `/api/dashboard/summary?${query}` : "/api/dashboard/summary",
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("Failed to load expense breakdown.");
      const json = await response.json();
      setBranches(json.branches || []);
      setSalesList(json.sales || []);
      setCapitalList(json.capital || []);
      setDieselList(json.diesel || []);
    } catch (error) {
      console.error("Failed to load expense breakdown:", error);
      setBranches([]);
      setSalesList([]);
      setCapitalList([]);
      setDieselList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId, selectedDieselId]);

  useEffect(() => { fetchExpenseBreakdown(); }, [fetchExpenseBreakdown]);

  // ✅ Detail rows ganna - Date eka API ekata th yawanawa
  const fetchDetailRows = useCallback(async () => {
    setDetailLoading(true);
    try {
      const branchParam = selectedBranchId ? selectedBranchId : "all";
      const p = new URLSearchParams({ branchId: branchParam });
      if (globalDate) p.set("date", globalDate);
      if (globalFrom) p.set("from", globalFrom);
      if (globalTo) p.set("to", globalTo);
      const res = await fetch(`/api/expences/all?${p.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("detail fetch failed");
      const data = await res.json();
      setDetailRows(Array.isArray(data) ? data : []);
    } catch {
      setDetailRows([]);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedBranchId, globalDate, globalFrom, globalTo]);

  useEffect(() => { fetchDetailRows(); }, [fetchDetailRows]);

  const updateFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.push(`/dashboard/total-expenses${query ? `?${query}` : ""}`);
  };

  // ✅ NEW: Date eken filter karapu Detail rows - API eka filter kale nathnam th meken filter wenawa
  const dateFilteredDetail = useMemo(() => {
    if (!hasDateFilter) return detailRows;
    return detailRows.filter((r) => {
      const d = (r.expense_date || "").slice(0, 10);
      if (!d) return false;
      if (globalDate) return d === globalDate;
      if (globalFrom && d < globalFrom) return false;
      if (globalTo && d > globalTo) return false;
      return true;
    });
  }, [detailRows, globalDate, globalFrom, globalTo, hasDateFilter]);

  // ✅ NEW: Date filter thiyenawanam Summary eka Detail rows walin hadanawa
  const summaryFromDetail = useMemo(() => {
    if (!hasDateFilter) return null;
    const map = new Map<string, BranchExpense>();
    dateFilteredDetail.forEach((r) => {
      const key = String(r.branch_id);
      if (!map.has(key)) {
        map.set(key, {
          id: r.branch_id,
          branch_name: r.branchName,
          branch_code: r.branchCode,
          salary_expenses: 0,
          sales_expenses: 0,
          capital_expenses: 0,
          other_expenses: 0,
          diesel_expenses: 0,
        });
      }
      const item = map.get(key)!;
      const val = Number(r.total_payable) || 0;
      if (r.category === "Salary") item.salary_expenses = Number(item.salary_expenses || 0) + val;
      if (r.category === "Sales") item.sales_expenses = Number(item.sales_expenses || 0) + val;
      if (r.category === "Capital") item.capital_expenses = Number(item.capital_expenses || 0) + val;
      if (r.category === "Other") item.other_expenses = Number(item.other_expenses || 0) + val;
      if (r.category === "Diesel") item.diesel_expenses = Number(item.diesel_expenses || 0) + val;
    });
    // Expense nathi branches th 0.00 walin pennanna
    branches.forEach((b) => {
      if (!map.has(String(b.id))) {
        map.set(String(b.id), { ...b, salary_expenses: 0, sales_expenses: 0, capital_expenses: 0, other_expenses: 0, diesel_expenses: 0 });
      }
    });
    return Array.from(map.values());
  }, [dateFilteredDetail, branches, hasDateFilter]);

  // === Branch filter logic - Date filter thiyenawanam summaryFromDetail gannawa ===
  const filteredBranches = useMemo(() => {
    let result = summaryFromDetail ?? branches;
    if (selectedBranchId) {
      result = result.filter((b) => String(b.id) === String(selectedBranchId));
    }
    if (searchText) {
      result = result.filter((b) =>
        b.branch_name.toLowerCase().includes(searchText.toLowerCase()) ||
        b.branch_code.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return result;
  }, [branches, summaryFromDetail, selectedBranchId, searchText]);

  const total = filteredBranches.reduce(
    (sum, branch) =>
      sum +
      Number(branch.salary_expenses || 0) +
      Number(branch.sales_expenses || 0) +
      Number(branch.capital_expenses || 0) +
      Number(branch.other_expenses || 0) +
      Number(branch.diesel_expenses || 0),
    0,
  );

  // ✅ Detail filter - Date eka methana ayeth filter karanne na, dateFilteredDetail ekenma enawa
  const filteredDetail = useMemo(() => {
    return dateFilteredDetail.filter((r) => {
      if (detailCategory !== "All" && r.category !== detailCategory) return false;
      if (detailSearch) {
        const s = detailSearch.toLowerCase();
        if (
          !String(r.reason || "").toLowerCase().includes(s) &&
          !String(r.branchName || "").toLowerCase().includes(s) &&
          !String(r.expense_date || "").includes(s)
        ) return false;
      }
      return true;
    });
  }, [dateFilteredDetail, detailCategory, detailSearch]);

  const detailTotals = useMemo(() => filteredDetail.reduce((a, r) => ({
    payable: a.payable + (Number(r.total_payable) || 0),
    paid: a.paid + (Number(r.total_paid) || 0),
    balance: a.balance + (Number(r.balance) || 0),
    cubes: a.cubes + (Number(r.total_cube_quantity) || 0),
  }), { payable: 0, paid: 0, balance: 0, cubes: 0 }), [filteredDetail]);

  const exportCSV = () => {
    const head = "Date,Branch,Category,Reason,Crusher,Outside,Total Cube,Unit Cube,Payable,Paid,Balance";
    const body = filteredDetail.map((r) => [r.expense_date, `"${r.branchName}"`, r.category, `"${r.reason}"`, r.crusher_load_quantity ?? "", r.outside_load_quantity ?? "", r.total_cube_quantity ?? "", r.unit_cube_quantity ?? "", r.total_payable, r.total_paid, r.balance].join(",")).join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "total-expenses-detail.csv";
    a.click();
  };

  const clearDateFilter = () => {
    setGlobalDate("");
    setGlobalFrom("");
    setGlobalTo("");
  };

  const handleRefreshAll = () => {
    setRefreshing(true);
    fetchExpenseBreakdown();
    fetchDetailRows();
  };

  if (loading) return <Loading text="Compiling Expense Ledger Sheets..." />;

  return (
    <main className="min-h-screen bg-slate-950 p-3 text-slate-100 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                const query = searchParams.toString();
                router.push(`/dashboard${query ? `?${query}` : ""}`);
              }}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white"
            >
              <ArrowLeft size={13} />
              Back To Main Control Panel
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <Coins size={15} className="text-emerald-400" />
              <h1 className="text-base font-semibold text-white">
                Gross Expense Breakdown Sub-Ledger
              </h1>

              {/* Branch Dropdown Filter */}
              <div className="relative flex items-center">
                <MapPin size={12} className="absolute left-2 text-slate-500 pointer-events-none" />
                <select
                  value={selectedBranchId || ""}
                  onChange={(e) => updateFilter("branch_id", e.target.value || undefined)}
                  className="bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-6 py-1 text-[11px] text-cyan-300 outline-none focus:border-cyan-500/50"
                >
                  <option value="">All Branches ({branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.branch_name} ({b.branch_code})
                    </option>
                  ))}
                </select>
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
            </div>

            {(selectedBranchId || searchText) && (
              <div className="flex items-center gap-2 mt-1">
                {selectedBranchId && (
                  <span className="flex items-center gap-1 bg-cyan-950/50 border border-cyan-500/30 px-2 py-1 rounded text-[10px] text-cyan-400">
                    <MapPin size={10} /> Branch: {filteredBranches[0]?.branch_name || selectedBranchId}
                    <button onClick={() => updateFilter("branch_id")} className="ml-1 hover:text-white"><X size={12}/></button>
                  </span>
                )}
                {searchText && (
                  <span className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[10px]">
                    Search: {searchText}
                    <button onClick={() => setSearchText("")} className="ml-1"><X size={12}/></button>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"/>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Filter branch..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-2 py-1.5 text-[11px] w-[160px] outline-none focus:border-slate-700"
              />
            </div>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={refreshing}
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2">
              <span className="block text-[9px] uppercase text-emerald-400">
                {selectedBranchId ? "Branch Gross" : "Aggregate Gross Expenses"}
              </span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                LKR {formatCurrency(total)}
              </span>
            </div>
          </div>
        </header>

        {/* ===== ✅ Ekama Date Filter - Summary + Detail Dekata ===== */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-emerald-400" />
            <span className="text-[11px] font-bold text-slate-200">Filter by Date</span>
            {hasDateFilter && (
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-400">
                {globalDate ? `Date: ${globalDate}` : `${globalFrom || "..."} → ${globalTo || "..."}`}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">Date:</span>
              <input
                type="date"
                value={globalDate}
                onChange={(e) => { setGlobalDate(e.target.value); setGlobalFrom(""); setGlobalTo(""); }}
                className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 outline-none focus:border-emerald-500/40"
              />
            </div>

            <span className="text-[10px] text-slate-600">OR</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">From:</span>
              <input
                type="date"
                value={globalFrom}
                onChange={(e) => { setGlobalFrom(e.target.value); setGlobalDate(""); }}
                className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 outline-none focus:border-emerald-500/40"
              />
              <span className="text-[10px] text-slate-500">To:</span>
              <input
                type="date"
                value={globalTo}
                onChange={(e) => { setGlobalTo(e.target.value); setGlobalDate(""); }}
                className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-200 outline-none focus:border-emerald-500/40"
              />
            </div>

            <button
              onClick={clearDateFilter}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-bold text-slate-300 transition"
            >
              Clear Date
            </button>
          </div>
        </div>

        {/* ===== 1. Uda Summary Matrix ===== */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-xs font-semibold">
            <div className="flex items-center gap-2"><FileSpreadsheet size={14} className="text-emerald-400" /> Infrastructure Financial Auditing Matrix {hasDateFilter && <span className="text-[10px] font-bold text-emerald-400">(Filtered by Date)</span>}</div>
            <span className="text-[10px] text-slate-500">{filteredBranches.length} Branches Shown</span>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[1050px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-400">
                  <th className="px-3 py-2 text-left">Node / Branch Identity</th>
                  <th className="px-3 py-2 text-right">Salary Expenses</th>
                  <th className="px-3 py-2 text-right text-emerald-400">Sales Expenses</th>
                  <th className="px-3 py-2 text-right text-amber-400">Capital Expenses</th>
                  <th className="px-3 py-2 text-right">Other Expenses</th>
                  <th className="px-3 py-2 text-right text-cyan-400">Diesel Expenses</th>
                  <th className="px-3 py-2 text-right text-emerald-400">Gross Combined Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredBranches.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-500">No Expense Records Found</td></tr>
                ) : (
                  filteredBranches.map((branch) => {
                    const salary = Number(branch.salary_expenses || 0);
                    const sales = Number(branch.sales_expenses || 0);
                    const capital = Number(branch.capital_expenses || 0);
                    const other = Number(branch.other_expenses || 0);
                    const diesel = Number(branch.diesel_expenses || 0);
                    const rowTotal = salary + sales + capital + other + diesel;
                    return (
                      <tr key={branch.id} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 font-mono text-slate-200">{branch.branch_name} <span className="text-[10px] text-slate-500">({branch.branch_code})</span></td>
                        <MoneyCell value={salary} />
                        <MoneyCell value={sales} className="text-emerald-400" />
                        <MoneyCell value={capital} className="text-amber-400" />
                        <MoneyCell value={other} />
                        <MoneyCell value={diesel} className="text-cyan-400" icon />
                        <MoneyCell value={rowTotal} className="font-bold text-emerald-400" />
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== 2. Detail Table ===== */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400"><FileText size={15} /></div>
              <div>
                <h2 className="text-xs font-bold tracking-wide text-slate-100 uppercase">Total Expenses - All Records</h2>
                <p className="text-[10px] text-slate-500">Salary • Sales • Capital • Other • Diesel - siyalu records ekama table ekaka</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">{filteredDetail.length} Records</span>
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-[11px] font-bold text-white transition"><Download size={12} /> Export CSV</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            {[
              { label: "Total Payable", value: detailTotals.payable, cls: "text-white", suffix: "LKR " },
              { label: "Total Paid", value: detailTotals.paid, cls: "text-emerald-400", suffix: "LKR " },
              { label: "Total Balance", value: detailTotals.balance, cls: "text-amber-400", suffix: "LKR " },
              { label: "Total Cubes", value: detailTotals.cubes, cls: "text-cyan-400", suffix: "" },
            ].map((c) => (
              <div key={c.label} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">{c.label}</p>
                <p className={`text-[14px] font-black font-mono mt-1 ${c.cls}`}>{c.suffix}{formatCurrency(c.value)}</p>
              </div>
            ))}
          </div>

          {/* Filters - Date eka methana na, uda global date ekenma */}
          <div className="px-4 pb-4 flex flex-col lg:flex-row gap-3">
            <div className="flex flex-wrap gap-1.5">
              {DETAIL_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setDetailCategory(c)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${detailCategory === c ? "bg-emerald-600 border-emerald-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"}`}>{c}</button>
              ))}
            </div>
            <div className="flex flex-1 gap-2 lg:justify-end items-center">
              <span className="text-[10px] text-slate-500 hidden lg:block">
                {hasDateFilter ? `Showing: ${globalDate || `${globalFrom || "..."} → ${globalTo || "..."}`}` : "Showing: All Dates"}
              </span>
              <div className="relative flex-1 lg:max-w-[240px]">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={detailSearch} onChange={(e) => setDetailSearch(e.target.value)} placeholder="Search reason / branch / date..." className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] outline-none focus:border-emerald-500/40" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full min-w-[950px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-400">
                  <th className="px-3 py-2 text-left"><span className="inline-flex items-center gap-1"><Calendar size={11} /> Date</span></th>
                  <th className="px-3 py-2 text-left"><span className="inline-flex items-center gap-1"><Building2 size={11} /> Branch</span></th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                  <th className="px-3 py-2 text-left"><span className="inline-flex items-center gap-1"><Boxes size={11} /> Cube Details</span></th>
                  <th className="px-3 py-2 text-right">Payable</th>
                  <th className="px-3 py-2 text-right">Paid</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {detailLoading ? (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-500">Loading records...</td></tr>
                ) : filteredDetail.length === 0 ? (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-500">No expense records found. <span className="text-slate-600">/api/expences/all API eka hadala thiyenawada balanna.</span></td></tr>
                ) : filteredDetail.map((r) => {
                  const isCube = r.total_cube_quantity != null;
                  const paidFull = Number(r.balance) <= 0;
                  return (
                    <tr key={`${r.category}-${r.id}`} className="hover:bg-slate-800/40 transition">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-300 whitespace-nowrap">{r.expense_date}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-slate-200">{r.branchName}</p>
                        {r.branchCode && <p className="text-[10px] font-mono text-slate-500">({r.branchCode})</p>}
                      </td>
                      <td className="px-3 py-2.5"><span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${CAT_STYLE[r.category] || ""}`}>{r.category}</span></td>
                      <td className="px-3 py-2.5 text-slate-200">{r.reason}</td>
                      <td className="px-3 py-2.5">
                        {isCube ? (
                          <div className="text-[11px] font-mono leading-4">
                            <p className="text-slate-300">Crusher: <span className="text-white">{Number(r.crusher_load_quantity || 0).toFixed(2)}</span> • Outside: <span className="text-white">{Number(r.outside_load_quantity || 0).toFixed(2)}</span></p>
                            <p className="text-emerald-400 font-bold">Total: {Number(r.total_cube_quantity).toFixed(2)} × {Number(r.unit_cube_quantity || 0).toFixed(2)}</p>
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[11px] font-semibold text-slate-200">{formatCurrency(r.total_payable)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[11px] text-emerald-400">{formatCurrency(r.total_paid)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[11px] font-bold text-amber-400">{formatCurrency(r.balance)}</td>
                      <td className="px-3 py-2.5 text-right"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${paidFull ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{paidFull ? "PAID" : "PENDING"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredDetail.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-700 font-mono text-[11px] font-black">
                    <td colSpan={5} className="px-3 py-2.5 text-right text-slate-300 uppercase">Grand Total ({filteredDetail.length} Records)</td>
                    <td className="px-3 py-2.5 text-right text-white">LKR {formatCurrency(detailTotals.payable)}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-400">LKR {formatCurrency(detailTotals.paid)}</td>
                    <td className="px-3 py-2.5 text-right text-amber-400">LKR {formatCurrency(detailTotals.balance)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MoneyCell({ value, className = "", icon = false }: { value: number; className?: string; icon?: boolean; }) {
  return (
    <td className={`px-3 py-2.5 text-right font-mono text-[11px] ${className}`}>
      <span className="inline-flex items-center gap-1">{icon && <Fuel size={12} />}{formatCurrency(value)}</span>
    </td>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 font-mono text-xs text-slate-500">
      <div className="text-center"><div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />{text}</div>
    </div>
  );
}

export default function TotalExpensesPage() {
  return (
    <Suspense fallback={<Loading text="Loading Expense Ledger..." />}>
      <TotalExpensesContent />
    </Suspense>
  );
}