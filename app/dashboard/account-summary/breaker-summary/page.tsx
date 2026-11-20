"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar, Fuel, Wallet, Receipt, Building2, Scale,
  Loader2, Search, Download, Users, Banknote, UserRound, ListChecks, Filter, X,
} from "lucide-react";

const fmt = (n: number) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const qtyFmt = (n: number) => `${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cube`;
const numeric = (v: any) => Number(v ?? 0) || 0;
const isBreker = (s: any) => {
  const t = String(s || "").toLowerCase();
  return t.includes("breker") || t.includes("breaker") || t.includes("braker");
};
const isBrekerSalary = (r: any) => {
  return isBreker(r.employee_name) || isBreker(r.employeeName) || isBreker(r.name) || isBreker(r.reason) || isBreker(r.description) || isBreker(r.employee);
};
const isBrekerMachine = (r: any) => {
  return isBreker(r.machine) || isBreker(r.machine_name) || isBreker(r.machineName);
};


const getCrusherQty = (r: any) => numeric(r.crusher_load_qty ?? r.crusher_load_quantity ?? r.crusher_qty ?? r.crusher_load ?? 0);
const getOutsideQty = (r: any) => numeric(r.outside_load_qty ?? r.outside_load_quantity ?? r.outside_qty ?? r.outside_load ?? 0);
const getTotalCube = (r: any) => {
  const direct = numeric(r.total_cube ?? r.total_cube_qty ?? r.total_cube_quantity ?? r.total_quantity ?? 0);
  if (direct > 0) return direct;
  return getCrusherQty(r) + getOutsideQty(r);
};

const fetchJSON = async (url: string) => {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json().catch(() => []);
    if (Array.isArray(j)) return j;
    if (j && Array.isArray(j.expenses)) return j.expenses;
    if (j && Array.isArray(j.data)) return j.data;
    return [];
  } catch { return []; }
};

export default function BreakerSummaryPage() {
  const [date, setDate] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [otherExpenses, setOtherExpenses] = useState<any[]>([]);
  const [dieselRows, setDieselRows] = useState<any[]>([]);
  const [salaryRows, setSalaryRows] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const [allDate, setAllDate] = useState("all");
  const [allBranch, setAllBranch] = useState("all");
  const [allType, setAllType] = useState("all");

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const branchList = await fetchJSON(`/api/branches`);
      setBranches(branchList);
      const ids = branchList.map((b: any) => b.id).filter(Boolean);
      const getName = (id: any) => branchList.find((x: any) => String(x.id) === String(id))?.branch_name || `Branch ${id}`;

      const otherResults = await Promise.allSettled(
        ids.map((id: any) =>
          fetchJSON(`/api/expences/other?branchId=${encodeURIComponent(id)}`).then((rows: any[]) =>
            rows.map((r: any) => ({ ...r, _branchId: id, _branchName: getName(id) }))
          )
        )
      );
      const allOther: any[] = [];
      otherResults.forEach((res: any) => { if (res.status === "fulfilled") allOther.push(...res.value); });
      setOtherExpenses(allOther);

      const dieselResults = await Promise.allSettled(
        ids.map((id: any) =>
          fetchJSON(`/api/expences/diesel?branch_id=${encodeURIComponent(id)}`).then((rows: any[]) =>
            rows.map((r: any) => ({ ...r, _branchId: id, _branchName: getName(id) }))
          )
        )
      );
      const allDiesel: any[] = [];
      dieselResults.forEach((res: any) => { if (res.status === "fulfilled") allDiesel.push(...res.value); });
      setDieselRows(allDiesel);

      const salaryResults = await Promise.allSettled(
        ids.map((id: any) =>
          fetchJSON(`/api/expences/salary?branchId=${encodeURIComponent(id)}`).then((rows: any[]) =>
            rows.map((r: any) => ({ ...r, _branchId: id, _branchName: getName(id) }))
          )
        )
      );
      const allSalary: any[] = [];
      salaryResults.forEach((res: any) => { if (res.status === "fulfilled") allSalary.push(...res.value); });
      setSalaryRows(allSalary);
    } finally { setIsLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const getBranchName = (r: any) => r._branchName || "-";
  const getBranchKey = (r: any) => String(r._branchId || r.branch_id || r.branchId || "");
  const getDateStr = (r: any) => String(r.expense_date || r.date || "").slice(0, 10);
  const isBranch = (r: any) => branchFilter === "all" || getBranchKey(r) === branchFilter;
  const isDate = (r: any) => date === "all" || getDateStr(r) === date;
  const branchOptions = useMemo(() => branches.map((b: any) => ({ id: String(b.id), name: b.branch_name || `Branch ${b.id}` })), [branches]);
  const dateLabel = date === "all" ? "All Dates" : date;

  const breakerIncomeAll = useMemo(() => (otherExpenses || []).filter(r => {
    if (!r) return false;
    if (!isBreker(r.reason)) return false;
    if (!isBranch(r)) return false;
    if (search && !String(r.reason || "").toLowerCase().includes(search.toLowerCase()) && !getBranchName(r).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [otherExpenses, branchFilter, search]);

  const breakerDieselAll = useMemo(() => (dieselRows || []).filter(r => {
    if (!r) return false;
    if (!isBrekerMachine(r)) return false;
    return isBranch(r);
  }), [dieselRows, branchFilter]);

  const breakerSalaryAll = useMemo(() => (salaryRows || []).filter(r => {
    if (!r) return false;
    if (!isBrekerSalary(r)) return false;
    return isBranch(r);
  }), [salaryRows, branchFilter]);

  const breakerIncomeTotal = useMemo(() => breakerIncomeAll.reduce((t, r) => t + numeric(r.total_payable ?? r.amount), 0), [breakerIncomeAll]);

  // ✅ NEW - Quantity Totals (All Dates + Branch Filter)
  const crusherTotalAll = useMemo(() => breakerIncomeAll.reduce((t, r) => t + getCrusherQty(r), 0), [breakerIncomeAll]);
  const outsideTotalAll = useMemo(() => breakerIncomeAll.reduce((t, r) => t + getOutsideQty(r), 0), [breakerIncomeAll]);
  const totalCubeAll = useMemo(() => breakerIncomeAll.reduce((t, r) => t + getTotalCube(r), 0), [breakerIncomeAll]);

  const dieselQtyAll = useMemo(() => breakerDieselAll.reduce((t, r) => t + numeric(r.diesel ?? r.qty ?? r.quantity ?? r.liters), 0), [breakerDieselAll]);
  const dieselTotal = useMemo(() => breakerDieselAll.reduce((t, r) => t + numeric(r.payable ?? r.total_payable ?? r.amount), 0), [breakerDieselAll]);

  const salaryTotal = useMemo(() => breakerSalaryAll.reduce((t, r) => t + numeric(r.total_payable ?? r.amount ?? r.salary), 0), [breakerSalaryAll]);
  const totalUsed = dieselTotal + salaryTotal;
  const balance = breakerIncomeTotal - totalUsed;
  const balancePositive = balance >= 0;

  const breakerIncomeDate = useMemo(() => breakerIncomeAll.filter(r => isDate(r)), [breakerIncomeAll, date]);
  const breakerDieselDate = useMemo(() => breakerDieselAll.filter(r => isDate(r)), [breakerDieselAll, date]);
  const breakerSalaryDate = useMemo(() => breakerSalaryAll.filter(r => isDate(r)), [breakerSalaryAll, date]);

  const incomeDateTotal = useMemo(() => breakerIncomeDate.reduce((t, r) => t + numeric(r.total_payable ?? r.amount), 0), [breakerIncomeDate]);
  const dieselDateTotal = useMemo(() => breakerDieselDate.reduce((t, r) => t + numeric(r.payable ?? r.total_payable ?? r.amount), 0), [breakerDieselDate]);
  const salaryDateTotal = useMemo(() => breakerSalaryDate.reduce((t, r) => t + numeric(r.total_payable ?? r.amount ?? r.salary), 0), [breakerSalaryDate]);
  const balanceDateTotal = incomeDateTotal - dieselDateTotal - salaryDateTotal;
  const balanceDatePositive = balanceDateTotal >= 0;

  // ✅ NEW - Date wise Quantity Totals
  const crusherDateTotal = useMemo(() => breakerIncomeDate.reduce((t, r) => t + getCrusherQty(r), 0), [breakerIncomeDate]);
  const outsideDateTotal = useMemo(() => breakerIncomeDate.reduce((t, r) => t + getOutsideQty(r), 0), [breakerIncomeDate]);
  const totalCubeDateTotal = useMemo(() => breakerIncomeDate.reduce((t, r) => t + getTotalCube(r), 0), [breakerIncomeDate]);

  const summaryRows = useMemo(() => {
    const map = new Map<string, { key: string, branchId: string, branchName: string, date: string, income: number, diesel: number, dieselQty: number, salary: number, incomeCount: number, dieselCount: number, salaryCount: number, crusherQty: number, outsideQty: number, totalCube: number }>();
    const getRow = (r: any) => {
      const d = getDateStr(r);
      const key = date === "all" ? `${d}|${getBranchKey(r)}` : getBranchKey(r);
      if (!map.has(key)) map.set(key, { key, branchId: getBranchKey(r), branchName: getBranchName(r), date: d, income: 0, diesel: 0, dieselQty: 0, salary: 0, incomeCount: 0, dieselCount: 0, salaryCount: 0, crusherQty: 0, outsideQty: 0, totalCube: 0 });
      return map.get(key)!;
    };
    
    breakerIncomeDate.forEach(r => {
      const row = getRow(r);
      row.income += numeric(r.total_payable ?? r.amount);
      row.incomeCount += 1;
      row.branchName = getBranchName(r);
      // ✅ QUANTITY ADD
      row.crusherQty += getCrusherQty(r);
      row.outsideQty += getOutsideQty(r);
      row.totalCube += getTotalCube(r);
    });
    breakerDieselDate.forEach(r => { const row = getRow(r); row.diesel += numeric(r.payable ?? r.total_payable ?? r.amount); row.dieselQty += numeric(r.diesel ?? r.qty ?? r.quantity); row.dieselCount += 1; row.branchName = getBranchName(r); });
    breakerSalaryDate.forEach(r => { const row = getRow(r); row.salary += numeric(r.total_payable ?? r.amount ?? r.salary); row.salaryCount += 1; row.branchName = getBranchName(r); });
    return Array.from(map.values()).map(r => ({ ...r, balance: r.income - r.diesel - r.salary })).sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.income - a.income);
  }, [breakerIncomeDate, breakerDieselDate, breakerSalaryDate, date]);

  const allEntriesRaw = useMemo(() => {
    const list: any[] = [];
    (otherExpenses || []).forEach(r => {
      if (!r || !isBreker(r.reason)) return;
      list.push({ _key: `inc-${r.id}-${r._branchId}`, _date: getDateStr(r), _branchId: String(r._branchId || ""), _branchName: getBranchName(r), _type: "Income", _detail: r.reason || "-", _sub: `Other Expense • ID ${r.id}`, _amount: numeric(r.total_payable ?? r.amount), _isPlus: true });
    });
    (dieselRows || []).forEach(r => {
      if (!r) return;
      if (!isBrekerMachine(r)) return;
      list.push({ _key: `diesel-${r.id}-${r._branchId}`, _date: getDateStr(r), _branchId: String(r._branchId || ""), _branchName: getBranchName(r), _type: "Diesel", _detail: r.machine || "-", _sub: `${numeric(r.diesel ?? r.qty ?? 0).toLocaleString()} L • ID ${r.id}`, _amount: numeric(r.payable ?? r.total_payable ?? r.amount), _isPlus: false });
    });
    (salaryRows || []).forEach(r => {
      if (!r || !isBrekerSalary(r)) return;
      list.push({ _key: `sal-${r.id}-${r._branchId}`, _date: getDateStr(r), _branchId: String(r._branchId || ""), _branchName: getBranchName(r), _type: "Salary", _detail: r.employee_name || r.employeeName || r.name || "-", _sub: `${r.reason || ""} • ID ${r.id}`, _amount: numeric(r.total_payable ?? r.amount ?? r.salary), _isPlus: false });
    });
    list.sort((a, b) => String(b._date || "").localeCompare(String(a._date || "")));
    return list;
  }, [otherExpenses, dieselRows, salaryRows]);

  const allEntries = useMemo(() => {
    let list = [...allEntriesRaw];
    if (allDate !== "all") list = list.filter(r => r._date === allDate);
    if (allBranch !== "all") list = list.filter(r => r._branchId === allBranch);
    if (allType !== "all") list = list.filter(r => r._type === allType);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(r => String(r._detail || "").toLowerCase().includes(s) || String(r._branchName || "").toLowerCase().includes(s) || String(r._type || "").toLowerCase().includes(s));
    }
    return list;
  }, [allEntriesRaw, allDate, allBranch, allType, search]);

  const allDates = useMemo(() => {
    const set = new Set(allEntriesRaw.map(r => r._date).filter(Boolean));
    return Array.from(set).sort((a, b) => String(b).localeCompare(String(a)));
  }, [allEntriesRaw]);

  const resetAllFilter = () => { setAllDate("all"); setAllBranch("all"); setAllType("all"); };
  const resetTopFilter = () => { setDate("all"); setBranchFilter("all"); };

  const exportCSV = () => {
    const head = "Date,Branch,Income,Diesel (Breaker Only),Operator Salary,Crusher Load Cube Quantity,Outside Load Cube Quantity,Total Cube Quantity,Balance";
    const body = [
      ...summaryRows.map(r => [r.date, `"${r.branchName}"`, r.income, r.diesel, r.salary, r.crusherQty, r.outsideQty, r.totalCube, r.balance].join(",")),
      `Total ${dateLabel},,${incomeDateTotal},${dieselDateTotal},${salaryDateTotal},${crusherDateTotal},${outsideDateTotal},${totalCubeDateTotal},${balanceDateTotal}`
    ].join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `breaker-summary-${dateLabel}.csv`; a.click();
  };

  const exportAllCSV = () => {
    const head = "Date,Branch,Type,Detail,Amount";
    const body = allEntries.map(r => [r._date, `"${r._branchName}"`, r._type, `"${String(r._detail || "").replace(/"/g, "")}"`, r._amount].join(",")).join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `breaker-all-entries.csv`; a.click();
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
            <p className="mt-1 text-slate-400">Cards - Total (All Dates) • Summary - {dateLabel} • Diesel = Breaker Machine Only</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-black hover:bg-amber-400">Refresh</button>
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-black hover:bg-slate-200"><Download size={14} /> Export CSV</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0B1226] p-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <input type="date" value={date === "all" ? "" : date} onChange={e => setDate(e.target.value || "all")} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-amber-500/50" />
            <button onClick={() => setDate("all")} className={`rounded-xl px-3 py-2.5 font-bold ring-1 ${date === "all" ? "bg-amber-500 text-black ring-amber-500" : "bg-slate-950 text-slate-300 ring-white/10 hover:bg-slate-800"}`}>All Dates</button>
            {date !== "all" && <button onClick={() => setDate("all")} className="flex items-center gap-1 rounded-xl bg-slate-800 px-2 py-2 font-bold text-white ring-1 ring-white/10"><X size={13} /> Clear</button>}
          </div>
          <div className="flex items-center gap-2"><Building2 size={14} className="text-slate-400" />
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none">
              <option value="all">All Branches</option>
              {branchOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full rounded-xl bg-slate-950 py-2.5 pl-8 pr-3 ring-1 ring-white/10 focus:outline-none focus:ring-amber-500/50" /></div>
          {(date !== "all" || branchFilter !== "all") && <button onClick={resetTopFilter} className="rounded-xl bg-slate-800 px-3 py-2.5 font-bold text-white ring-1 ring-white/10">Clear Filter</button>}
        </div>

        {isLoading ? <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /> Loading...</div> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Breker Income • Total</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"><Wallet size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-emerald-400">{fmt(breakerIncomeTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{breakerIncomeAll.length} records • All Dates</p>
                <div className="mt-3 border-t border-white/[0.06] pt-3 space-y-1 text-[11px]">
                  <p className="flex justify-between text-slate-400"><span>Other - Breker (Total)</span><span className="font-black text-white">{fmt(breakerIncomeTotal)}</span></p>
                  <p className="flex justify-between text-slate-400"><span>Diesel - Breaker Only (Total)</span><span className="font-bold text-blue-400">- {fmt(dieselTotal)}</span></p>
                  <p className="flex justify-between text-slate-400"><span>Operator Salary (Total)</span><span className="font-bold text-violet-400">- {fmt(salaryTotal)}</span></p>
                </div>
                {/* ✅ NEW - Quantity inside Income Card */}
                <div className="mt-3 border-t border-white/[0.06] pt-3 space-y-1 text-[11px]">
                  <p className="flex justify-between text-slate-400"><span>Crusher Load</span><span className="font-bold text-cyan-300">{qtyFmt(crusherTotalAll)}</span></p>
                  <p className="flex justify-between text-slate-400"><span>Outside Load</span><span className="font-bold text-cyan-300">{qtyFmt(outsideTotalAll)}</span></p>
                  <p className="flex justify-between text-slate-400"><span>Total Cube</span><span className="font-black text-white">{qtyFmt(totalCubeAll)}</span></p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Breaker Diesel • Total</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"><Fuel size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-blue-400">{fmt(dieselTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{dieselQtyAll.toLocaleString()} L • {breakerDieselAll.length} records • All Dates • All Branches • Breaker Only</p>
                <p className="mt-2 text-[10px] text-blue-300/80">Breker Machine eke Diesel Cost witharak</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Operator Salary • Total</p><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400"><Users size={15} /></span></div>
                <p className="mt-3 text-2xl font-black text-violet-400">{fmt(salaryTotal)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{breakerSalaryAll.length} records • Breker operator • All Dates</p>
              </div>
              <div className={`rounded-2xl border p-5 ${balancePositive ? "border-emerald-500/30 bg-emerald-500/[0.07]" : "border-red-500/30 bg-red-500/[0.07]"}`}>
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Balance • Total</p><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${balancePositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}><Scale size={15} /></span></div>
                <p className={`mt-3 text-2xl font-black ${balancePositive ? "text-emerald-400" : "text-red-400"}`}>{fmt(balance)}</p>
                <p className="mt-1 text-[10px] text-slate-400">Total Used {fmt(totalUsed)} • All Dates</p>
              </div>
            </div>

        
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Crusher Load Quantity • Total</p>
                <p className="mt-3 text-2xl font-black text-cyan-300">{qtyFmt(crusherTotalAll)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Selected Filter • {dateLabel}</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Outside Load Quantity • Total</p>
                <p className="mt-3 text-2xl font-black text-cyan-300">{qtyFmt(outsideTotalAll)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Selected Filter • {dateLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Total Cube Quantity • Total</p>
                <p className="mt-3 text-2xl font-black text-white">{qtyFmt(totalCubeAll)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Crusher + Outside • {dateLabel}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
              <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase mb-3">Calculation • Total (All Dates)</p>
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <span className="rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-400 ring-1 ring-emerald-500/20">Income {fmt(breakerIncomeTotal)}</span><span className="text-slate-500">−</span>
                <span className="rounded-lg bg-slate-950 px-3 py-2 ring-1 ring-white/10">( Breaker Diesel {fmt(dieselTotal)} <span className="text-slate-500">+</span> Salary {fmt(salaryTotal)} )</span><span className="text-slate-500">=</span>
                <span className={`rounded-lg px-3 py-2 ring-1 ${balancePositive ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" : "bg-red-500/15 text-red-400 ring-red-500/30"}`}>Balance {fmt(balance)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-[#0B1226] p-5">
              <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Receipt size={14} className="text-emerald-400" /> Breaker Summary • {dateLabel}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Diesel column eka = E Date + E Branch eke BREKER MACHINE eke Diesel Cost witharak • Balance = Income - (Breaker Diesel + Operator Salary)</p>
              {summaryRows.length === 0 ? <p className="py-8 text-center text-slate-500">Me date / branch ekata Breker data na.</p> : (
                <div className="overflow-x-auto">
                <table className="mt-4 w-full text-left min-w-[1080px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500">
                      <th className="py-3">Date</th>
                      <th className="py-3">Branch</th>
                      <th className="py-3 text-right">Income</th>
                      <th className="py-3 text-right">Diesel (Breaker Only)</th>
                      <th className="py-3 text-right">Operator Salary</th>
                      {/* ✅ NEW - COLUMN 3KA */}
                      <th className="py-3 text-right text-cyan-300">Crusher Load Cube Quantity</th>
                      <th className="py-3 text-right text-cyan-300">Outside Load Cube Quantity</th>
                      <th className="py-3 text-right text-white">Total Cube Quantity</th>
                      <th className="py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map(r => (
                      <tr key={r.key} className="border-b border-white/[0.04]">
                        <td className="py-3 font-bold whitespace-nowrap">{r.date}</td>
                        <td className="py-3"><p className="font-bold flex items-center gap-2"><Building2 size={13} className="text-cyan-400" /> {r.branchName}</p><p className="text-[10px] text-slate-500">{r.incomeCount} income • {r.dieselCount} diesel (breaker) • {r.salaryCount} salary</p></td>
                        <td className="py-3 text-right font-black text-emerald-400">{fmt(r.income)}</td>
                        <td className="py-3 text-right font-bold text-blue-400">{fmt(r.diesel)}<p className="text-[10px] font-normal text-slate-500">{r.dieselQty.toLocaleString()} L</p></td>
                        <td className="py-3 text-right font-bold text-violet-400">{fmt(r.salary)}</td>
                        
                        <td className="py-3 text-right font-medium text-cyan-300">{qtyFmt(r.crusherQty)}</td>
                        <td className="py-3 text-right font-medium text-cyan-300">{qtyFmt(r.outsideQty)}</td>
                        <td className="py-3 text-right font-bold text-white">{qtyFmt(r.totalCube)}</td>
                        <td className={`py-3 text-right font-black ${r.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(r.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-black text-base">
                      <td className="py-4">Total • {dateLabel}</td>
                      <td className="py-4 text-slate-400">{summaryRows.length} Rows</td>
                      <td className="py-4 text-right text-emerald-400">{fmt(incomeDateTotal)}</td>
                      <td className="py-4 text-right text-blue-400">{fmt(dieselDateTotal)}</td>
                      <td className="py-4 text-right text-violet-400">{fmt(salaryDateTotal)}</td>
                      {/* ✅ NEW - FOOTER TOTALS */}
                      <td className="py-4 text-right text-cyan-300">{qtyFmt(crusherDateTotal)}</td>
                      <td className="py-4 text-right text-cyan-300">{qtyFmt(outsideDateTotal)}</td>
                      <td className="py-4 text-right text-white">{qtyFmt(totalCubeDateTotal)}</td>
                      <td className={`py-4 text-right ${balanceDatePositive ? "text-emerald-400" : "text-red-400"}`}>{fmt(balanceDateTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}