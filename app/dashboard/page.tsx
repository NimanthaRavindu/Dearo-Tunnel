"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Building2, TrendingUp, AlertCircle, RefreshCw, ChevronUp, ChevronDown, MapPin, Filter, X, Wallet } from "lucide-react";

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

  const clearFilter = (type: "sales" | "capital") => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "sales") params.delete("selected_sales_id");
    if (type === "capital") params.delete("selected_capital_id");
    
    const query = params.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  const handleTotalExpensesClick = () => {
    const params = new URLSearchParams();
    if (selectedSalesId) params.append("selected_sales_id", selectedSalesId);
    if (selectedCapitalId) params.append("selected_capital_id", selectedCapitalId);
    const query = params.toString();
    router.push(`/dashboard/total-expenses${query ? `?${query}` : ""}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center text-slate-400 bg-[#0B0F19] font-sans text-xs">
        <div className="h-5 w-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="uppercase tracking-widest text-[10px] font-medium">Loading Dashboard Matrices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center text-red-400 bg-[#0B0F19] font-sans p-6 space-y-4">
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 px-5 py-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          <span>System Synchronization Error: {error}</span>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchDashboardData(); }}
          className="text-xs uppercase tracking-wider font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-4 py-2 rounded hover:bg-slate-700 transition-colors"
        >
          Retry Connection
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
        backgroundColor: "rgba(59, 130, 246, 0.8)", // Professional Blue
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 18,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#94a3b8", font: { size: 11, family: "Inter, sans-serif" } } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 10 } } },
      y: { 
        grid: { color: "rgba(30, 41, 59, 0.5)", drawBorder: false }, 
        ticks: { color: "#64748b", font: { size: 10 } } 
      },
    },
  };

  return (
    <div className="p-5 md:p-8 space-y-6 bg-[#0B0F19] min-h-screen text-slate-300 font-sans selection:bg-blue-500/20 selection:text-blue-300">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">Financial Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time centralized ledger for active branch infrastructure.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {selectedCapitalId && (
            <div className="flex items-center gap-2 bg-[#1E293B] border border-slate-700 px-3 py-1.5 rounded-md text-slate-300 text-xs shadow-sm">
              <Filter size={14} className="text-emerald-500" />
              <span>Capital ID: {selectedCapitalId}</span>
              <button onClick={() => clearFilter("capital")} className="hover:text-emerald-400 transition-colors ml-1">
                <X size={14} />
              </button>
            </div>
          )}

          {selectedSalesId && (
            <div className="flex items-center gap-2 bg-[#1E293B] border border-slate-700 px-3 py-1.5 rounded-md text-slate-300 text-xs shadow-sm">
              <Filter size={14} className="text-blue-500" />
              <span>Sales ID: {selectedSalesId}</span>
              <button onClick={() => clearFilter("sales")} className="hover:text-blue-400 transition-colors ml-1">
                <X size={14} />
              </button>
            </div>
          )}

          <button
            onClick={() => { setRefreshing(true); fetchDashboardData(); }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 rounded-md transition-all text-xs font-medium shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={`${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Syncing..." : "Refresh Data"}
          </button>
        </div>
      </header>

      {/* KPI Metrics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-40">
        
        {/* Branches Card */}
        <div 
          onClick={() => setIsTunnelDropdownOpen(!isTunnelDropdownOpen)}
          className={`bg-[#111827] border rounded-xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-sm group hover:-translate-y-0.5 ${
            isTunnelDropdownOpen ? "border-slate-500 bg-[#1F2937]" : "border-slate-800 hover:border-slate-600"
          }`}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              Total Branches
              {isTunnelDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
            </p>
            <h3 className="text-2xl font-semibold text-slate-100 mt-1">
              {data?.cards?.totalBranches || filteredBranches.length || 0}
            </h3>
          </div>
          <div className="p-3 bg-slate-800/50 text-slate-400 rounded-lg group-hover:text-slate-200 transition-colors">
            <Building2 size={20} />
          </div>
        </div>

        {/* Expenses Card */}
        <div
          onClick={handleTotalExpensesClick} 
          className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-blue-500/50 hover:-translate-y-0.5 transition-all group"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Expenses</p>
            <h3 className="text-2xl font-semibold text-slate-100 mt-1">
              <span className="text-sm text-slate-500 mr-1">LKR</span>
              {Number(data?.cards?.totalExpenses || 0).toLocaleString("en-US")}
            </h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg group-hover:bg-blue-500/20 transition-colors">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Balance Card */}
        <div 
          onClick={() => router.push("/dashboard/remaining-balance")}
          className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:border-amber-500/50 hover:-translate-y-0.5 transition-all group"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Remaining Balance</p>
            <h3 className="text-2xl font-semibold text-slate-100 mt-1">
              <span className="text-sm text-slate-500 mr-1">LKR</span>
              {Number(data?.cards?.totalRemaining || 0).toLocaleString("en-US")}
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg group-hover:bg-amber-500/20 transition-colors">
            <Wallet size={20} />
          </div>
        </div>
      </section>

      {/* Dropdown for Branches */}
      {isTunnelDropdownOpen && (
        <div className="bg-[#111827] border border-slate-700 rounded-xl p-5 shadow-2xl relative z-50 mt-[-10px]">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
            <span>Branch Directory ({filteredBranches.length} Records)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredBranches.map((branch: any) => (
              <div
                key={branch.id}
                onClick={() => router.push(`/dashboard/branches/${branch.id}`)} 
                className="flex items-center gap-3 p-2.5 bg-[#1E293B] border border-transparent rounded-lg hover:border-slate-500 hover:bg-[#273548] cursor-pointer transition-all"
              >
                <MapPin size={14} className="text-slate-400"/>
                <span className="text-xs font-medium text-slate-200 truncate">{branch.branch_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Chart */}
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-5 md:p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Expense Distribution by Branch</h3>
            <p className="text-[11px] text-slate-500 mt-1">Visual breakdown of financial allocations.</p>
          </div>
        </div>
        <div className="h-72 w-full relative">
          <Bar data={chartData} options={chartOptions as any} />
        </div>
      </section>

    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-slate-400 bg-[#0B0F19] font-sans text-xs">
      <div className="h-5 w-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="uppercase tracking-widest text-[10px] font-medium">Loading Dashboard Matrices...</p>
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