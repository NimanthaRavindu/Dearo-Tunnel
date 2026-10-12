"use client";
import React, { Suspense,useCallback,useEffect,useState, useMemo} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {Chart as ChartJS,CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Building2,TrendingUp,AlertCircle,RefreshCw,ChevronUp,ChevronDown,MapPin,Filter,X,Sparkles, Search} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface PageProps {
  searchQuery?: string;
}

interface IncomeSummary {
  grandTotal: number;
  entriesCount: number;
}

function DashboardContent({ searchQuery = "" }: PageProps) {
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
  const [refreshing, setRefreshing] = useState(false);
  const [isTunnelDropdownOpen, setIsTunnelDropdownOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const [incomeSummary, setIncomeSummary] = useState<IncomeSummary>({
    grandTotal: 0,
    entriesCount: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setError("");

      const dashboardParams = new URLSearchParams();

      if (selectedSalesId) {
        dashboardParams.set("selected_sales_id", selectedSalesId);
      }

      if (selectedCapitalId) {
        dashboardParams.set("selected_capital_id", selectedCapitalId);
      }

      if (selectedDieselId) {
        dashboardParams.set("selected_diesel_id", selectedDieselId);
      }

      if (selectedBranchId) {
        dashboardParams.set("branch_id", selectedBranchId);
      }

      if (selectedDate) {
        dashboardParams.set("date", selectedDate);
      }

      const dashboardQuery = dashboardParams.toString();

      const dashboardUrl = `/api/dashboard/summary${
        dashboardQuery? `?${dashboardQuery}` : ""
      }`;

      const response = await fetch(dashboardUrl, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          "Failed to synchronize infrastructure core metrics.",
        );
      }

      const dashboardJson = await response.json();
      setData(dashboardJson);

      const incomeParams = new URLSearchParams();
      incomeParams.set("summary", "true");

      if (selectedSalesId) {
        incomeParams.set("selected_sales_id", selectedSalesId);
      }

      if (selectedCapitalId) {
        incomeParams.set("selected_capital_id", selectedCapitalId);
      }

      if (selectedDieselId) {
        incomeParams.set("selected_diesel_id", selectedDieselId);
      }

      if (selectedBranchId) {
        incomeParams.set("branch_id", selectedBranchId);
      }

      if (selectedDate) {
        incomeParams.set("date", selectedDate);
      }

      const incomeResponse = await fetch(
        `/api/expences/sales-incomes?${incomeParams.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!incomeResponse.ok) {
        throw new Error("Failed to load total incomes.");
      }

      const incomeJson = await incomeResponse.json();

      if (!incomeJson.success) {
        throw new Error(
          incomeJson.error || "Failed to load total incomes.",
        );
      }

      setIncomeSummary({
        grandTotal: Number(incomeJson.grandTotal?? dashboardJson?.cards?.totalIncomes?? 0),
        entriesCount: Array.isArray(incomeJson.data)
         ? incomeJson.data.length
          : 0,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId, selectedDieselId, selectedBranchId, selectedDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const clearFilter = (type: "sales" | "capital" | "diesel" | "branch") => {
    const params = new URLSearchParams(searchParams.toString());

    if (type === "sales") {
      params.delete("selected_sales_id");
    }

    if (type === "capital") {
      params.delete("selected_capital_id");
    }

    if (type === "diesel") {
      params.delete("selected_diesel_id");
    }

    if (type === "branch") {
      params.delete("branch_id");
    }

    const query = params.toString();
    router.push(`/dashboard${query? `?${query}` : ""}`);
  };

  const updateBranchFilter = (branchId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (branchId) {
      params.set("branch_id", branchId);
    } else {
      params.delete("branch_id");
    }
    const query = params.toString();
    router.push(`/dashboard${query? `?${query}` : ""}`);
  };

  const handleTotalExpensesClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    router.push(`/dashboard/total-expenses${query? `?${query}` : ""}`);
  };

  const handleRemainingBalanceClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    router.push(`/dashboard/remaining-balance${query? `?${query}` : ""}`);
  };

  const handleTotalIncomesClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    const query = params.toString();
    router.push(`/dashboard/total-incomes${query? `?${query}` : ""}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
        <div className="h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="uppercase tracking-widest text-[10px]">
          Initializing Operational Ledger Matrices...
        </p>
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
          type="button"
          onClick={() => {
            setLoading(true);
            fetchDashboardData();
          }}
          className="text-[10px] uppercase font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded transition-all"
        >
          Re-establish Data Pipeline
        </button>
      </div>
    );
  }

  const filteredBranches = useMemo(() => {
    let branches = data?.branches || [];
    // prop searchQuery filter (oya thiyena eka ehemama)
    branches = branches.filter((branch: any) =>
      String(branch.branch_name || "")
       .toLowerCase()
       .includes(searchQuery.toLowerCase()),
    );
    // local search inside dropdown
    if (localSearch) {
      branches = branches.filter((branch: any) =>
        String(branch.branch_name || "").toLowerCase().includes(localSearch.toLowerCase()) ||
        String(branch.branch_code || "").toLowerCase().includes(localSearch.toLowerCase())
      );
    }
    return branches;
  }, [data, searchQuery, localSearch]);

  const chartData = useMemo(() => {
    return {
      labels: filteredBranches.map((branch: any) => branch.branch_code || branch.branch_name),
      datasets: [
        {
          label: "Sales Expenses (Rs.)",
          data: filteredBranches.map((branch: any) => {
            const sales = Number(branch.sales_expenses || 0);
            // sales 0 nam total_expenses fallback karanawa chart eka empty wena eka nawaththanna
            return sales > 0? sales : Number(branch.total_expenses || 0);
          }),
          backgroundColor: "rgba(59, 130, 246, 0.9)",
          borderColor: "#3b82f6",
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 14,
        },
        {
          label: "Total Incomes (Rs.)",
          data: filteredBranches.map((branch: any) =>
            Number(branch.total_incomes || branch.income_total || 0),
          ),
          backgroundColor: "rgba(239, 68, 68, 0.9)",
          borderColor: "#ef4444",
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 14,
        },
      ],
    };
  }, [filteredBranches]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        labels: {
          color: "#94a3b8",
          font: {
            size: 11,
            weight: "600" as const,
          },
          boxWidth: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: LKR ${Number(ctx.raw).toLocaleString("en-US")}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: "#1e293b",
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 10,
          },
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-[#070a12] min-h-screen text-slate-300 font-mono text-xs selection:bg-cyan-500/20 selection:text-cyan-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Financial & Tunnel Logistics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time centralized ledger for all active infrastructure
            branches.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* BRANCH FILTER - ADDED */}
          <div className="relative flex items-center">
            <MapPin size={12} className="absolute left-2 text-cyan-400 pointer-events-none" />
            <select
              value={selectedBranchId || ""}
              onChange={(e) => updateBranchFilter(e.target.value)}
              className="bg-[#0d1527] border border-slate-700 rounded-lg pl-6 pr-7 py-1.5 text-[11px] text-cyan-300 outline-none focus:border-cyan-500/50 cursor-pointer min-w-[180px]"
            >
              <option value="">All Branches ({data?.branches?.length || 0})</option>
              {data?.branches?.map((b: any) => (
                <option key={b.id} value={String(b.id)}>{b.branch_name} ({b.branch_code})</option>
              ))}
            </select>
          </div>

          {selectedBranchId && (
            <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-400 text-[11px]">
              <Filter size={12} />
              <span>Branch #{selectedBranchId}</span>
              <button
                type="button"
                onClick={() => clearFilter("branch")}
                className="hover:text-white p-0.5 rounded transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {selectedCapitalId && (
            <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-400 text-[11px]">
              <Filter size={12} />
              <span>Capital Record #{selectedCapitalId}</span>
              <button
                type="button"
                onClick={() => clearFilter("capital")}
                className="hover:text-white p-0.5 rounded transition-colors"
                title="Clear Capital Filter"
                aria-label="Clear Capital Filter"
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
                type="button"
                onClick={() => clearFilter("sales")}
                className="hover:text-white p-0.5 rounded transition-colors"
                title="Clear Sales Filter"
                aria-label="Clear Sales Filter"
              >
                <X size={13} />
              </button>
            </div>
          )}
          {selectedDieselId && (
            <div className="flex items-center gap-2 bg-teal-950/40 border border-teal-500/30 px-3 py-1.5 rounded-lg text-teal-400 text-[11px]">
              <Filter size={12} />
              <span>Diesel Record #{selectedDieselId}</span>
              <button
                type="button"
                onClick={() => clearFilter("diesel")}
                className="hover:text-white p-0.5 rounded transition-colors"
                title="Clear Diesel Filter"
                aria-label="Clear Diesel Filter"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchDashboardData();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1527]/80 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-all text-[11px]"
          >
            <RefreshCw
              size={13}
              className={`text-cyan-400 ${
                refreshing? "animate-spin" : ""
              }`}
            />
            {refreshing? "FETCHING" : "REFRESH DATA"}
          </button>
        </div>
      </div>

      <div className="relative z-40">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() =>
              setIsTunnelDropdownOpen(!isTunnelDropdownOpen)
            }
            className={`bg-[#0d1527]/60 border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm select-none group relative overflow-hidden ${
              isTunnelDropdownOpen
               ? "border-cyan-500/60 bg-[#0f1b35]/80"
                : "border-slate-800 hover:border-cyan-500/30"
            }`}
          >
            <div className="z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                Total Tunnels
                {isTunnelDropdownOpen? (
                  <ChevronUp size={12} className="text-cyan-400" />
                ) : (
                  <ChevronDown size={12} className="text-slate-500 group-hover:text-cyan-400" />
                )}
              </p>

              <p className="text-2xl font-mono font-bold text-white mt-1">
                {data?.cards?.totalBranches ||
                  filteredBranches.length ||
                  0}
              </p>
            </div>

            <div
              className={`p-2 bg-slate-900/80 border border-slate-800 text-slate-400 rounded-lg transition-all z-10 ${
                isTunnelDropdownOpen
                 ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
                  : "group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30"
              }`}
            >
              <Building2 size={18} />
            </div>
          </div>

          <div
            onClick={handleTotalExpensesClick}
            className="bg-[#0d1527]/60 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-blue-500/40 transition-all"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Expenses
              </p>

              <p className="text-2xl font-mono font-bold text-blue-400 mt-1">
                LKR{" "}
                {Number(
                  data?.cards?.totalExpenses || 0,
                ).toLocaleString("en-US")}
              </p>
            </div>

            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <span className="text-sm font-bold">$</span>
            </div>
          </div>

          <div
            onClick={handleRemainingBalanceClick}
            className="bg-[#0d1527]/60 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Remaining Balance
              </p>

              <p className="text-2xl font-mono font-bold text-amber-500 mt-1">
                LKR{" "}
                {Number(
                  data?.cards?.totalRemaining || 0,
                ).toLocaleString("en-US")}
              </p>
            </div>

            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>

          <div
            onClick={handleTotalIncomesClick}
            className="bg-[#0d1527]/60 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-red-500/40 transition-all group"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Incomes
              </p>

              <p className="text-2xl font-mono font-bold text-red-400 mt-1">
                LKR{" "}
                {incomeSummary.grandTotal.toLocaleString("en-US")}
              </p>
            </div>
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg group-hover:scale-110 transition-transform">
              <Sparkles size={18} />
            </div>
          </div>
        </section>

        {isTunnelDropdownOpen && (
          <div className="absolute left-0 mt-2 w-full bg-[#0a101f] border border-cyan-500/40 rounded-xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-800/80 pb-2.5 mb-4 flex items-center justify-between">
              <span>
                Active Node Branches List ({filteredBranches.length}{" "}
                Records Located)
              </span>
              <div className="relative">
                <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={localSearch} onChange={(e)=> setLocalSearch(e.target.value)} placeholder="Filter branch..." className="bg-[#0e1626] border border-slate-800 rounded-lg pl-6 pr-2 py-1 text-[10px] outline-none w-[160px]"/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[250px] overflow-y-auto pr-2">
              {filteredBranches.map((branch: any) => (
                <div
                  key={branch.id}
                  onClick={() =>
                    router.push(`/dashboard/branches/${branch.id}`)
                  }
                  className="flex items-center gap-3 p-2.5 bg-[#0e1626] border border-slate-900 rounded-lg hover:border-cyan-500/30 cursor-pointer"
                >
                  <MapPin size={12} className="text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-200 truncate">
                    {branch.branch_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <section className="bg-[#0d1527]/40 border border-slate-800/60 rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Branch Expense Distribution - Sales Expenses vs Incomes
          </h3>
          <span className="text-[10px] text-slate-500">
            {filteredBranches.length} branches | <span className="text-blue-400">■ Sales Expenses</span> <span className="text-red-400">■ Incomes</span>
          </span>
        </div>
        <div className="h-80 w-full relative">
          <Bar key={filteredBranches.length} data={chartData} options={chartOptions as any} />
        </div>
      </section>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
      <div className="h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
      <p className="uppercase tracking-widest text-[10px]">
        Initializing Operational Ledger Matrices...
      </p>
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