"use client";
import React, { Suspense,useCallback,useEffect,useState} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chart as ChartJS,CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend} from "chart.js";
import { Bar } from "react-chartjs-2";
import { AlertCircle,Building2,ChevronDown,ChevronUp,Filter,MapPin,RefreshCw,Sparkles,TrendingUp,X} from "lucide-react";

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
  const selectedDate = searchParams.get("date") || "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isTunnelDropdownOpen, setIsTunnelDropdownOpen] =
    useState(false);

  const [incomeSummary, setIncomeSummary] =
    useState<IncomeSummary>({
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

      const dashboardQuery = dashboardParams.toString();

      const dashboardResponse = await fetch(
        `/api/dashboard/summary${
          dashboardQuery ? `?${dashboardQuery}` : ""
        }`,
        { cache: "no-store" },
      );

      if (!dashboardResponse.ok) {
        throw new Error("Failed to load dashboard data.");
      }

      const dashboardResult = await dashboardResponse.json();
      setData(dashboardResult);

      const incomeParams = new URLSearchParams();
      incomeParams.set("summary", "true");

      if (selectedSalesId) {
        incomeParams.set("selected_sales_id", selectedSalesId);
      }

      if (selectedCapitalId) {
        incomeParams.set("selected_capital_id", selectedCapitalId);
      }

      if (selectedDate) {
        incomeParams.set("date", selectedDate);
      }

      const incomeResponse = await fetch(
        `/api/expences/sales-incomes?${incomeParams.toString()}`,
        { cache: "no-store" },
      );

      if (!incomeResponse.ok) {
        throw new Error("Failed to load total incomes.");
      }

      const incomeResult = await incomeResponse.json();

      if (incomeResult.success === false) {
        throw new Error(
          incomeResult.error || "Failed to load total incomes.",
        );
      }

      setIncomeSummary({
        grandTotal: Number(incomeResult.grandTotal ?? 0) || 0,
        entriesCount: Array.isArray(incomeResult.data)
          ? incomeResult.data.length
          : 0,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId, selectedDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const clearFilter = (type: "sales" | "capital") => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete(
      type === "sales"
        ? "selected_sales_id"
        : "selected_capital_id",
    );

    const query = params.toString();

    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  const navigateWithFilters = (path: string) => {
    const params = new URLSearchParams();

    if (selectedSalesId) {
      params.set("selected_sales_id", selectedSalesId);
    }

    if (selectedCapitalId) {
      params.set("selected_capital_id", selectedCapitalId);
    }

    if (selectedDate) {
      params.set("date", selectedDate);
    }

    const query = params.toString();

    router.push(`${path}${query ? `?${query}` : ""}`);
  };

  if (loading) {
    return (
      <DashboardFallback text="Initializing dashboard..." />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center gap-4 text-red-400">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>

        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchDashboardData();
          }}
          className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredBranches =
    data?.branches?.filter((branch: any) =>
      String(branch.branch_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    ) || [];

  const chartData = {
    labels: filteredBranches.map(
      (branch: any) => branch.branch_name,
    ),
    datasets: [
      {
        label: "Total Expenses (Rs.)",
        data: filteredBranches.map((branch: any) =>
          Number(branch.total_expenses || 0),
        ),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "#3b82f6",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#94a3b8",
          font: { size: 11 },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" },
      },
      y: {
        grid: { color: "#1e293b" },
        ticks: { color: "#64748b" },
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#070a12] p-6 md:p-8 text-slate-300">
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              Financial & Tunnel Logistics
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Real-time centralized ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedCapitalId && (
              <FilterBadge text={`Capital Record #${selectedCapitalId}`} color="amber" onClear={() => clearFilter("capital")} />
            )}

            {selectedSalesId && (
              <FilterBadge text={`Sales Record #${selectedSalesId}`} color="cyan" onClear={() => clearFilter("sales")} />
            )}

            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchDashboardData();
              }}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs hover:text-white"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "FETCHING" : "REFRESH DATA"}
            </button>
          </div>
        </header>

        <section className="relative">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              title="Total Tunnels"
              value={
                data?.cards?.totalBranches ||
                filteredBranches.length ||
                0
              }
              icon={<Building2 size={18} />}
              onClick={() =>
                setIsTunnelDropdownOpen((value) => !value)
              }
            />

            <DashboardCard
              title="Total Expenses"
              value={`LKR ${Number(
                data?.cards?.totalExpenses || 0,
              ).toLocaleString("en-US")}`}
              icon={<span>$</span>}
              onClick={() =>
                navigateWithFilters("/dashboard/total-expenses")
              }
            />

            <DashboardCard
              title="Remaining Balance"
              value={`LKR ${Number(
                data?.cards?.totalRemaining || 0,
              ).toLocaleString("en-US")}`}
              icon={<TrendingUp size={18} />}
              onClick={() =>
                navigateWithFilters(
                  "/dashboard/remaining-balance",
                )
              }
            />

            <DashboardCard
              title="Total Incomes"
              value={`LKR ${incomeSummary.grandTotal.toLocaleString(
                "en-US",
              )}`}
              icon={<Sparkles size={18} />}
              onClick={() =>
                navigateWithFilters("/dashboard/total-incomes")
              }
            />
          </div>

          {isTunnelDropdownOpen && (
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-cyan-500/40 bg-[#0a101f] p-5 shadow-2xl">
              <div className="mb-4 border-b border-slate-800 pb-3 text-xs font-bold text-cyan-400">
                Active Node Branches
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {filteredBranches.map((branch: any) => (
                  <button
                    type="button"
                    key={branch.id}
                    onClick={() =>
                      router.push(
                        `/dashboard/branches/${branch.id}`,
                      )
                    }
                    className="flex items-center gap-3 rounded-lg border border-slate-900 bg-[#0e1626] p-3 text-left hover:border-cyan-500/30"
                  >
                    <MapPin size={14} />
                    <span className="truncate text-xs text-white">
                      {branch.branch_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800/60 bg-[#0d1527]/40 p-5">
          <h2 className="mb-4 text-xs font-bold uppercase">
            Branch Expense Distribution
          </h2>

          <div className="h-72">
            <Bar data={chartData} options={chartOptions as any} />
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  icon,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-[#0d1527]/60 p-4 text-left hover:border-cyan-500/40"
    >
      <div>
        <p className="text-[10px] font-bold uppercase text-slate-400">
          {title}
        </p>
        <p className="mt-1 text-2xl font-bold text-white">
          {value}
        </p>
      </div>

      <div className="rounded-lg bg-cyan-500/10 p-3 text-cyan-400">
        {icon}
      </div>
    </button>
  );
}

function FilterBadge({
  text,
  color,
  onClear,
}: {
  text: string;
  color: "amber" | "cyan";
  onClear: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] ${
        color === "amber"
          ? "border-amber-500/30 text-amber-400"
          : "border-cyan-500/30 text-cyan-400"
      }`}
    >
      <Filter size={12} />
      {text}
      <button type="button" onClick={onClear}>
        <X size={13} />
      </button>
    </div>
  );
}

function DashboardFallback({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070a12] text-xs text-cyan-400">
      <RefreshCw size={20} className="mr-2 animate-spin" />
      {text}
    </div>
  );
}

export default function DashboardPage(props: PageProps) {
  return (
    <Suspense fallback={<DashboardFallback text="Loading..." />}>
      <DashboardContent {...props} />
    </Suspense>
  );
}