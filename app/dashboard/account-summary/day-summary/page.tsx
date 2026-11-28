"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, CreditCard, Building2, Loader2, Search, Download, Phone, Car, Receipt, Plus, Equal, ArrowLeft, User } from "lucide-react";

const fmt = (n: number) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const numeric = (v: any) => Number(v ?? 0) || 0;

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

const getPayable = (r: any) => numeric(
  r.total_payable ?? r.totalPayable ?? r.payable ?? r.payable_amount ?? r.payableAmount ??
  r.amount ?? r.total_amount ?? r.totalAmount ?? r.total ?? r.value ??
  r.salary_amount ?? r.salaryAmount ?? r.net_salary ?? r.other_amount ?? r.diesel_amount ?? r.expense_amount ?? r.cost ?? r.price ?? 0
);

const getExpDate = (r: any) => String(
  r.expense_date || r.date || r.expenseDate || r.created_date || r.created_at || r.updated_at || ""
).slice(0, 10);

const getRecordBranchId = (r: any) => String(r.branchId ?? r.branch_id ?? r.branch ?? r.branchID ?? "");

export default function DaySummaryPage() {
  const [date, setDate] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [summaryRows, setSummaryRows] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showCreditors, setShowCreditors] = useState(true);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(true);
  const [showSalesIncomes, setShowSalesIncomes] = useState(true);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [expenseRows, setExpenseRows] = useState<any[]>([]);
  const [allExpensesRaw, setAllExpensesRaw] = useState<any[]>([]);
  const [detailedIncomes, setDetailedIncomes] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const bData = await fetchOne(`/api/branch`);
      let branchList: any[] = bData.length > 0
        ? bData.map((b: any) => ({ id: String(b.id ?? b.branch_id ?? b.branchId), branch_name: b.branchName || b.bName || b.branch_name || b.name || `Branch ${b.id ?? b.branch_id}` }))
        : [];
      branchList = Array.from(new Map(branchList.map((b: any) => [String(b.id), b])).values());
      const idsFromBranch = branchList.map((b: any) => String(b.id)).filter(Boolean);
      const getName = (id: any, fallbackName?: string) => branchList.find((x: any) => String(x.id) === String(id))?.branch_name || fallbackName || `Branch ${id}`;

      const summaryPromises = idsFromBranch.length > 0
        ? idsFromBranch.map(async (bid) => {
            const url = date === "all"
              ? `/api/expences/sales-incomes?summary=true&branch_id=${encodeURIComponent(bid)}`
              : `/api/expences/sales-incomes?summary=true&date=${encodeURIComponent(date)}&branch_id=${encodeURIComponent(bid)}`;
            const rows = await fetchOne(url);
            return rows.filter((r: any) => {
              const rb = getRecordBranchId(r);
              return !rb || rb === String(bid);
            }).map((r: any) => ({ ...r, _forcedBranchId: bid }));
          })
        : [fetchOne(date === "all" ? `/api/expences/sales-incomes?summary=true` : `/api/expences/sales-incomes?summary=true&date=${encodeURIComponent(date)}`)];

      const summaryChunks = await Promise.all(summaryPromises);
      const summaryData = summaryChunks.flat();

      const normalizedSummary = summaryData.map((r: any) => {
        const paid = numeric(r.totalPaid ?? r.total_paid ?? r.paid ?? r.paid_amount ?? 0);
        const bid = String(r._forcedBranchId || getRecordBranchId(r) || r.branchId || r.branch_id || "");
        return {
          branchId: bid,
          branchName: getName(bid, r.branchName || r.branch_name),
          date: String(r.date || "").slice(0, 10),
          paid,
          credit: 0,
          income: paid,
          amount: paid,
          discount: numeric(r.totalDiscount ?? r.total_discount ?? r.discount),
          count: numeric(r.entriesCount ?? r.entries_count ?? 0),
        };
      }).filter((r: any) => r.branchId && r.date);
      setSummaryRows(normalizedSummary);

      normalizedSummary.forEach((r: any) => {
        if (!branchList.find((b: any) => String(b.id) === String(r.branchId))) branchList.push({ id: r.branchId, branch_name: r.branchName });
      });
      setBranches(branchList);

      const ids = Array.from(new Set([...branchList.map((b: any) => String(b.id)), ...normalizedSummary.map((r: any) => String(r.branchId))])).filter(Boolean);
      const getName2 = (id: any) => branchList.find((x: any) => String(x.id) === String(id))?.branch_name || normalizedSummary.find((x: any) => String(x.branchId) === String(id))?.branchName || `Branch ${id}`;

      // ✅ ALUTH: Sales Incomes detailed - Sales Incomes page eke table eka penvanna
      const detailChunks = await Promise.all(ids.map(async (id) => {
        const rows = await fetchOne(`/api/expences/sales-incomes?branch_id=${encodeURIComponent(id)}`);
        return rows.map((r: any) => ({ ...r, _branchId: getRecordBranchId(r) || String(id), _branchName: getName2(getRecordBranchId(r) || String(id)) }));
      }));
      setDetailedIncomes(detailChunks.flat());

      const creditChunks = await Promise.all(ids.map(async (id) => {
        const rows = await fetchOne(`/api/expences/sales-credits?branch_id=${encodeURIComponent(id)}`);
        return rows.map((r: any) => {
          const rb = getRecordBranchId(r) || String(id);
          return { ...r, _branchId: rb, _branchName: getName2(rb) };
        });
      }));
      const creditSeen = new Set<string>();
      const allCredits: any[] = [];
      creditChunks.flat().forEach((r: any) => {
        const k = `${r.id ?? ""}|${r._branchId}|${r.bill_number ?? ""}|${r.credit_amount ?? ""}|${r.customer_name ?? ""}`;
        if (creditSeen.has(k)) return; creditSeen.add(k); allCredits.push(r);
      });
      setCredits(allCredits);

      const expensePromises: Promise<any[]>[] = [];
      for (const api of EXPENSE_DEFS) {
        for (const id of ids) {
          expensePromises.push((async () => {
            let rows: any[] = [];
            if (api.key === "salesExp") {
              rows = await fetchOne(`/api/expenses/sales?branchId=${encodeURIComponent(id)}`);
            } else {
              rows = await fetchOne(`/api/expences/${api.path}?branch_id=${encodeURIComponent(id)}`);
              if (rows.length === 0) rows = await fetchOne(`/api/expences/${api.path}?branchId=${encodeURIComponent(id)}`);
            }
            return rows.filter((r: any) => {
              const rb = getRecordBranchId(r);
              return !rb || rb === String(id);
            }).map((r: any) => ({
              ...r,
              _branchId: String(id),
              _branchName: getName2(String(id)),
              _type: api.key as ExpenseKey,
            }));
          })());
        }
      }
      const expenseChunks = await Promise.all(expensePromises);
      let allExpenses = expenseChunks.flat();
      const seen = new Set<string>();
      allExpenses = allExpenses.filter((r: any) => {
        const k = `${r._type}|${r.id ?? ""}|${r._branchId}|${getPayable(r)}|${getExpDate(r)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      setAllExpensesRaw(allExpenses);

      const datesFromAll = [
        ...summaryData.map((r: any) => String(r.date || "").slice(0, 10)),
        ...allCredits.map((r: any) => String(r.created_date || r.date || r.created_at || "").slice(0, 10)),
        ...allExpenses.map((r: any) => getExpDate(r)),
      ].filter(Boolean);
      const uniqDates = Array.from(new Set(datesFromAll)).sort().reverse().slice(0, 30) as string[];
      setAllDates(uniqDates);

      const expMap = new Map<string, any>();
      allExpenses.forEach((r: any) => {
        const d = getExpDate(r);
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

  const filteredCredits = useMemo(() => {
    return credits.filter(r => {
      if (date !== "all" && getCreditDateStr(r) !== date) return false;
      if (!isBranch(r)) return false;
      if (numeric(r.credit_amount) <= 0) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!String(r.customer_name || "").toLowerCase().includes(s) && !String(r.bill_number || "").toLowerCase().includes(s) && !String(r.vehicle_number || "").toLowerCase().includes(s) && !getBranchName(r).toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [credits, date, branchFilter, search]);

  const creditorRows = useMemo(() => {
    return [...filteredCredits].sort((a, b) => numeric(b.credit_amount) - numeric(a.credit_amount));
  }, [filteredCredits]);

  const creditByDateBranch = useMemo(() => {
    const map = new Map<string, number>();
    filteredCredits.forEach((r: any) => {
      const bid = getBranchKey(r);
      const d = getCreditDateStr(r);
      if (!d) return;
      const key = `${d}|${bid}`;
      map.set(key, (map.get(key) || 0) + numeric(r.credit_amount));
    });
    return map;
  }, [filteredCredits]);

  const creditCountByDateBranch = useMemo(() => {
    const map = new Map<string, number>();
    filteredCredits.forEach((r: any) => {
      const bid = getBranchKey(r);
      const d = getCreditDateStr(r);
      if (!d) return;
      const key = `${d}|${bid}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [filteredCredits]);

  const dayRows = useMemo(() => {
    const map = new Map<string, any>();
    summaryRows.forEach(r => {
      if (branchFilter !== "all" && String(r.branchId) !== branchFilter) return;
      const key = `${r.date}|${r.branchId}`;
      if (!map.has(key)) map.set(key, { key, branchId: String(r.branchId), branchName: r.branchName, date: r.date, paid: 0, income: 0, amount: 0, discount: 0, credit: 0, count: 0, salary: 0, other: 0, diesel: 0, capital: 0, salesExp: 0 });
      const row = map.get(key);
      row.paid += numeric(r.paid); row.discount += r.discount; row.count += r.count;
    });
    expenseRows.forEach(r => {
      if (branchFilter !== "all" && String(r.branchId) !== branchFilter) return;
      if (date !== "all" && r.date !== date) return;
      const key = `${r.date}|${r.branchId}`;
      if (!map.has(key)) map.set(key, { key, branchId: String(r.branchId), branchName: r.branchName, date: r.date, paid: 0, income: 0, amount: 0, discount: 0, credit: 0, count: 0, salary: 0, other: 0, diesel: 0, capital: 0, salesExp: 0 });
      const row = map.get(key);
      row.salary += numeric(r.salary); row.other += numeric(r.other); row.diesel += numeric(r.diesel); row.capital += numeric(r.capital); row.salesExp += numeric(r.salesExp);
    });
    creditByDateBranch.forEach((creditAmt, key) => {
      if (!map.has(key)) {
        const [d, bid] = key.split("|");
        const credSample = credits.find((c: any) => getCreditDateStr(c) === d && getBranchKey(c) === bid);
        map.set(key, { key, branchId: bid, branchName: credSample ? getBranchName(credSample) : `Branch ${bid}`, date: d, paid: 0, income: 0, amount: 0, discount: 0, credit: 0, count: 0, salary: 0, other: 0, diesel: 0, capital: 0, salesExp: 0 });
      }
      const row = map.get(key);
      row.credit = creditAmt;
    });
    return Array.from(map.values()).map(r => {
      const totalIncome = numeric(r.paid) + numeric(r.credit);
      const totalExpenses = numeric(r.salary) + numeric(r.other) + numeric(r.diesel) + numeric(r.capital) + numeric(r.salesExp);
      return { ...r, totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, creditCount: creditCountByDateBranch.get(`${r.date}|${r.branchId}`) || 0 };
    }).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(a.branchName).localeCompare(String(b.branchName)));
  }, [summaryRows, creditByDateBranch, creditCountByDateBranch, branchFilter, expenseRows, date, credits]);

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

  // ✅ SALES INCOMES DETAILED TABLE - filter
  const getCreditByBill = (billNo?: string) => {
    if (!billNo || billNo === "-") return undefined;
    return credits.find((c: any) => String(c.bill_number || "").trim().toLowerCase() === String(billNo).trim().toLowerCase());
  };
  const getCreditAmountForItem = (item: any) => {
    const billNo = item.bill_number || item.billNumber || "-";
    const rec = getCreditByBill(billNo);
    if (rec) return Number(rec.credit_amount || 0);
    return Number(item.credit || 0);
  };

  const filteredDetailedIncomes = useMemo(() => {
    return detailedIncomes.filter((item: any) => {
      if (date !== "all" && String(item.date || "").slice(0, 10) !== date) return false;
      if (branchFilter !== "all" && String(item._branchId || getRecordBranchId(item)) !== branchFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!String(item.name || "").toLowerCase().includes(s) && !String(item.bill_number || item.billNumber || "").toLowerCase().includes(s) && !String(item._branchName || "").toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((a: any, b: any) => String(b.date || "").localeCompare(String(a.date || "")));
  }, [detailedIncomes, date, branchFilter, search]);

  const detailTotalAmount = useMemo(() => filteredDetailedIncomes.reduce((t, r: any) => t + numeric(r.amount), 0), [filteredDetailedIncomes]);
  const detailTotalPaid = useMemo(() => filteredDetailedIncomes.reduce((t, r: any) => t + numeric(r.paid), 0), [filteredDetailedIncomes]);
  const detailTotalCredit = useMemo(() => filteredDetailedIncomes.reduce((t, r: any) => t + getCreditAmountForItem(r), 0), [filteredDetailedIncomes]);
  const detailTotalDiscount = useMemo(() => filteredDetailedIncomes.reduce((t, r: any) => t + Math.max(0, numeric(r.amount) - numeric(r.paid) - getCreditAmountForItem(r)), 0), [filteredDetailedIncomes]);

  const exportCSV = () => {
    const head = "Date,Branch,Total Paid,Discount,Total Credit,Total Income,Total Salary,Total Other,Total Diesel,Total Capital,Total Sales Exp,Total Expenses,Net Balance";
    const body = [...dayRows.map(r => [r.date, `"${r.branchName}"`, r.paid, r.discount, r.credit, r.totalIncome, r.salary, r.other, r.diesel, r.capital, r.salesExp, r.totalExpenses, r.netBalance].join(",")), `Total,,${totalPaid},${totalDiscount},${totalCredit},${totalIncome},${totalSalary},${totalOther},${totalDiesel},${totalCapital},${totalSalesExp},${totalExpenses},${netBalance}`].join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `day-summary-${date}.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-6 sm:p-10 flex flex-col items-center relative overflow-hidden font-mono text-xs">
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-red-600/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="w-full max-w-6xl space-y-6 relative z-10">

        {/* HEADER - SALES INCOMES WAGEMA */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => window.history.back()} className="p-3 bg-slate-900/90 hover:bg-slate-800/90 rounded-xl transition-all duration-200 border border-slate-800 text-slate-400 hover:text-white shadow-lg" title="Back"><ArrowLeft size={16} /></button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-100">Day Summary</h1>
              <p className="text-xs text-slate-400 mt-1">View daily income, expenses and net balance for all branches</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all">Refresh</button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-slate-200"><Download size={14} /> Export CSV</button>
          </div>
        </div>

        {/* FILTER + TOP CARDS - UDA TABLE EKA AYIN KALA, CARDS WITHARAK THIYENNE */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div><h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">Day Summary Totals</h2><p className="text-[10px] text-slate-500 mt-1">{dayRows.length} days • {date === "all" ? "All Dates" : date}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Search size={14} className="text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search creditor / bill / vehicle..." className="px-3 py-2 bg-slate-50/80 border border-slate-800 rounded-xl text-slate-900 focus:border-red-500/60 focus:outline-none transition-colors w-56" />
              </div>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="px-3 py-2 bg-slate-50/80 border border-slate-800 rounded-xl text-slate-900 focus:border-red-500/60 focus:outline-none">
                <option value="all">All Branches</option>
                {branchOptions.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 bg-slate-50/80 border border-slate-800 rounded-xl text-slate-900 focus:border-red-500/60 focus:outline-none">
                <option value="all">All Dates</option>
                {allDates.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="date" value={date === "all" ? "" : date} onChange={e => setDate(e.target.value || "all")} className="px-3 py-2 bg-slate-50/80 border border-slate-800 rounded-xl text-slate-900 focus:border-red-500/60 focus:outline-none" />
            </div>
          </div>

          {!isLoading && dayRows.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Income</p><p className="mt-1 text-lg font-black text-red-400">LKR {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-[10px] text-slate-500 mt-1">Paid {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })} + Credit {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Paid</p><p className="mt-1 text-lg font-black text-emerald-400">LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-[10px] text-slate-500 mt-1">{totalBills} bills • Discount {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><p className="text-[10px] uppercase tracking-wider text-amber-400">Total Credit - Nayata Ganna Mudala</p><p className="mt-1 text-lg font-black text-amber-400">LKR {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-[10px] text-slate-500 mt-1">{creditorRows.length} creditors</p></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Expenses</p><p className="mt-1 text-lg font-black text-red-400">LKR {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-[10px] text-slate-500 mt-1">Net Balance LKR {netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            </div>
          )}
          {isLoading && <div className="py-8 text-center flex flex-col items-center justify-center space-y-2"><Loader2 size={24} className="text-red-500 animate-spin" /><p className="text-slate-400">Loading...</p></div>}
        </div>

        {/* ✅ TOTAL INCOME HEDUNA VIDIYA - MEKA WITHARAK THIYENNE - UDA TABLE EKA AYIN KALA */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-blue-500/20 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Receipt size={14} className="text-blue-400" /> Total Income Heduna Vidiya • Paid + Credit = Income</h2><p className="text-[10px] text-slate-500 mt-1">Paid (sales_incomes) + Credit (sales_credits) = Total Income • Me table eken witharak Total Income eka kohomada hadune kiyala penwanawa</p></div>
            <button onClick={() => setShowIncomeBreakdown(!showIncomeBreakdown)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold">{showIncomeBreakdown ? "Hide" : "Show"}</button>
          </div>
          {showIncomeBreakdown && (
            <>
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-4 text-center">
                <span className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2"><span className="block text-[10px] text-slate-400 uppercase font-bold">Total Paid</span><span className="block text-base font-black text-emerald-400">{fmt(totalPaid)}</span><span className="block text-[10px] text-slate-500">{totalBills} bills</span></span>
                <span className="text-xl font-black text-slate-400"><Plus size={18} /></span>
                <span className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-4 py-2"><span className="block text-[10px] text-slate-400 uppercase font-bold">Total Credit</span><span className="block text-base font-black text-amber-400">{fmt(totalCredit)}</span><span className="block text-[10px] text-slate-500">{creditorRows.length} creditors</span></span>
                <span className="text-xl font-black text-slate-400"><Equal size={18} /></span>
                <span className="rounded-xl bg-blue-500/15 border border-blue-500/40 px-4 py-2"><span className="block text-[10px] text-slate-400 uppercase font-bold">Total Income</span><span className="block text-base font-black text-white">{fmt(totalIncome)}</span><span className="block text-[10px] text-slate-500">Paid + Credit</span></span>
              </div>
              {dayRows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><th className="py-3 px-4">Date</th><th className="py-3 px-4">Branch</th><th className="py-3 px-4 text-right">Total Paid</th><th className="py-3 px-4 text-center">+</th><th className="py-3 px-4 text-right">Total Credit</th><th className="py-3 px-4 text-center">=</th><th className="py-3 px-4 text-right">Total Income</th><th className="py-3 px-4">Formula</th></tr></thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                      {dayRows.map(r => (
                        <tr key={r.key} className="hover:bg-slate-900/70"><td className="py-3 px-4 font-bold">{r.date}</td><td className="py-3 px-4 font-bold">{r.branchName}<p className="text-[10px] text-slate-500 font-normal">{r.count} bills • {r.creditCount} creditors</p></td><td className="py-3 px-4 text-right font-black text-emerald-400">{fmt(r.paid)}</td><td className="py-3 px-4 text-center font-black text-slate-400">+</td><td className="py-3 px-4 text-right font-black text-amber-400">{fmt(r.credit)}</td><td className="py-3 px-4 text-center font-black text-slate-400">=</td><td className="py-3 px-4 text-right font-black text-white">{fmt(r.totalIncome)}</td><td className="py-3 px-4"><span className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] font-bold">{fmt(r.paid)} + {fmt(r.credit)} = {fmt(r.totalIncome)}</span></td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t-2 border-blue-500/20 font-black"><td className="py-3 px-4">Total</td><td className="py-3 px-4 text-slate-400">{dayRows.length} Rows</td><td className="py-3 px-4 text-right text-emerald-400">{fmt(totalPaid)}</td><td className="py-3 px-4 text-center">+</td><td className="py-3 px-4 text-right text-amber-400">{fmt(totalCredit)}</td><td className="py-3 px-4 text-center">=</td><td className="py-3 px-4 text-right text-white">{fmt(totalIncome)}</td><td className="py-3 px-4"><span className="rounded-lg bg-blue-500/15 border border-blue-500/30 px-2 py-1 text-[11px]">{fmt(totalPaid)} + {fmt(totalCredit)} = {fmt(totalIncome)}</span></td></tr></tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* ✅ ALUTHEN ADD KARA - SALES INCOMES EKE TABLE EKA WITHARAK - SALES INCOMES PAGE EKE WAGEMA */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div><h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">Registered Sales Incomes Ledger</h2><p className="text-[10px] text-slate-500 mt-1">{filteredDetailedIncomes.length} records found • Sales Incomes page eke table eka ma thamai</p></div>
            <button onClick={() => setShowSalesIncomes(!showSalesIncomes)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold">{showSalesIncomes ? "Hide" : "Show"}</button>
          </div>

          {showSalesIncomes && (
            <>
              {!isLoading && filteredDetailedIncomes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Amount</p><p className="mt-1 text-lg font-black text-red-400">LKR {(detailTotalPaid + detailTotalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-[10px] text-slate-500 mt-1">Paid {detailTotalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })} + Credit {detailTotalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Paid</p><p className="mt-1 text-lg font-black text-emerald-400">LKR {detailTotalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><p className="text-[10px] uppercase tracking-wider text-amber-400">Total Credit - Nayata Ganna Mudala</p><p className="mt-1 text-lg font-black text-amber-400">LKR {detailTotalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Discount = Amount - Paid - Credit</p><p className="mt-1 text-lg font-black text-amber-400">LKR {detailTotalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                </div>
              )}

              {isLoading ? <div className="py-16 text-center flex flex-col items-center justify-center space-y-2"><Loader2 size={24} className="text-red-500 animate-spin" /><p className="text-slate-400">Loading branch entries...</p></div> : filteredDetailedIncomes.length === 0 ? <div className="py-16 text-center text-slate-500">No sales income records found.</div> : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><th className="py-3 px-4">Bill No</th><th className="py-3 px-4">Branch</th><th className="py-3 px-4">Name</th><th className="py-3 px-4">Date</th><th className="py-3 px-4 text-right">Unit Price</th><th className="py-3 px-4 text-right">Qty</th><th className="py-3 px-4 text-right">Amount (LKR)</th><th className="py-3 px-4 text-right">Paid (LKR)</th><th className="py-3 px-4 text-right">Credit (LKR)</th><th className="py-3 px-4 text-right">Discount (LKR)</th><th className="py-3 px-4">Credit Customer</th></tr></thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                      {filteredDetailedIncomes.map((item: any) => {
                        const billNo = item.bill_number || item.billNumber || "-";
                        const creditRec = getCreditByBill(billNo);
                        const creditAmt = getCreditAmountForItem(item);
                        const rowDiscount = Math.max(0, Number(item.amount || 0) - Number(item.paid || 0) - creditAmt);
                        return (
                          <tr key={item.id} className="hover:bg-slate-900/70 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-200">{billNo}</td>
                            <td className="py-3 px-4 font-bold flex items-center gap-2"><Building2 size={13} className="text-cyan-400" /> {item._branchName || "-"}</td>
                            <td className="py-3 px-4 font-bold text-slate-200">{item.name}</td>
                            <td className="py-3 px-4 text-slate-400">{String(item.date || "").slice(0, 10)}</td>
                            <td className="py-3 px-4 text-right text-slate-300">LKR {Number(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-4 text-right text-slate-300">{Number(item.quantity || 0)}</td>
                            <td className="py-3 px-4 text-right font-black text-red-400">LKR {Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-4 text-right font-black text-emerald-400">LKR {Number(item.paid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-4 text-right font-black text-amber-400">LKR {creditAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-4 text-right font-black text-amber-400">LKR {rowDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 px-4">
                              {creditRec ? (
                                <div>
                                  <p className="font-bold text-amber-300 flex items-center gap-1"><User size={11} /> {creditRec.customer_name}</p>
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1"><Phone size={10} /> {creditRec.contact_number}</p>
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1"><Car size={10} /> {creditRec.vehicle_number}</p>
                                </div>
                              ) : (<span className="text-slate-600">-</span>)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot><tr className="border-t-2 border-slate-800 font-black"><td colSpan={6} className="py-3 px-4 text-right uppercase text-slate-300">Total ({filteredDetailedIncomes.length})</td><td className="py-3 px-4 text-right text-red-400">LKR {detailTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="py-3 px-4 text-right text-emerald-400">LKR {detailTotalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="py-3 px-4 text-right text-amber-400">LKR {detailTotalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="py-3 px-4 text-right text-amber-400">LKR {detailTotalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td /></tr></tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* CREDITORS - Ehemama */}
        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-amber-500/20 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} className="text-amber-400" /> All Credit Records - Creditors</h2><p className="text-[10px] text-slate-500 mt-1">{creditorRows.length} records • Total Credit LKR {totalCreditFromCreditors.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            <button onClick={() => setShowCreditors(!showCreditors)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold">{showCreditors ? "Hide" : "Show"}</button>
          </div>
          {showCreditors && (creditorRows.length === 0 ? <div className="py-10 text-center text-slate-500">Creditors la na.</div> : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><th className="py-3 px-4">Creditor (Customer)</th><th className="py-3 px-4">Branch</th><th className="py-3 px-4">Bill No</th><th className="py-3 px-4">Product</th><th className="py-3 px-4">Promise Date</th><th className="py-3 px-4 text-right">Credit Amount</th><th className="py-3 px-4 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {creditorRows.map(r => (<tr key={r.id} className="hover:bg-slate-900/70"><td className="py-3 px-4"><p className="font-bold flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">{String(r.customer_name || "?").charAt(0).toUpperCase()}</span>{r.customer_name}</p><p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><Phone size={10} /> {r.contact_number || "-"} • <Car size={10} /> {r.vehicle_number || "-"}</p></td><td className="py-3 px-4 font-bold">{getBranchName(r)}</td><td className="py-3 px-4 font-bold">{r.bill_number || "-"}</td><td className="py-3 px-4">{r.product_name || "-"}</td><td className="py-3 px-4">{String(r.promise_date || "").slice(0, 10) || "-"}</td><td className="py-3 px-4 text-right font-black text-amber-400">{fmt(numeric(r.credit_amount))}</td><td className="py-3 px-4 text-right">{fmt(numeric(r.total_amount))}</td></tr>))}
                </tbody>
                <tfoot><tr className="border-t-2 border-amber-500/20 font-black"><td colSpan={5} className="py-3 px-4 text-right uppercase text-slate-300">Total Credit ({creditorRows.length})</td><td className="py-3 px-4 text-right text-amber-400">{fmt(totalCreditFromCreditors)}</td><td /></tr></tfoot>
              </table>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}