"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, Wallet, CreditCard, Building2, Loader2, Search, Download, Phone, Car, Receipt, TrendingDown, Scale } from "lucide-react";

const fmt = (n: number) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const numeric = (v: any) => Number(v ?? 0) || 0;

// ✅ Salary page eke EXACT parse eka ma
const parseLikeSalaryPage = (result: any): any[] => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.expenses)) return result.expenses;
  if (Array.isArray(result?.records)) return result.records;
  return [];
};

const fetchOne = async (url: string): Promise<any[]> => {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [];
    const j = await r.json().catch(() => null);
    return parseLikeSalaryPage(j);
  } catch { return []; }
};

const EXPENSE_DEFS = [
  { key: "salary", path: "salary" },
  { key: "other", path: "other" },
  { key: "diesel", path: "diesel" },
  { key: "capital", path: "capital" },
  { key: "salesExp", path: "sales" },
] as const;
type ExpenseKey = typeof EXPENSE_DEFS[number]["key"];

// ✅ Salary page eke fields - total_payable / expense_date
const getPayable = (r: any) => numeric(
  r.total_payable ?? r.totalPayable ?? r.payable ?? r.payable_amount ?? r.payableAmount ??
  r.amount ?? r.total_amount ?? r.totalAmount ?? r.total ?? r.value ??
  r.salary_amount ?? r.salaryAmount ?? r.net_salary ?? r.other_amount ?? r.diesel_amount ?? r.expense_amount ?? r.cost ?? r.price ?? 0
);

const getExpDate = (r: any) => String(
  r.expense_date || r.date || r.expenseDate || r.created_date || r.created_at || r.updated_at || ""
).slice(0, 10);

const getRecordBranchId = (r: any, fallback: string) => String(r.branchId ?? r.branch_id ?? r.branch ?? r.branchID ?? fallback ?? "");

export default function DaySummaryPage() {
  const [date, setDate] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [summaryRows, setSummaryRows] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showCreditors, setShowCreditors] = useState(true);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [expenseRows, setExpenseRows] = useState<any[]>([]);
  const [allExpensesRaw, setAllExpensesRaw] = useState<any[]>([]);
  const [debug, setDebug] = useState<any>({ salaryCount: 0, otherCount: 0, dieselCount: 0, capitalCount: 0, salesExpCount: 0, salarySample: null, otherSample: null, ids: [] });

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      // ---------- 1. Summary ----------
      const summaryUrl = date === "all" ? `/api/expences/sales-incomes?summary=true` : `/api/expences/sales-incomes?summary=true&date=${encodeURIComponent(date)}`;
      const summaryData = await fetchOne(summaryUrl);
      const datesFromAll = summaryData.map((r: any) => String(r.date || "").slice(0, 10)).filter(Boolean);
      const uniqDates = Array.from(new Set(datesFromAll)).sort().reverse().slice(0, 15) as string[];
      setAllDates(uniqDates);

      const normalizedSummary = summaryData.map((r: any) => {
        const paid = numeric(r.totalPaid ?? r.total_paid ?? r.paid ?? r.paid_amount ?? 0);
        const credit = numeric(r.totalCredit ?? r.total_credit ?? r.credit ?? r.credit_amount ?? 0);
        const hasPaidCredit = (r.totalPaid ?? r.total_paid ?? r.paid ?? r.paid_amount ?? r.totalCredit ?? r.total_credit ?? r.credit ?? r.credit_amount) !== undefined;
        const income = hasPaidCredit ? (paid + credit) : numeric(r.amount ?? r.totalAmount ?? r.total_amount);
        return {
          branchId: String(r.branchId ?? r.branch_id ?? ""),
          branchName: r.branchName || r.branch_name || `Branch ${r.branchId ?? r.branch_id}`,
          date: String(r.date || "").slice(0, 10),
          paid: hasPaidCredit ? paid : income,
          credit: hasPaidCredit ? credit : 0,
          income, amount: income,
          discount: numeric(r.totalDiscount ?? r.total_discount ?? r.discount),
          count: numeric(r.entriesCount ?? r.entries_count ?? 0),
        };
      });
      setSummaryRows(normalizedSummary);

      // ---------- 2. Branches - 1 request witharai ----------
      let branchList: any[] = [];
      const bData = await fetchOne(`/api/branch`);
      if (bData.length > 0) branchList = bData.map((b: any) => ({ id: String(b.id ?? b.branch_id ?? b.branchId), branch_name: b.branchName || b.bName || b.branch_name || b.name || `Branch ${b.id ?? b.branch_id}` }));
      else branchList = normalizedSummary.map((r: any) => ({ id: r.branchId, branch_name: r.branchName }));
      branchList = Array.from(new Map(branchList.map((b: any) => [String(b.id), b])).values());
      normalizedSummary.forEach((r: any) => {
        if (!branchList.find((b: any) => String(b.id) === String(r.branchId))) branchList.push({ id: r.branchId, branch_name: r.branchName });
      });
      if (!branchList.find((b: any) => String(b.id) === "1")) branchList.push({ id: "1", branch_name: "Branch 1" });
      setBranches(branchList);

      const ids = Array.from(new Set([...branchList.map((b: any) => String(b.id)), ...normalizedSummary.map((r: any) => String(r.branchId))])).filter(Boolean);
      const getName = (id: any) => branchList.find((x: any) => String(x.id) === String(id))?.branch_name || normalizedSummary.find((x: any) => String(x.branchId) === String(id))?.branchName || `Branch ${id}`;

      // ---------- 3. Credits - SEQUENTIAL, ekapara 1i ----------
      let allCredits: any[] = [];
      const creditsNoBranch = await fetchOne(`/api/expences/sales-credits`);
      if (creditsNoBranch.length > 0) {
        allCredits = creditsNoBranch.map((r: any) => ({ ...r, _branchId: getRecordBranchId(r, ids[0] ?? "1"), _branchName: getName(getRecordBranchId(r, ids[0] ?? "1")) }));
      } else {
        for (const id of ids) {
          const rows = await fetchOne(`/api/expences/sales-credits?branch_id=${encodeURIComponent(id)}`);
          rows.forEach((r: any) => allCredits.push({ ...r, _branchId: id, _branchName: getName(id) }));
        }
      }
      setCredits(allCredits);

      // ---------- 4. ✅ FIX ADDED - Expenses TYPE ekakata gane ----------
      // Kalin waradda: allExpenses.length === 0 nam witharak fallback - Capital awoth Salary skip wenawa
      // Dan: Type ekak 0 nam e Type eka witharak per-branch fetch wenawa
      // branchId nathuwa -> branchId walin -> branch_id walin - SEQUENTIAL, ekapara 1 request i
      let allExpenses: any[] = [];
      for (const api of EXPENSE_DEFS) {
        // Step 1: branchId nathuwa try karanawa
        const rowsNoBranch = await fetchOne(`/api/expences/${api.path}`);

        if (rowsNoBranch.length > 0) {
          rowsNoBranch.forEach((r: any) => {
            const realBid = getRecordBranchId(r, ids[0] ?? "1");
            allExpenses.push({ ...r, _branchId: realBid, _branchName: getName(realBid), _type: api.key as ExpenseKey });
          });
        } else {
          // Step 2: E Type eka 0 nam - e Type eka witharak per-branch SEQUENTIAL
          for (const id of ids) {
            let branchRows = await fetchOne(`/api/expences/${api.path}?branchId=${encodeURIComponent(id)}`);
            // branchId walin 0 nam branch_id walinuth try karanawa (Diesel wage API walata)
            if (branchRows.length === 0) {
              branchRows = await fetchOne(`/api/expences/${api.path}?branch_id=${encodeURIComponent(id)}`);
            }
            branchRows.forEach((r: any) => {
              const realBid = getRecordBranchId(r, String(id));
              allExpenses.push({ ...r, _branchId: realBid, _branchName: getName(realBid), _type: api.key as ExpenseKey });
            });
          }
        }
      }

      // Duplicate ain karanawa
      const seen = new Set<string>();
      allExpenses = allExpenses.filter((r: any) => {
        const k = `${r._type}|${r.id ?? ""}|${r._branchId}|${getPayable(r)}|${getExpDate(r)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      setAllExpensesRaw(allExpenses);
      const salaryOnly = allExpenses.filter((r: any) => r._type === "salary");
      const otherOnly = allExpenses.filter((r: any) => r._type === "other");
      const dieselOnly = allExpenses.filter((r: any) => r._type === "diesel");
      const capitalOnly = allExpenses.filter((r: any) => r._type === "capital");
      const salesExpOnly = allExpenses.filter((r: any) => r._type === "sales");
      setDebug({ salaryCount: salaryOnly.length, otherCount: otherOnly.length, dieselCount: dieselOnly.length, capitalCount: capitalOnly.length, salesExpCount: salesExpOnly.length, salarySample: salaryOnly[0] || null, otherSample: otherOnly[0] || null, ids });
      console.log("DEBUG IDS:", ids, "SALARY:", salaryOnly.length, salaryOnly[0], "OTHER:", otherOnly.length, otherOnly[0], "CAPITAL:", capitalOnly.length, capitalOnly[0]);

      // ---------- 5. Expense rows - date nathnam ain karanne na ----------
      const expMap = new Map<string, any>();
      const latestDateForBranch = new Map<string, string>();
      normalizedSummary.forEach((r: any) => {
        const cur = latestDateForBranch.get(String(r.branchId));
        if (!cur || String(r.date) > cur) latestDateForBranch.set(String(r.branchId), String(r.date));
      });
      allExpenses.forEach((r: any) => {
        let d = getExpDate(r);
        if (!d) d = date !== "all" ? date : (latestDateForBranch.get(String(r._branchId)) || uniqDates[0] || "");
        if (!d) return;
        if (date !== "all" && d !== date) return;
        const key = `${d}|${String(r._branchId)}`;
        if (!expMap.has(key)) expMap.set(key, { key, date: d, branchId: String(r._branchId), branchName: r._branchName, salary: 0, other: 0, diesel: 0, capital: 0, salesExp: 0 });
        const row = expMap.get(key);
        const val = getPayable(r);
        if (r._type === "salary") row.salary += val;
        else if (r._type === "other") row.other += val;
        else if (r._type === "diesel") row.diesel += val;
        else if (r._type === "capital") row.capital += val;
        else if (r._type === "salesExp") row.salesExp += val;
      });
      setExpenseRows(Array.from(expMap.values()));
    } finally { setIsLoading(false); }
  }, [date]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getBranchName = (r: any) => r._branchName || r.branch_name || "-";
  const getBranchKey = (r: any) => String(r._branchId || r.branch_id || r.branchId || "");
  const getCreditDateStr = (r: any) => String(r.created_date || r.date || r.created_at || "").slice(0, 10);
  const isBranch = (r: any) => branchFilter === "all" || getBranchKey(r) === branchFilter;
  const branchOptions = useMemo(() => branches.map((b: any) => ({ id: String(b.id), name: b.branch_name })), [branches]);

  const creditorRows = useMemo(() => {
    let list = credits.filter(r => {
      if (date !== "all" && getCreditDateStr(r) !== date) return false;
      if (!isBranch(r)) return false;
      if (numeric(r.credit_amount) <= 0) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!String(r.customer_name || "").toLowerCase().includes(s) && !String(r.bill_number || "").toLowerCase().includes(s) && !String(r.vehicle_number || "").toLowerCase().includes(s) && !getBranchName(r).toLowerCase().includes(s)) return false;
      }
      return true;
    });
    return list.sort((a, b) => numeric(b.credit_amount) - numeric(a.credit_amount));
  }, [credits, date, branchFilter, search]);

  const dayRows = useMemo(() => {
    const map = new Map<string, any>();
    summaryRows.forEach(r => {
      if (branchFilter !== "all" && String(r.branchId) !== branchFilter) return;
      const key = `${r.date}|${r.branchId}`;
      if (!map.has(key)) map.set(key, { key, branchId: String(r.branchId), branchName: r.branchName, date: r.date, paid: 0, income: 0, amount: 0, discount: 0, credit: 0, count: 0, salary: 0, other: 0, diesel: 0, capital: 0, salesExp: 0 });
      const row = map.get(key);
      row.paid += numeric(r.paid); row.credit += numeric(r.credit); row.income += numeric(r.income); row.amount += numeric(r.amount); row.discount += r.discount; row.count += r.count;
    });
    expenseRows.forEach(r => {
      if (branchFilter !== "all" && String(r.branchId) !== branchFilter) return;
      if (date !== "all" && r.date !== date) return;
      const key = `${r.date}|${r.branchId}`;
      if (!map.has(key)) map.set(key, { key, branchId: String(r.branchId), branchName: r.branchName, date: r.date, paid: 0, income: 0, amount: 0, discount: 0, credit: 0, count: 0, salary: 0, other: 0, diesel: 0, capital: 0, salesExp: 0 });
      const row = map.get(key);
      row.salary += numeric(r.salary); row.other += numeric(r.other); row.diesel += numeric(r.diesel); row.capital += numeric(r.capital); row.salesExp += numeric(r.salesExp);
    });
    creditorRows.forEach(r => {
      const k = getBranchKey(r);
      if (branchFilter !== "all" && k !== branchFilter) return;
      const d = getCreditDateStr(r);
      const key = `${d}|${k}`;
      if (!map.has(key)) map.set(key, { key, branchId: k, branchName: getBranchName(r), date: d, paid: 0, income: 0, amount: 0, discount: 0, credit: 0, count: 0, salary: 0, other: 0, diesel: 0, capital: 0, salesExp: 0 });
    });
    return Array.from(map.values()).map(r => {
      const totalIncome = numeric(r.paid) + numeric(r.credit);
      const totalExpenses = numeric(r.salary) + numeric(r.other) + numeric(r.diesel) + numeric(r.capital) + numeric(r.salesExp);
      return { ...r, totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses };
    }).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [summaryRows, creditorRows, branchFilter, expenseRows, date]);

  const totalPaid = useMemo(() => dayRows.reduce((t, r) => t + numeric(r.paid), 0), [dayRows]);
  const totalCredit = useMemo(() => dayRows.reduce((t, r) => t + numeric(r.credit), 0), [dayRows]);
  const totalIncome = useMemo(() => totalPaid + totalCredit, [totalPaid, totalCredit]);
  const totalDiscount = useMemo(() => dayRows.reduce((t, r) => t + r.discount, 0), [dayRows]);
  const totalCreditFromCreditors = useMemo(() => creditorRows.reduce((t, r) => t + numeric(r.credit_amount), 0), [creditorRows]);
  const totalBills = useMemo(() => dayRows.reduce((t, r) => t + r.count, 0), [dayRows]);

  // ✅ FIX - Totals DIRECT allExpenses walin - date grouping waradi unath Total hari
  const filteredExpensesForTotal = useMemo(() => allExpensesRaw.filter((r: any) => {
    if (branchFilter !== "all" && String(r._branchId) !== branchFilter) return false;
    if (date !== "all") {
      const d = getExpDate(r);
      if (d && d !== date) return false;
    }
    return true;
  }), [allExpensesRaw, branchFilter, date]);
  const totalSalary = useMemo(() => filteredExpensesForTotal.filter((r: any) => r._type === "salary").reduce((t, r) => t + getPayable(r), 0), [filteredExpensesForTotal]);
  const totalOther = useMemo(() => filteredExpensesForTotal.filter((r: any) => r._type === "other").reduce((t, r) => t + getPayable(r), 0), [filteredExpensesForTotal]);
  const totalDiesel = useMemo(() => filteredExpensesForTotal.filter((r: any) => r._type === "diesel").reduce((t, r) => t + getPayable(r), 0), [filteredExpensesForTotal]);
  const totalCapital = useMemo(() => filteredExpensesForTotal.filter((r: any) => r._type === "capital").reduce((t, r) => t + getPayable(r), 0), [filteredExpensesForTotal]);
  const totalSalesExp = useMemo(() => filteredExpensesForTotal.filter((r: any) => r._type === "salesExp").reduce((t, r) => t + getPayable(r), 0), [filteredExpensesForTotal]);
  const totalExpenses = useMemo(() => totalSalary + totalOther + totalDiesel + totalCapital + totalSalesExp, [totalSalary, totalOther, totalDiesel, totalCapital, totalSalesExp]);
  const netBalance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const exportCSV = () => {
    const head = "Date,Branch,Total Paid,Discount,Total Credit,Total Income,Total Salary,Total Other,Total Diesel,Total Capital,Total Sales Exp,Total Expenses,Net Balance";
    const body = [...dayRows.map(r => [r.date, `"${r.branchName}"`, r.paid, r.discount, r.credit, r.totalIncome, r.salary, r.other, r.diesel, r.capital, r.salesExp, r.totalExpenses, r.netBalance].join(",")), `Total,,${totalPaid},${totalDiscount},${totalCredit},${totalIncome},${totalSalary},${totalOther},${totalDiesel},${totalCapital},${totalSalesExp},${totalExpenses},${netBalance}`].join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `day-summary-${date}.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-[#060913] p-6 sm:p-10 font-sans text-xs text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-wider uppercase">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"><Receipt size={18} /></span>
              Day Summary
            </h1>
            <p className="mt-1 text-slate-400">Total Income = Total Paid + Total Credit • Net Balance = Total Income - Total Expenses • Payable / Amount walin</p>
            {allDates.length > 0 && <p className="mt-2 text-[11px] text-slate-300">DB eke data thiyena dates: {allDates.map(d => <button key={d} onClick={() => setDate(d)} className="mx-1 px-2 py-1 bg-slate-800 rounded-lg text-white font-bold hover:bg-emerald-600">{d}</button>)}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-black hover:bg-amber-400">Refresh</button>
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-black hover:bg-slate-200"><Download size={14} /> Export CSV</button>
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-[11px] break-all">
          <p className="font-black text-yellow-300">DEBUG</p>
          <p>IDs used: {JSON.stringify(debug.ids)}</p>
          <p>Salary: {debug.salaryCount} | Other: {debug.otherCount} | Diesel: {debug.dieselCount} | Capital: {debug.capitalCount} | SalesExp: {debug.salesExpCount}</p>
          <p>Salary sample: {JSON.stringify(debug.salarySample)}</p>
          <p>Other sample: {JSON.stringify(debug.otherSample)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0B1226] p-4">
          <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" />
            <select value={date} onChange={e => setDate(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none">
              <option value="all">All Dates</option>
              {allDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="date" value={date === "all" ? "" : date} onChange={e => setDate(e.target.value || "all")} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50" />
          </div>
          <div className="flex items-center gap-2"><Building2 size={14} className="text-slate-400" />
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none">
              <option value="all">All Branches</option>
              {branchOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creditor / bill / vehicle..." className="w-full rounded-xl bg-slate-950 py-2.5 pl-8 pr-3 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50" /></div>
        </div>

        {isLoading ? <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /> Loading...</div> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2"><Wallet size={13} /> Total Paid • {date === "all" ? "All Dates" : date}</p>
                <p className="mt-3 text-2xl font-black text-emerald-400">{fmt(totalPaid)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Sales Incomes Total Paid wala ekathuwa • {totalBills} bills • Discount {fmt(totalDiscount)}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2"><CreditCard size={13} /> Total Credit • {date === "all" ? "All Dates" : date}</p>
                <p className="mt-3 text-2xl font-black text-amber-400">{fmt(totalCredit)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Sales Incomes Total Credit wala ekathuwa • {creditorRows.length} creditors</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Total Income • Paid + Credit</p>
                <p className="mt-3 text-2xl font-black text-white">{fmt(totalIncome)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Total Paid {fmt(totalPaid)} + Total Credit {fmt(totalCredit)}</p>
              </div>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2"><TrendingDown size={13} /> Total Expenses • {date === "all" ? "All Dates" : date}</p>
                <p className="mt-3 text-2xl font-black text-red-400">{fmt(totalExpenses)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Salary {fmt(totalSalary)} • Other {fmt(totalOther)} • Diesel {fmt(totalDiesel)} • Capital {fmt(totalCapital)} • Sales Exp {fmt(totalSalesExp)}</p>
              </div>
              <div className={`rounded-2xl border p-5 ${netBalance >= 0 ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-red-500/30 bg-red-500/[0.08]"}`}>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2"><Scale size={13} /> Net Balance • {date === "all" ? "All Dates" : date}</p>
                <p className={`mt-3 text-2xl font-black ${netBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(netBalance)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Total Income {fmt(totalIncome)} - Total Expenses {fmt(totalExpenses)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-[#0B1226] p-5">
              <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Receipt size={14} className="text-emerald-400" /> Summary • {date === "all" ? "All Dates - Okkoma Data" : date}</h3>
              {dayRows.length === 0 ? <p className="py-8 text-center text-slate-500">Data na.</p> : (
                <div className="overflow-x-auto">
                  <table className="mt-4 w-full text-left min-w-[1400px]">
                    <thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-3">Date</th><th className="py-3">Branch</th><th className="py-3 text-right">Total Paid</th><th className="py-3 text-right">Discount</th><th className="py-3 text-right">Total Credit</th><th className="py-3 text-right">Total Income</th><th className="py-3 text-right">Total Salary</th><th className="py-3 text-right">Total Other</th><th className="py-3 text-right">Total Diesel</th><th className="py-3 text-right">Total Capital</th><th className="py-3 text-right">Total Sales Exp</th><th className="py-3 text-right">Total Expenses</th><th className="py-3 text-right">Net Balance</th></tr></thead>
                    <tbody>{dayRows.map(r => (<tr key={r.key} className="border-b border-white/[0.04]"><td className="py-3 font-bold">{r.date}</td><td className="py-3"><p className="font-bold flex items-center gap-2"><Building2 size={13} className="text-cyan-400" /> {r.branchName}</p><p className="text-[10px] text-slate-500">{r.count} bills</p></td><td className="py-3 text-right font-black text-emerald-400">{fmt(r.paid)}</td><td className="py-3 text-right text-amber-400">{fmt(r.discount)}</td><td className="py-3 text-right font-black text-amber-400">{fmt(r.credit)}</td><td className="py-3 text-right font-black text-white">{fmt(r.totalIncome)}</td><td className="py-3 text-right">{fmt(r.salary)}</td><td className="py-3 text-right">{fmt(r.other)}</td><td className="py-3 text-right">{fmt(r.diesel)}</td><td className="py-3 text-right">{fmt(r.capital)}</td><td className="py-3 text-right">{fmt(r.salesExp)}</td><td className="py-3 text-right font-black text-red-400">{fmt(r.totalExpenses)}</td><td className={`py-3 text-right font-black ${r.netBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(r.netBalance)}</td></tr>))}</tbody>
                    <tfoot><tr className="font-black text-base"><td className="py-4">Total</td><td className="py-4 text-slate-400">{dayRows.length} Rows</td><td className="py-4 text-right text-emerald-400">{fmt(totalPaid)}</td><td className="py-4 text-right text-amber-400">{fmt(totalDiscount)}</td><td className="py-4 text-right text-amber-400">{fmt(totalCredit)}</td><td className="py-4 text-right text-white">{fmt(totalIncome)}</td><td className="py-4 text-right">{fmt(totalSalary)}</td><td className="py-4 text-right">{fmt(totalOther)}</td><td className="py-4 text-right">{fmt(totalDiesel)}</td><td className="py-4 text-right">{fmt(totalCapital)}</td><td className="py-4 text-right">{fmt(totalSalesExp)}</td><td className="py-4 text-right text-red-400">{fmt(totalExpenses)}</td><td className={`py-4 text-right ${netBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(netBalance)}</td></tr></tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-[#0B1226] p-5">
              <div className="flex items-center justify-between">
                <div><h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><CreditCard size={14} className="text-amber-400" /> Creditors • {date === "all" ? "All Dates" : date} • {creditorRows.length} Customers</h3><p className="text-[10px] text-slate-500 mt-1">Credit karapu okkoma customer la - Total {fmt(totalCreditFromCreditors)}</p></div>
                <button onClick={() => setShowCreditors(!showCreditors)} className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-bold">{showCreditors ? "Hide" : "Show"}</button>
              </div>
              {showCreditors && (creditorRows.length === 0 ? <p className="py-8 text-center text-slate-500">Creditors la na.</p> : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left min-w-[720px]">
                    <thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-3">Creditor (Customer)</th><th className="py-3">Branch</th><th className="py-3">Bill No</th><th className="py-3">Product</th><th className="py-3">Promise Date</th><th className="py-3">Credit Amount</th><th className="py-3 text-right">Total</th></tr></thead>
                    <tbody>{creditorRows.map(r => (<tr key={r.id} className="border-b border-white/[0.04]"><td className="py-3"><p className="font-bold flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">{String(r.customer_name || "?").charAt(0).toUpperCase()}</span>{r.customer_name}</p><p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><Phone size={10} /> {r.contact_number || "-"} • <Car size={10} /> {r.vehicle_number || "-"}</p></td><td className="py-3 font-bold">{getBranchName(r)}</td><td className="py-3 font-bold">{r.bill_number || "-"}</td><td className="py-3">{r.product_name || "-"}</td><td className="py-3">{String(r.promise_date || "").slice(0, 10) || "-"}</td><td className="py-3 text-right font-black text-amber-400">{fmt(numeric(r.credit_amount))}</td><td className="py-3 text-right">{fmt(numeric(r.total_amount))}</td></tr>))}</tbody>
                    <tfoot><tr className="font-black"><td colSpan={5} className="py-3 text-right">Total Credit ({creditorRows.length})</td><td className="py-3 text-right text-amber-400">{fmt(totalCreditFromCreditors)}</td><td /></tr></tfoot>
                  </table>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}