"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle,ArrowLeft,Calendar,FileText,RefreshCw,Search,ShieldCheck,User,X} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

type SalaryEntry = {
  id?: number | string;
  employee_name?: string;
  employee_id?: number | string;
  reason?: string;
  total_payable?: number | string;
  total_paid?: number | string;
  balance?: number | string;
  expense_date?: string;
  date?: string;
};

type SalarySummary = {
  payable: number;
  paid: number;
  balance: number;
};

const EMPTY_SALARY_SUMMARY: SalarySummary = {
  payable: 0,
  paid: 0,
  balance: 0,
};

function money(value: unknown): string {
  return Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function entryDate(item: SalaryEntry): string {
  return String(item.expense_date || item.date || "").slice(0, 10);
}

export default function ViewSalaryExpensesPage({
  params,
}: PageProps) {
  const router = useRouter();
  const routeParams = use(params);

  const branchId = routeParams?.id
    ? decodeURIComponent(routeParams.id)
    : "";

  const [data, setData] = useState<SalaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!branchId || branchId === "[id]") {
      setLoading(false);
      return;
    }

    const fetchSalaryLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/expences/salary?branchId=${encodeURIComponent(branchId)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load salary expenses.");
        }

        const result = await response.json();

        setData(
          Array.isArray(result)
            ? result
            : result.data || result.rows || [],
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load salary expenses.",
        );
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryLogs();
  }, [branchId]);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((item) => {
      const matchesDate =
        !selectedDate || entryDate(item) === selectedDate;

      const matchesSearch =
        !query ||
        [
          item.employee_name,
          item.employee_id,
          item.reason,
          item.total_payable,
          item.total_paid,
          item.balance,
          entryDate(item),
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query),
        );

      return matchesDate && matchesSearch;
    });
  }, [data, selectedDate, search]);

  const summary = useMemo<SalarySummary>(() => {
    return filteredData.reduce<SalarySummary>(
      (total, item) => ({
        payable:
          total.payable + Number(item.total_payable || 0),
        paid:
          total.paid + Number(item.total_paid || 0),
        balance:
          total.balance + Number(item.balance || 0),
      }),
      EMPTY_SALARY_SUMMARY,
    );
  }, [filteredData]);

  const clearFilters = () => {
    setSelectedDate("");
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-[#070a12] p-4 text-slate-300 antialiased md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-900 pb-5 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                Salary Expenditure Ledger
              </h1>

              <p className="mt-1 text-[10px] uppercase text-slate-500">
                Scope Node ID: {branchId}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                className="rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-300 outline-none focus:border-amber-500"
              />
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee..."
                className="rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-300 outline-none focus:border-amber-500"
              />
            </div>

            {(selectedDate || search) && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center justify-center rounded-lg border border-slate-800 px-3 text-xs text-slate-400 transition hover:text-white"
                aria-label="Clear filters"
              >
                <X size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 transition hover:text-amber-400"
            >
              <RefreshCw size={14} />
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
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Payable"
            value={money(summary.payable)}
            color="amber"
          />

          <SummaryCard
            title="Total Paid"
            value={money(summary.paid)}
            color="emerald"
          />

          <SummaryCard
            title="Outstanding Balance"
            value={money(summary.balance)}
            color="rose"
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-900 bg-slate-900/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/80 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="p-4">Employee Name</th>
                  <th className="p-4">Classification Reason</th>
                  <th className="p-4 text-right">Total Payable</th>
                  <th className="p-4 text-right">Total Paid</th>
                  <th className="p-4 text-right">Balance</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-900/40 text-[11px]">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-12 text-center text-slate-500"
                    >
                      Loading salary records...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-12 text-center text-slate-600"
                    >
                      <AlertCircle size={18} className="mx-auto mb-2" />
                      No salary records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => {
                    const balance = Number(item.balance || 0);
                    const settled = balance <= 0;

                    return (
                      <tr
                        key={item.id ?? index}
                        className="transition hover:bg-slate-900/30"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2 font-semibold text-slate-200">
                            <User size={13} className="text-slate-600" />

                            {item.employee_name ||
                              `ID: ${item.employee_id || "UNKNOWN"}`}
                          </div>
                        </td>

                        <td className="p-4 text-slate-400">
                          {item.reason || "Monthly salary payout"}
                        </td>

                        <td className="p-4 text-right text-slate-300">
                          {money(item.total_payable)}
                        </td>

                        <td className="p-4 text-right text-emerald-400">
                          {money(item.total_paid)}
                        </td>

                        <td className="p-4 text-right">
                          {settled ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-400">
                              <ShieldCheck size={10} />
                              SETTLED
                            </span>
                          ) : (
                            <span className="font-bold text-amber-400">
                              {money(balance)}
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap p-4 text-slate-300">
                          <Calendar size={12} className="mr-2 inline text-slate-600" />

                          {entryDate(item) || "-"}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/dashboard/branches/${encodeURIComponent(
                                  branchId,
                                )}/view-expences/salary/${item.id}`,
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
                    <td
                      colSpan={2}
                      className="p-4 text-slate-400"
                    >
                      Filtered Total
                    </td>

                    <td className="p-4 text-right text-amber-400">
                      {money(summary.payable)}
                    </td>

                    <td className="p-4 text-right text-emerald-400">
                      {money(summary.paid)}
                    </td>

                    <td className="p-4 text-right text-rose-400">
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
          title="Salary Expense Summary"
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
  color: "amber" | "emerald" | "rose";
}) {
  const colors = {
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
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
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0d1527] p-6">
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
            color="amber"
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
