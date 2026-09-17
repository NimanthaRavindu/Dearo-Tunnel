"use client";
import React, {use,useCallback,useEffect,useMemo,useState} from "react";
import { useRouter } from "next/navigation";
import {ArrowLeft,CalendarDays,CheckCircle2,CircleDollarSign,Fuel,Loader2,RefreshCw,Search,TrendingDown,Wallet,X} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface DieselExpense {
  id?: number | string;
  branch_id?: number | string;
  date?: string;
  machine?: string;
  diesel?: number | string;
  amount?: number | string;
  payable?: number | string;
  paid?: number | string;
  balance?: number | string;
}

interface ApiResponse {
  success?: boolean;
  data?: DieselExpense[];
  expenses?: DieselExpense[];
  rows?: DieselExpense[];
  error?: string;
}

interface DieselSummary {
  diesel: number;
  amount: number;
  payable: number;
  paid: number;
  balance: number;
}

const DIESEL_API = "/api/expences/diesel";

const EMPTY_SUMMARY: DieselSummary = {
  diesel: 0,
  amount: 0,
  payable: 0,
  paid: 0,
  balance: 0,
};

function numeric(value: unknown): number {
  return Number(value ?? 0) || 0;
}

function dateOnly(value: unknown): string {
  return String(value ?? "").slice(0, 10);
}

function formatDate(value: unknown): string {
  const date = dateOnly(value);

  if (!date) return "-";

  const [year, month, day] = date.split("-");

  return year && month && day
    ? `${day}/${month}/${year}`
    : date;
}

function formatMoney(value: number): string {
  return `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function extractRecords(result: unknown): DieselExpense[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (!result || typeof result !== "object") {
    return [];
  }

  const response = result as ApiResponse;

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (Array.isArray(response.expenses)) {
    return response.expenses;
  }

  if (Array.isArray(response.rows)) {
    return response.rows;
  }

  return [];
}

export default function DieselExpensesPage({
  params,
}: PageProps) {
  const router = useRouter();
  const routeParams = use(params);

  const branchId = routeParams?.id
    ? decodeURIComponent(routeParams.id)
    : "";

  const [records, setRecords] = useState<DieselExpense[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async () => {
    if (!branchId || branchId === "[id]") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams();
      query.set("branch_id", branchId);

      const response = await fetch(
        `${DIESEL_API}?${query.toString()}`,
        {
          cache: "no-store",
        },
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error || "Failed to load diesel expenses.",
        );
      }

      setRecords(extractRecords(result));
    } catch (requestError) {
      console.error("Diesel expenses error:", requestError);

      setRecords([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load diesel expenses.",
      );
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesDate =
        !selectedDate ||
        dateOnly(record.date) === selectedDate;

      const matchesSearch =
        !query ||
        [
          record.branch_id,
          record.date,
          record.machine,
          record.diesel,
          record.amount,
          record.payable,
          record.paid,
          record.balance,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query),
        );

      return matchesDate && matchesSearch;
    });
  }, [records, selectedDate, search]);

  const summary = useMemo<DieselSummary>(() => {
    return filteredRecords.reduce<DieselSummary>(
      (total, record) => ({
        diesel: total.diesel + numeric(record.diesel),
        amount: total.amount + numeric(record.amount),
        payable: total.payable + numeric(record.payable),
        paid: total.paid + numeric(record.paid),
        balance: total.balance + numeric(record.balance),
      }),
      EMPTY_SUMMARY,
    );
  }, [filteredRecords]);

  const clearFilters = () => {
    setSelectedDate("");
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-[#070a12] p-4 font-sans text-slate-200 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-800/80 pb-6 xl:flex-row xl:items-center">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/branches/${encodeURIComponent(
                    branchId,
                  )}/view-expences`,
                )
              }
              className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-slate-400 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-white"
              aria-label="Back to expenses"
            >
              <ArrowLeft size={17} />
            </button>

            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-400">
                  <Fuel size={20} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">
                    Expense Management
                  </p>

                  <h1 className="mt-1 font-mono text-xl font-black uppercase tracking-wider text-white">
                    Diesel Expenses
                  </h1>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Branch ID:{" "}
                <span className="font-semibold text-purple-400">
                  {branchId}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                className="w-full rounded-xl border border-slate-800 bg-[#0d1527] py-3 pl-10 pr-3 text-xs text-slate-300 outline-none transition focus:border-cyan-500 sm:w-auto"
              />
            </div>

            <button
              type="button"
              onClick={loadRecords}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#0d1527] px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-400 disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowSummary(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:bg-cyan-400"
            >
              <CircleDollarSign size={15} />
              View Summary
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadRecords}
              className="font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Amount"
            value={formatMoney(summary.amount)}
            icon={<CircleDollarSign size={19} />}
            color="cyan"
          />

          <MetricCard
            title="Total Payable"
            value={formatMoney(summary.payable)}
            icon={<Wallet size={19} />}
            color="amber"
          />

          <MetricCard
            title="Total Paid"
            value={formatMoney(summary.paid)}
            icon={<CheckCircle2 size={19} />}
            color="emerald"
          />

          <MetricCard
            title="Total Balance"
            value={formatMoney(summary.balance)}
            icon={<TrendingDown size={19} />}
            color="rose"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1527] shadow-2xl">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-white">
                Diesel Expense Register
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {selectedDate
                  ? `Showing records for ${formatDate(selectedDate)}`
                  : "Showing all available branch records"}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search records..."
                  className="w-full rounded-xl border border-slate-800 bg-[#070a12] py-2.5 pl-9 pr-3 text-xs text-slate-300 outline-none focus:border-cyan-500 sm:w-56"
                />
              </div>

              {(selectedDate || search) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-slate-800 px-3 text-xs text-slate-400 transition hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 size={28} className="animate-spin text-cyan-400"/>
              Loading diesel expense records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-500">
              <Fuel size={30} className="text-slate-700" />

              <p>
                {selectedDate
                  ? `No records found for ${formatDate(selectedDate)}.`
                  : "No diesel expense records found."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0a1020] text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Branch ID</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Machine</th>
                    <th className="px-5 py-4 text-right">
                      Diesel
                    </th>
                    <th className="px-5 py-4 text-right">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-right">
                      Payable
                    </th>
                    <th className="px-5 py-4 text-right">
                      Paid
                    </th>
                    <th className="px-5 py-4 text-right">
                      Balance
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/70">
                  {filteredRecords.map((record, index) => (
                    <tr
                      key={
                        record.id ??
                        `${record.date}-${record.machine}-${index}`
                      }
                      className="transition hover:bg-cyan-500/[0.03]"
                    >
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {record.branch_id ?? branchId}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-300">
                        {formatDate(record.date)}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-white">
                        {record.machine || "-"}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-cyan-400">
                        {numeric(record.diesel).toLocaleString(
                          "en-LK",
                          {
                            maximumFractionDigits: 3,
                          },
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-slate-200">
                        {formatMoney(numeric(record.amount))}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-amber-400">
                        {formatMoney(numeric(record.payable))}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-emerald-400">
                        {formatMoney(numeric(record.paid))}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-rose-400">
                        {formatMoney(numeric(record.balance))}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="border-t border-slate-700 bg-[#0a1020] text-sm font-bold">
                    <td
                      colSpan={3}
                      className="px-5 py-4 text-slate-400"
                    >
                      Filtered Total
                    </td>

                    <td className="px-5 py-4 text-right text-cyan-400">
                      {summary.diesel.toLocaleString("en-LK", {
                        maximumFractionDigits: 3,
                      })}
                    </td>

                    <td className="px-5 py-4 text-right text-white">
                      {formatMoney(summary.amount)}
                    </td>

                    <td className="px-5 py-4 text-right text-amber-400">
                      {formatMoney(summary.payable)}
                    </td>

                    <td className="px-5 py-4 text-right text-emerald-400">
                      {formatMoney(summary.paid)}
                    </td>

                    <td className="px-5 py-4 text-right text-rose-400">
                      {formatMoney(summary.balance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0d1527] p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between border-b border-slate-800 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">
                  Financial Overview
                </p>

                <h2 className="mt-1 font-mono text-lg font-black uppercase text-white">
                  Diesel Expense Summary
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedDate
                    ? `Date: ${formatDate(selectedDate)}`
                    : "All available dates"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                aria-label="Close summary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryItem
                label="Total Records"
                value={String(filteredRecords.length)}
              />

              <SummaryItem
                label="Total Diesel"
                value={`${summary.diesel.toLocaleString("en-LK", {
                  maximumFractionDigits: 3,
                })} L`}
              />

              <SummaryItem
                label="Total Amount"
                value={formatMoney(summary.amount)}
              />

              <SummaryItem
                label="Total Payable"
                value={formatMoney(summary.payable)}
              />

              <SummaryItem
                label="Total Paid"
                value={formatMoney(summary.paid)}
              />

              <SummaryItem
                label="Outstanding Balance"
                value={formatMoney(summary.balance)}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "cyan" | "amber" | "emerald" | "rose";
}) {
  const styles = {
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    emerald:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-xl font-black text-white">
            {value}
          </p>
        </div>

        <div className={`rounded-xl border p-3 ${styles[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#070a12] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}