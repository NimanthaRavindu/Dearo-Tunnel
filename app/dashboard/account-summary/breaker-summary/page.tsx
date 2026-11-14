"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar, Fuel, Wallet, Receipt, Building2, Scale,
  Loader2, Search, Download, TrendingDown, TrendingUp, ArrowDownRight, ArrowUpRight,
} from "lucide-react";

function getToday() { return new Date().toISOString().split("T")[0]; }
const fmt = (n: number) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

interface OtherExpense {
  id: string;
  branch_id?: string;
  branch_name?: string;
  date: string;
  category?: string;
  type?: string;
  name?: string;
  description?: string;
  amount: number;
}
interface DieselRow {
  id: string;
  branch_id?: string;
  branch_name?: string;
  date: string;
  quantity?: number;
  litres?: number;
  amount: number;
  unit_price?: number;
}

export default function BreakerSummaryPage() {
  const [date, setDate] = useState(getToday());
  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);
  const [dieselRows, setDieselRows] = useState<DieselRow[]>([]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      // ✅ Oya API 2ka - branch filter nathuwa okkoma gannawa, date eken filter karanne meke
      const [oRes, dRes] = await Promise.all([
        fetch(`/api/expences/other-expenses?cache=no-store`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/expences/diesel?cache=no-store`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      setOtherExpenses(oRes.data || oRes || []);
      setDieselRows(dRes.data || dRes || []);
    } finally { setIsLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  // ✅ Branch list - filter ekata
  const branches = useMemo(() => {
    const s = new Set<string>();
    [...otherExpenses, ...dieselRows].forEach((r: any) => { if (r.branch_id) s.add(String(r.branch_id)); });
    return Array.from(s);
  }, [otherExpenses, dieselRows]);

  // ✅ Date + Branch filter
  const filteredOther = useMemo(() => otherExpenses.filter(r => {
    const dOk = (r.date || "").slice(0, 10) === date;
    const bOk = branchFilter === "all" || String(r.branch_id) === branchFilter;
    const sOk = !search || `${r.name} ${r.description} ${r.category}`.toLowerCase().includes(search.toLowerCase());
    return dOk && bOk && sOk;
  }), [otherExpenses, date, branchFilter, search]);

  const filteredDiesel = useMemo(() => dieselRows.filter(r => {
    const dOk = (r.date || "").slice(0, 10) === date;
    const bOk = branchFilter === "all" || String(r.branch_id) === branchFilter;
    return dOk && bOk;
  }), [dieselRows, date, branchFilter]);

  // ✅ Breker Expenses = Other Expenses wala Breker category eka
  // Oya DB eke category eka "breaker" / "Breker" / "BREAKER" nam meken match wenawa
  const breakerExpenses = useMemo(() => filteredOther.filter(r =>
    `${r.category || ""} ${r.type || ""} ${r.name || ""}`.toLowerCase().includes("breker") ||
    `${r.category || ""} ${r.type || ""} ${r.name || ""}`.toLowerCase().includes("breaker")
  ), [filteredOther]);

  const otherOnly = useMemo(() => filteredOther.filter(r => !breakerExpenses.includes(r)), [filteredOther, breakerExpenses]);

  // ✅ Totals
  const breakerTotal = useMemo(() => breakerExpenses.reduce((t, r) => t + Number(r.amount || 0), 0), [breakerExpenses]);
  const otherTotal = useMemo(() => otherOnly.reduce((t, r) => t + Number(r.amount || 0), 0), [otherOnly]);
  const dieselQty = useMemo(() => filteredDiesel.reduce((t, r) => t + Number(r.quantity ?? r.litres ?? 0), 0), [filteredDiesel]);
  const dieselAmount = useMemo(() => filteredDiesel.reduce((t, r) => t + Number(r.amount || 0), 0), [filteredDiesel]);
  const totalUsed = dieselAmount + otherTotal;
  // ✅ BALANCE = Breker Expenses - ( Diesel Amount + Other Expenses )
  const balance = breakerTotal - totalUsed;
  const balancePositive = balance >= 0;

  const exportCSV = () => {
    const head = "Date,Branch,Type,Description,Amount";
    const body = [
      ...breakerExpenses.map(r => [date, r.branch_id || "", "Breker Expense", `"${r.name || r.description || ""}"`, r.amount].join(",")),
      ...filteredDiesel.map(r => [date, r.branch_id || "", "Breker Diesel", `${r.quantity ?? r.litres ?? 0} L`, r.amount].join(",")),
      ...otherOnly.map(r => [date, r.branch_id || "", "Other Expense", `"${r.name || r.description || ""}"`, r.amount].join(",")),
    ].join("\n");
    const blob = new Blob([head + "\n" + body + `\n,,,Balance,${balance}`], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `breaker-summary-${date}.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-[#060913] p-6 sm:p-10 font-sans text-xs text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-wider uppercase">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"><Fuel size={18} /></span>
              Breaker Summary
            </h1>
            <p className="mt-1 text-slate-400">Date ekata adala Breaker Expenses • Diesel • Other Expenses • Balance</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-black hover:bg-slate-200"><Download size={14} /> Export CSV</button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0B1226] p-4">
          <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /><input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-amber-500/50" /></div>
          <div className="flex items-center gap-2"><Building2 size={14} className="text-slate-400" />
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none">
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b} value={b}>Branch {b}</option>)}
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expense..." className="w-full rounded-xl bg-slate-950 py-2.5 pl-8 pr-3 ring-1 ring-white/10 focus:outline-none focus:ring-amber-500/50" /></div>
          <span className="rounded-full bg-white/[0.04] px-3 py-2 font-bold text-slate-400 ring-1 ring-white/[0.06]">{date} • {branchFilter === "all" ? "All Branches" : `Branch ${branchFilter}`}</span>
        </div>

        {isLoading ? <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /> Loading...</div> : (
          <>
            {/* ✅ SUMMARY CARDS - Professional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Breaker Expenses</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400"><Wallet size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-white">{fmt(breakerTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{breakerExpenses.length} records • {date}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Breaker Diesel</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"><Fuel size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-blue-400">{fmt(dieselAmount)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{dieselQty.toLocaleString()} L • {filteredDiesel.length} records</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Other Expenses</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400"><Receipt size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-violet-400">{fmt(otherTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{otherOnly.length} records • {date}</p>
              </div>
              {/* ✅ BALANCE CARD */}
              <div className={`rounded-2xl border p-5 ${balancePositive ? "border-emerald-500/30 bg-emerald-500/[0.07]" : "border-red-500/30 bg-red-500/[0.07]"}`}>
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Balance</p><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${balancePositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}><Scale size={15} /></span></div>
                <p className={`mt-3 text-2xl font-black ${balancePositive ? "text-emerald-400" : "text-red-400"}`}>{fmt(balance)}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">{balancePositive ? <><TrendingUp size={11} className="text-emerald-400" /> Balance thiyenawa</> : <><TrendingDown size={11} className="text-red-400" /> Over / Negative</>}</p>
              </div>
            </div>

            {/* ✅ CALCULATION BAR */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
              <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase mb-3">Calculation • {date}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="rounded-lg bg-slate-950 px-3 py-2 ring-1 ring-white/10">Breaker {fmt(breakerTotal)}</span><span className="text-slate-500">−</span>
                <span className="rounded-lg bg-slate-950 px-3 py-2 ring-1 ring-white/10">( Diesel {fmt(dieselAmount)} <span className="text-slate-500">+</span> Other {fmt(otherTotal)} )</span><span className="text-slate-500">=</span>
                <span className={`rounded-lg px-3 py-2 ring-1 ${balancePositive ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" : "bg-red-500/15 text-red-400 ring-red-500/30"}`}>Balance {fmt(balance)}</span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">Total Used = {fmt(totalUsed)} • Diesel {dieselQty.toLocaleString()} L</p>
            </div>

            {/* ✅ TABLES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Breaker Diesel Table */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Fuel size={14} className="text-blue-400" /> Breaker Machine Diesel • {date}</h3>
                {filteredDiesel.length === 0 ? <p className="py-8 text-center text-slate-500">No diesel records for this date.</p> : (
                  <table className="mt-4 w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-2">Branch</th><th className="py-2 text-right">Qty (L)</th><th className="py-2 text-right">Amount</th></tr></thead>
                    <tbody>{filteredDiesel.map((r, i) => <tr key={r.id || i} className="border-b border-white/[0.04]"><td className="py-2.5 font-bold">Branch {r.branch_id || "-"}</td><td className="py-2.5 text-right">{Number(r.quantity ?? r.litres ?? 0).toLocaleString()} L</td><td className="py-2.5 text-right font-black text-blue-400">{fmt(Number(r.amount || 0))}</td></tr>)}
                    </tbody><tfoot><tr className="font-black"><td className="py-3">Total</td><td className="py-3 text-right">{dieselQty.toLocaleString()} L</td><td className="py-3 text-right text-blue-400">{fmt(dieselAmount)}</td></tr></tfoot></table>
                )}
              </div>

              {/* Breker + Other Expenses Table */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Receipt size={14} className="text-amber-400" /> Breaker & Other Expenses • {date}</h3>
                {filteredOther.length === 0 ? <p className="py-8 text-center text-slate-500">No expenses for this date.</p> : (
                  <table className="mt-4 w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-2">Branch / Name</th><th className="py-2">Type</th><th className="py-2 text-right">Amount</th></tr></thead>
                    <tbody>{filteredOther.map((r) => {
                      const isBreker = breakerExpenses.includes(r);
                      return <tr key={r.id} className="border-b border-white/[0.04]"><td className="py-2.5"><p className="font-bold">Branch {r.branch_id || "-"}</p><p className="text-[10px] text-slate-500">{r.name || r.description || "-"}</p></td><td className="py-2.5"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${isBreker ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" : "bg-violet-500/10 text-violet-400 ring-violet-500/20"}`}>{isBreker ? "Breker" : "Other"}</span></td><td className="py-2.5 text-right font-black">{fmt(Number(r.amount || 0))}</td></tr>;
                    })}</tbody>
                    <tfoot><tr className="font-black"><td colSpan={2} className="py-3">Total Expenses</td><td className="py-3 text-right">{fmt(breakerTotal + otherTotal)}</td></tr></tfoot></table>
                )}
              </div>
            </div>

            {/* Branch-wise Balance */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
              <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Building2 size={14} className="text-cyan-400" /> Branch-wise Balance • {date}</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {branches.length === 0 && <p className="text-slate-500">No branches for this date.</p>}
                {branches.map(b => {
                  const bBreker = breakerExpenses.filter(r => String(r.branch_id) === b).reduce((t, r) => t + Number(r.amount || 0), 0);
                  const bOther = otherOnly.filter(r => String(r.branch_id) === b).reduce((t, r) => t + Number(r.amount || 0), 0);
                  const bDiesel = filteredDiesel.filter(r => String(r.branch_id) === b).reduce((t, r) => t + Number(r.amount || 0), 0);
                  const bBal = bBreker - (bDiesel + bOther);
                  return (
                    <div key={b} className="rounded-xl bg-slate-950/60 p-4 ring-1 ring-white/[0.06]">
                      <p className="font-bold">Branch {b}</p>
                      <p className="mt-2 text-[11px] text-slate-400">Breker {fmt(bBreker)} • Diesel {fmt(bDiesel)} • Other {fmt(bOther)}</p>
                      <p className={`mt-2 flex items-center gap-1 font-black ${bBal >= 0 ? "text-emerald-400" : "text-red-400"}`}>{bBal >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} Balance {fmt(bBal)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}