"use client";
import React, {Suspense,useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {BarChart3,CalendarDays,CheckCircle2,CircleDollarSign,FileText,Filter,RefreshCw,RotateCcw,Search,TrendingDown,TrendingUp,Wallet} from "lucide-react";

const SUMMARY_API = "/api/dashboard/summary";
const INCOME_API = "/api/expences/sales-incomes";

type Entry = {
  id?: number | string;
  date?: string;
  description?: string;
  category?: string;
  type?: string;
  amount?: number | string;
  branch_name?: string;
  branch_id?: string | number;
};

type DashboardResponse = {
  cards?: {
    totalExpenses?: number | string;
  };
  sales?: Entry[];
  capital?: Entry[];
};

type IncomeResponse = {
  success?: boolean;
  grandTotal?: number | string;
  data?: Entry[];
};

function ViewEntriesContent() {
  const searchParams = useSearchParams();

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");
  const selectedDate = searchParams.get("date") || "";

  const [entries, setEntries] = useState<Entry[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<Entry[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const [fromDate, setFromDate] = useState(selectedDate);
  const [toDate, setToDate] = useState(selectedDate);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setFromDate(selectedDate);
    setToDate(selectedDate);
  }, [selectedDate]);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
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
        `${SUMMARY_API}${dashboardQuery ? `?${dashboardQuery}` : ""}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!dashboardResponse.ok) {
        throw new Error("Failed to load dashboard summary.");
      }

      const dashboardResult: DashboardResponse =
        await dashboardResponse.json();

      setTotalExpenses(
        Number(dashboardResult.cards?.totalExpenses ?? 0) || 0,
      );

      const incomeParams = new URLSearchParams({
        summary: "true",
      });

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
        `${INCOME_API}?${incomeParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!incomeResponse.ok) {
        throw new Error("Failed to load income summary.");
      }

      const incomeResult: IncomeResponse =
        await incomeResponse.json();

      if (incomeResult.success === false) {
        throw new Error("Income summary request failed.");
      }

      setTotalIncome(Number(incomeResult.grandTotal ?? 0) || 0);

      const salesEntries: Entry[] = Array.isArray(
        dashboardResult.sales,
      )
        ? dashboardResult.sales.map((entry) => ({
            ...entry,
            type: entry.type || "Expense",
            category: entry.category || "Sales Expense",
            description:
              entry.description ||
              (entry.id
                ? `Sales Expense #${entry.id}`
                : "Sales Expense"),
            date: entry.date
              ? String(entry.date).substring(0, 10)
              : "",
            amount: entry.amount ?? 0,
          }))
        : [];

      const capitalEntries: Entry[] = Array.isArray(
        dashboardResult.capital,
      )
        ? dashboardResult.capital.map((entry) => ({
            ...entry,
            type: entry.type || "Expense",
            category: entry.category || "Capital Expense",
            description:
              entry.description ||
              (entry.id
                ? `Capital Expense #${entry.id}`
                : "Capital Expense"),
            date: entry.date
              ? String(entry.date).substring(0, 10)
              : "",
            amount: entry.amount ?? 0,
          }))
        : [];

      const incomeRecords: Entry[] = Array.isArray(
        incomeResult.data,
      )
        ? incomeResult.data.map((entry: any) => ({
            ...entry,
            type: entry.type || "Income",
            category: entry.category || "Income",
            description:
              entry.description ||
              entry.personName ||
              entry.person_name ||
              entry.name ||
              (entry.id
                ? `Income Entry #${entry.id}`
                : "Income Entry"),
            date: entry.date
              ? String(entry.date).substring(0, 10)
              : "",
            amount: entry.amount ?? 0,
          }))
        : [];

      setIncomeEntries(incomeRecords);

      const loadedEntries = [
        ...incomeRecords,
        ...salesEntries,
        ...capitalEntries,
      ].sort((a, b) =>
        String(b.date ?? "").localeCompare(String(a.date ?? "")),
      );

      setEntries(loadedEntries);
    } catch (err) {
      console.error("VIEW ENTRIES ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load entries.",
      );

      setEntries([]);
      setIncomeEntries([]);
      setTotalIncome(0);
      setTotalExpenses(0);
    } finally {
      setLoading(false);
    }
  }, [selectedSalesId, selectedCapitalId, selectedDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const dateFilteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = String(entry.date ?? "").substring(0, 10);

      if (!entryDate) return false;
      if (fromDate && entryDate < fromDate) return false;
      if (toDate && entryDate > toDate) return false;

      return true;
    });
  }, [entries, fromDate, toDate]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return dateFilteredEntries;

    return dateFilteredEntries.filter((entry) =>
      [
        entry.description,
        entry.category,
        entry.type,
        entry.branch_name,
        entry.branch_id,
        entry.amount,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      ),
    );
  }, [dateFilteredEntries, searchQuery]);

  const isIncomeEntry = (entry: Entry) => {
    const type = String(entry.type ?? "").toLowerCase();
    const category = String(entry.category ?? "").toLowerCase();

    return (
      type.includes("income") ||
      type === "in" ||
      type === "credit" ||
      category.includes("income")
    );
  };

  const filteredSummary = useMemo(() => {
    if (!fromDate && !toDate) {
      return {
        income: totalIncome,
        expenses: totalExpenses,
      };
    }

    const income = incomeEntries.reduce((total, entry) => {
      const date = String(entry.date ?? "").substring(0, 10);

      if (!date) return total;
      if (fromDate && date < fromDate) return total;
      if (toDate && date > toDate) return total;

      return total + (Number(entry.amount ?? 0) || 0);
    }, 0);

    const expenses = dateFilteredEntries.reduce((total, entry) => {
      if (isIncomeEntry(entry)) return total;

      return total + (Number(entry.amount ?? 0) || 0);
    }, 0);

    return { income, expenses };
  }, [
    fromDate,
    toDate,
    incomeEntries,
    dateFilteredEntries,
    totalIncome,
    totalExpenses,
  ]);

  const balance =
    filteredSummary.income - filteredSummary.expenses;

  const isLoss = balance < 0;

  const formatMoney = (value: number) =>
    `Rs. ${value.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const parts = String(date).substring(0, 10).split("-");

    return parts.length === 3
      ? `${parts[2]}/${parts[1]}/${parts[0]}`
      : String(date);
  };

  const resetFilter = () => {
    setFromDate("");
    setToDate("");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <Link
                href="/dashboard"
                className="hover:text-cyan-400 transition"
              >
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-400">
                View Entries
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <FileText size={22} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  View Entries
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Review income, expenses and financial entries
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadEntries}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-7">
          <SummaryCard
            title="Total Income"
            value={formatMoney(filteredSummary.income)}
            icon={<TrendingUp size={20} className="text-emerald-400" />}
            iconClass="bg-emerald-500/10 border-emerald-500/20"
            footerIcon={<CheckCircle2 size={14} />}
            footer="Income recorded"
            footerClass="text-emerald-400"
          />

          <SummaryCard
            title="Net Income"
            value={formatMoney(filteredSummary.expenses)}
            icon={<TrendingDown size={20} className="text-orange-400" />}
            iconClass="bg-orange-500/10 border-orange-500/20"
            footerIcon={<CircleDollarSign size={14} />}
            footer="Expenses recorded"
            footerClass="text-orange-400"
          />

          <div
            className={`rounded-2xl border p-5 shadow-xl ${
              isLoss
                ? "border-red-500/20 bg-red-500/[0.04]"
                : "border-blue-500/20 bg-blue-500/[0.04]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-slate-500">
                  Balance
                </p>

                <h2
                  className={`text-2xl sm:text-3xl font-bold mt-2 ${
                    isLoss ? "text-red-400" : "text-blue-400"
                  }`}
                >
                  {formatMoney(Math.abs(balance))}
                </h2>
              </div>

              <div
                className={`h-10 w-10 rounded-xl border flex items-center justify-center ${
                  isLoss
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-blue-500/10 border-blue-500/20"
                }`}
              >
                <Wallet size={20} className={ isLoss ? "text-red-400" : "text-blue-400" } />
              </div>
            </div>

            <div
              className={`mt-4 text-xs font-bold uppercase tracking-wider ${
                isLoss ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {isLoss ? "LOSS" : "PROFIT"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-5 mb-7">
          <div className="flex items-center gap-2 mb-5">
            <Filter size={18} className="text-cyan-400" />

            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Filter Entries
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateInput
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
            />

            <DateInput
              label="To Date"
              value={toDate}
              onChange={setToDate}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Search
              </label>

              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search entries..."
                  className="w-full rounded-xl border border-slate-700 bg-[#070a13] pl-10 pr-3 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
            <div className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-300">
                {filteredEntries.length}
              </span>{" "}
              entries
            </div>

            <button
              type="button"
              onClick={resetFilter}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <RotateCcw size={15} />
              Reset Filter
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0d1527] overflow-hidden shadow-xl">
          <div className="px-5 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <BarChart3 size={18} className="text-indigo-400" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Financial Entries
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Income and expense records
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              {filteredEntries.length} Records
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <RefreshCw size={28} className="animate-spin text-cyan-400 mb-3" />
              <p className="text-sm text-slate-500">
                Loading entries...
              </p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center px-5">
              <div className="h-14 w-14 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center justify-center mb-4">
                <FileText size={25} className="text-slate-500" />
              </div>

              <h3 className="text-sm font-semibold text-slate-300">
                No Entries Found
              </h3>

              <p className="text-xs text-slate-600 mt-1 text-center">
                There are no entries matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0a1020]">
                    {[
                      "Date",
                      "Description",
                      "Category",
                      "Type",
                      "Branch",
                      "Amount",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className={`px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 ${
                          heading === "Amount"
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.map((entry, index) => {
                    const amount =
                      Number(entry.amount ?? 0) || 0;
                    const income = isIncomeEntry(entry);

                    return (
                      <tr
                        key={
                          entry.id ??
                          `${entry.date}-${entry.description}-${index}`
                        }
                        className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/20 transition"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CalendarDays size={15} className="text-slate-600" />
                            {formatDate(entry.date)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-200">
                            {entry.description || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                            {entry.category || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase ${
                              income
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            }`}
                          >
                            {income ? (
                              <TrendingUp size={13} />
                            ) : (
                              <TrendingDown size={13} />
                            )}
                            {entry.type ||
                              (income ? "Income" : "Expense")}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-400">
                            {entry.branch_name ||
                              entry.branch_id ||
                              "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span
                            className={`font-bold ${
                              income
                                ? "text-emerald-400"
                                : "text-orange-400"
                            }`}
                          >
                            {income ? "+" : "-"}
                            {formatMoney(amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-600">
          <div>View Entries • Financial Overview</div>
          <div>Balance = Total Income - Total Expenses</div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  iconClass,
  footerIcon,
  footer,
  footerClass,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  footerIcon: React.ReactNode;
  footer: string;
  footerClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-5 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-500">
            {title}
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            {value}
          </h2>
        </div>

        <div
          className={`h-10 w-10 rounded-xl border flex items-center justify-center ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-2 text-xs ${footerClass}`}
      >
        {footerIcon}
        {footer}
      </div>
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        {label}
      </label>

      <div className="relative">
        <CalendarDays size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />

        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-[#070a13] pl-10 pr-3 py-3 text-sm text-slate-200 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
        />
      </div>
    </div>
  );
}

export default function ViewEntriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-cyan-400">
          Loading entries...
        </div>
      }
    >
      <ViewEntriesContent />
    </Suspense>
  );
}