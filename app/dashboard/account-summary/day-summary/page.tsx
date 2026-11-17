"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, Wallet, CreditCard, Building2, Loader2, Search, Download, Phone, Car, Receipt } from "lucide-react";

const fmt = (n: number) => `LKR ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const numeric = (v: any) => Number(v ?? 0) || 0;

const fetchJSON = async (url: string) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const r = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!r.ok) return [];
    const j = await r.json().catch(() => []);
    if (Array.isArray(j)) return j;
    if (j && Array.isArray(j.data)) return j.data;
    return [];
  } catch { return []; }
};

export default function DaySummaryPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showCreditors, setShowCreditors] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const branchList = await fetchJSON(`/api/branches`);
      setBranches(branchList);
      const ids = branchList.map((b: any) => b.id).filter(Boolean);
      const getName = (id: any) => branchList.find((x: any) => String(x.id) === String(id))?.branch_name || `Branch ${id}`;

      const [incomeResults, creditResults] = await Promise.all([
        Promise.allSettled(
          ids.map((id: any) =>
            fetchJSON(`/api/expences/sales-incomes?branch_id=${encodeURIComponent(id)}`).then((rows: any[]) =>
              rows.map((r: any) => ({ ...r, _branchId: id, _branchName: getName(id) }))
            )
          )
        ),
        Promise.allSettled(
          ids.map((id: any) =>
            fetchJSON(`/api/expences/sales-credits?branch_id=${encodeURIComponent(id)}`).then((rows: any[]) =>
              rows.map((r: any) => ({ ...r, _branchId: id, _branchName: getName(id) }))
            )
          )
        ),
      ]);

      const allIncomes: any[] = [];
      incomeResults.forEach((res: any) => { if (res.status === "fulfilled") allIncomes.push(...res.value); });
      const allCredits: any[] = [];
      creditResults.forEach((res: any) => { if (res.status === "fulfilled") allCredits.push(...res.value); });

      setIncomes(allIncomes);
      setCredits(allCredits);
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getBranchName = (r: any) => r._branchName || r.branch_name || "-";
  const getBranchKey = (r: any) => String(r._branchId || r.branch_id || r.branchId || "");
  // ✅ Sales Incomes page eke date eka wage - r.date / r.created_date / r.expense_date 3ma balanawa
  const getDateStr = (r: any) => String(r.date || r.created_date || r.expense_date || "").slice(0, 10);
  const isBranch = (r: any) => branchFilter === "all" || getBranchKey(r) === branchFilter;
  const isDate = (r: any) => getDateStr(r) === date;

  // ✅ INCOME = Sales Incomes page eke Amount wala ekathuwa - Discount adu karanne NA
  const getAmount = (r: any) => numeric(r.amount);
  const getCredit = (r: any) => numeric(r.credit);

  const branchOptions = useMemo(() => branches.map((b: any) => ({ id: String(b.id), name: b.branch_name || `Branch ${b.id}` })), [branches]);

  const dayRows = useMemo(() => {
    const map = new Map<string, { key: string, branchId: string, branchName: string, date: string, income: number, amount: number, discount: number, credit: number, count: number }>();
    const getRow = (r: any) => {
      const key = `${getDateStr(r)}|${getBranchKey(r)}`;
      if (!map.has(key)) map.set(key, { key, branchId: getBranchKey(r), branchName: getBranchName(r), date: getDateStr(r), income: 0, amount: 0, discount: 0, credit: 0, count: 0 });
      return map.get(key)!;
    };
    incomes.forEach(r => {
      if (!isDate(r) || !isBranch(r)) return;
      const row = getRow(r);
      row.amount += getAmount(r);
      row.discount += numeric(r.discount);
      row.credit += getCredit(r);
      row.income += getAmount(r); // ✅ Income = Amount
      row.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.income - a.income);
  }, [incomes, date, branchFilter]);

  const creditorRows = useMemo(() => {
    let list = credits.filter(r => {
      if (!isDate(r) || !isBranch(r)) return false;
      if (numeric(r.credit_amount) <= 0) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!String(r.customer_name || "").toLowerCase().includes(s) && !String(r.bill_number || "").toLowerCase().includes(s) && !String(r.vehicle_number || "").toLowerCase().includes(s) && !getBranchName(r).toLowerCase().includes(s)) return false;
      }
      return true;
    });
    return list.sort((a, b) => numeric(b.credit_amount) - numeric(a.credit_amount));
  }, [credits, date, branchFilter, search]);

  const totalIncome = useMemo(() => dayRows.reduce((t, r) => t + r.income, 0), [dayRows]);
  const totalAmount = useMemo(() => dayRows.reduce((t, r) => t + r.amount, 0), [dayRows]);
  const totalDiscount = useMemo(() => dayRows.reduce((t, r) => t + r.discount, 0), [dayRows]);
  const totalCredit = useMemo(() => dayRows.reduce((t, r) => t + r.credit, 0), [dayRows]);
  const totalCreditFromCreditors = useMemo(() => creditorRows.reduce((t, r) => t + numeric(r.credit_amount), 0), [creditorRows]);

  const exportCSV = () => {
    const head = "Date,Branch,Income (Amount),Discount,Total Credit";
    const body = [
      ...dayRows.map(r => [r.date, `"${r.branchName}"`, r.income, r.discount, r.credit].join(",")),
      `Total,,${totalIncome},${totalDiscount},${totalCredit}`
    ].join("\n");
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
            <p className="mt-1 text-slate-400">Income = Sales Incomes page eke Amount wala ekathuwa (Date + Branch anuwa) • Total Credits = Credit Amount</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-black hover:bg-amber-400">Refresh</button>
            <button onClick={exportCSV} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-black hover:bg-slate-200"><Download size={14} /> Export CSV</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0B1226] p-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-slate-200 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2"><Wallet size={13} /> Income • {date}</p>
                <p className="mt-3 text-2xl font-black text-emerald-400">{fmt(totalIncome)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Sales Incomes Amount wala ekathuwa • {dayRows.reduce((t, r) => t + r.count, 0)} bills • Discount {fmt(totalDiscount)}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2"><CreditCard size={13} /> Total Credits • {date}</p>
                <p className="mt-3 text-2xl font-black text-amber-400">{fmt(totalCredit)}</p>
                <p className="mt-1 text-[10px] text-slate-500">{creditorRows.length} creditors • Creditors total {fmt(totalCreditFromCreditors)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#0B1226] p-5">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Net Income • Income - Credit</p>
                <p className="mt-3 text-2xl font-black text-white">{fmt(totalIncome - totalCredit)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Amount - Credit = Cash Income</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-[#0B1226] p-5">
              <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><Receipt size={14} className="text-emerald-400" /> Day Summary • {date}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Branch ekata ekata - Income = Amount</p>
              {dayRows.length === 0 ? <p className="py-8 text-center text-slate-500">Me date ekata data na.</p> : (
                <div className="overflow-x-auto">
                  <table className="mt-4 w-full text-left min-w-[720px]">
                    <thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-3">Date</th><th className="py-3">Branch</th><th className="py-3 text-right">Income (Amount)</th><th className="py-3 text-right">Discount</th><th className="py-3 text-right">Total Credits</th></tr></thead>
                    <tbody>
                      {dayRows.map(r => (
                        <tr key={r.key} className="border-b border-white/[0.04]">
                          <td className="py-3 font-bold">{r.date}</td>
                          <td className="py-3"><p className="font-bold flex items-center gap-2"><Building2 size={13} className="text-cyan-400" /> {r.branchName}</p><p className="text-[10px] text-slate-500">{r.count} bills</p></td>
                          <td className="py-3 text-right font-black text-emerald-400">{fmt(r.income)}</td>
                          <td className="py-3 text-right text-amber-400">{fmt(r.discount)}</td>
                          <td className="py-3 text-right font-black text-amber-400">{fmt(r.credit)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="font-black text-base"><td className="py-4">Total</td><td className="py-4 text-slate-400">{dayRows.length} Branches</td><td className="py-4 text-right text-emerald-400">{fmt(totalIncome)}</td><td className="py-4 text-right text-amber-400">{fmt(totalDiscount)}</td><td className="py-4 text-right text-amber-400">{fmt(totalCredit)}</td></tr></tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-[#0B1226] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-bold uppercase tracking-wider"><CreditCard size={14} className="text-amber-400" /> Creditors • {date} • {creditorRows.length} Customers</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Credit karapu adaala customer la - Total {fmt(totalCreditFromCreditors)}</p>
                </div>
                <button onClick={() => setShowCreditors(!showCreditors)} className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-bold">{showCreditors ? "Hide" : "Show"}</button>
              </div>
              {showCreditors && (
                creditorRows.length === 0 ? <p className="py-8 text-center text-slate-500">Me date ekata creditors la na.</p> : (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left min-w-[720px]">
                      <thead><tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><th className="py-3">Creditor (Customer)</th><th className="py-3">Branch</th><th className="py-3">Bill No</th><th className="py-3">Product</th><th className="py-3">Promise Date</th><th className="py-3 text-right">Credit Amount</th><th className="py-3 text-right">Total</th></tr></thead>
                      <tbody>
                        {creditorRows.map(r => (
                          <tr key={r.id} className="border-b border-white/[0.04]">
                            <td className="py-3">
                              <p className="font-bold flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">{String(r.customer_name || "?").charAt(0).toUpperCase()}</span>{r.customer_name}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><Phone size={10} /> {r.contact_number || "-"} • <Car size={10} /> {r.vehicle_number || "-"}</p>
                            </td>
                            <td className="py-3 font-bold">{getBranchName(r)}</td>
                            <td className="py-3 font-bold">{r.bill_number || "-"}</td>
                            <td className="py-3">{r.product_name || "-"}</td>
                            <td className="py-3">{String(r.promise_date || "").slice(0, 10) || "-"}</td>
                            <td className="py-3 text-right font-black text-amber-400">{fmt(numeric(r.credit_amount))}</td>
                            <td className="py-3 text-right">{fmt(numeric(r.total_amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr className="font-black"><td colSpan={5} className="py-3 text-right">Total Credit ({creditorRows.length})</td><td className="py-3 text-right text-amber-400">{fmt(totalCreditFromCreditors)}</td><td /></tr></tfoot>
                    </table>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}