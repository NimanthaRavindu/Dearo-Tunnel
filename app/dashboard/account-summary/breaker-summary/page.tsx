"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar, Fuel, Wallet, Receipt, Building2, Scale,
  Loader2, Search, Download, Users, ArrowDownRight, ArrowUpRight, Banknote, UserRound,
} from "lucide-react";

const fmt = (n: number) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const safeArray = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.rows)) return v.rows;
  if (v && Array.isArray(v.expenses)) return v.expenses;
  return [];
};
const numeric = (v: any) => Number(v ?? 0) || 0;

const fetchJSON = async (url: string) => {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json().catch(() => []);
    return safeArray(j);
  } catch { return []; }
};

export default function BreakerSummaryPage() {
  const [date, setDate] = useState("2026-11-13");
  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [otherExpenses, setOtherExpenses] = useState<any[]>([]);
  const [dieselRows, setDieselRows] = useState<any[]>([]);
  const [salaryRows, setSalaryRows] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      // ✅ FIX 1 - Branch API eka oya Other Expenses page eke wage /api/branch
      const branchList: any[] = await fetchJSON(`/api/branch`);
      setBranches(branchList);

      // ✅ FIX 2 - Other Expenses API eka oya page eke wage /api/expences/other?branchId=...
      // Branch ekak gane ganna ona - nathnam data enne na
      const ids = branchList.map((b: any) => b.id).filter(Boolean);
      // Branch na nam ekai parak try karanna
      const branchIds = ids.length > 0 ? ids : ["all"];

      const otherResults = await Promise.allSettled(
        branchIds.map((id: any) =>
          fetchJSON(`/api/expences/other?branchId=${encodeURIComponent(id)}`).then((rows: any[]) =>
            rows.map((r: any) => ({ ...r, _branchId: id }))
          )
        )
      );
      const allOther: any[] = [];
      otherResults.forEach((res: any) => {
        if (res.status === "fulfilled") allOther.push(...res.value);
      });
      setOtherExpenses(allOther);

      // Diesel / Salary - oya API thibboth enawa, nathnam 0 wenawa (Breker Income ekata balapanne na)
      const [d, s] = await Promise.allSettled([
        fetchJSON(`/api/expences/diesel`),
        fetchJSON(`/api/expences/salary`),
      ]);
      setDieselRows(d.status === "fulfilled" ? d.value : []);
      setSalaryRows(s.status === "fulfilled" ? s.value : []);
    } finally { setIsLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const getBranchName = (r: any) => {
    const b = branches.find((x: any) => String(x.id) === String(r._branchId || r.branch_id || r.branchId));
    return b?.branchName || b?.bName || r.branch_name || r.branchName || r.branch || (r._branchId ? `Branch ${r._branchId}` : "-");
  };
  const getBranchKey = (r: any) => String(r._branchId || r.branch_id || r.branchId || "");

  const branchOptions = useMemo(() => {
    return branches.map((b: any) => ({ id: String(b.id), name: b.branchName || b.bName || `Branch ${b.id}` }));
  }, [branches]);

  const getDateStr = (r: any) => String(r.expense_date || r.date || r.created_at || "").slice(0, 10);
  const isSameDate = (r: any) => getDateStr(r) === date;
  const isBranch = (r: any) => branchFilter === "all" || getBranchKey(r) === branchFilter;

  // ✅ FIX 3 - BREKER INCOME = Other Expenses wala Breker Expenses wala total_payable
  // Oya Other Expenses page eke wage: expense_type / reason == "Breker Expenses"
  // Amount eka = total_payable
  const breakerIncomeRows = useMemo(() => (otherExpenses || []).filter(r => {
    if (!r) return false;
    const type = String(r.expense_type || "").toLowerCase();
    const reason = String(r.reason || "").toLowerCase();
    const isBreker = type.includes("breker") || reason.includes("breker") || type.includes("breaker") || reason.includes("breaker");
    if (!isBreker) return false;
    const txt = `${r.reason || ""} ${r.expense_type || ""}`.toLowerCase();
    const ok = !search || txt.includes(search.toLowerCase()) || getBranchName(r).toLowerCase().includes(search.toLowerCase());
    return ok && isSameDate(r) && isBranch(r);
  }), [otherExpenses, date, branchFilter, search, branches]);

  // ✅ FIX 4 - BRANCH WISE - Date | Branch | Breker Income (total_payable)
  const getPayable = (r: any) => numeric(r.total_payable ?? r.total ?? r.amount ?? 0);

  const branchWiseIncome = useMemo(() => {
    const map = new Map<string, { branchId: string, branchName: string, date: string, count: number, total: number }>();
    breakerIncomeRows.forEach(r => {
      const key = getBranchKey(r) || getBranchName(r);
      const cur = map.get(key) || { branchId: key, branchName: getBranchName(r), date, count: 0, total: 0 };
      cur.count += 1;
      cur.total += getPayable(r);
      cur.branchName = getBranchName(r);
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [breakerIncomeRows, date, branches]);

  const breakerDieselRows = useMemo(() => (dieselRows || []).filter(r => String(r.expense_date || r.date || r.created_at || "").slice(0, 10) === date && (branchFilter === "all" || String(r.branch_id || r.branchId) === branchFilter)), [dieselRows, date, branchFilter]);
  const breakerSalaryRows = useMemo(() => (salaryRows || []).filter(r => {
    const txt = `${r.role || ""} ${r.position || ""} ${r.category || ""} ${r.employee_name || ""} ${r.name || ""}`.toLowerCase();
    return (txt.includes("breker") || txt.includes("breaker")) && String(r.expense_date || r.date || r.created_at || "").slice(0, 10) === date;
  }), [salaryRows, date]);

  const breakerIncomeTotal = useMemo(() => breakerIncomeRows.reduce((t, r) => t + getPayable(r), 0), [breakerIncomeRows]);
  const dieselQty = useMemo(() => breakerDieselRows.reduce((t, r) => t + numeric(r.quantity ?? r.litres ?? 0), 0), [breakerDieselRows]);
  const dieselTotal = useMemo(() => breakerDieselRows.reduce((t, r) => t + numeric(r.total_payable ?? r.amount ?? r.total ?? 0), 0), [breakerDieselRows]);
  const salaryTotal = useMemo(() => breakerSalaryRows.reduce((t, r) => t + numeric(r.total_payable ?? r.amount ?? r.salary ?? 0), 0), [breakerSalaryRows]);
  const totalUsed = dieselTotal + salaryTotal;
  const balance = breakerIncomeTotal - totalUsed;
  const balancePositive = balance >= 0;

  const exportCSV = () => {
    const head = "Date,Branch,Breker Income (Total Payable),Records";
    const body = [...branchWiseIncome.map(r => [r.date, `"${r.branchName}"`, r.total, r.count].join(",")), `Total,,${breakerIncomeTotal},${breakerIncomeRows.length}`].join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `breaker-summary-${date}.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-[#060913] p-6 sm:p-10 font-sans text-xs text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-wider uppercase">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"><Banknote size={18} /></span>
              Breaker Summary
            </h1>
            <p className="mt-1 text-slate-400">Breker Income (Other Expenses - Breker Expenses - Total Payable) - Diesel - Operator Salary = Balance</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-black hover:bg-amber-400">Refresh</button>
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-black hover:bg-slate-200"><Download size={14} /> Export CSV</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0B1226] p-4">
          <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /><input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-amber-500/50" /></div>
          <div className="flex items-center gap-2"><Building2 size={14} className="text-slate-400" />
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none">
              <option value="all">All Branches</option>
              {branchOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full rounded-xl bg-slate-950 py-2.5 pl-8 pr-3 ring-1 ring-white/10 focus:outline-none focus:ring-amber-500/50" /></div>
        </div>

        {isLoading ? <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /> Loading...</div> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Breker Income</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"><Wallet size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-emerald-400">{fmt(breakerIncomeTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{breakerIncomeRows.length} records • Breker Expenses - Total Payable • {date}</p>
                <div className="mt-3 border-t border-white/[0.06] pt-3 space-y-1 text-[11px]">
                  <p className="flex justify-between text-slate-400"><span>Other Expenses - Breker ({date})</span><span className="font-black text-white">{fmt(breakerIncomeTotal)}</span></p>
                  <p className="flex justify-between text-slate-400"><span>Diesel</span><span className="font-bold text-blue-400">- {fmt(dieselTotal)}</span></p>
                  <p className="flex justify-between text-slate-400"><span>Operator Salary</span><span className="font-bold text-violet-400">- {fmt(salaryTotal)}</span></p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Breaker Diesel</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"><Fuel size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-blue-400">{fmt(dieselTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{dieselQty.toLocaleString()} L • {breakerDieselRows.length} records • {date}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Operator Salary</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400"><Users size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-violet-400">{fmt(salaryTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{breakerSalaryRows.length} operators • {date}</p>
              </div>
              <div className={`rounded-2xl border p-5 ${balancePositive ? "border-emerald-500/30 bg-emerald-500/[0.07]" : "border-red-500/30 bg-red-500/[0.07]"}`}>
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Balance</p><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${balancePositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}><Scale size={15} /></span></div>
                <p className={`mt-3 text-2xl font-black ${balancePositive ? "text-emerald-400" : "text-red-400"}`}>{fmt(balance)}</p>
                <p className="mt-1 text-[10px] text-slate-400">Total Used {fmt(totalUsed)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
              <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase mb-3">Calculation • {date}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-400 ring-1 ring-emerald-500/20">Income {fmt(breakerIncomeTotal)}</span><span className="text-slate-500">−</span>
                <span className="rounded-lg bg-slate-950 px-3 py-2 ring-1 ring-white/10">( Diesel {fmt(dieselTotal)} <span className="text-slate-500">+</span> Salary {fmt(salaryTotal)} )</span><span className="text-slate-500">=</span>
                <span className={`rounded-lg px-3 py-2 ring-1 ${balancePositive ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" : "bg-red-500/15 text-red-400 ring-red-500/30"}`}>Balance {fmt(balance)}</span>
              </div>
            </div>

            {/* ✅ OYA ILLUWA TABLE EKA - Date | Branch | Breker Income (Total Payable) */}
            <div className="rounded-2xl border border-emerald-500/20 bg-[#0B1226] p-5">
              <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Receipt size={14} className="text-emerald-400" /> Breker Income - Branch Wise • {date}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Other Expenses Page - Breker Expenses - Total Payable • Date ekata adala</p>
              {branchWiseIncome.length === 0 ? <p className="py-8 text-center text-slate-500">Me date ekata Breker Expenses na.</p> : (
                <table className="mt-4 w-full text-left">
                  <thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-3">Date</th><th className="py-3">Branch</th><th className="py-3 text-center">Records</th><th className="py-3 text-right">Breker Income (Total Payable)</th></tr></thead>
                  <tbody>{branchWiseIncome.map(r => (
                    <tr key={r.branchId} className="border-b border-white/[0.04]"><td className="py-3 font-bold">{r.date}</td><td className="py-3"><p className="font-bold flex items-center gap-2"><Building2 size={13} className="text-cyan-400" /> {r.branchName}</p></td><td className="py-3 text-center text-slate-400">{r.count}</td><td className="py-3 text-right font-black text-emerald-400">{fmt(r.total)}</td></tr>
                  ))}</tbody>
                  <tfoot><tr className="font-black text-base"><td className="py-4">Total</td><td className="py-4 text-slate-400">{branchWiseIncome.length} Branches</td><td className="py-4 text-center text-slate-400">{breakerIncomeRows.length}</td><td className="py-4 text-right text-emerald-400">{fmt(breakerIncomeTotal)}</td></tr></tfoot>
                </table>
              )}
              <p className="mt-3 text-[10px] text-slate-500">* Me total eka Other Expenses page eke Category = Breker Expenses filter karama yata Filtered Total (Total Payable) ekata match wenna ona.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Fuel size={14} className="text-blue-400" /> Breker Diesel</h3>
                {breakerDieselRows.length === 0 ? <p className="py-8 text-center text-slate-500">No diesel for this date.</p> : (
                  <table className="mt-4 w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-2">Branch</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Amount</th></tr></thead>
                    <tbody>{breakerDieselRows.map((r: any) => <tr key={r.id} className="border-b border-white/[0.04]"><td className="py-2.5"><p className="font-bold">{getBranchName(r)}</p></td><td className="py-2.5 text-right">{numeric(r.quantity ?? r.litres ?? 0).toLocaleString()} L</td><td className="py-2.5 text-right font-black text-blue-400">{fmt(numeric(r.total_payable ?? r.amount ?? 0))}</td></tr>)}
                    </tbody><tfoot><tr className="font-black"><td className="py-3">Total</td><td className="py-3 text-right">{dieselQty.toLocaleString()} L</td><td className="py-3 text-right text-blue-400">{fmt(dieselTotal)}</td></tr></tfoot></table>
                )}
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><UserRound size={14} className="text-violet-400" /> Operator Salary</h3>
                {breakerSalaryRows.length === 0 ? <p className="py-8 text-center text-slate-500">No operator salary for this date.</p> : (
                  <table className="mt-4 w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-2">Branch / Operator</th><th className="py-2 text-right">Amount</th></tr></thead>
                    <tbody>{breakerSalaryRows.map((r: any) => <tr key={r.id} className="border-b border-white/[0.04]"><td className="py-2.5"><p className="font-bold">{getBranchName(r)}</p><p className="text-[10px] text-slate-500">{r.employee_name || r.name || "-"}</p></td><td className="py-2.5 text-right font-black text-violet-400">{fmt(numeric(r.total_payable ?? r.amount ?? r.salary ?? 0))}</td></tr>)}
                    </tbody><tfoot><tr className="font-black"><td className="py-3">Total Salary</td><td className="py-3 text-right text-violet-400">{fmt(salaryTotal)}</td></tr></tfoot></table>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
              <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Building2 size={14} className="text-cyan-400" /> Branch-wise Balance • {date}</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {branchWiseIncome.map(b => {
                  const bDiesel = breakerDieselRows.filter(r => getBranchKey(r) === b.branchId).reduce((t, r) => t + numeric(r.total_payable ?? r.amount ?? 0), 0);
                  const bSalary = breakerSalaryRows.filter(r => getBranchKey(r) === b.branchId).reduce((t, r) => t + numeric(r.total_payable ?? r.amount ?? r.salary ?? 0), 0);
                  const bBal = b.total - (bDiesel + bSalary);
                  return (
                    <div key={b.branchId} className="rounded-xl bg-slate-950/60 p-4 ring-1 ring-white/[0.06]">
                      <p className="font-bold flex items-center gap-2"><Building2 size={13} className="text-cyan-400" /> {b.branchName}</p>
                      <p className="mt-2 text-[11px] text-slate-400">Income {fmt(b.total)} • Diesel {fmt(bDiesel)} • Salary {fmt(bSalary)}</p>
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