"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, CircleDollarSign, Fuel, Loader2, RefreshCw, Search, X, Droplets, AlertCircle, CreditCard, Wallet, Settings2, TrendingUp, BarChart3, PieChart, Printer, Download } from "lucide-react";

interface PageProps { params: Promise<{ id: string }> }
interface DieselExpense {
  id?: number | string; branch_id?: number | string; date?: string; machine?: string;
  diesel?: number | string; amount?: number | string; payable?: number | string; paid?: number | string; balance?: number | string;
}
interface ApiResponse { success?: boolean; data?: DieselExpense[]; expenses?: DieselExpense[]; rows?: DieselExpense[]; error?: string; }
interface DieselSummary { diesel: number; amount: number; payable: number; paid: number; balance: number; }

const DIESEL_API = "/api/expences/diesel";
const EMPTY_SUMMARY: DieselSummary = { diesel: 0, amount: 0, payable: 0, paid: 0, balance: 0 };
const INITIAL_DIESEL_STOCK = 0.00;

function numeric(value: unknown): number { return Number(value?? 0) || 0; }
function dateOnly(value: unknown): string { return String(value?? "").slice(0, 10); }
function formatDate(value: unknown): string {
  const date = dateOnly(value); if (!date) return "-";
  const [year, month, day] = date.split("-");
  return year && month && day? `${day}/${month}/${year}` : date;
}
function formatMoney(value: number): string { return `Rs. ${value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function formatDiesel(value: unknown): string { return numeric(value).toLocaleString("en-LK", { maximumFractionDigits: 3 }); }
function extractRecords(result: unknown): DieselExpense[] {
  if (Array.isArray(result)) return result;
  if (!result || typeof result!== "object") return [];
  const response = result as ApiResponse;
  if (Array.isArray(response.expenses)) return response.expenses;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.rows)) return response.rows;
  return [];
}
function normalizeRecord(record: DieselExpense): DieselExpense {
  const payable = numeric(record.payable?? record.amount);
  const paid = numeric(record.paid);
  return {...record, balance: numeric(record.balance?? payable - paid) };
}

export default function DieselExpensesPage({ params }: PageProps) {
  const router = useRouter();
  const routeParams = use(params);
  const branchId = routeParams?.id? decodeURIComponent(routeParams.id) : "";
  const [records, setRecords] = useState<DieselExpense[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [search, setSearch] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DieselExpense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async () => {
    if (!branchId || branchId === "[id]") { setLoading(false); return; }
    try {
      setLoading(true); setError("");
      const query = new URLSearchParams(); query.set("branch_id", branchId);
      const response = await fetch(`${DIESEL_API}?${query.toString()}`, { cache: "no-store" });
      const result: ApiResponse = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.error || "Failed to load diesel expenses.");
      setRecords(extractRecords(result).map(normalizeRecord));
    } catch (requestError) {
      setRecords([]); setError(requestError instanceof Error? requestError.message : "Unable to load diesel expenses.");
    } finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const machineList = useMemo(() => {
    const machines = records.map(r => r.machine).filter(Boolean) as string[];
    return Array.from(new Set(machines));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesDate =!selectedDate || dateOnly(record.date) === selectedDate;
      const matchesMachine =!selectedMachine || record.machine === selectedMachine;
      const matchesSearch =!query || [record.id, record.branch_id, record.date, record.machine, record.diesel, record.amount, record.payable, record.paid, record.balance].some((value) => String(value?? "").toLowerCase().includes(query));
      return matchesDate && matchesMachine && matchesSearch;
    });
  }, [records, selectedDate, selectedMachine, search]);

  const summary = useMemo<DieselSummary>(() => {
    return filteredRecords.reduce<DieselSummary>((total, record) => ({
      diesel: total.diesel + numeric(record.diesel),
      amount: total.amount + numeric(record.amount),
      payable: total.payable + numeric(record.payable?? record.amount),
      paid: total.paid + numeric(record.paid),
      balance: total.balance + numeric(record.balance),
    }), EMPTY_SUMMARY);
  }, [filteredRecords]);

  // For Summary Modal
  const machineBreakdown = useMemo(() => {
    const map = new Map<string, { diesel: number, amount: number, count: number }>();
    filteredRecords.forEach(r => {
      const key = r.machine || "Unknown";
      const cur = map.get(key) || { diesel: 0, amount: 0, count: 0 };
      cur.diesel += numeric(r.diesel);
      cur.amount += numeric(r.amount);
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries()).map(([machine, v]) => ({ machine,...v })).sort((a,b) => b.diesel - a.diesel);
  }, [filteredRecords]);

  const dailyBreakdown = useMemo(() => {
    const map = new Map<string, { diesel: number, amount: number }>();
    filteredRecords.forEach(r => {
      const d = dateOnly(r.date);
      const cur = map.get(d) || { diesel: 0, amount: 0 };
      cur.diesel += numeric(r.diesel);
      cur.amount += numeric(r.amount);
      map.set(d, cur);
    });
    return Array.from(map.entries()).map(([date, v]) => ({ date,...v })).sort((a,b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  const clearFilters = () => { setSelectedDate(""); setSelectedMachine(""); setSearch(""); };
  const openRecordInTotalExpenses = (record: DieselExpense) => {
    if (!record.id) return;
    const query = new URLSearchParams(); query.set("selected_diesel_id", String(record.id));
    router.push(`/dashboard/total-expenses?${query.toString()}`);
  };
  const handleRecordClick = (record: DieselExpense) => { setSelectedRecord(record); openRecordInTotalExpenses(record); };

  return (
    <main className="min-h-screen bg-[#070a12] p-4 font-sans text-slate-200 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-800/80 pb-6 xl:flex-row xl:items-center">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => router.push(`/dashboard/branches/${encodeURIComponent(branchId)}/view-expences`)} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-slate-400 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-white"><ArrowLeft size={17} /></button>
            <div><div className="flex items-center gap-3"><div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-400"><Fuel size={20} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">Expense Management</p><h1 className="mt-1 font-mono text-xl font-black uppercase tracking-wider text-white">Diesel Expenses</h1></div></div><p className="mt-3 text-xs text-slate-500">Branch ID: <span className="font-semibold text-purple-400">{branchId}</span></p></div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative"><CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#0d1527] py-3 pl-10 pr-3 text-xs text-slate-300 outline-none focus:border-cyan-500 sm:w-auto" /></div>
            <div className="relative">
              <Settings2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select value={selectedMachine} onChange={(e) => setSelectedMachine(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-800 bg-[#0d1527] py-3 pl-10 pr-8 text-xs text-slate-300 outline-none focus:border-cyan-500 sm:w-40">
                <option value="">All Machines</option>
                {machineList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button type="button" onClick={loadRecords} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#0d1527] px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-400 disabled:opacity-50"><RefreshCw size={15} className={loading? "animate-spin" : ""} />Refresh</button>
            <button type="button" onClick={() => setShowSummary(true)} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"><BarChart3 size={15} />View Summary</button>
          </div>
        </header>

        {error && (<div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"><span>{error}</span><button type="button" onClick={loadRecords} className="font-bold underline">Retry</button></div>)}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Diesel Used" value={`${formatDiesel(summary.diesel)} L`} subtitle="Table total" icon={<Droplets size={19} />} color="cyan" />
          <MetricCard title="Total Amount" value={formatMoney(summary.amount)} subtitle="Amount total" icon={<Wallet size={19} />} color="amber" />
          <MetricCard title="Remaining Balance" value={formatMoney(summary.balance)} subtitle="Payable - Paid" icon={<CreditCard size={19} />} color="emerald" />
          <MetricCard title="Total Diesel" value={`${formatDiesel(INITIAL_DIESEL_STOCK)} L`} subtitle="Initial Stock" icon={<AlertCircle size={19} />} color="rose" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1527] shadow-2xl">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 lg:flex-row lg:items-center">
            <div><h2 className="font-mono text-sm font-bold uppercase tracking-widest text-white">Diesel Expense Register</h2><p className="mt-1 text-xs text-slate-500">{selectedDate || selectedMachine? `Filtered: ${selectedDate? formatDate(selectedDate) : ""} ${selectedMachine? `| ${selectedMachine}` : ""}` : "Showing all available branch records"}</p></div>
            <div className="flex gap-3">
              <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." className="w-full rounded-xl border border-slate-800 bg-[#070a12] py-2.5 pl-9 pr-3 text-xs text-slate-300 outline-none focus:border-cyan-500 sm:w-56" /></div>
              {(selectedDate || selectedMachine || search) && (<button type="button" onClick={clearFilters} className="rounded-xl border border-slate-800 bg-red-500/10 px-4 text-xs font-bold text-red-400 transition hover:bg-red-500/20">Clear Filters</button>)}
            </div>
          </div>
          {loading? (<div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-sm text-slate-500"><Loader2 size={28} className="animate-spin text-cyan-400" />Loading...</div>) : filteredRecords.length === 0? (<div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-500"><Fuel size={30} className="text-slate-700" /><p>No records found for selected filter.</p></div>) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[1150px]"><thead><tr className="border-b border-slate-800 bg-[#0a1020] text-left text-[10px] font-bold uppercase tracking-wider text-slate-500"><th className="px-5 py-4">Branch ID</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Machine</th><th className="px-5 py-4 text-right">Diesel</th><th className="px-5 py-4 text-right">Amount</th><th className="px-5 py-4 text-right">Payable</th><th className="px-5 py-4 text-right">Paid</th><th className="px-5 py-4 text-right">Balance</th><th className="px-5 py-4 text-center">Action</th></tr></thead><tbody className="divide-y divide-slate-800/70">{filteredRecords.map((record, index) => (<tr key={record.id?? `${record.date}-${record.machine}-${index}`} onClick={() => handleRecordClick(record)} className="cursor-pointer transition hover:bg-cyan-500/[0.08]"><td className="px-5 py-4 text-xs text-slate-400">{record.branch_id?? branchId}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-300">{formatDate(record.date)}</td><td className="px-5 py-4 text-sm font-bold text-white">{record.machine || "-"}</td><td className="px-5 py-4 text-right text-sm font-semibold text-cyan-400">{formatDiesel(record.diesel)} L</td><td className="px-5 py-4 text-right text-sm text-slate-200">{formatMoney(numeric(record.amount))}</td><td className="px-5 py-4 text-right text-sm text-amber-400">{formatMoney(numeric(record.payable?? record.amount))}</td><td className="px-5 py-4 text-right text-sm text-emerald-400">{formatMoney(numeric(record.paid))}</td><td className="px-5 py-4 text-right text-sm font-bold text-rose-400">{formatMoney(numeric(record.balance))}</td><td className="px-5 py-4 text-center"><button type="button" onClick={(e) => { e.stopPropagation(); handleRecordClick(record); }} className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950">View</button></td></tr>))}</tbody><tfoot><tr className="border-t border-slate-700 bg-[#0a1020] text-sm font-bold"><td colSpan={3} className="px-5 py-4 text-slate-400">Filtered Total</td><td className="px-5 py-4 text-right text-cyan-400">{formatDiesel(summary.diesel)} L</td><td className="px-5 py-4 text-right text-white">{formatMoney(summary.amount)}</td><td className="px-5 py-4 text-right text-amber-400">{formatMoney(summary.payable)}</td><td className="px-5 py-4 text-right text-emerald-400">{formatMoney(summary.paid)}</td><td className="px-5 py-4 text-right text-rose-400">{formatMoney(summary.balance)}</td><td /></tr></tfoot></table></div>)}
        </section>
      </div>

      {/* ===== PROFESSIONAL SUMMARY MODAL ===== */}
      {showSummary && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4">
          <div className="my-8 w-full max-w-6xl animate-in fade-in zoom-in">
            <div className="overflow-hidden rounded-[24px] border border-slate-700 bg-[#0a0e1a] shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d1527] px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-cyan-500 p-3 text-black"><BarChart3 size={22} /></div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">DEARO INVESTMENT LIMITED • Branch {branchId}</p>
                    <h2 className="text-2xl font-black tracking-tight text-white">Diesel Expense Summary Report</h2>
                    <p className="mt-1 text-xs text-slate-400">Filtered {filteredRecords.length} records • {selectedDate? formatDate(selectedDate) : "All Dates"} {selectedMachine? `• ${selectedMachine}` : "• All Machines"} • Generated {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 flex items-center gap-2"><Printer size={14}/> Print</button>
                  <button onClick={() => setShowSummary(false)} className="rounded-xl bg-white p-2.5 text-black hover:bg-slate-200"><X size={18}/></button>
                </div>
              </div>

              <div className="p-8 space-y-6 bg-[#070a12]">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-5"><p className="text-[10px] tracking-widest text-slate-500 font-bold">TOTAL CONSUMPTION</p><p className="mt-2 text-3xl font-black text-white">{formatDiesel(summary.diesel)} L</p><p className="mt-1 text-xs text-cyan-400 flex items-center gap-1"><TrendingUp size={12}/> {filteredRecords.length} Transactions</p></div>
                  <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5"><p className="text-[10px] tracking-widest text-slate-500 font-bold">TOTAL EXPENDITURE</p><p className="mt-2 text-2xl font-black text-white">{formatMoney(summary.amount)}</p><p className="mt-1 text-xs text-slate-400">Avg {formatMoney(summary.amount / (filteredRecords.length || 1))} / entry</p></div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5"><p className="text-[10px] tracking-widest text-slate-500 font-bold">PAYMENT STATUS</p><p className="mt-2 text-2xl font-black text-emerald-400">100% Paid</p><p className="mt-1 text-xs text-slate-400">Balance {formatMoney(summary.balance)}</p></div>
                  <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-5"><p className="text-[10px] tracking-widest text-slate-500 font-bold">AVG PRICE / L</p><p className="mt-2 text-2xl font-black text-white">Rs. {(summary.amount / (summary.diesel || 1)).toFixed(2)}</p><p className="mt-1 text-xs text-violet-300">Across all machines</p></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Machine Breakdown */}
                  <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-[#0d1527] p-6">
                    <h3 className="font-bold text-sm tracking-widest text-white flex items-center gap-2"><PieChart size={16} className="text-cyan-400"/> CONSUMPTION BY MACHINE</h3>
                    <div className="mt-6 space-y-4">
                      {machineBreakdown.map((m) => {
                        const percent = summary.diesel? (m.diesel / summary.diesel) * 100 : 0;
                        return (
                          <div key={m.machine} className="group">
                            <div className="flex justify-between text-xs mb-2"><span className="font-bold text-white">{m.machine}</span><span className="text-slate-400">{m.count} records • {formatDiesel(m.diesel)} L • {percent.toFixed(1)}%</span></div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700" style={{ width: `${percent}%` }}></div></div>
                            <div className="mt-1 flex justify-between text-[11px] text-slate-500"><span>{formatMoney(m.amount)}</span><span>Rs. {(m.amount / (m.diesel || 1)).toFixed(2)} / L</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-6">
                      <h3 className="font-bold text-sm tracking-widest text-white">DAILY TREND</h3>
                      <div className="mt-5 space-y-2 max-h-[260px] overflow-y-auto pr-2">
                        {dailyBreakdown.map(d => (
                          <div key={d.date} className="flex items-center justify-between rounded-xl bg-[#070a12] border border-slate-800/50 px-4 py-3">
                            <span className="text-xs font-medium text-slate-300">{formatDate(d.date)}</span>
                            <div className="text-right"><p className="text-xs font-bold text-cyan-400">{formatDiesel(d.diesel)} L</p><p className="text-[11px] text-slate-500">{formatMoney(d.amount)}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
                      <h4 className="text-xs font-black tracking-widest text-amber-400"><AlertCircle size={12} className="inline mr-1"/> KEY INSIGHTS</h4>
                      <ul className="mt-3 space-y-2 text-xs text-slate-300 leading-relaxed">
                        <li>• Highest consumption: <span className="font-bold text-white">{machineBreakdown[0]?.machine}</span> with {formatDiesel(machineBreakdown[0]?.diesel)} L ({machineBreakdown[0]? ((machineBreakdown[0].diesel / summary.diesel)*100).toFixed(1) : 0}% )</li>
                        <li>• Average daily use: {formatDiesel(summary.diesel / (dailyBreakdown.length || 1))} L</li>
                        <li>• All payments cleared, no outstanding balance</li>
                        <li>• Recommended: Review {machineBreakdown[0]?.machine} usage pattern</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer Table */}
                <div className="rounded-2xl border border-slate-800 bg-[#0d1527] overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center"><h3 className="font-bold text-sm text-white">SUMMARY TABLE - FILTERED RECORDS ({filteredRecords.length})</h3><span className="text-[10px] text-slate-500">Branch {branchId} • {formatMoney(summary.amount)}</span></div>
                  <div className="overflow-x-auto max-h-[300px]"><table className="w-full text-xs"><thead className="sticky top-0 bg-[#0a1020] text-[10px] text-slate-500 uppercase"><tr><th className="px-5 py-3 text-left">Date</th><th className="px-5 py-3 text-left">Machine</th><th className="px-5 py-3 text-right">Diesel</th><th className="px-5 py-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-800/50">{filteredRecords.map((r,i) => (<tr key={i}><td className="px-5 py-2.5 text-slate-300">{formatDate(r.date)}</td><td className="px-5 py-2.5 font-bold text-white">{r.machine}</td><td className="px-5 py-2.5 text-right text-cyan-400">{formatDiesel(r.diesel)} L</td><td className="px-5 py-2.5 text-right">{formatMoney(numeric(r.amount))}</td></tr>))}</tbody></table></div>
                </div>

                <div className="text-center text-[10px] text-slate-600 pt-2">DEARO INVESTMENT LIMITED • CENTRAL SYSTEM • This report is auto-generated from live expense register</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({ title, value, subtitle, icon, color }: { title: string; value: string; subtitle?: string; icon: React.ReactNode; color: "cyan" | "amber" | "emerald" | "rose"; }) {
  const styles = { cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400", amber: "border-amber-500/20 bg-amber-500/10 text-amber-400", emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400", rose: "border-rose-500/20 bg-rose-500/10 text-rose-400" };
  return (<div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p><p className="mt-3 text-xl font-black text-white">{value}</p>{subtitle && <p className="mt-1 text-[10px] text-slate-500">{subtitle}</p>}</div><div className={`rounded-xl border p-3 ${styles[color]}`}>{icon}</div></div></div>);
}