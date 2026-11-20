"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Droplets, Fuel, RefreshCw, Wallet, CreditCard, Filter, X, Calendar, Eye, BarChart3, Banknote } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

type DieselExpense = { id: number; branch_id: string; date: string; machine: string; diesel: number | string; amount: number | string; payable: number | string; paid: number | string; };
type InitialAdd = { id?: number; branch_id?: string; date: string; diesel: number; amount: number };
type CardColor = "cyan" | "blue" | "orange" | "green" | "red" | "violet";
const machines = ["Komatsu","CAT","JCB","Excavator","Loader","Backhoe Loader","Wheel Loader","Breker Machine","Compressor","Tractor"];
const numberValue = (v: any) => Number(v || 0);
const formatNumber = (v: any) => Number(v || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const DIESEL_PRICE = 397;

export default function ViewDieselExpensesPage() {
  const params = useParams(); const router = useRouter();
  const branchId = Array.isArray(params?.id)? params.id[0] : String(params?.id || "");
  const [expenses, setExpenses] = useState<DieselExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialDieselStock, setInitialDieselStock] = useState(0);
  const [initialTotalAmount, setInitialTotalAmount] = useState(0);
  const [isInitialSet, setIsInitialSet] = useState(false);
  const [showInitialSummary, setShowInitialSummary] = useState(false);

  // ✅ Initial History - View modal eke pennanna witharak
  const [initialHistory, setInitialHistory] = useState<InitialAdd[]>([]);
  const [initialFilterDate, setInitialFilterDate] = useState("");

  // FILTER - SINGLE DATE ONLY
  const [filterDate, setFilterDate] = useState("");
  const [filterMachine, setFilterMachine] = useState("");

  // ✅ FIX - diesel_stock eken ena format eka (total_diesel) + history table eken ena format eka (added_diesel) dekama + branch filter
  const mapHistory = (arr: any[]) => (arr || [])
    .filter((h: any) => !h.branch_id || String(h.branch_id) === String(branchId))
    .map((h: any) => ({
      id: h.id, branch_id: h.branch_id, date: String(h.stock_date || h.initial_date || h.date || "").slice(0,10),
      diesel: Number(h.added_diesel ?? h.total_diesel ?? h.diesel ?? 0), amount: Number(h.added_amount ?? h.total_amount ?? h.amount ?? 0),
    }));

  const loadExpenses = async () => {
    if (!branchId) return;
    try { setLoading(true);
      const res = await fetch(`/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}`, { cache: "no-store" });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setExpenses((data.expenses || []).filter((e:any)=> String(e.branch_id)===String(branchId)));
      if (data.summary) {
        const d = Number(data.summary.totalDiesel || 0); const a = Number(data.summary.totalAmount || 0);
        setInitialDieselStock(d); setInitialTotalAmount(a); setIsInitialSet(d > 0 || a > 0);
      }
      if (Array.isArray(data.history)) {
        setInitialHistory(mapHistory(data.history));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadInitialHistory = async () => {
    if (!branchId) return;
    try {
      const r = await fetch(`/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}&type=history`, { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      const arr = Array.isArray(j) ? j : (Array.isArray(j.history) ? j.history : []);
      setInitialHistory(mapHistory(arr));
    } catch {}
  };

  useEffect(() => {
    setExpenses([]); setInitialHistory([]); setInitialDieselStock(0); setInitialTotalAmount(0); setIsInitialSet(false);
    if (branchId) { loadExpenses(); loadInitialHistory(); }
  }, [branchId]);

  useEffect(() => {
    if (!showInitialSummary) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowInitialSummary(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showInitialSummary]);

  // FILTER LOGIC - EKA DATE EKIN WITHARAK
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      const d = item.date?.slice(0, 10);
      const matchMachine = !filterMachine || item.machine === filterMachine;
      const matchDate = !filterDate || d === filterDate;
      return matchMachine && matchDate;
    });
  }, [expenses, filterDate, filterMachine]);

  const totalUsedDiesel = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.diesel), 0), [expenses]);
  const totalPayable = useMemo(() => expenses.reduce((s, i) => s + numberValue(i.payable), 0), [expenses]);
  const fDiesel = useMemo(() => filteredExpenses.reduce((s, i) => s + numberValue(i.diesel), 0), [filteredExpenses]);
  const fPayable = useMemo(() => filteredExpenses.reduce((s, i) => s + numberValue(i.payable), 0), [filteredExpenses]);

  const isFiltered = Boolean(filterDate || filterMachine);
  const activeDieselUsed = isFiltered? fDiesel : totalUsedDiesel;
  const activePayable = isFiltered? fPayable : totalPayable;

  // ✅ CARD LOGIC - View eke form na nisa formDiesel / formPayable add karanne na
  const displayTotalDiesel = initialDieselStock;
  const displayDieselUsed = activeDieselUsed;
  const displayTotalAmount = activePayable;
  const displayRemainingDiesel = Math.max(0, displayTotalDiesel - totalUsedDiesel);
  const displayRemainingBalance = displayRemainingDiesel * DIESEL_PRICE;

  // ✅ ALUTH CARD 2 - Initial Diesel / Initial Amount - Modal eke wage Original Stock eka
  const displayInitialDiesel = initialDieselStock; // 745L
  const displayInitialAmount = initialTotalAmount; // Rs. 295,765

  // ✅ INITIAL HISTORY - Date wise group
  const initialByDate = useMemo(() => {
    const map = new Map<string, { date: string; diesel: number; amount: number; count: number }>();
    initialHistory.forEach((h) => {
      const d = String(h.date || "").slice(0,10);
      if (!d) return;
      const cur = map.get(d) || { date: d, diesel: 0, amount: 0, count: 0 };
      cur.diesel += numberValue(h.diesel); cur.amount += numberValue(h.amount); cur.count += 1;
      map.set(d, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [initialHistory]);
  const filteredInitialByDate = useMemo(() => initialByDate.filter(r => !initialFilterDate || r.date === initialFilterDate), [initialByDate, initialFilterDate]);
  const totalInitialHistoryDiesel = useMemo(() => initialHistory.reduce((s, h) => s + numberValue(h.diesel), 0), [initialHistory]);
  const totalInitialHistoryAmount = useMemo(() => initialHistory.reduce((s, h) => s + numberValue(h.amount), 0), [initialHistory]);

  // ✅ DATE WISE SUMMARY - Modal eke pennanna
  const dateWiseSummary = useMemo(() => {
    const map = new Map<string, { date: string; diesel: number; amount: number; paid: number; count: number; machines: Set<string> }>();
    expenses.forEach((item) => {
      const d = String(item.date || "").slice(0, 10) || "-";
      const cur = map.get(d) || { date: d, diesel: 0, amount: 0, paid: 0, count: 0, machines: new Set<string>() };
      cur.diesel += numberValue(item.diesel);
      cur.amount += numberValue(item.payable ?? item.amount);
      cur.paid += numberValue(item.paid);
      cur.count += 1;
      if (item.machine) cur.machines.add(item.machine);
      map.set(d, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses]);

  // ✅ MACHINE WISE SUMMARY - Modal eke yatin
  const machineWiseSummary = useMemo(() => {
    const map = new Map<string, { machine: string; diesel: number; amount: number; count: number }>();
    expenses.forEach((item) => {
      const key = item.machine || "-";
      const cur = map.get(key) || { machine: key, diesel: 0, amount: 0, count: 0 };
      cur.diesel += numberValue(item.diesel);
      cur.amount += numberValue(item.payable ?? item.amount);
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.diesel - a.diesel);
  }, [expenses]);

  const clearFilters = () => { setFilterDate(""); setFilterMachine(""); };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold"><ArrowLeft size={16}/> Back</button>
        <header className="flex justify-between rounded-3xl border border-slate-700/80 bg-slate-900 p-5">
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400"><Fuel size={29}/></div><div><h1 className="text-2xl font-bold">Diesel Expenses</h1><p className="text-sm text-slate-400">View Only - Card + Filter + Table • Branch: {branchId}</p></div></div>
          <div className="flex gap-2">
            <button onClick={async () => { await loadInitialHistory(); setShowInitialSummary(true); }} className="h-11 inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 text-sm font-bold"><Eye size={16}/> View</button>
            <button onClick={() => { loadExpenses(); loadInitialHistory(); }} className="h-11 inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 text-sm font-bold"><RefreshCw size={17} className={loading? "animate-spin" : ""}/>Refresh</button>
          </div>
        </header>

        {/* ✅ CARD TIKA - Initial 2ka aluthen add kala - Form na */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SummaryCard title="Initial Diesel" subtitle="Original Stock • Modal eke wage" value={`${formatNumber(displayInitialDiesel)} L`} icon={<Fuel size={22}/>} color="violet"/>
          <SummaryCard title="Initial Amount" subtitle={`Original Amount • Total Stock Value`} value={`Rs. ${formatNumber(displayInitialAmount)}`} icon={<Banknote size={22}/>} color="violet"/>
          <SummaryCard title="Diesel Used" subtitle={isFiltered ? `Filtered: ${fDiesel}L` : "Table eke diesel wala ekathuwa"} value={`${formatNumber(displayDieselUsed)} L`} icon={<Droplets size={22}/>} color="cyan"/>
          <SummaryCard title="Total Amount" subtitle={isFiltered ? `Filtered payable` : "Table eke viyadam wela thiyena amount"} value={`Rs. ${formatNumber(displayTotalAmount)}`} icon={<Wallet size={22}/>} color="blue"/>
          <SummaryCard title="Remaining Diesel" subtitle="Total Diesel - Diesel Used" value={`${formatNumber(displayRemainingDiesel)} L`} icon={<Droplets size={22}/>} color="orange"/>
          <SummaryCard title="Remaining Balance" subtitle={`Remaining Diesel x Rs. ${DIESEL_PRICE}`} value={`Rs. ${formatNumber(displayRemainingBalance)}`} icon={<CreditCard size={22}/>} color="green"/>
          <SummaryCard title="Total Diesel" subtitle="Initial stock" value={`${formatNumber(displayTotalDiesel)} L`} icon={<AlertCircle size={22}/>} color="red"/>
        </section>

        {/* ✅ FILTER + TABLE WITHARAK */}
        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-700/80 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold">Records</h2>
              <span className="text-sm bg-slate-800 px-3 py-1 rounded-xl">{filteredExpenses.length} / {expenses.length} Records</span>
            </div>
            <div className="flex flex-wrap gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400"/>
                <span className="text-xs font-bold text-slate-400 uppercase">Filter:</span>
              </div>
              <select value={filterMachine} onChange={e=>setFilterMachine(e.target.value)} className="h-9 rounded-lg border border-slate-600 bg-slate-900 px-3 text-xs outline-none">
                <option value="">All Machines</option>
                {machines.map(m=> <option key={m} value={m}>{m}</option>)}
                {expenses.map(e=>e.machine).filter((v,i,a)=>v && !machines.includes(v) && a.indexOf(v)===i).map(m=> <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex items-center gap-1.5 h-9 rounded-lg border border-slate-600 bg-slate-50 px-3">
                <Calendar size={14} className="text-slate-900"/>
                <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="bg-transparent text-xs outline-none" />
              </div>
              {isFiltered && (
                <button onClick={clearFilters} className="h-9 inline-flex items-center gap-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 px-3 text-xs font-bold">
                  <X size={12}/>Clear
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead className="bg-slate-800/80"><tr className="text-xs text-slate-400 uppercase"><th className="px-5 py-4 text-left">Date</th><th className="px-5 py-4 text-left">Machine</th><th className="px-5 py-4 text-right">Diesel</th><th className="px-5 py-4 text-right">Payable</th><th className="px-5 py-4 text-right">Paid</th><th className="px-5 py-4 text-right">Balance</th></tr></thead><tbody>{filteredExpenses.length===0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No records for {filterDate} {filterMachine} - filter clear karala balanna</td></tr> : filteredExpenses.map(item => { const p = numberValue(item.payable); const pd = numberValue(item.paid); return <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/40"><td className="px-5 py-4 text-sm">{item.date?.slice(0, 10)}</td><td className="px-5 py-4 font-semibold">{item.machine}</td><td className="px-5 py-4 text-right">{formatNumber(item.diesel)}</td><td className="px-5 py-4 text-right font-bold text-blue-400">Rs. {formatNumber(p)}</td><td className="px-5 py-4 text-right font-bold text-green-400">Rs. {formatNumber(pd)}</td><td className="px-5 py-4 text-right font-bold text-red-400">Rs. {formatNumber(Math.max(0, p - pd))}</td></tr> })}</tbody></table></div>
        </section>
      </div>

      {/* ✅ VIEW MODAL - Summary witharak, Form na */}
      {showInitialSummary && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setShowInitialSummary(false)}>
          <div className="w-full max-w-2xl my-6 rounded-3xl border border-slate-700 bg-[#0d1527] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400"><BarChart3 size={20}/></div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider">Initial Stock Summary</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Branch • {branchId} • {expenses.length} Records • {dateWiseSummary.length} Days</p>
                </div>
              </div>
              <button onClick={() => setShowInitialSummary(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white font-black hover:bg-red-600"><X size={16}/></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Diesel</p>
                  <p className="mt-2 text-lg font-black text-cyan-300">{formatNumber(initialDieselStock)} L</p>
                  <p className="text-[10px] text-slate-500 mt-1">Total Add karapu gaana</p>
                </div>
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Amount</p>
                  <p className="mt-2 text-lg font-black text-blue-300">Rs. {formatNumber(initialTotalAmount)}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Total Amount</p>
                </div>
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Diesel Used</p>
                  <p className="mt-2 text-lg font-black text-orange-300">{formatNumber(totalUsedDiesel)} L</p>
                  <p className="text-[10px] text-slate-500 mt-1">Table eke ekathuwa</p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Remaining</p>
                  <p className="mt-2 text-lg font-black text-emerald-300">{formatNumber(Math.max(0, initialDieselStock - totalUsedDiesel))} L</p>
                  <p className="text-[10px] text-slate-500 mt-1">Rs. {formatNumber(Math.max(0, initialDieselStock - totalUsedDiesel) * DIESEL_PRICE)}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-2">
                  <span>Used {initialDieselStock > 0 ? Math.round((totalUsedDiesel / initialDieselStock) * 100) : 0}%</span>
                  <span>Remaining {initialDieselStock > 0 ? Math.round((Math.max(0, initialDieselStock - totalUsedDiesel) / initialDieselStock) * 100) : 0}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${initialDieselStock > 0 ? Math.min(100, (totalUsedDiesel / initialDieselStock) * 100) : 0}%` }} />
                </div>
              </div>

              {/* Initial Add History - Date Wise - Read Only */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-cyan-300">Initial Add History • Date Wise • Branch {branchId}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 h-9 rounded-lg border border-slate-600 bg-slate-900 px-3">
                      <Calendar size={14} className="text-slate-400"/>
                      <input type="date" value={initialFilterDate} onChange={e=>setInitialFilterDate(e.target.value)} className="bg-transparent text-xs outline-none" />
                    </div>
                    {initialFilterDate && <button onClick={()=>setInitialFilterDate("")} className="h-9 px-3 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1"><X size={12}/>Clear</button>}
                    <span className="rounded-lg bg-cyan-500/15 text-cyan-300 px-2.5 py-1 text-[11px] font-bold">{filteredInitialByDate.length} Days • {initialHistory.length} Adds</span>
                  </div>
                </div>
                {filteredInitialByDate.length === 0 ? (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-500">Thama Initial Add History na<br/><span className="text-[11px]">DB Total: {formatNumber(initialDieselStock)} L / Rs. {formatNumber(initialTotalAmount)}</span></p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-cyan-500/20">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-900">
                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-center">Adds</th>
                          <th className="px-4 py-3 text-right">Initial Diesel</th>
                          <th className="px-4 py-3 text-right">Initial Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {filteredInitialByDate.map((row) => (
                          <tr key={row.date} className="hover:bg-slate-800/40">
                            <td className="px-4 py-3 font-bold">{row.date}</td>
                            <td className="px-4 py-3 text-center"><span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold">{row.count}</span></td>
                            <td className="px-4 py-3 text-right font-bold text-cyan-300">{formatNumber(row.diesel)} L</td>
                            <td className="px-4 py-3 text-right font-bold">Rs. {formatNumber(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900">
                        <tr className="font-black">
                          <td className="px-4 py-3 text-slate-400">Total (History)</td>
                          <td className="px-4 py-3 text-center">{initialHistory.length}</td>
                          <td className="px-4 py-3 text-right text-cyan-300">{formatNumber(totalInitialHistoryDiesel)} L</td>
                          <td className="px-4 py-3 text-right">Rs. {formatNumber(totalInitialHistoryAmount)}</td>
                        </tr>
                        <tr className="font-black text-[11px] text-slate-500">
                          <td colSpan={2} className="px-4 py-2">DB Total</td>
                          <td className="px-4 py-2 text-right">{formatNumber(initialDieselStock)} L</td>
                          <td className="px-4 py-2 text-right">Rs. {formatNumber(initialTotalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Date Wise Summary</h3>
                  <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold">{dateWiseSummary.length} Days</span>
                </div>
                {dateWiseSummary.length === 0 ? (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-500">Thama records na</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-800">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-900">
                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3 text-center">Records</th>
                          <th className="px-4 py-3 text-right">Diesel</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {dateWiseSummary.map((row) => (
                          <tr key={row.date} className="hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <p className="font-bold">{row.date}</p>
                              <p className="text-[11px] text-slate-500">{Array.from(row.machines).slice(0, 2).join(", ")}{row.machines.size > 2 ? ` +${row.machines.size - 2} more` : ""}</p>
                            </td>
                            <td className="px-4 py-3 text-center"><span className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold">{row.count}</span></td>
                            <td className="px-4 py-3 text-right font-bold text-cyan-300">{formatNumber(row.diesel)} L</td>
                            <td className="px-4 py-3 text-right font-bold">Rs. {formatNumber(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900">
                        <tr className="font-black">
                          <td className="px-4 py-3 text-slate-400">Total</td>
                          <td className="px-4 py-3 text-center">{expenses.length}</td>
                          <td className="px-4 py-3 text-right text-cyan-300">{formatNumber(totalUsedDiesel)} L</td>
                          <td className="px-4 py-3 text-right">Rs. {formatNumber(totalPayable)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Machine Wise</h3>
                <div className="space-y-2">
                  {machineWiseSummary.map((m) => (
                    <div key={m.machine} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                      <div><p className="font-bold text-sm">{m.machine}</p><p className="text-[11px] text-slate-500">{m.count} records</p></div>
                      <div className="text-right"><p className="font-black text-cyan-300 text-sm">{formatNumber(m.diesel)} L</p><p className="text-[11px] text-slate-400">Rs. {formatNumber(m.amount)}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-800 bg-slate-900/80 px-6 py-4">
              <button onClick={() => setShowInitialSummary(false)} className="flex-1 rounded-xl bg-cyan-500 py-3 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-cyan-400">Close</button>
              <button onClick={() => window.print()} className="rounded-xl border border-slate-700 px-5 py-3 text-xs font-bold hover:bg-slate-800">Print</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
function SummaryCard({ title, subtitle, value, icon, color }: { title: string; subtitle: string; value: string; icon: React.ReactNode; color: CardColor; }) {
  const s: any = { cyan: { b: "border-cyan-500/25", i: "bg-cyan-500/10 text-cyan-400", v: "text-cyan-300" }, blue: { b: "border-blue-500/25", i: "bg-blue-500/10 text-blue-400", v: "text-blue-300" }, orange: { b: "border-orange-500/25", i: "bg-orange-500/10 text-orange-400", v: "text-orange-300" }, green: { b: "border-green-500/25", i: "bg-green-500/10 text-green-400", v: "text-green-300" }, red: { b: "border-red-500/25", i: "bg-red-500/10 text-red-400", v: "text-red-300" }, violet: { b: "border-violet-500/25", i: "bg-violet-500/10 text-violet-400", v: "text-violet-300" } };
  const c = s[color]; return (<div className={`rounded-2xl border bg-slate-900 p-5 ${c.b}`}><div className="flex justify-between"><div><p className="text-sm font-bold">{title}</p><p className="text-xs text-slate-500 mt-1">{subtitle}</p><h2 className={`mt-4 text-xl font-bold ${c.v}`}>{value}</h2></div><span className={`h-10 w-10 flex items-center justify-center rounded-xl ${c.i}`}>{icon}</span></div></div>);
}