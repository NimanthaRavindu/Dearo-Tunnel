"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, Wallet, CreditCard, Building2, Loader2, Search, Download, Phone, Car, Receipt, TrendingDown, Scale, Plus, Equal, User } from "lucide-react";

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

const getCreditAmountForItem = (item: any) => {
    const billNo = String(item.bill_number || item.billNumber || "").trim().toLowerCase();
    if (!billNo || billNo === "-") return Number(item.credit || 0);
    const matched = credits.filter((c: any) => String(c.bill_number || "").trim().toLowerCase() === billNo);
    if (matched.length === 0) return Number(item.credit || 0);

    return matched.reduce((t, c: any) => t + numeric(c.credit_amount), 0);
  };
  const getCreditByBill = (billNo?: string) => {
    if (!billNo || billNo === "-") return undefined;
    return credits.find((c: any) => String(c.bill_number || "").trim().toLowerCase() === String(billNo).trim().toLowerCase());
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

  
  const matchedCreditTotal = useMemo(() => filteredDetailedIncomes.reduce((t, r: any) => t + getCreditAmountForItem(r), 0), [filteredDetailedIncomes, credits]);
  const orphanCredits = useMemo(() => {
    const billNos = new Set(filteredDetailedIncomes.map((i: any) => String(i.bill_number || i.billNumber || "").trim().toLowerCase()));
    return filteredCredits.filter((c: any) => {
      const b = String(c.bill_number || "").trim().toLowerCase();
      return !b || b === "-" || !billNos.has(b);
    });
  }, [filteredCredits, filteredDetailedIncomes]);
  const orphanCreditTotal = useMemo(() => orphanCredits.reduce((t, c: any) => t + numeric(c.credit_amount), 0), [orphanCredits]);

  const detailTotalAmount = useMemo(() => filteredDetailedIncomes.reduce((t, r: any) => t + numeric(r.amount), 0), [filteredDetailedIncomes]);
  const detailTotalPaid = useMemo(() => filteredDetailedIncomes.reduce((t, r: any) => t + numeric(r.paid), 0), [filteredDetailedIncomes]);
  const detailTotalCredit = useMemo(() => totalCredit, [totalCredit]); // <- meka thamai fix eka, kalin matchedCreditTotal witharak thibbe
  const detailTotalDiscount = useMemo(() => filteredDetailedIncomes.reduce((t, r: any) => t + Math.max(0, numeric(r.amount) - numeric(r.paid) - getCreditAmountForItem(r)), 0), [filteredDetailedIncomes, credits]);

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
                <p className="mt-1 text-[10px] text-slate-500">Sales Credits Total Credit wala ekathuwa • {creditorRows.length} creditors</p>
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

            <div className="rounded-2xl border border-blue-500/30 bg-[#0B1226] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Receipt size={14} className="text-blue-400" /> Total Income Heduna Vidiya • Paid + Credit = Income</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Total Income eka kohomada hadune kiyala - Paid (sales_incomes) + Credit (sales_credits) = Total Income</p>
                </div>
                <button onClick={() => setShowIncomeBreakdown(!showIncomeBreakdown)} className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-bold">{showIncomeBreakdown ? "Hide" : "Show"}</button>
              </div>
              {showIncomeBreakdown && (
                <>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-4 text-center">
                    <span className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2"><span className="block text-[10px] text-slate-400 uppercase font-bold">Total Paid</span><span className="block text-base font-black text-emerald-400">{fmt(totalPaid)}</span><span className="block text-[10px] text-slate-500">{totalBills} bills</span></span>
                    <span className="text-xl font-black text-slate-400"><Plus size={18} /></span>
                    <span className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-4 py-2"><span className="block text-[10px] text-slate-400 uppercase font-bold">Total Credit</span><span className="block text-base font-black text-amber-400">{fmt(totalCredit)}</span><span className="block text-[10px] text-slate-500">{creditorRows.length} creditors</span></span>
                    <span className="text-xl font-black text-slate-400"><Equal size={18} /></span>
                    <span className="rounded-xl bg-blue-500/15 border border-blue-500/40 px-4 py-2"><span className="block text-[10px] text-slate-400 uppercase font-bold">Total Income</span><span className="block text-base font-black text-white">{fmt(totalIncome)}</span><span className="block text-[10px] text-slate-500">Paid + Credit</span></span>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500">📌 Total Paid enne <span className="text-emerald-400 font-bold">sales_incomes table</span> eke Paid column eken • Total Credit enne <span className="text-amber-400 font-bold">sales_credits table</span> eke Credit Amount eken • Total Income = Paid + Credit</p>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
              <div className="flex items-center justify-between">
                <div><h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Receipt size={14} className="text-red-400" /> Registered Sales Incomes Ledger</h3><p className="text-[10px] text-slate-500 mt-1">{filteredDetailedIncomes.length} records found • Matched Credit {fmt(matchedCreditTotal)} + Bill nathi Credit {fmt(orphanCreditTotal)} = Total Credit {fmt(detailTotalCredit)}</p></div>
                <button onClick={() => setShowSalesIncomes(!showSalesIncomes)} className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-bold">{showSalesIncomes ? "Hide" : "Show"}</button>
              </div>
              {showSalesIncomes && (
                <>
                  {filteredDetailedIncomes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
                      <div className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Amount</p><p className="mt-1 text-lg font-black text-red-400">LKR {(detailTotalPaid + detailTotalCredit + detailTotalDiscount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-[10px] text-slate-500 mt-1">Paid + Credit + Discount</p></div>
                      <div className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Paid</p><p className="mt-1 text-lg font-black text-emerald-400">LKR {detailTotalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><p className="text-[10px] uppercase tracking-wider text-amber-400">Total Credit - Nayata Ganna Mudala</p><p className="mt-1 text-lg font-black text-amber-400">LKR {detailTotalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-[10px] text-slate-500 mt-1">Matched {matchedCreditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} + Orphan {orphanCreditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                      <div className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total Discount = Amount - Paid - Credit</p><p className="mt-1 text-lg font-black text-amber-400">LKR {detailTotalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                    </div>
                  )}
                  {filteredDetailedIncomes.length === 0 ? <p className="py-8 text-center text-slate-500">No sales income records found.</p> : (
                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-left min-w-[1100px]">
                        <thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-3">Bill No</th><th className="py-3">Branch</th><th className="py-3">Name</th><th className="py-3">Date</th><th className="py-3 text-right">Unit Price</th><th className="py-3 text-right">Qty</th><th className="py-3 text-right">Amount (LKR)</th><th className="py-3 text-right">Paid (LKR)</th><th className="py-3 text-right">Credit (LKR)</th><th className="py-3 text-right">Discount (LKR)</th><th className="py-3">Credit Customer</th></tr></thead>
                        <tbody>
                          {filteredDetailedIncomes.map((item: any) => {
                            const billNo = item.bill_number || item.billNumber || "-";
                            const creditRec = getCreditByBill(billNo);
                            const creditAmt = getCreditAmountForItem(item);
                            const rowDiscount = Math.max(0, Number(item.amount || 0) - Number(item.paid || 0) - creditAmt);
                            return (
                              <tr key={item.id} className="border-b border-white/[0.04]">
                                <td className="py-3 font-bold">{billNo}</td>
                                <td className="py-3"><p className="font-bold flex items-center gap-2"><Building2 size={13} className="text-cyan-400" /> {item._branchName || "-"}</p></td>
                                <td className="py-3 font-bold">{item.name}</td>
                                <td className="py-3 text-slate-400">{String(item.date || "").slice(0, 10)}</td>
                                <td className="py-3 text-right">LKR {Number(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-3 text-right">{Number(item.quantity || 0)}</td>
                                <td className="py-3 text-right font-black text-red-400">LKR {Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-3 text-right font-black text-emerald-400">LKR {Number(item.paid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-3 text-right font-black text-amber-400">LKR {creditAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-3 text-right font-black text-amber-400">LKR {rowDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-3">
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
                          {/* ✅ ORPHAN CREDIT */}
                          {orphanCredits.map((c: any) => (
                            <tr key={`orphan-${c.id}`} className="border-b border-amber-500/20 bg-amber-500/[0.04]">
                              <td className="py-3 font-bold text-amber-300">{c.bill_number || "-"}</td>
                              <td className="py-3"><p className="font-bold flex items-center gap-2"><Building2 size={13} className="text-cyan-400" /> {getBranchName(c)}</p></td>
                              <td className="py-3 font-bold text-amber-300">Credit Only - Bill Not Found</td>
                              <td className="py-3 text-slate-400">{getCreditDateStr(c)}</td>
                              <td className="py-3 text-right">-</td>
                              <td className="py-3 text-right">-</td>
                              <td className="py-3 text-right font-black text-amber-400">LKR {numeric(c.credit_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 text-right">LKR 0.00</td>
                              <td className="py-3 text-right font-black text-amber-400">LKR {numeric(c.credit_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 text-right">LKR 0.00</td>
                              <td className="py-3">
                                <p className="font-bold text-amber-300 flex items-center gap-1"><User size={11} /> {c.customer_name}</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1"><Phone size={10} /> {c.contact_number}</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1"><Car size={10} /> {c.vehicle_number}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot><tr className="font-black"><td colSpan={6} className="py-3 text-right">Total ({filteredDetailedIncomes.length + orphanCredits.length})</td><td className="py-3 text-right text-red-400">LKR {detailTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="py-3 text-right text-emerald-400">LKR {detailTotalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="py-3 text-right text-amber-400">LKR {detailTotalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="py-3 text-right text-amber-400">LKR {detailTotalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td /></tr></tfoot>
                      </table>
                    </div>
                  )}
                </>
              )}
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