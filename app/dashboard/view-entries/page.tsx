"use client";
import React, {Suspense,useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3,CalendarDays,CheckCircle2,CircleDollarSign,FileText,Filter,RefreshCw,RotateCcw,Search,TrendingDown,TrendingUp,Wallet} from "lucide-react";

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
  branch_id?: number | string;
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

  const dashboardHref = `/dashboard${
    searchParams.toString()
      ? `?${searchParams.toString()}`
      : ""
  }`;

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

      if (selectedDate) {
        dashboardParams.set("date", selectedDate);
      }

      const dashboardQuery = dashboardParams.toString();

      const dashboardResponse = await fetch(
        `${SUMMARY_API}${
          dashboardQuery ? `?${dashboardQuery}` : ""
        }`,
        {
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

      setTotalIncome(
        Number(incomeResult.grandTotal ?? 0) || 0,
      );

      const salesEntries: Entry[] = Array.isArray(
        dashboardResult.sales,
      )
        ? dashboardResult.sales.map((entry) => ({
            ...entry,
            type: entry.type || "Expense",
            category: entry.category || "Sales Expense",
            description:
              entry.description ||
              `Sales Expense #${entry.id ?? ""}`,
            date: String(entry.date ?? "").substring(0, 10),
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
              `Capital Expense #${entry.id ?? ""}`,
            date: String(entry.date ?? "").substring(0, 10),
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
              `Income Entry #${entry.id ?? ""}`,
            date: String(
              entry.date ||
                entry.income_date ||
                entry.created_at ||
                "",
            ).substring(0, 10),
            amount:
              entry.amount ??
              entry.income_amount ??
              entry.total ??
              0,
          }))
        : [];

      setIncomeEntries(incomeRecords);

      setEntries(
        [...incomeRecords, ...salesEntries, ...capitalEntries].sort(
          (a, b) =>
            String(b.date ?? "").localeCompare(
              String(a.date ?? ""),
            ),
        ),
      );
    } catch (err) {
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
      const date = String(entry.date ?? "").substring(0, 10);

      if (!date) return false;
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;

      return true;
    });
  }, [entries, fromDate, toDate]);

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return dateFilteredEntries;
    }

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

  const isIncomeEntry = useCallback((entry: Entry) => {
    const type = String(entry.type ?? "").toLowerCase();
    const category = String(entry.category ?? "").toLowerCase();

    return (
      type.includes("income") ||
      type === "in" ||
      type === "credit" ||
      category.includes("income")
    );
  }, []);

  const filteredSummary = useMemo(() => {
    if (selectedDate) {
      const expenses = dateFilteredEntries.reduce(
        (total, entry) =>
          isIncomeEntry(entry)
            ? total
            : total + (Number(entry.amount ?? 0) || 0),
        0,
      );

      return {
        income: totalIncome,
        expenses:
          totalExpenses > 0 ? totalExpenses : expenses,
      };
    }

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

    const expenses = dateFilteredEntries.reduce(
      (total, entry) =>
        isIncomeEntry(entry)
          ? total
          : total + (Number(entry.amount ?? 0) || 0),
      0,
    );

    return {
      income,
      expenses,
    };
  }, [
    selectedDate,
    fromDate,
    toDate,
    incomeEntries,
    dateFilteredEntries,
    totalIncome,
    totalExpenses,
    isIncomeEntry,
  ]);

  const balance =
    filteredSummary.income - filteredSummary.expenses;

  const formatMoney = (value: number) =>
    `Rs. ${value.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value?: string) => {
    if (!value) return "-";

    const [year, month, day] = value
      .substring(0, 10)
      .split("-");

    return year && month && day
      ? `${day}/${month}/${year}`
      : value;
  };

  const resetFilter = () => {
    setFromDate("");
    setToDate("");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-[#070a13] p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex gap-2 text-xs text-slate-500">
              <Link
                href={dashboardHref}
                className="hover:text-cyan-400"
              >
                Dashboard
              </Link>

              <span>/</span>
              <span>View Entries</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                <FileText className="text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  View Entries
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Review income, expenses and financial entries
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadEntries}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm hover:text-cyan-400 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />

            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Total Income"
            value={formatMoney(filteredSummary.income)}
            icon={<TrendingUp className="text-emerald-400" />}
            iconClass="border-emerald-500/20 bg-emerald-500/10"
            footer="Income recorded"
            footerIcon={<CheckCircle2 size={14} />}
            footerClass="text-emerald-400"
          />

          <SummaryCard
            title="Total Expenses"
            value={formatMoney(filteredSummary.expenses)}
            icon={<TrendingDown className="text-orange-400" />}
            iconClass="border-orange-500/20 bg-orange-500/10"
            footer="Expenses recorded"
            footerIcon={<CircleDollarSign size={14} />}
            footerClass="text-orange-400"
          />

          <SummaryCard
            title="Balance"
            value={formatMoney(Math.abs(balance))}
            icon={<Wallet className="text-blue-400" />}
            iconClass="border-blue-500/20 bg-blue-500/10"
            footer={balance < 0 ? "LOSS" : "PROFIT"}
            footerIcon={
              balance < 0 ? (
                <TrendingDown size={14} />
              ) : (
                <TrendingUp size={14} />
              )
            }
            footerClass={
              balance < 0
                ? "text-red-400"
                : "text-emerald-400"
            }
          />
        </section>

        <section className="mb-7 rounded-2xl border border-slate-800 bg-[#0d1527] p-5">
          <div className="mb-5 flex items-center gap-2">
            <Filter size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold uppercase text-white">
              Filter Entries
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              <label className="mb-2 block text-xs uppercase text-slate-500">
                Search
              </label>

              <div className="relative">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

                <input
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Search entries..."
                  className="w-full rounded-xl border border-slate-700 bg-[#070a13] py-3 pl-10 pr-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {filteredEntries.length} entries
            </p>

            <button
              type="button"
              onClick={resetFilter}
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-xs uppercase text-slate-400 hover:text-white"
            >
              <RotateCcw size={15} />
              Reset Filter
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1527]">
          <div className="flex items-center justify-between border-b border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-indigo-400" />
              <h2 className="text-sm font-bold uppercase text-white">
                Financial Entries
              </h2>
            </div>

            <span className="text-xs text-slate-500">
              {filteredEntries.length} Records
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-16 text-slate-500">
              <RefreshCw className="mb-3 animate-spin text-cyan-400" />
              Loading entries...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">
              No entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0a1020] text-left text-[10px] uppercase text-slate-500">
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Branch</th>
                    <th className="px-5 py-4 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.map((entry, index) => {
                    const income = isIncomeEntry(entry);
                    const amount =
                      Number(entry.amount ?? 0) || 0;

                    return (
                      <tr
                        key={
                          entry.id ??
                          `${entry.date}-${entry.description}-${index}`
                        }
                        className="border-b border-slate-800/70 hover:bg-slate-800/20"
                      >
                        <td className="px-5 py-4 text-sm text-slate-300">
                          <span className="flex items-center gap-2">
                            <CalendarDays size={15} />
                            {formatDate(entry.date)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-200">
                          {entry.description || "-"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-400">
                          {entry.category || "-"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              income
                                ? "text-emerald-400"
                                : "text-orange-400"
                            }
                          >
                            {income ? "Income" : "Expense"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-400">
                          {entry.branch_name ||
                            entry.branch_id ||
                            "-"}
                        </td>

                        <td
                          className={`px-5 py-4 text-right font-bold ${
                            income
                              ? "text-emerald-400"
                              : "text-orange-400"
                          }`}
                        >
                          {income ? "+" : "-"}
                          {formatMoney(amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  iconClass,
  footer,
  footerIcon,
  footerClass,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  footer: string;
  footerIcon: React.ReactNode;
  footerClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-slate-500">
            {title}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {value}
          </h2>
        </div>

        <div className={`rounded-xl border p-3 ${iconClass}`}>
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
      <label className="mb-2 block text-xs uppercase text-slate-500">
        {label}
      </label>

      <div className="relative">
        <CalendarDays size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-[#070a13] py-3 pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-cyan-500"
        />
      </div>
    </div>
  );
}

export default function ViewEntriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070a13] text-cyan-400">
          Loading entries...
        </div>
      }
    >
      <ViewEntriesContent />
    </Suspense>
  );
}