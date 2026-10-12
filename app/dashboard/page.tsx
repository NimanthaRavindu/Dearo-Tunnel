"use client";
import React, { Suspense,useCallback,useEffect,useState, useMemo} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {Chart as ChartJS,CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Building2,TrendingUp,AlertCircle,RefreshCw,ChevronUp,ChevronDown,MapPin,Filter,X,Sparkles, Search} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function DashboardContent({ searchQuery = "" }: { searchQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");
  const selectedDieselId = searchParams.get("selected_diesel_id");
  const selectedBranchId = searchParams.get("branch_id");
  const selectedDate = searchParams.get("date");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTunnelDropdownOpen, setIsTunnelDropdownOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const fetchDashboardData = useCallback(async () => {
    try {
      const params = new URLSearchParams(searchParams.toString());
      const res = await fetch(`/api/dashboard/summary?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      console.log("FULL API:", json);
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed");
    } finally { setLoading(false); }
  }, [searchParams]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const updateBranchFilter = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("branch_id", id); else params.delete("branch_id");
    router.push(`/dashboard?${params.toString()}`);
  };
  const clearFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "branch") params.delete("branch_id");
    if (type === "sales") params.delete("selected_sales_id");
    if (type === "capital") params.delete("selected_capital_id");
    if (type === "diesel") params.delete("selected_diesel_id");
    router.push(`/dashboard?${params.toString()}`);
  };

  const filteredBranches = useMemo(() => {
    if (!data?.branches) return [];
    let b = data.branches as any[];
    if (searchQuery) b = b.filter((x:any)=> String(x.branch_name||"").toLowerCase().includes(searchQuery.toLowerCase()));
    if (localSearch) b = b.filter((x:any)=> String(x.branch_name||"").toLowerCase().includes(localSearch.toLowerCase()));
    return b;
  }, [data, searchQuery, localSearch]);

  // ===== CHART FIX - FALLBACK TO total_expenses IF sales_expenses = 0 =====
  const chartData = useMemo(() => {
    const hasSales = filteredBranches.some((x:any)=> Number(x.sales_expenses||0) > 0);
    return {
      labels: filteredBranches.map((x:any)=> x.branch_code || `BR-${x.id}`),
      datasets: [
        {
          label: hasSales? "Sales Expenses (Rs.)" : "Total Expenses (Rs.)",
          data: filteredBranches.map((x:any)=> {
            const sales = Number(x.sales_expenses||0);
            // sales 0 nam total_expenses gannawa chart eka pennanna
            return sales > 0? sales : Number(x.total_expenses||0);
          }),
          backgroundColor: "#3b82f6",
          borderRadius: 4,
          barThickness: 12,
        },
        {
          label: "Total Incomes (Rs.)",
          data: filteredBranches.map((x:any)=> Number(x.total_incomes|| x.income_total||0)),
          backgroundColor: "#ef4444",
          borderRadius: 4,
          barThickness: 12,
        },
      ],
    };
  }, [filteredBranches]);

  const chartOptions:any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: "#94a3b8", font: { size: 11 }, boxWidth: 12 } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 9 } } },
      y: { grid: { color: "#1e293b" }, ticks: { color: "#64748b" }, beginAtZero: true },
    },
  };

  if (loading) return <div className="h-screen bg-[#070a12] flex items-center justify-center text-slate-500 font-mono text-xs">Loading...</div>;
  if (error) return <div className="h-screen bg-[#070a12] flex items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-[#070a12] min-h-screen text-slate-300 font-mono text-xs">
      <div className="flex justify-between gap-4 flex-wrap">
        <div><h2 className="text-xl font-bold text-white">Financial & Tunnel Logistics</h2><p className="text-slate-500 text-xs">Real-time ledger for all branches</p></div>
        <div className="flex gap-2 flex-wrap">
          <select value={selectedBranchId||""} onChange={(e)=>updateBranchFilter(e.target.value)} className="bg-[#0d1527] border border-slate-700 rounded-lg px-3 py-1.5 text-cyan-300 text-[11px] min-w-[180px]">
            <option value="">All Branches ({data?.branches?.length||0})</option>
            {data?.branches?.map((b:any)=><option key={b.id} value={String(b.id)}>{b.branch_name} - {b.branch_code}</option>)}
          </select>
          {selectedBranchId && <button onClick={()=>clearFilter("branch")} className="flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-400">Branch #{selectedBranchId} <X size={13}/></button>}
          <button onClick={()=>{ setLoading(true); fetchDashboardData(); }} className="px-3 py-1.5 bg-[#0d1527] border border-slate-800 rounded-lg flex gap-2 items-center"><RefreshCw size={12}/>REFRESH</button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={()=>setIsTunnelDropdownOpen(!isTunnelDropdownOpen)} className="bg-[#0d1527]/60 border border-slate-800 rounded-xl p-4 flex justify-between cursor-pointer"><div><p className="text-[10px] text-slate-400 uppercase flex gap-1">Total Tunnels {isTunnelDropdownOpen?<ChevronUp size={12}/>:<ChevronDown size={12}/>}</p><p className="text-2xl font-bold text-white mt-1">{data?.cards?.totalBranches||0}</p></div><Building2 size={18}/></div>
        <div className="bg-[#0d1527]/60 border border-slate-800 rounded-xl p-4"><p className="text-[10px] text-slate-400 uppercase">Total Expenses</p><p className="text-2xl font-bold text-blue-400 mt-1">LKR {Number(data?.cards?.totalExpenses||0).toLocaleString()}</p></div>
        <div className="bg-[#0d1527]/60 border border-slate-800 rounded-xl p-4"><p className="text-[10px] text-slate-400 uppercase">Remaining Balance</p><p className="text-2xl font-bold text-amber-500 mt-1">LKR {Number(data?.cards?.totalRemaining||0).toLocaleString()}</p></div>
        <div className="bg-[#0d1527]/60 border border-slate-800 rounded-xl p-4"><p className="text-[10px] text-slate-400 uppercase">Total Incomes</p><p className="text-2xl font-bold text-red-400 mt-1">LKR {Number(data?.cards?.totalIncomes||0).toLocaleString()}</p></div>
      </section>

      {isTunnelDropdownOpen && (
        <div className="bg-[#0a101f] border border-cyan-500/40 rounded-xl p-4">
          <div className="flex justify-between mb-3"><span className="text-cyan-400 text-[10px] uppercase">Branches ({filteredBranches.length})</span><div className="relative"><Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2"/><input value={localSearch} onChange={(e)=>setLocalSearch(e.target.value)} placeholder="Filter..." className="bg-[#0e1626] border border-slate-800 rounded pl-6 pr-2 py-1 text-[10px]"/></div></div>
          <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-auto">{filteredBranches.map((b:any)=><div key={b.id} onClick={()=>router.push(`/dashboard/branches/${b.id}`)} className="p-2 bg-[#0e1626] border border-slate-900 rounded cursor-pointer hover:border-cyan-500/30"><MapPin size={10} className="inline mr-1"/>{b.branch_name}</div>)}</div>
        </div>
      )}

      <section className="bg-[#0d1527]/40 border border-slate-800/60 rounded-xl p-5">
        <div className="mb-4 flex justify-between"><h3 className="text-xs font-bold uppercase text-slate-300">Branch Expense Distribution - Sales vs Incomes</h3><span className="text-[10px]"><span className="text-blue-400">■ Sales/Total</span> <span className="text-red-400">■ Income</span></span></div>
        <div className="h-[350px] w-full">
          {/* key eka dala force re-render */}
          <Bar key={JSON.stringify(chartData)} data={chartData} options={chartOptions} />
        </div>
        {/* Debug view */}
        <div className="mt-3 text-[10px] text-slate-500">Sample: {filteredBranches[0]?.branch_code} | Sales: {filteredBranches[0]?.sales_expenses} | Total Exp: {filteredBranches[0]?.total_expenses} | Income: {filteredBranches[0]?.total_incomes}</div>
      </section>
    </div>
  );
}

export default function DashboardPage(props:any) {
  return <Suspense fallback={<div className="h-screen bg-[#070a12]"/>}><DashboardContent {...props}/></Suspense>;
}