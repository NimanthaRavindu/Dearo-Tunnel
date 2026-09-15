"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine,BarChart3,CalendarDays,CheckCircle2,CircleDollarSign,FileText,Filter,RefreshCw,RotateCcw,TrendingDown,TrendingUp,Wallet} from "lucide-react";

const SUMMARY_API = "/api/dashboard/summary";

type Entry = {
  id?: number | string;
  date?: string;
  description?: string;
  name?: string;
  category?: string;
  income?: number | string;
  expense?: number | string;
  amount?: number | string;
  type?: string;
};

type SummaryResponse = {
  totalIncome?: number | string;
  totalExpenses?: number | string;
  entries?: Entry[];

  // Alternative names supported
  total_income?: number | string;
  total_expenses?: number | string;
  expenses?: Entry[];
  incomes?: Entry[];
};

export default function ViewEntriesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const loadEntries = async () => {
    try {
      setLoading(true);

      const response = await fetch(SUMMARY_API, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load dashboard entries");
      }

      const data: SummaryResponse = await response.json();

      const income = Number(
        data.totalIncome ??
          data.total_income ??
          0
      );

      const expenses = Number(
        data.totalExpenses ??
          data.total_expenses ??
          0
      );

      setTotalIncome(
        Number.isFinite(income) ? income : 0
      );

      setTotalExpenses(
        Number.isFinite(expenses)
          ? expenses
          : 0
      );

      if (Array.isArray(data.entries)) {
        setEntries(data.entries);
      } else {
        const incomeEntries = Array.isArray(
          data.incomes
        )
          ? data.incomes.map((item) => ({
              ...item,
              type: "Income",
            }))
          : [];

        const expenseEntries = Array.isArray(
          data.expenses
        )
          ? data.expenses.map((item) => ({
              ...item,
              type: "Expense",
            }))
          : [];

        setEntries([
          ...incomeEntries,
          ...expenseEntries,
        ]);
      }
    } catch (error) {
      console.error(
        "VIEW ENTRIES ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!entry.date) {
        return false;
      }

      const entryDate =
        entry.date.substring(0, 10);

      if (
        fromDate &&
        entryDate < fromDate
      ) {
        return false;
      }

      if (
        toDate &&
        entryDate > toDate
      ) {
        return false;
      }

      return true;
    });
  }, [entries, fromDate, toDate]);

  const filteredTotals = useMemo(() => {
    let income = 0;
    let expenses = 0;

    filteredEntries.forEach((entry) => {
      const amount = Number(
        entry.amount ??
          entry.income ??
          entry.expense ??
          0
      );

      const entryType =
        String(entry.type || "")
          .toLowerCase();

      if (
        entryType.includes("income")
      ) {
        income += amount;
      }

      if (
        entryType.includes("expense")
      ) {
        expenses += amount;
      }
    });

    if (
      filteredEntries.length === 0 &&
      !fromDate &&
      !toDate
    ) {
      income = totalIncome;
      expenses = totalExpenses;
    }

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [
    filteredEntries,
    fromDate,
    toDate,
    totalIncome,
    totalExpenses,
  ]);

  const balance =
    filteredTotals.balance;

  const isProfit = balance > 0;
  const isLoss = balance < 0;
  const isEqual = balance === 0;

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
  };

  const displayEntries = useMemo(() => {
    return filteredEntries.map(
      (entry, index) => {
        const amount = Number(
          entry.amount ??
            entry.income ??
            entry.expense ??
            0
        );

        const entryType =
          String(entry.type || "")
            .toLowerCase();

        let finalType = "Entry";

        if (
          entryType.includes("income")
        ) {
          finalType = "Income";
        } else if (
          entryType.includes("expense")
        ) {
          finalType = "Expense";
        }

        return {
          ...entry,
          id:
            entry.id ??
            `${entry.date}-${index}`,
          amount,
          finalType,
        };
      }
    );
  }, [filteredEntries]);

  return (
    <div className="min-h-screen bg-[#070a13] px-4 py-6 text-slate-100 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1527] shadow-2xl">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 ring-1 ring-cyan-500/20">
                <FileText size={27} className="text-cyan-400"
                />
              </div>
              <div>

                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    View Entries
                  </h1>

                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    Financial Overview
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Review income, expenses and overall financial performance
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadEntries}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/30 hover:bg-slate-800 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={17} className={ loading ? "animate-spin" : "" } />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
              <Filter size={19} />
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Filter Entries
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Select a date range to view financial entries
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* FROM DATE */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                From Date
              </label>

              <div className="relative">
                <CalendarDays size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) =>
                    setFromDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-800 bg-[#080d19] py-3 pl-10 pr-4 text-sm text-slate-200 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10"
                />
              </div>
            </div>

            {/* TO DATE */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                To Date
              </label>

              <div className="relative">
                <CalendarDays size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />

                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) =>
                    setToDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-800 bg-[#080d19] py-3 pl-10 pr-4 text-sm text-slate-200 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10"
                />
              </div>
            </div>

            {/* FILTER BUTTON */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  if (
                    fromDate &&
                    toDate &&
                    fromDate > toDate
                  ) {
                    alert(
                      "From Date cannot be greater than To Date."
                    );
                    return;
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/20 transition hover:from-cyan-500 hover:to-blue-500"
              >
                <Filter size={17} />
                Apply Filter
              </button>
            </div>

            {/* RESET */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
              >
                <RotateCcw size={17} />
                Reset
              </button>
            </div>
          </div>

          {(fromDate || toDate) && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-500/10 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-400">
              <CalendarDays size={15} />
              <span>
                Showing entries
                {fromDate ? ` from ${fromDate}` : ""}
                {toDate ? ` to ${toDate}` : ""}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* TOTAL INCOME */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-[#0d1527] p-5 shadow-xl transition hover:border-emerald-500/30">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/5 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Total Income
                </p>

                <h2 className="mt-3 text-2xl font-bold text-white">
                  Rs.{" "}
                  {formatMoney(
                    filteredTotals.income
                  )}
                </h2>

                <p className="mt-2 text-xs text-emerald-400">
                  Income generated
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>

          {/* TOTAL EXPENSES */}
          <div className="group relative overflow-hidden rounded-2xl border border-orange-500/15 bg-[#0d1527] p-5 shadow-xl transition hover:border-orange-500/30">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-500/5 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>

                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Total Expenses
                </p>

                <h2 className="mt-3 text-2xl font-bold text-white">
                  Rs.{" "}
                  {formatMoney(
                    filteredTotals.expenses
                  )}
                </h2>

                <p className="mt-2 text-xs text-orange-400">
                  Total expenditure
                </p>
              </div>

              <div className="rounded-xl bg-orange-500/10 p-3 text-orange-400">
                <Wallet size={22} />
              </div>
            </div>
          </div>

          {/* BALANCE */}
          <div
            className={`group relative overflow-hidden rounded-2xl border bg-[#0d1527] p-5 shadow-xl transition ${
              isProfit
                ? "border-emerald-500/25 hover:border-emerald-500/40"
                : isLoss
                ? "border-red-500/25 hover:border-red-500/40"
                : "border-slate-700"
            }`}
          >

            <div
              className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${
                isProfit
                  ? "bg-emerald-500/10"
                  : isLoss
                  ? "bg-red-500/10"
                  : "bg-slate-500/10"
              }`}
            />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Total Balance
                </p>
                <h2
                  className={`mt-3 text-2xl font-bold ${
                    isProfit
                      ? "text-emerald-400"
                      : isLoss
                      ? "text-red-400"
                      : "text-slate-300"
                  }`}
                >
                  Rs.{" "}
                  {formatMoney(
                    Math.abs(balance)
                  )}
                </h2>

                <div className="mt-2 flex items-center gap-2">
                  {isProfit && (
                    <>
                      <TrendingUp size={15} className="text-emerald-400" />

                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Profit
                      </span>
                    </>
                  )}

                  {isLoss && (
                    <>
                      <TrendingDown size={15}  className="text-red-400" />

                      <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                        Loss
                      </span>
                    </>
                  )}

                  {isEqual && (
                    <>
                      <CheckCircle2 size={15} className="text-slate-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        No Profit / No Loss
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div
                className={`rounded-xl p-3 ${
                  isProfit
                    ? "bg-emerald-500/10 text-emerald-400"
                    : isLoss
                    ? "bg-red-500/10 text-red-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <CircleDollarSign size={22} />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col gap-4 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between ${
            isProfit
              ? "border-emerald-500/20 bg-emerald-500/5"
              : isLoss
              ? "border-red-500/20 bg-red-500/5"
              : "border-slate-700 bg-slate-800/30"
          }`}
        >

          <div className="flex items-center gap-4">

            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isProfit
                  ? "bg-emerald-500/10 text-emerald-400"
                  : isLoss
                  ? "bg-red-500/10 text-red-400"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {isProfit ? (
                <TrendingUp size={21} />
              ) : isLoss ? (
                <TrendingDown size={21} />
              ) : (
                <BarChart3 size={21} />
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Financial Status
              </p>
              <h3
                className={`mt-1 text-lg font-bold ${
                  isProfit
                    ? "text-emerald-400"
                    : isLoss
                    ? "text-red-400"
                    : "text-slate-300"
                }`}
              >
                {isProfit ? "PROFIT" : isLoss ? "LOSS" : "NO PROFIT / NO LOSS"}
              </h3>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs text-slate-500">
              Total Income − Total Expenses
            </p>

            <p
              className={`mt-1 text-xl font-bold ${
                isProfit
                  ? "text-emerald-400"
                  : isLoss
                  ? "text-red-400"
                  : "text-slate-300"
              }`}
            >
              {isLoss ? "-" : ""}
              Rs.{" "}
              {formatMoney( Math.abs(balance))}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0d1527] shadow-xl">

          <div className="flex flex-col gap-3 border-b border-slate-800/80 p-5 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-lg font-bold text-white">
                Financial Entries
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {displayEntries.length}{" "}
                entries found for the selected period
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#080d19] px-3 py-2">
              <BarChart3 size={15} className="text-cyan-400" />
              <span className="text-xs font-semibold text-slate-400">
                Live Summary
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-800 bg-[#080d19]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Description
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Category
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Type
                  </th>
                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-14 text-center"
                    >

                      <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
                        <RefreshCw size={18} className="animate-spin text-cyan-400" />
                        Loading entries...
                      </div>
                    </td>
                  </tr>

                ) : displayEntries.length ===
                  0 ? (

                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-14 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 rounded-2xl bg-slate-800/70 p-4 text-slate-500">
                          <FileText size={27} />
                        </div>

                        <p className="font-semibold text-slate-300">
                          No entries found
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Try changing the selected date range.
                        </p>
                      </div>
                    </td>
                  </tr>

                ) : (
                  displayEntries.map(
                    (entry) => (

                      <tr
                        key={String(
                          entry.id
                        )}
                        className="border-b border-slate-800/70 transition hover:bg-slate-800/30"
                      >

                        {/* DATE */}
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {entry.date ? new Date(`${entry.date.substring( 0, 10 )}T00:00:00` ).toLocaleDateString( "en-GB" ) : "-"}
                        </td>

                        {/* DESCRIPTION */}
                        <td className="px-5 py-4">
                          <p className="max-w-xs truncate text-sm font-semibold text-slate-200">
                            {entry.description ||  entry.name || "Financial Entry"}
                          </p>
                        </td>

                        {/* CATEGORY */}
                        <td className="px-5 py-4 text-sm text-slate-400">
                          {entry.category || "-"}
                        </td>

                        {/* TYPE */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              entry.finalType ===
                              "Income"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : entry.finalType ===
                                  "Expense"
                                ? "border-red-500/20 bg-red-500/10 text-red-400"
                                : "border-slate-700 bg-slate-800 text-slate-400"
                            }`}
                          >
                            {entry.finalType ===
                            "Income" ? (
                              <TrendingUp size={12} />
                            ) : (
                              <TrendingDown size={12}/>
                            )}
                            {entry.finalType}
                          </span>
                        </td>

                        {/* AMOUNT */}
                        <td
                          className={`px-5 py-4 text-right text-sm font-bold ${
                            entry.finalType ===
                            "Income"
                              ? "text-emerald-400"
                              : entry.finalType ===
                                "Expense"
                              ? "text-red-400"
                              : "text-slate-300"
                          }`}
                        >
                          {entry.finalType ===
                          "Expense"
                            ? "-"
                            : "+"}
                          {" Rs. "}
                          {formatMoney(
                            entry.amount
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-800/70 pt-4 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>
            View Entries • Financial
            Overview
          </p>
          <p>
            Income − Expenses = Balance
          </p>
        </div>
      </div>
    </div>
  );
}