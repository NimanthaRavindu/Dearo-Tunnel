"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, Wallet, CreditCard, Building2, Loader2, Search, Download, Phone, Car, Receipt, TrendingDown, Scale } from "lucide-react";

const fmt = (n: number) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const numeric = (v: any) => Number(v ?? 0) || 0;

const fetchRaw = async (url: string): Promise<{ ok: boolean; status: number; json: any; data: any[] }> => {
  try {
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json().catch(() => null);
    let data: any[] = [];
    if (Array.isArray(j)) data = j;
    else if (j?.success && Array.isArray(j.data)) data = j.data;
    else if (Array.isArray(j?.data)) data = j.data;
    else if (Array.isArray(j?.branches)) data = j.branches;
    else if (Array.isArray(j?.expenses)) data = j.expenses;
    else if (Array.isArray(j?.records)) data = j.records;
    else if (Array.isArray(j?.rows)) data = j.rows;
    else if (Array.isArray(j?.summary)) data = j.summary;
    return { ok: r.ok, status: r.status, json: j, data };
  } catch (e: any) {
    return { ok: false, status: 0, json: { error: String(e?.message || e) }, data: [] };
  }
};

// ✅ Salary - branchId + branch_id dekama try karanawa
const EXPENSE_APIS = [
  { key: "salary", urls: (id: string) => [`/api/expences/salary?branchId=${id}`, `/api/expences/salary?branch_id=${id}`] },
  { key: "other", urls: (id: string) => [`/api/expences/other?branchId=${id}`, `/api/expences/other?branch_id=${id}`] },
  { key: "diesel", urls: (id: string) => [`/api/expences/diesel?branch_id=${id}`, `/api/expences/diesel?branchId=${id}`] },
  { key: "capital", urls: (id: string) => [`/api/expences/capital?branchId=${id}`, `/api/expences/capital?branch_id=${id}`] },
  { key: "salesExp", urls: (id: string) => [`/api/expences/sales?branch_id=${id}`, `/api/expences/sales-expenses?branch_id=${id}`, `/api/expences/sales-expences?branch_id=${id}`] },
] as const;
type ExpenseKey = typeof EXPENSE_APIS[number]["key"];

const getPayable = (r: any) => numeric(
  r.total_payable ?? r.totalPayable ??
  r.payable ?? r.payable_amount ??
  r.amount ?? r.total_amount ?? r.totalAmount ?? r.total ?? r.value ?? 0
);

const getExpDate = (r: any) => String(
  r.expense_date || r.date || r.expenseDate ||
  r.created_date || r.created_at || r.updated_at || ""
).slice(0, 10);

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
  const [debug, setDebug] = useState<any>({ salaryCount: 0, salarySample: null, ids: [], rawSalary: [] });

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const summaryUrl = date === "all"
        ? `/api/expences/sales-incomes?summary=true`
        : `/api/expences/sales-incomes?summary=true&date=${encodeURIComponent(date)}`;
      const s1 = await fetchRaw(summaryUrl);

      const datesFromAll = (s1.data || []).map((r: any) => String(r.date || "").slice(0, 10)).filter(Boolean);
      const uniqDates = Array.from(new Set(datesFromAll)).sort().reverse().slice(0, 15) as string[];
      setAllDates(uniqDates);

      const summary = s1.data || [];
      const normalizedSummary = summary.map((r: any) => {
        const paid = numeric(r.totalPaid ?? r.total_paid ?? r.paid ?? r.paid_amount ?? r.totalPaidAmount ?? 0);
        const credit = numeric(r.totalCredit ?? r.total_credit ?? r.credit ?? r.credit_amount ?? r.totalCreditAmount ?? 0);
        const hasPaidCredit = (r.totalPaid ?? r.total_paid ?? r.paid ?? r.paid_amount ?? r.totalCredit ?? r.total_credit ?? r.credit ?? r.credit_amount) !== undefined;
        const income = hasPaidCredit ? (paid + credit) : numeric(r.amount ?? r.totalAmount ?? r.total_amount);
        return {
          branchId: String(r.branchId ?? r.branch_id ?? ""),
          branchName: r.branchName || r.branch_name || `Branch ${r.branchId ?? r.branch_id}`,
          date: String(r.date || "").slice(0, 10),
          paid: hasPaidCredit ? paid : income,
          credit: hasPaidCredit ? credit : 0,
          income: income,
          amount: income,
          discount: numeric(r.totalDiscount ?? r.total_discount ?? r.discount),
          count: numeric(r.entriesCount ?? r.entries_count ?? 0),
        };
      });
      setSummaryRows(normalizedSummary);

      const bRes = await fetchRaw(`/api/branches`);
      let branchList = bRes.data.length > 0
        ? bRes.data.map((b: any) => ({ id: String(b.id ?? b.branch_id ?? b.branchId), branch_name: b.branch_name || b.name || `Branch ${b.id ?? b.branch_id}` }))
        : normalizedSummary.map((r: any) => ({ id: r.branchId, branch_name: r.branchName }));
      normalizedSummary.forEach((r: any) => {
        if (!branchList.find((b: any) => String(b.id) === String(r.branchId))) branchList.push({ id: r.branchId, branch_name: r.branchName });
      });
      setBranches(branchList);

      // ✅ FIX 1 - IDs: Branches + Summary dekama - ekak hari nathuwa yanawa nam anika gannawa
      const ids = Array.from(new Set([
        ...branchList.map((b: any) => String(b.id)),
        ...normalizedSummary.map((r: any) => String(r.branchId)),
      ])).filter(Boolean);
      const getName = (id: any) => branchList.find((x: any) => String(x.id) === String(id))?.branch_name || normalizedSummary.find((x: any) => String(x.branchId) === String(id))?.branchName || `Branch ${id}`;

      const creditResults = await Promise.allSettled(
        ids.map((id: any) =>
          fetchRaw(`/api/expences/sales-credits?branch_id=${encodeURIComponent(id)}`).then((res) =>
            (res.data || []).map((r: any) => ({ ...r, _branchId: id, _branchName: getName(id) }))
          )
        )
      );
      const allCredits: any[] = [];
      creditResults.forEach((res: any) => { if (res.status === "fulfilled") allCredits.push(...res.value); });
      setCredits(allCredits);

      const expenseResults = await Promise.allSettled(
        ids.flatMap((id: any) =>
          EXPENSE_APIS.map(async (api) => {
            for (const url of api.urls(encodeURIComponent(id))) {
              const res = await fetchRaw(url);
              if (res.ok && res.data.length > 0) {
                return (res.data || []).map((r: any) => ({ ...r, _branchId: String(id), _branchName: getName(id), _type: api.key as ExpenseKey }));
              }
            }
            return [];
          })
        )
      );
      const allExpenses: any[] = [];
      expenseResults.forEach((res: any) => { if (res.status === "fulfilled") allExpenses.push(...res.value); });

      // ✅ DEBUG - Salary data enawa da balanna
      const salaryOnly = allExpenses.filter((r: any) => r._type === "salary");
      setDebug({ salaryCount: salaryOnly.length, salarySample: salaryOnly[0] || null, ids, rawSalary: salaryOnly.slice(0, 3) });
      console.log("DEBUG IDS:", ids);
      console.log("DEBUG SALARY COUNT:", salaryOnly.length);
      console.log("DEBUG SALARY SAMPLE:", salaryOnly[0]);

      const expMap = new Map<string, any>();
      allExpenses.forEach((r: any) => {
        const d = getExpDate(r);
        if (!d) return;
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
      row.paid += numeric(r.paid);
      row.credit += numeric(r.credit);
      row.income += numeric(r.income);
      row.amount += numeric(r.amount);
      row.discount += r.discount; row.count += r.count;
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
  const totalSalary = useMemo(() => dayRows.reduce((t, r) => t + numeric(r.salary), 0), [dayRows]);
  const totalOther = useMemo(() => dayRows.reduce((t, r) => t + numeric(r.other), 0), [dayRows]);
  const totalDiesel = useMemo(() => dayRows.reduce((t, r) => t + numeric(r.diesel), 0), [dayRows]);
  const totalCapital = useMemo(() => dayRows.reduce((t, r) => t + numeric(r.capital), 0), [dayRows]);
  const totalSalesExp = useMemo(() => dayRows.reduce((t, r) => t + numeric(r.salesExp), 0), [dayRows]);
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

        {/* ✅ DEBUG BOX - meka balala kiyanna - passe ain karannam */}
        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-[11px]">
          <p className="font-black text-yellow-300">DEBUG - Salary</p>
          <p>IDs used: {JSON.stringify(debug.ids)}</p>
          <p>Salary records fetched: {debug.salaryCount}</p>
          <p>Salary sample: {JSON.stringify(debug.salarySample)}</p>
          <p className="text-slate-400">Salary count 0 nam - Salary API eken data enne na. Sample eke expense_date / total_payable balanna.</p>
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