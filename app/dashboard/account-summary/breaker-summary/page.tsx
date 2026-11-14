"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar, Fuel, Wallet, Receipt, Building2, Scale,
  Loader2, Search, Download, TrendingDown, TrendingUp,
  Users, ArrowDownRight, ArrowUpRight, Banknote, UserRound,
} from "lucide-react";

function getToday() { return new Date().toISOString().split("T")[0]; }
const fmt = (n: number) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// ✅ Oya 3 pages wala data structure
interface OtherExpense {
  id: string;
  branch_id?: string;
  branch_name?: string;
  branchName?: string;
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
  branchName?: string;
  date: string;
  quantity?: number;
  litres?: number;
  amount: number;
  machine?: string;
  vehicle_number?: string;
}
interface SalaryRow {
  id: string;
  branch_id?: string;
  branch_name?: string;
  branchName?: string;
  date: string;
  employee_name?: string;
  name?: string;
  role?: string;
  position?: string;
  category?: string;
  amount: number;
  salary?: number;
}

export default function BreakerSummaryPage() {
  const [date, setDate] = useState(getToday());
  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);
  const [dieselRows, setDieselRows] = useState<DieselRow[]>([]);
  const [salaryRows, setSalaryRows] = useState<SalaryRow[]>([]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [oRes, dRes, sRes] = await Promise.all([
        fetch(`/api/expences/other-expenses`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/expences/diesel`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
        // ✅ Salary API eka - oya project eke thiyena eka
        fetch(`/api/expences/salaries`, { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      setOtherExpenses(oRes.data || oRes || []);
      setDieselRows(dRes.data || dRes || []);
      setSalaryRows(sRes.data || sRes || []);
    } finally { setIsLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const getBranchName = (r: any) => r.branch_name || r.branchName || (r.branch_id ? `Branch ${r.branch_id}` : "-");
  const getBranchKey = (r: any) => String(r.branch_id || r.branch_name || "");

  // ✅ Branch list - Branch Name eken
  const branches = useMemo(() => {
    const map = new Map<string, string>();
    [...otherExpenses, ...dieselRows, ...salaryRows].forEach((r: any) => {
      if (r.branch_id || r.branch_name) map.set(getBranchKey(r), getBranchName(r));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [otherExpenses, dieselRows, salaryRows]);

  const isSameDate = (d?: string) => (d || "").slice(0, 10) === date;
  const isBranch = (r: any) => branchFilter === "all" || getBranchKey(r) === branchFilter;

  // ✅ 1. BREKER INCOME = Other Expenses wala Breker Expenses - Date eke
  const breakerIncomeRows = useMemo(() => otherExpenses.filter(r => {
    const txt = `${r.category || ""} ${r.type || ""} ${r.name || ""} ${r.description || ""}`.toLowerCase();
    const isBreker = txt.includes("breker") || txt.includes("breaker");
    return isBreker && isSameDate(r.date) && isBranch(r);
  }), [otherExpenses, date, branchFilter]);

  // ✅ 2. DIESEL = Diesel Page wala Breker Machine - Date eke
  // Diesel page eke okkoma Breker Machine nam, filter eka nathuwa gannawa. Machine field eke "breaker" thiyenawanam eka witharak gannawa.
  const breakerDieselRows = useMemo(() => dieselRows.filter(r => {
    const txt = `${r.machine || ""} ${r.vehicle_number || ""}`.toLowerCase();
    const isBrekerMachine = !r.machine || txt.includes("breker") || txt.includes("breaker") || txt.includes("machine");
    return isBrekerMachine && isSameDate(r.date) && isBranch(r);
  }), [dieselRows, date, branchFilter]);

  // ✅ 3. SALARY = Salary Page wala Breker Operator - Date eke
  const breakerSalaryRows = useMemo(() => salaryRows.filter(r => {
    const txt = `${r.role || ""} ${r.position || ""} ${r.category || ""} ${r.employee_name || ""} ${r.name || ""}`.toLowerCase();
    const isOperator = (txt.includes("breker") || txt.includes("breaker")) && (txt.includes("operator") || txt.includes("operater") || txt.includes("oprator"));
    // Role eka nathnam, name eke breaker thiyenawanam gannawa
    const isBrekerOnly = txt.includes("breker") || txt.includes("breaker");
    return (isOperator || isBrekerOnly) && isSameDate(r.date) && isBranch(r);
  }), [salaryRows, date, branchFilter]);

  // ✅ Search - Breker Income table eke witharak
  const searchedIncome = useMemo(() => {
    if (!search) return breakerIncomeRows;
    return breakerIncomeRows.filter(r => `${r.name} ${r.description} ${getBranchName(r)}`.toLowerCase().includes(search.toLowerCase()));
  }, [breakerIncomeRows, search]);

  // ✅ TOTALS - Date eke
  const breakerIncomeTotal = useMemo(() => breakerIncomeRows.reduce((t, r) => t + Number(r.amount || 0), 0), [breakerIncomeRows]);
  const dieselQty = useMemo(() => breakerDieselRows.reduce((t, r) => t + Number(r.quantity ?? r.litres ?? 0), 0), [breakerDieselRows]);
  const dieselTotal = useMemo(() => breakerDieselRows.reduce((t, r) => t + Number(r.amount || 0), 0), [breakerDieselRows]);
  const salaryTotal = useMemo(() => breakerSalaryRows.reduce((t, r) => t + Number(r.amount ?? r.salary ?? 0), 0), [breakerSalaryRows]);
  const totalUsed = dieselTotal + salaryTotal;
  // ✅ BALANCE = Breker Income - ( Diesel + Salary Operator )
  const balance = breakerIncomeTotal - totalUsed;
  const balancePositive = balance >= 0;

  const exportCSV = () => {
    const head = "Date,Branch,Type,Description,Amount";
    const body = [
      ...breakerIncomeRows.map(r => [date, getBranchName(r), "Breker Income", `"${r.name || r.description || ""}"`, r.amount].join(",")),
      ...breakerDieselRows.map(r => [date, getBranchName(r), "Breker Diesel", `${r.quantity ?? r.litres ?? 0} L`, r.amount].join(",")),
      ...breakerSalaryRows.map(r => [date, getBranchName(r), "Breker Operator Salary", `"${r.employee_name || r.name || ""}"`, r.amount ?? r.salary ?? 0].join(",")),
      `,,,Balance,${balance}`,
    ].join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `breaker-summary-${date}.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-[#060913] p-6 sm:p-10 font-sans text-xs text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-wider uppercase">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"><Banknote size={18} /></span>
              Breaker Summary
            </h1>
            <p className="mt-1 text-slate-400">Breker Income - Diesel - Operator Salary = Balance • Date vise</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-black hover:bg-slate-200"><Download size={14} /> Export CSV</button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0B1226] p-4">
          <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /><input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-amber-500/50" /></div>
          <div className="flex items-center gap-2"><Building2 size={14} className="text-slate-400" />
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none">
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search breker income..." className="w-full rounded-xl bg-slate-950 py-2.5 pl-8 pr-3 ring-1 ring-white/10 focus:outline-none focus:ring-amber-500/50" /></div>
          <span className="rounded-full bg-white/[0.04] px-3 py-2 font-bold text-slate-400 ring-1 ring-white/[0.06]">{date} • {branchFilter === "all" ? "All Branches" : branches.find(b => b.id === branchFilter)?.name}</span>
        </div>

        {isLoading ? <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /> Loading...</div> : (
          <>
            {/* ✅ 4 SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Breker Income */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Breker Income</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"><Wallet size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-emerald-400">{fmt(breakerIncomeTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{breakerIncomeRows.length} records • Other Expenses • {date}</p>
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400"><TrendingUp size={11} /> INCOME</p>
              </div>
              {/* Diesel */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Breaker Diesel</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"><Fuel size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-blue-400">{fmt(dieselTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{dieselQty.toLocaleString()} L • {breakerDieselRows.length} records • {date}</p>
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400"><TrendingDown size={11} /> EXPENSE</p>
              </div>
              {/* Salary Operator */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Operator Salary</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400"><Users size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-violet-400">{fmt(salaryTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{breakerSalaryRows.length} operators • {date}</p>
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-400"><TrendingDown size={11} /> EXPENSE</p>
              </div>
              {/* Balance */}
              <div className={`rounded-2xl border p-5 ${balancePositive ? "border-emerald-500/30 bg-emerald-500/[0.07]" : "border-red-500/30 bg-red-500/[0.07]"}`}>
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Balance</p><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${balancePositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}><Scale size={15} /></span></div>
                <p className={`mt-3 text-2xl font-black ${balancePositive ? "text-emerald-400" : "text-red-400"}`}>{fmt(balance)}</p>
                <p className="mt-1 text-[10px] text-slate-400">Total Used {fmt(totalUsed)}</p>
                <p className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold bg-white/[0.06] text-slate-300">{balancePositive ? "Balance thiyenawa" : "Over / Negative"}</p>
              </div>
            </div>

            {/* ✅ CALCULATION BAR */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
              <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase mb-3">Calculation • {date} • {branchFilter === "all" ? "All Branches" : branches.find(b => b.id === branchFilter)?.name}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-400 ring-1 ring-emerald-500/20">Income {fmt(breakerIncomeTotal)}</span><span className="text-slate-500">−</span>
                <span className="rounded-lg bg-slate-950 px-3 py-2 ring-1 ring-white/10">( Diesel {fmt(dieselTotal)} <span className="text-slate-500">+</span> Salary {fmt(salaryTotal)} )</span><span className="text-slate-500">=</span>
                <span className={`rounded-lg px-3 py-2 ring-1 ${balancePositive ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" : "bg-red-500/15 text-red-400 ring-red-500/30"}`}>Balance {fmt(balance)}</span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">Diesel {dieselQty.toLocaleString()} L • Operators {breakerSalaryRows.length} • Total Used {fmt(totalUsed)}</p>
            </div>

            {/* ✅ 3 TABLES - Date vise data */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 1. Breker Income - Other Expenses */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Receipt size={14} className="text-emerald-400" /> Breker Income</h3>
                <p className="text-[10px] text-slate-500 mt-1">Other Expenses Page • {date}</p>
                {searchedIncome.length === 0 ? <p className="py-8 text-center text-slate-500">No breker income for this date.</p> : (
                  <table className="mt-4 w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-2">Branch / Name</th><th className="py-2 text-right">Amount</th></tr></thead>
                    <tbody>{searchedIncome.map(r => <tr key={r.id} className="border-b border-white/[0.04]"><td className="py-2.5"><p className="font-bold flex items-center gap-1"><Building2 size={11} className="text-slate-500" /> {getBranchName(r)}</p><p className="text-[10px] text-slate-500">{r.name || r.description || "Breker Expenses"}</p><p className="text-[10px] text-slate-600">{(r.date || "").slice(0, 10)}</p></td><td className="py-2.5 text-right font-black text-emerald-400">{fmt(Number(r.amount || 0))}</td></tr>)}
                    </tbody><tfoot><tr className="font-black"><td className="py-3">Total Income</td><td className="py-3 text-right text-emerald-400">{fmt(breakerIncomeTotal)}</td></tr></tfoot></table>
                )}
              </div>

              {/* 2. Diesel - Diesel Page */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Fuel size={14} className="text-blue-400" /> Breker Diesel</h3>
                <p className="text-[10px] text-slate-500 mt-1">Diesel Page • Breker Machine • {date}</p>
                {breakerDieselRows.length === 0 ? <p className="py-8 text-center text-slate-500">No diesel for this date.</p> : (
                  <table className="mt-4 w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-2">Branch</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Amount</th></tr></thead>
                    <tbody>{breakerDieselRows.map(r => <tr key={r.id} className="border-b border-white/[0.04]"><td className="py-2.5"><p className="font-bold flex items-center gap-1"><Building2 size={11} className="text-slate-500" /> {getBranchName(r)}</p><p className="text-[10px] text-slate-500">{(r.date || "").slice(0, 10)}</p></td><td className="py-2.5 text-right">{Number(r.quantity ?? r.litres ?? 0).toLocaleString()} L</td><td className="py-2.5 text-right font-black text-blue-400">{fmt(Number(r.amount || 0))}</td></tr>)}
                    </tbody><tfoot><tr className="font-black"><td className="py-3">Total</td><td className="py-3 text-right">{dieselQty.toLocaleString()} L</td><td className="py-3 text-right text-blue-400">{fmt(dieselTotal)}</td></tr></tfoot></table>
                )}
              </div>

              {/* 3. Salary - Salary Page */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><UserRound size={14} className="text-violet-400" /> Operator Salary</h3>
                <p className="text-[10px] text-slate-500 mt-1">Salary Page • Breker Operator • {date}</p>
                {breakerSalaryRows.length === 0 ? <p className="py-8 text-center text-slate-500">No operator salary for this date.</p> : (
                  <table className="mt-4 w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-2">Branch / Operator</th><th className="py-2 text-right">Amount</th></tr></thead>
                    <tbody>{breakerSalaryRows.map(r => <tr key={r.id} className="border-b border-white/[0.04]"><td className="py-2.5"><p className="font-bold flex items-center gap-1"><Building2 size={11} className="text-slate-500" /> {getBranchName(r)}</p><p className="text-[10px] text-slate-500">{r.employee_name || r.name || "-"}</p><p className="text-[10px] text-slate-600">{r.role || r.position || "Breker Operator"} • {(r.date || "").slice(0, 10)}</p></td><td className="py-2.5 text-right font-black text-violet-400">{fmt(Number(r.amount ?? r.salary ?? 0))}</td></tr>)}
                    </tbody><tfoot><tr className="font-black"><td className="py-3">Total Salary</td><td className="py-3 text-right text-violet-400">{fmt(salaryTotal)}</td></tr></tfoot></table>
                )}
              </div>
            </div>

            {/* ✅ Branch-wise Balance */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
              <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Building2 size={14} className="text-cyan-400" /> Branch-wise Balance • {date}</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {branches.length === 0 && <p className="text-slate-500">No branches for this date.</p>}
                {branches.map(b => {
                  const bIncome = breakerIncomeRows.filter(r => getBranchKey(r) === b.id).reduce((t, r) => t + Number(r.amount || 0), 0);
                  const bDiesel = breakerDieselRows.filter(r => getBranchKey(r) === b.id).reduce((t, r) => t + Number(r.amount || 0), 0);
                  const bSalary = breakerSalaryRows.filter(r => getBranchKey(r) === b.id).reduce((t, r) => t + Number(r.amount ?? r.salary ?? 0), 0);
                  const bBal = bIncome - (bDiesel + bSalary);
                  if (bIncome === 0 && bDiesel === 0 && bSalary === 0) return null;
                  return (
                    <div key={b.id} className="rounded-xl bg-slate-950/60 p-4 ring-1 ring-white/[0.06]">
                      <p className="font-bold flex items-center gap-2"><Building2 size={13} className="text-cyan-400" /> {b.name}</p>
                      <p className="mt-2 text-[11px] text-slate-400">Income {fmt(bIncome)} • Diesel {fmt(bDiesel)} • Salary {fmt(bSalary)}</p>
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