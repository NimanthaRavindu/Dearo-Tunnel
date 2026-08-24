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

// 1. Inner Component handling useSearchParams and API logic
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

  // Filter එක ඉවත් කිරීමේ Function එක
  const clearFilter = (type: "sales" | "capital" | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "sales" || type === "all") {
      params.delete("selected_sales_id");
    }
    if (type === "capital" || type === "all") {
      params.delete("selected_capital_id");
    }
    const query = params.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
        <div className="h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="uppercase tracking-widest text-[10px]">Initializing Operational Ledger Matrices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-red-400 bg-[#070a12] font-mono p-4 space-y-3">
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 px-4 py-2.5 rounded-lg text-xs">
          <AlertCircle size={14} />
          <span>Gateway Sync Error: {error}</span>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchDashboardData(); }}
          className="text-[10px] uppercase font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded transition-all"
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
        label: "Total Expenses (Rs.)",
        data: filteredBranches.map((b: any) => Number(b.total_expenses || 0)),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "#3b82f6",
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

  // Card Navigation URL සමඟ Active Filters යැවීම
  const handleTotalExpensesClick = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);
    const query = params.toString();
    router.push(`/dashboard/total-expenses${query ? `?${query}` : ""}`);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-[#070a12] min-h-screen text-slate-300 font-mono text-xs selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Financial & Tunnel Logistics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time centralized ledger for all active infrastructure branches.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Filter Badges */}
          {selectedCapitalId && (
            <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-400 text-[11px]">
              <Filter size={12} />
              <span>Capital Record #{selectedCapitalId}</span>
              <button 
                onClick={() => clearFilter("capital")} 
                className="hover:text-white p-0.5 rounded transition-colors"
                title="Clear Capital Filter"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {selectedSalesId && (
            <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-400 text-[11px]">
              <Filter size={12} />
              <span>Sales Record #{selectedSalesId}</span>
              <button 
                onClick={() => clearFilter("sales")} 
                className="hover:text-white p-0.5 rounded transition-colors"
                title="Clear Sales Filter"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <button
            onClick={() => { setRefreshing(true); fetchDashboardData(); }}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1527]/80 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-all text-[11px]"
          >
            <RefreshCw size={13} className={`text-cyan-400 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "FETCHING" : "REFRESH DATA"}
          </button>
        </div>
      </div>

      <div className="relative z-40">
        {/* Grid Content Information Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Branches */}
          <div 
            onClick={() => setIsTunnelDropdownOpen(!isTunnelDropdownOpen)}
            className={`bg-[#0d1527]/60 border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm select-none group relative overflow-hidden ${
              isTunnelDropdownOpen ? "border-cyan-500/60 bg-[#0f1b35]/80" : "border-slate-800 hover:border-cyan-500/30"
            }`}>
            <div className="z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                Total Tunnels
                {isTunnelDropdownOpen ? <ChevronUp size={12} className="text-cyan-400" /> : <ChevronDown size={12} className="text-slate-500 group-hover:text-cyan-400" />}
              </p>
              <p className="text-2xl font-mono font-bold text-white mt-1">
                {data?.cards?.totalBranches || filteredBranches.length || 0}
              </p>
            </div>
            <div className={`p-2 bg-slate-900/80 border border-slate-800 text-slate-400 rounded-lg transition-all z-10 ${
              isTunnelDropdownOpen ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30"
            }`}>
              <Building2 size={18} />
            </div>
          </div>

          {/* Card 2: Total Expenses Matrix */}
          <div
            onClick={handleTotalExpensesClick} 
            className="bg-[#0d1527]/60 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-blue-500/40 transition-all"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {selectedSalesId || selectedCapitalId ? "Filtered Expenses" : "Total Expenses"}
              </p>
              <p className="text-2xl font-mono font-bold text-blue-400 mt-1">
                LKR {Number(data?.cards?.totalExpenses || 0).toLocaleString("en-US")}
              </p>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <span className="text-sm font-bold">$</span>
            </div>
          </div>

          {/* Card 3: Remaining Due Balance Matrix */}
          <div 
            onClick={() => router.push("/dashboard/remaining-balance")}
            className="bg-[#0d1527]/60 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining Balance</p>
              <p className="text-2xl font-mono font-bold text-amber-500 mt-1">
                LKR {Number(data?.cards?.totalRemaining || 0).toLocaleString("en-US")}
              </p>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>

        </section>

        {isTunnelDropdownOpen && (
          <div className="absolute left-0 mt-2 w-full bg-[#0a101f] border border-cyan-500/40 rounded-xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-800/80 pb-2.5 mb-4 flex items-center justify-between">
              <span>Active Node Branches List ({filteredBranches.length} Records Located)</span>
              {searchQuery && <span className="text-[9px] text-slate-500 font-normal lowercase font-sans">filtered by:"{searchQuery}"</span>}
            </div>
            {filteredBranches.length === 0 ? (
              <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                <AlertCircle size={14} className="text-slate-600"/>System database returned empty branch record matrix.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {filteredBranches.map((branch: any) => (
                  <div
                    key={branch.id}
                    onClick={() => {
                      router.push(`/dashboard/branches/${branch.id}`);
                    }} 
                    className="flex items-center gap-3 p-2.5 bg-[#0e1626] border border-slate-900 rounded-lg hover:border-cyan-500/30 hover:bg-[#111c34]/50 transition-all group cursor-pointer"
                  >
                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all">
                      <MapPin size={12}/>
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                        {branch.branch_name}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono tracking-wider mt-0.5">
                        {branch.branch_code || `CODE-${branch.id}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analytics Chart Container */}
      <section className="bg-[#0d1527]/40 border border-slate-800/60 rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Branch Expense Distribution</h3>
        </div>
        
        <div className="h-72 w-full relative">
          {filteredBranches.length > 0 ? (
            <Bar data={chartData} options={chartOptions as any} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-mono gap-2">
              <AlertCircle size={14} /> NO BRANCH MATCHES FOUND
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

// 2. Loading Fallback UI during SSG Prerendering
function DashboardFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
      <div className="h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p className="uppercase tracking-widest text-[10px]">Initializing Operational Ledger Matrices...</p>
    </div>
  );
}

// 3. Exported Component wrapped with Suspense Boundary
export default function DashboardPage(props: PageProps) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent {...props} />
    </Suspense>
  );
}