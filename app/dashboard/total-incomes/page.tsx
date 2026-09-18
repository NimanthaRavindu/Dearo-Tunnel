"use client";
import React, {Suspense,useCallback,useEffect,useState} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft,Building2,Calendar,Filter,Layers,Loader2,TrendingUp,X} from "lucide-react";

interface BranchIncomeSummary {
  branchId: string;
  branchName: string;
  totalAmount: number;
  totalCredit: number;
  entriesCount: number;
}

function TotalIncomesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");
  const filterDate = searchParams.get("date") || "";

  const [summaries, setSummaries] = useState<
    BranchIncomeSummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grandTotal, setGrandTotal] = useState(0);
  const [grandCredit, setGrandCredit] = useState(0);

  const fetchTotalIncomesSummary = useCallback(async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      params.set("summary", "true");

      if (selectedSalesId) {
        params.set("selected_sales_id", selectedSalesId);
      }

      if (selectedCapitalId) {
        params.set("selected_capital_id", selectedCapitalId);
      }

      if (filterDate) {
        params.set("date", filterDate);
      }

      const response = await fetch(
        `/api/expences/sales-incomes?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to fetch total incomes summary.",
        );
      }

      setSummaries(
        Array.isArray(result.data) ? result.data : [],
      );
      setGrandTotal(Number(result.grandTotal ?? 0) || 0);
      setGrandCredit(Number(result.grandCredit ?? 0) || 0);
    } catch (error) {
      console.error(
        "Failed to fetch total incomes summary:",
        error,
      );

      setSummaries([]);
      setGrandTotal(0);
      setGrandCredit(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSalesId, selectedCapitalId, filterDate]);

  useEffect(() => {
    fetchTotalIncomesSummary();
  }, [fetchTotalIncomesSummary]);

  const updateDateFilter = (date: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (date) {
      params.set("date", date);
    } else {
      params.delete("date");
    }

    const query = params.toString();

    router.replace(
      `/dashboard/total-incomes${query ? `?${query}` : ""}`,
    );
  };

  const clearDateFilter = () => {
    updateDateFilter("");
  };

  const clearFilter = (type: "sales" | "capital") => {
    const params = new URLSearchParams(searchParams.toString());

    if (type === "sales") {
      params.delete("selected_sales_id");
    }

    if (type === "capital") {
      params.delete("selected_capital_id");
    }

    const query = params.toString();

    router.push(
      `/dashboard/total-incomes${query ? `?${query}` : ""}`,
    );
  };

  const handleBackToDashboard = () => {
    const params = new URLSearchParams();

    if (selectedSalesId) {
      params.set("selected_sales_id", selectedSalesId);
    }

    if (selectedCapitalId) {
      params.set("selected_capital_id", selectedCapitalId);
    }

    if (filterDate) {
      params.set("date", filterDate);
    }

    const query = params.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  const handleBranchClick = (branchId: string) => {
    const params = new URLSearchParams();

    if (selectedSalesId) {
      params.set("selected_sales_id", selectedSalesId);
    }

    if (selectedCapitalId) {
      params.set("selected_capital_id", selectedCapitalId);
    }

    if (filterDate) {
      params.set("date", filterDate);
    }

    const query = params.toString();

    router.push(
      `/dashboard/branches/${encodeURIComponent(
        branchId,
      )}/add-expenses${query ? `?${query}` : ""}`,
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#070a12] p-6 font-mono text-xs text-slate-100 sm:p-10">
      <div className="pointer-events-none absolute left-1/4 top-0 h-[300px] w-[500px] rounded-full bg-red-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-10 right-1/4 h-[250px] w-[400px] rounded-full bg-rose-600/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-5xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-800/80 pb-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBackToDashboard}
              title="Return to Dashboard"
              className="group rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-slate-400 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-slate-800/90 hover:text-white active:scale-95"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-lg shadow-red-500/50" />

                <h1 className="text-xl font-black uppercase tracking-wider text-slate-100 sm:text-2xl">
                  Total Sales Incomes Ledger
                </h1>
              </div>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Real-time aggregated financial revenue tracking
                across all active corporate infrastructure branches
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedCapitalId && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-[11px] text-amber-400">
                <Filter size={12} />
                <span>
                  Capital Record #{selectedCapitalId}
                </span>

                <button
                  type="button"
                  onClick={() => clearFilter("capital")}
                  aria-label="Clear Capital Filter"
                  title="Clear Capital Filter"
                  className="rounded p-0.5 transition-colors hover:text-white"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {selectedSalesId && (
              <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 text-[11px] text-cyan-400">
                <Filter size={12} />
                <span>
                  Sales Record #{selectedSalesId}
                </span>

                <button
                  type="button"
                  onClick={() => clearFilter("sales")}
                  aria-label="Clear Sales Filter"
                  title="Clear Sales Filter"
                  className="rounded p-0.5 transition-colors hover:text-white"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5">
              <Calendar size={14} className="text-slate-300" strokeWidth={2.5} />

              <label
                htmlFor="total-income-date-filter"
                className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-slate-300"
              >
                Date
              </label>

              <input
                id="total-income-date-filter"
                type="date"
                value={filterDate}
                onChange={(event) =>
                  updateDateFilter(event.target.value)
                }
                className="cursor-pointer bg-transparent text-[11px] text-slate-200 outline-none"
              />

              {filterDate && (
                <button
                  type="button"
                  onClick={clearDateFilter}
                  aria-label="Clear Date Filter"
                  title="Clear Date Filter"
                  className="text-slate-300 transition-colors hover:text-red-400"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1527]/60 p-6 shadow-2xl sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-red-500/5 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-5">
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 shadow-inner">
                <TrendingUp size={28} />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {filterDate
                    ? `Revenue for ${filterDate}`
                    : "Grand Cumulative Revenue"}
                </span>

                <div className="mt-1 text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
                  LKR{" "}
                  {grandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-400 shadow-inner">
                <TrendingUp size={28} />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {filterDate
                    ? `Credit for ${filterDate}`
                    : "Grand Total Credit"}
                </span>

                <div className="mt-1 text-2xl font-black tracking-tight text-amber-400 sm:text-3xl">
                  LKR{" "}
                  {grandCredit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex w-fit items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-2.5 shadow-inner">
            <div className="rounded-lg bg-slate-900 p-2 text-slate-400">
              <Layers size={16} />
            </div>
            <div className="text-xs">
              <p className="font-medium text-slate-400">
                Database Status
              </p>

              <p className="mt-0.5 flex items-center gap-1 font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                Synchronized
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-800 bg-[#0d1527]/40 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-red-400" />
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                Branch-Wise Revenue Breakdown
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {summaries.length} Operating Units Active
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-24 text-center">
              <Loader2 size={28} className="animate-spin text-red-500" />

              <p className="text-[11px] font-medium text-slate-400">
                Aggregating branch database nodes...
              </p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-24 text-center">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-600">
                <Building2 size={28} />
              </div>

              <p className="text-[11px] font-medium text-slate-400">
                {filterDate
                  ? `No sales income records found for ${filterDate}.`
                  : "No active branch sales income records detected."}
              </p>

              {filterDate && (
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className="text-[10px] text-red-400 transition-colors hover:text-red-300"
                >
                  Clear date filter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3.5">
                      Branch Name
                    </th>

                    <th className="px-4 py-3.5 text-center">
                      Logged Entries
                    </th>

                    <th className="px-4 py-3.5 text-right">
                      Total Revenue (LKR)
                    </th>

                    <th className="px-4 py-3.5 text-right">
                      Total Credit (LKR)
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {summaries.map((item) => (
                    <tr
                      key={item.branchId}
                      onClick={() =>
                        handleBranchClick(item.branchId)
                      }
                      title="Click to view branch details"
                      className="group cursor-pointer transition-colors hover:bg-slate-900/70"
                    >
                      <td className="px-4 py-3.5 font-semibold text-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-red-400 transition-transform group-hover:scale-110">
                            <Building2 size={14} />
                          </div>

                          <span className="block text-sm font-bold text-white">
                            {item.branchName || "Unnamed Branch"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center font-semibold text-slate-300">
                        <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px]">
                          {item.entriesCount} entries
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right text-sm font-black text-red-400">
                        LKR{" "}
                        {Number(
                          item.totalAmount || 0,
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="px-4 py-3.5 text-right text-sm font-black text-amber-400">
                        LKR{" "}
                        {Number(
                          item.totalCredit || 0,
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalIncomesFallback() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#070a12] font-mono text-xs text-slate-500">
      <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />

      <p className="text-[10px] uppercase tracking-widest">
        Loading Revenue Ledger...
      </p>
    </div>
  );
}

export default function TotalIncomesSummaryPage() {
  return (
    <Suspense fallback={<TotalIncomesFallback />}>
      <TotalIncomesContent />
    </Suspense>
  );
}