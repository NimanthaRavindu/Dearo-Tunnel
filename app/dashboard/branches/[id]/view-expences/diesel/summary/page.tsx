"use client";
import React, { use, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Fuel, PieChart, Printer, Calendar, TrendingUp, Droplets, Wallet, BarChart3, Download } from "lucide-react";

interface Props { params: Promise<{ id: string }> }
interface DieselExpense { id?: any; date?: string; machine?: string; diesel?: any; amount?: any; payable?: any; paid?: any; balance?: any; branch_id?: any; }

function num(v: any){ return Number(v||0)||0 }
function dateOnly(v: any){ return String(v||"").slice(0,10) }
function formatDate(v: any){ const d=dateOnly(v); if(!d) return "-"; const [y,m,day]=d.split("-"); return `${day}/${m}/${y}` }
function formatMoney(v:number){ return `Rs. ${v.toLocaleString("en-LK",{minimumFractionDigits:2, maximumFractionDigits:2})}` }
function formatDiesel(v:any){ return num(v).toLocaleString("en-LK",{maximumFractionDigits:2}) }

export default function DieselSummaryPage({ params }: Props) {
  const { id } = use(params);
  const branchId = decodeURIComponent(id);
  const searchParams = useSearchParams();
  const router = useRouter();
  const filterDate = searchParams.get("date") || "";
  const filterMachine = searchParams.get("machine") || "";
  const filterSearch = searchParams.get("search") || "";

  const [records, setRecords] = useState<DieselExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(){
      try{
        setLoading(true);
        const q = new URLSearchParams(); q.set("branch_id", branchId);
        const res = await fetch(`/api/expences/diesel?${q.toString()}`, { cache: "no-store" });
        const json = await res.json();
        const data = json.data || json.expenses || json.rows || json || [];
        setRecords(Array.isArray(data)? data : []);
      } finally{ setLoading(false) }
    }
    load();
  }, [branchId]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchDate =!filterDate || dateOnly(r.date) === filterDate;
      const matchMachine =!filterMachine || r.machine === filterMachine;
      const matchSearch =!filterSearch || JSON.stringify(r).toLowerCase().includes(filterSearch.toLowerCase());
      return matchDate && matchMachine && matchSearch;
    });
  }, [records, filterDate, filterMachine, filterSearch]);

  const summary = useMemo(() => {
    return filtered.reduce((t,r) => ({
      diesel: t.diesel + num(r.diesel),
      amount: t.amount + num(r.amount),
      payable: t.payable + num(r.payable||r.amount),
      paid: t.paid + num(r.paid),
      balance: t.balance + num(r.balance)
    }), { diesel:0, amount:0, payable:0, paid:0, balance:0 });
  }, [filtered]);

  const byMachine = useMemo(() => {
    const map = new Map<string, {d:number,a:number,c:number}>();
    filtered.forEach(r => {
      const k = r.machine || "Unknown";
      const cur = map.get(k) || {d:0,a:0,c:0};
      cur.d+=num(r.diesel); cur.a+=num(r.amount); cur.c+=1;
      map.set(k,cur);
    });
    return Array.from(map.entries()).map(([m,v])=>({machine:m,d:v.d,a:v.a,c:v.c})).sort((a,b)=>b.d-a.d);
  }, [filtered]);

  const byDate = useMemo(() => {
    const map = new Map<string, {d:number,a:number}>();
    filtered.forEach(r => {
      const d = dateOnly(r.date);
      const cur = map.get(d) || {d:0,a:0};
      cur.d+=num(r.diesel); cur.a+=num(r.amount);
      map.set(d,cur);
    });
    return Array.from(map.entries()).map(([date,v])=>({date,d:v.d,a:v.a})).sort((a,b)=>a.date.localeCompare(b.date));
  }, [filtered]);

  if(loading) return <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center text-slate-400 gap-3"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>Loading summary...</div>

  return (
    <main className="min-h-screen bg-[#070a12] text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER - PROFESSIONAL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 rounded-xl bg-[#0d1527] border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/30 transition"><ArrowLeft size={18}/></button>
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500 shadow-lg shadow-cyan-500/20 text-black"><BarChart3 size={22}/></div>
              <div>
                <p className="text-[11px] tracking-[0.25em] text-cyan-400 font-black">DEARO INVESTMENT LIMITED • DIESEL REPORT</p>
                <h1 className="text-2xl font-black tracking-tight text-white mt-1">Diesel Expense Summary</h1>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">Branch: {branchId}</span>
                  {filterDate && <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">Date: {formatDate(filterDate)}</span>}
                  {filterMachine && <span className="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">Machine: {filterMachine}</span>}
                  {filterSearch && <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">Search: {filterSearch}</span>}
                  <span className="text-slate-500">• {filtered.length} Records • {new Date().toLocaleDateString()}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-black text-xs tracking-wider hover:bg-slate-200 transition"><Printer size={14}/> PRINT</button>
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0d1527] border border-slate-800 font-bold text-xs"><Download size={14}/> Export</button>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="group rounded-[20px] bg-gradient-to-br from-[#0d1527] to-[#0a1020] border border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start"><div><p className="text-[10px] tracking-widest font-bold text-slate-500">TOTAL DIESEL CONSUMED</p><h2 className="text-4xl font-black mt-3 text-white">{formatDiesel(summary.diesel)}<span className="text-lg text-slate-500 ml-1">L</span></h2></div><div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"><Droplets size={20}/></div></div>
            <p className="mt-4 text-xs text-cyan-400 flex items-center gap-1"><TrendingUp size={12}/> {filtered.length} Transactions • Avg {(summary.diesel/(filtered.length||1)).toFixed(1)}L</p>
          </div>
          <div className="group rounded-[20px] bg-gradient-to-br from-[#0d1527] to-[#0a1020] border border-amber-500/20 p-6 hover:border-amber-500/40 transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start"><div><p className="text-[10px] tracking-widest font-bold text-slate-500">TOTAL EXPENDITURE</p><h2 className="text-2xl font-black mt-3 text-white">{formatMoney(summary.amount)}</h2></div><div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400"><Wallet size={20}/></div></div>
            <p className="mt-4 text-xs text-slate-500">Payable: {formatMoney(summary.payable)} • Paid: {formatMoney(summary.paid)}</p>
          </div>
          <div className="group rounded-[20px] bg-gradient-to-br from-[#0d1527] to-[#0a1020] border border-emerald-500/20 p-6 hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start"><div><p className="text-[10px] tracking-widest font-bold text-slate-500">AVERAGE PRICE</p><h2 className="text-2xl font-black mt-3 text-emerald-400">Rs. {(summary.amount/(summary.diesel||1)).toFixed(2)}<span className="text-sm text-slate-500"> / L</span></h2></div><div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><Fuel size={20}/></div></div>
            <p className="mt-4 text-xs text-slate-500">Based on {filtered.length} records</p>
          </div>
          <div className="group rounded-[20px] bg-gradient-to-br from-[#0d1527] to-[#0a1020] border border-rose-500/20 p-6 hover:border-rose-500/40 transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start"><div><p className="text-[10px] tracking-widest font-bold text-slate-500">OUTSTANDING BALANCE</p><h2 className="text-2xl font-black mt-3 text-white">{formatMoney(summary.balance)}</h2></div><div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400"><Calendar size={20}/></div></div>
            <p className="mt-4 text-xs text-emerald-400">✓ {summary.balance === 0? "All Paid" : "Pending Balance"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MACHINE BREAKDOWN */}
          <div className="lg:col-span-2 rounded-[20px] bg-[#0d1527] border border-slate-800 p-7">
            <div className="flex justify-between items-center mb-7"><h3 className="font-black text-sm tracking-[0.15em] text-white flex items-center gap-2"><PieChart size={18} className="text-cyan-400"/> CONSUMPTION BY MACHINE</h3><span className="text-[10px] text-slate-500 border border-slate-700 rounded-full px-3 py-1">{byMachine.length} Machines</span></div>
            <div className="space-y-6">
              {byMachine.map(m => {
                const pct = summary.diesel? (m.d/ summary.diesel)*100 : 0;
                return (
                  <div key={m.machine} className="group">
                    <div className="flex justify-between items-end mb-2.5"><span className="font-bold text-white text-sm">{m.machine}</span><span className="text-xs text-slate-400">{m.c} records • <span className="text-cyan-300 font-bold">{formatDiesel(m.d)} L</span> • {pct.toFixed(1)}%</span></div>
                    <div className="h-3 w-full bg-[#070a12] rounded-full overflow-hidden border border-slate-800/50 p-1"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-1000" style={{width: `${pct}%`}}></div></div>
                    <div className="flex justify-between mt-2 text-[11px]"><span className="text-slate-500">{formatMoney(m.a)}</span><span className="text-slate-400 font-medium">Rs. {(m.a/m.d).toFixed(2)} / L</span></div>
                  </div>
                )
              })}
              {byMachine.length === 0 && <p className="text-center text-slate-500 py-10 text-sm">No data for selected filter</p>}
            </div>
          </div>

          {/* DAILY + INSIGHTS */}
          <div className="space-y-6">
            <div className="rounded-[20px] bg-[#0d1527] border border-slate-800 p-6">
              <h3 className="font-black text-xs tracking-widest mb-5">DAILY BREAKDOWN</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {byDate.map(d => (
                  <div key={d.date} className="flex justify-between items-center bg-[#070a12] border border-slate-800/60 rounded-xl px-4 py-3 hover:border-cyan-500/20 transition">
                    <span className="text-xs font-medium text-slate-300">{formatDate(d.date)}</span>
                    <div className="text-right"><p className="text-xs font-black text-cyan-400">{formatDiesel(d.d)} L</p><p className="text-[11px] text-slate-500">{formatMoney(d.a)}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] bg-gradient-to-br from-amber-500/[0.08] to-transparent border border-amber-500/20 p-6">
              <h4 className="text-xs font-black tracking-widest text-amber-400 mb-3">KEY INSIGHTS</h4>
              <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                {byMachine[0] && <li className="flex gap-2"><span className="text-amber-400">•</span> <span>Highest consumer is <b className="text-white">{byMachine[0].machine}</b> with {formatDiesel(byMachine[0].d)} L ({((byMachine[0].d/summary.diesel)*100).toFixed(1)}%)</span></li>}
                <li className="flex gap-2"><span className="text-amber-400">•</span> <span>Average daily usage {formatDiesel(summary.diesel/(byDate.length||1))} L</span></li>
                <li className="flex gap-2"><span className="text-amber-400">•</span> <span>Average cost Rs. {(summary.amount/(summary.diesel||1)).toFixed(2)} per liter</span></li>
                <li className="flex gap-2"><span className="text-amber-400">•</span> <span>Payment status: {summary.balance === 0? "100% cleared" : formatMoney(summary.balance) + " pending"}</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* FULL TABLE */}
        <div className="mt-8 rounded-[20px] border border-slate-800 bg-[#0d1527] overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0a1020]"><h3 className="font-black text-sm tracking-widest">COMPLETE RECORD TABLE - {filtered.length} RECORDS</h3><span className="text-xs text-slate-500">Branch {branchId}</span></div>
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-[#070a12] text-[10px] tracking-widest text-slate-500 uppercase"><tr><th className="p-4 text-left">Date</th><th className="p-4 text-left">Machine</th><th className="p-4 text-right">Diesel</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right">Payable</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right">Balance</th></tr></thead><tbody className="divide-y divide-slate-800/50">{filtered.map((r,i) => <tr key={i} className="hover:bg-cyan-500/[0.04] transition"><td className="p-4 text-slate-300">{formatDate(r.date)}</td><td className="p-4 font-bold text-white">{r.machine}</td><td className="p-4 text-right font-bold text-cyan-400">{formatDiesel(r.diesel)} L</td><td className="p-4 text-right">{formatMoney(num(r.amount))}</td><td className="p-4 text-right text-amber-400">{formatMoney(num(r.payable||r.amount))}</td><td className="p-4 text-right text-emerald-400">{formatMoney(num(r.paid))}</td><td className="p-4 text-right font-bold text-rose-400">{formatMoney(num(r.balance))}</td></tr>)}</tbody><tfoot className="bg-[#0a1020] font-black border-t border-slate-700"><tr><td colSpan={2} className="p-4 text-slate-400">TOTAL - FILTERED</td><td className="p-4 text-right text-cyan-400">{formatDiesel(summary.diesel)} L</td><td className="p-4 text-right">{formatMoney(summary.amount)}</td><td className="p-4 text-right text-amber-400">{formatMoney(summary.payable)}</td><td className="p-4 text-right text-emerald-400">{formatMoney(summary.paid)}</td><td className="p-4 text-right text-rose-400">{formatMoney(summary.balance)}</td></tr></tfoot></table></div>
        </div>

        <div className="text-center py-8"><p className="text-[10px] tracking-widest text-slate-600">DEARO INVESTMENT LIMITED © 2026 • CENTRAL SYSTEM • AUTO-GENERATED REPORT • {new Date().toLocaleString()}</p></div>
      </div>
    </main>
  )
}