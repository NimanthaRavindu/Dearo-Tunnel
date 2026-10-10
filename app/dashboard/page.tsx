"use client";
import React, { Suspense,useCallback,useEffect,useState, useMemo} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {Chart as ChartJS,CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Building2,TrendingUp,AlertCircle,RefreshCw,ChevronUp,ChevronDown,MapPin,Filter,X,Sparkles} from "lucide-react";

ChartJS.register(CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend);

interface PageProps { searchQuery?: string; }
interface IncomeSummary { grandTotal: number; entriesCount: number; }

function DashboardContent({ searchQuery = "" }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");
  const selectedDieselId = searchParams.get("selected_diesel_id");
  const selectedDate = searchParams.get("date");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isTunnelDropdownOpen, setIsTunnelDropdownOpen] = useState(false);
  const [incomeSummary, setIncomeSummary] = useState<IncomeSummary>({ grandTotal: 0, entriesCount: 0 });
  const [incomeBranches, setIncomeBranches] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError("");
      const dashboardParams = new URLSearchParams();
      if (selectedSalesId) dashboardParams.set("selected_sales_id", selectedSalesId);
      if (selectedCapitalId) dashboardParams.set("selected_capital_id", selectedCapitalId);
      if (selectedDieselId) dashboardParams.set("selected_diesel_id", selectedDieselId);

      const dashboardUrl = `/api/dashboard/summary${dashboardParams.toString()? `?${dashboardParams.toString()}` : ""}`;
      const response = await fetch(dashboardUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to synchronize infrastructure core metrics.");
      const dashboardJson = await response.json();
      setData(dashboardJson);

      const incomeParams = new URLSearchParams();
      incomeParams.set("summary", "true");
      if (selectedSalesId) incomeParams.set("selected_sales_id", selectedSalesId);
      if (selectedCapitalId) incomeParams.set("selected_capital_id", selectedCapitalId);
      if (selectedDieselId) incomeParams.set("selected_diesel_id", selectedDieselId);
      if (selectedDate) incomeParams.set("date", selectedDate);

      const incomeResponse = await fetch(`/api/expences/sales-incomes?${incomeParams.toString()}`, { cache: "no-store" });
      if (!incomeResponse.ok) throw new Error("Failed to load total incomes.");
      const incomeJson = await incomeResponse.json();
      if (!incomeJson.success) throw new Error(incomeJson.error || "Failed to load total incomes.");

      setIncomeSummary({
        grandTotal: Number(incomeJson.grandTotal?? 0),
        entriesCount: Array.isArray(incomeJson.data)? incomeJson.data.length : 0,
      });
      setIncomeBranches(Array.isArray(incomeJson.data)? incomeJson.data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId, selectedDieselId, selectedDate]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const clearFilter = (type: "sales" | "capital" | "diesel") => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "sales") params.delete("selected_sales_id");
    if (type === "capital") params.delete("selected_capital_id");
    if (type === "diesel") params.delete("selected_diesel_id");
    router.push(`/dashboard${params.toString()? `?${params.toString()}` : ""}`);
  };

  const handleTotalExpensesClick = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.set("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.set("selected_capital_id", selectedCapitalId);
    if (selectedDieselId) params.set("selected_diesel_id", selectedDieselId);
    router.push(`/dashboard/total-expenses${params.toString()? `?${params.toString()}` : ""}`);
  };
  const handleRemainingBalanceClick = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.set("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.set("selected_capital_id", selectedCapitalId);
    if (selectedDieselId) params.set("selected_diesel_id", selectedDieselId);
    router.push(`/dashboard/remaining-balance${params.toString()? `?${params.toString()}` : ""}`);
  };
  const handleTotalIncomesClick = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.set("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.set("selected_capital_id", selectedCapitalId);
    if (selectedDieselId) params.set("selected_diesel_id", selectedDieselId);
    if (selectedDate) params.set("date", selectedDate);
    router.push(`/dashboard/total-incomes${params.toString()? `?${params.toString()}` : ""}`);
  };

  if (loading) {
    return (<div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs"><div className="h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" /><p className="uppercase tracking-widest text-[10px]">Initializing Operational Ledger Matrices...</p></div>);
  }
  if (error) {
    return (<div className="h-screen w-full flex flex-col items-center justify-center text-red-400 bg-[#070a12] font-mono p-4 space-y-3"><div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 px-4 py-2.5 rounded-lg text-xs"><AlertCircle size={14} /><span>Gateway Sync Error: {error}</span></div><button type="button" onClick={() => { setLoading(true); fetchDashboardData(); }} className="text-[10px] uppercase font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded">Re-establish Data Pipeline</button></div>);
  }

  const filteredBranches = data?.branches?.filter((branch: any) => String(branch.branch_name || "").toLowerCase().includes(searchQuery.toLowerCase())) || [];

  // === FIXED: MERGE EXPENSE + INCOME BRANCH WISE ===
  const mergedChart = useMemo(() => {
    const map: Record<string, { expense: number; income: number }> = {};

    filteredBranches.forEach((b: any) => {
      const name = b.branch_name?.trim();
      if (!name) return;
      if (!map[name]) map[name] = { expense: 0, income: 0 };
      map[name].expense = Number(b.total_expenses || 0);
    });

    incomeBranches.forEach((b: any) => {
      const name = (b.branchName || b.branch_name || "").trim();
      if (!name) return;
      if (!map[name]) map[name] = { expense: 0, income: 0 };
      map[name].income = Number(b.totalAmount?? b.total_amount?? 0);
    });

    const labels = Object.keys(map);
    return {
      labels,
      expenses: labels.map(l => map[l].expense),
      incomes: labels.map(l => map[l].income),
    };
  }, [filteredBranches, incomeBranches]);

  const chartData = {
    labels: mergedChart.labels,
    datasets: [
      { label: "Total Expenses (Rs.)", data: mergedChart.expenses, backgroundColor: "rgba(59, 130, 246, 0.85)", borderColor: "#3b82f6", borderWidth: 1, borderRadius: 4, barThickness: 12 },
      { label: "Total Incomes (Rs.)", data: mergedChart.incomes, backgroundColor: "rgba(239, 68, 68, 0.85)", borderColor: "#ef4444", borderWidth: 1, borderRadius: 4, barThickness: 12 },
    ],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { labels: { color: "#94a3b8", font: { size: 11, weight: "600" as const } } },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: LKR ${Number(ctx.raw).toLocaleString()}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 9 }, maxRotation: 60, minRotation: 45 } },
      y: { grid: { color: "#1e293b" }, ticks: { color: "#64748b", font: { size: 10 } } },
    },
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-[#070a12] min-h-screen text-slate-300 font-mono text-xs selection:bg-cyan-500/20 selection:text-cyan-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h2 className="text-xl font-bold tracking-tight text-white">Financial & Tunnel Logistics</h2><p className="text-xs text-slate-500 mt-0.5">Real-time centralized ledger for all active infrastructure branches.</p></div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectedCapitalId && (<div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-400 text-[11px]"><Filter size={12} /><span>Capital Record #{selectedCapitalId}</span><button type="button" onClick={() => clearFilter("capital")} className="hover:text-white p-0.5 rounded"><X size={13} /></button></div>)}
          {selectedSalesId && (<div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-400 text-[11px]"><Filter size={12} /><span>Sales Record #{selectedSalesId}</span><button type="button" onClick={() => clearFilter("sales")} className="hover:text-white p-0.5 rounded"><X size={13} /></button></div>)}
          {selectedDieselId && (<div className="flex items-center gap-2 bg-teal-950/40 border border-teal-500/30 px-3 py-1.5 rounded-lg text-teal-400 text-[11px]"><Filter size={12} /><span>Diesel Record #{selectedDieselId}</span><button type="button" onClick={() => clearFilter("diesel")} className="hover:text-white p-0.5 rounded"><X size={13} /></button></div>)}
          <button type="button" onClick={() => { setRefreshing(true); fetchDashboardData(); }} disabled={refreshing} className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1527]/80 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-all text-[11px]"><RefreshCw size={13} className={`text-cyan-400 ${refreshing? "animate-spin" : ""}`} />{refreshing? "FETCHING" : "REFRESH DATA"}</button>
        </div>
      </div>

      <div className="relative z-40">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => setIsTunnelDropdownOpen(!isTunnelDropdownOpen)} className={`bg-[#0d1527]/60 border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm select-none group relative overflow-hidden ${isTunnelDropdownOpen? "border-cyan-500/60 bg-[#0f1b35]/80" : "border-slate-800 hover:border-cyan-500/30"}`}><div className="z-10"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">Total Tunnels {isTunnelDropdownOpen? <ChevronUp size={12} className="text-cyan-400" /> : <ChevronDown size={12} className="text-slate-500 group-hover:text-cyan-400" />}</p><p className="text-2xl font-mono font-bold text-white mt-1">{data?.cards?.totalBranches || filteredBranches.length || 0}</p></div><div className={`p-2 bg-slate-900/80 border border-slate-800 text-slate-400 rounded-lg transition-all z-10 ${isTunnelDropdownOpen? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30"}`}><Building2 size={18} /></div></div>
          <div onClick={handleTotalExpensesClick} className="bg-[#0d1527]/60 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-blue-500/40 transition-all"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Expenses</p><p className="text-2xl font-mono font-bold text-blue-400 mt-1">LKR {Number(data?.cards?.totalExpenses || 0).toLocaleString("en-US")}</p></div><div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg"><span className="text-sm font-bold">$</span></div></div>
          <div onClick={handleRemainingBalanceClick} className="bg-[#0d1527]/60 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining Balance</p><p className="text-2xl font-mono font-bold text-amber-500 mt-1">LKR {Number(data?.cards?.totalRemaining || 0).toLocaleString("en-US")}</p></div><div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg"><TrendingUp size={18} /></div></div>
          <div onClick={handleTotalIncomesClick} className="bg-[#0d1527]/60 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-red-500/40 transition-all group"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Incomes</p><p className="text-2xl font-mono font-bold text-red-400 mt-1">LKR {incomeSummary.grandTotal.toLocaleString("en-US")}</p></div><div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg group-hover:scale-110 transition-transform"><Sparkles size={18} /></div></div>
        </section>
        {isTunnelDropdownOpen && (<div className="absolute left-0 mt-2 w-full bg-[#0a101f] border border-cyan-500/40 rounded-xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"><div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-800/80 pb-2.5 mb-4 flex items-center justify-between"><span>Active Node Branches List ({filteredBranches.length} Records Located)</span></div><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[250px] overflow-y-auto pr-2">{filteredBranches.map((branch: any) => (<div key={branch.id} onClick={() => router.push(`/dashboard/branches/${branch.id}`)} className="flex items-center gap-3 p-2.5 bg-[#0e1626] border border-slate-900 rounded-lg hover:border-cyan-500/30 cursor-pointer"><MapPin size={12} className="text-slate-500" /><span className="text-[11px] font-bold text-slate-200 truncate">{branch.branch_name}</span></div>))}</div></div>)}
      </div>

      <section className="bg-[#0d1527]/40 border border-slate-800/60 rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Branch Expense vs Income Distribution</h3><span className="text-[10px] text-slate-500">{mergedChart.labels.length} Branches • Blue=Expense, Red=Income</span></div>
        <div className="h-[420px] w-full relative"><Bar data={chartData} options={chartOptions as any} /></div>
      </section>
    </div>
  );
}

function DashboardFallback() {
  return (<div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs"><div className="h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" /><p className="uppercase tracking-widest text-[10px]">Initializing Operational Ledger Matrices...</p></div>);
}

export default function DashboardPage(props: PageProps) {
  return (<Suspense fallback={<DashboardFallback />}><DashboardContent {...props} /></Suspense>);
}