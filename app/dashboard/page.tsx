"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Building2, TrendingUp, AlertCircle, RefreshCw, ChevronUp, ChevronDown, MapPin, Filter, X } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PageProps {
  searchQuery?: string;
}

function DashboardContent({ searchQuery = "" }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isTunnelDropdownOpen, setIsTunnelDropdownOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
      if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);

      const queryString = params.toString();
      const url = `/api/dashboard/summary${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to synchronize infrastructure core metrics.");
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // තනි Filter එකක් ඉවත් කරද්දී අනෙක තබා ගැනීම
  const clearFilter = (type: "sales" | "capital") => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "sales") params.delete("selected_sales_id");
    if (type === "capital") params.delete("selected_capital_id");
    
    const query = params.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  // Total Expenses Card එකට යද්දී parameters දෙකම රැගෙන යාම
  const handleTotalExpensesClick = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);
    const query = params.toString();
    router.push(`/dashboard/total-expenses${query ? `?${query}` : ""}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-emerald-400 bg-slate-950 font-sans text-xs">
        <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="uppercase tracking-widest text-[10px]">Loading Dashboard Matrices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-red-400 bg-slate-950 font-sans p-4 space-y-3">
        <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/50 px-4 py-2.5 rounded-lg text-xs">
          <AlertCircle size={14} />
          <span>Sync Error: {error}</span>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchDashboardData(); }}
          className="text-[10px] uppercase font-bold text-slate-300 hover:text-white bg-emerald-900/60 border border-emerald-700 px-3 py-1.5 rounded transition-all"
        >
          Re-establish Data Pipeline
        </button>
      </div>
    );
  }

  const filteredBranches = data?.branches?.filter((b: any) =>
    b.branch_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const chartData = {
    labels: filteredBranches.map((b: any) => b.branch_name),
    datasets: [
      {
        label: "Total Expenses (LKR)",
        data: filteredBranches.map((b: any) => Number(b.total_expenses || 0)),
        backgroundColor: "rgba(16, 185, 129, 0.75)",
        borderColor: "#059669",
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 16,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#94a3b8", font: { size: 11, weight: "600" } } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 10 } } },
      y: { grid: { color: "#1e293b" }, ticks: { color: "#64748b", font: { size: 10 } } },
    },
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-slate-950 min-h-screen text-slate-200 font-sans text-xs selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Financial & Operational Dashboard
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Real-time centralized ledger for active branch infrastructure.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Capital Filter Badge */}
          {selectedCapitalId && (
            <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-md text-emerald-400 text-[11px]">
              <Filter size={12} />
              <span>Capital #{selectedCapitalId}</span>
              <button 
                onClick={() => clearFilter("capital")} 
                className="hover:text-white p-0.5 rounded transition-colors"
                title="Clear Capital Filter"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Sales Filter Badge */}
          {selectedSalesId && (
            <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-md text-emerald-400 text-[11px]">
              <Filter size={12} />
              <span>Sales #{selectedSalesId}</span>
              <button 
                onClick={() => clearFilter("sales")} 
                className="hover:text-white p-0.5 rounded transition-colors"
                title="Clear Sales Filter"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <button
            onClick={() => { setRefreshing(true); fetchDashboardData(); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md hover:border-emerald-600/50 hover:text-emerald-400 transition-all text-[11px] font-medium"
          >
            <RefreshCw size={12} className={`text-emerald-500 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "FETCHING" : "REFRESH"}
          </button>
        </div>
      </div>

      <div className="relative z-40">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Card 1: Total Tunnels / Branches */}
          <div 
            onClick={() => setIsTunnelDropdownOpen(!isTunnelDropdownOpen)}
            className={`bg-slate-900/70 border rounded-lg p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-sm select-none group relative overflow-hidden ${
              isTunnelDropdownOpen ? "border-emerald-500/60 bg-slate-900" : "border-slate-800 hover:border-emerald-500/40"
            }`}>
            <div className="z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                Total Branches
                {isTunnelDropdownOpen ? <ChevronUp size={12} className="text-emerald-400" /> : <ChevronDown size={12} className="text-slate-500 group-hover:text-emerald-400" />}
              </p>
              <p className="text-xl font-bold text-white mt-1">
                {data?.cards?.totalBranches || filteredBranches.length || 0}
              </p>
            </div>
            <div className={`p-2 bg-slate-950 border border-slate-800 text-slate-400 rounded-md transition-all z-10 ${
              isTunnelDropdownOpen ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:text-emerald-400"
            }`}>
              <Building2 size={16} />
            </div>
          </div>

          {/* Card 2: Total Expenses Matrix */}
          <div
            onClick={handleTotalExpensesClick} 
            className="bg-slate-900/70 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between cursor-pointer hover:border-emerald-500/40 transition-all group"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Expenses</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                LKR {Number(data?.cards?.totalExpenses || 0).toLocaleString("en-US")}
              </p>
            </div>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md group-hover:bg-emerald-500/20">
              <TrendingUp size={16} />
            </div>
          </div>

          {/* Card 3: Remaining Balance */}
          <div 
            onClick={() => router.push("/dashboard/remaining-balance")}
            className="bg-slate-900/70 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between cursor-pointer hover:border-emerald-500/40 transition-all group"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining Balance</p>
              <p className="text-xl font-bold text-emerald-300 mt-1">
                LKR {Number(data?.cards?.totalRemaining || 0).toLocaleString("en-US")}
              </p>
            </div>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md group-hover:bg-emerald-500/20">
              <span className="text-xs font-bold">LKR</span>
            </div>
          </div>

        </section>

        {isTunnelDropdownOpen && (
          <div className="absolute left-0 mt-2 w-full bg-slate-900 border border-emerald-500/40 rounded-lg p-4 shadow-xl z-50">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
              <span>Branch Nodes Directory ({filteredBranches.length} Records Located)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-2">
              {filteredBranches.map((branch: any) => (
                <div
                  key={branch.id}
                  onClick={() => router.push(`/dashboard/branches/${branch.id}`)} 
                  className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800/80 rounded-md hover:border-emerald-500/40 cursor-pointer transition-colors"
                >
                  <MapPin size={12} className="text-emerald-500"/>
                  <span className="text-[11px] font-medium text-slate-200 truncate">{branch.branch_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analytics Chart */}
      <section className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Branch Expense Distribution</h3>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">Live Metrics</span>
        </div>
        <div className="h-64 w-full relative">
          <Bar data={chartData} options={chartOptions as any} />
        </div>
      </section>

    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-emerald-400 bg-slate-950 font-sans text-xs">
      <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="uppercase tracking-widest text-[10px]">Loading Dashboard Matrices...</p>
    </div>
  );
}

export default function DashboardPage(props: PageProps) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent {...props} />
    </Suspense>
  );
}