"use client";
import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle,ArrowLeft,Calendar,FileText,RefreshCw,Search,ShieldCheck,Tag,Wallet,X} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface OtherExpense {
  id?: number | string;
  reason?: string;
  expense_type?: string;
  total_payable?: number | string;
  total_paid?: number | string;
  balance?: number | string;
  expense_date?: string;
  date?: string;
}

interface Branch {
  id: number | string;
  branchName?: string;
  bName?: string;
}

interface OtherSummary {
  payable: number;
  paid: number;
  balance: number;
}

const EMPTY_SUMMARY: OtherSummary = {
  payable: 0,
  paid: 0,
  balance: 0,
};

function numeric(value: unknown): number {
  return Number(value ?? 0) || 0;
}

function money(value: unknown): string {
  return numeric(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function expenseDate(item: OtherExpense): string {
  return String(item.expense_date || item.date || "").slice(0, 10);
}

export default function ViewOtherExpensesPage({
  params,
}: PageProps) {
  const router = useRouter();
  const routeParams = use(params);

  const branchId = routeParams?.id
    ? decodeURIComponent(routeParams.id)
    : "";

  const [data, setData] = useState<OtherExpense[]>([]);
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const loadData = async () => {
    if (!branchId || branchId === "[id]") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const expenseResponse = await fetch(
        `/api/expences/other?branchId=${encodeURIComponent(branchId)}`,
        { cache: "no-store" },
      );

      if (!expenseResponse.ok) {
        throw new Error("Failed to load other expenses.");
      }

      const expenseResult = await expenseResponse.json();

      setData(
        Array.isArray(expenseResult)
          ? expenseResult
          : expenseResult.data || expenseResult.rows || [],
      );

      const branchResponse = await fetch("/api/branch", {
        cache: "no-store",
      });

      if (branchResponse.ok) {
        const branchResult = await branchResponse.json();

        if (Array.isArray(branchResult)) {
          const currentBranch = branchResult.find(
            (branch: Branch) =>
              String(branch.id) === String(branchId),
          );

          if (currentBranch) {
            setBranchName(
              currentBranch.branchName ||
                currentBranch.bName ||
                "",
            );
          }
        }
      }
    } catch (requestError) {
      console.error("Other expenses loading error:", requestError);

      setData([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load other expenses.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((item) => {
      const matchesCategory =
        categoryFilter === "ALL" ||
        String(item.expense_type || "").toLowerCase() ===
          categoryFilter.toLowerCase();

      const matchesDate =
        !selectedDate || expenseDate(item) === selectedDate;

      const matchesSearch =
        !query ||
        [
          item.reason,
          item.expense_type,
          item.total_payable,
          item.total_paid,
          item.balance,
          expenseDate(item),
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query),
        );

      return matchesCategory && matchesDate && matchesSearch;
    });
  }, [data, categoryFilter, selectedDate, search]);

  const summary = useMemo<OtherSummary>(() => {
    return filteredData.reduce<OtherSummary>(
      (total, item) => ({
        payable:
          total.payable + numeric(item.total_payable),
        paid: total.paid + numeric(item.total_paid),
        balance: total.balance + numeric(item.balance),
      }),
      EMPTY_SUMMARY,
    );
  }, [filteredData]);

  const clearFilters = () => {
    setCategoryFilter("ALL");
    setSelectedDate("");
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-[#070a12] p-4 font-sans text-slate-300 antialiased md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-900 pb-5 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-md border border-purple-500/20 bg-purple-500/10 p-1.5 text-purple-400">
                  <Wallet size={15} />
                </div>

                <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                  Operational Overhead Ledger
                </h1>
              </div>

              <p className="mt-1 text-[10px] uppercase tracking-wide text-purple-400/80">
                Scope Context:{" "}
                {branchName || `Branch Node ID: ${branchId}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs uppercase tracking-wider text-slate-300 outline-none focus:border-purple-500"
            >
              <option value="ALL">ALL CLASSIFICATIONS</option>
              <option value="Food">Food</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Water">Water</option>
              <option value="Electricity">Electricity</option>
              <option value="Other Payments">Other Payments</option>
            </select>

            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                className="rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-300 outline-none focus:border-purple-500"
              />
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                className="rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-300 outline-none focus:border-purple-500"
              />
            </div>

            {(categoryFilter !== "ALL" || selectedDate || search) && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center justify-center rounded-lg border border-slate-800 px-3 text-slate-400 transition hover:text-white"
                aria-label="Clear filters"
              >
                <X size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 transition hover:text-purple-400 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowSummary(true)}
              className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-400 transition hover:bg-purple-500/20"
            >
              <FileText size={13} className="mr-1 inline" />
              View Summary
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadData}
              className="font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Payable"
            value={money(summary.payable)}
            color="purple"
          />

          <SummaryCard
            title="Total Paid"
            value={money(summary.paid)}
            color="emerald"
          />

          <SummaryCard
            title="Outstanding Balance"
            value={money(summary.balance)}
            color="amber"
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-900 bg-slate-900/10 shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/80 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="p-4">Classification Matrix</th>
                  <th className="p-4 text-right">Total Payable</th>
                  <th className="p-4 text-right">Total Paid</th>
                  <th className="p-4 text-right">
                    Outstanding Balance
                  </th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-900/40 font-mono text-[11px]">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center text-slate-500"
                    >
                      Loading operational entries...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center text-slate-600"
                    >
                      <AlertCircle size={18} className="mx-auto mb-2" />
                      No operational records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => {
                    const balance = numeric(item.balance);
                    const settled = balance <= 0;

                    return (
                      <tr
                        key={item.id ?? index}
                        className="transition-colors hover:bg-slate-900/30"
                      >
                        <td className="whitespace-nowrap p-4">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/10 bg-purple-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-purple-400">
                            <Tag size={10} />
                            {item.reason || "General Overhead"}
                          </span>
                        </td>

                        <td className="p-4 text-right font-medium text-slate-300">
                          {money(item.total_payable)}
                        </td>

                        <td className="p-4 text-right font-medium text-emerald-400">
                          {money(item.total_paid)}
                        </td>

                        <td className="p-4 text-right font-bold">
                          {settled ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] uppercase tracking-wider text-emerald-400">
                              <ShieldCheck size={10} />
                              Settled
                            </span>
                          ) : (
                            <div className="inline-flex flex-col items-end">
                              <span className="text-amber-400">
                                {money(balance)}
                              </span>
                              <span className="text-[8px] uppercase tracking-tighter text-amber-600">
                                Deferred
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap p-4 text-slate-300">
                          <Calendar size={12} className="mr-2 inline text-slate-600" />
                          {expenseDate(item) || "-"}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/dashboard/branches/${encodeURIComponent(
                                  branchId,
                                )}/view-expences/other/${item.id}`,
                              )
                            }
                            className="rounded border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] font-bold text-purple-400 transition hover:bg-purple-600 hover:text-white"
                          >
                            <FileText size={11} className="mr-1 inline" />
                            View Summary
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {!loading && filteredData.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-800 bg-slate-950/70 font-bold">
                    <td className="p-4 text-slate-400">
                      Filtered Total
                    </td>

                    <td className="p-4 text-right text-purple-400">
                      {money(summary.payable)}
                    </td>

                    <td className="p-4 text-right text-emerald-400">
                      {money(summary.paid)}
                    </td>

                    <td className="p-4 text-right text-amber-400">
                      {money(summary.balance)}
                    </td>

                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>

      {showSummary && (
        <SummaryModal
          title="Operational Expense Summary"
          count={filteredData.length}
          values={[
            ["Total Payable", money(summary.payable)],
            ["Total Paid", money(summary.paid)],
            ["Outstanding Balance", money(summary.balance)],
          ]}
          onClose={() => setShowSummary(false)}
        />
      )}
    </main>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "purple" | "emerald" | "amber";
}) {
  const colors = {
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className={`mt-3 text-xl font-black ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryModal({
  title,
  count,
  values,
  onClose,
}: {
  title: string;
  count: number;
  values: string[][];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0d1527] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-mono text-lg font-bold uppercase text-white">
              {title}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {count} records
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 transition hover:text-white"
            aria-label="Close summary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard
            title="Records"
            value={String(count)}
            color="purple"
          />

          {values.map(([label, value]) => (
            <SummaryCard
              key={label}
              title={label}
              value={value}
              color="emerald"
            />
          ))}
        </div>
      </div>
    </div>
  );
}