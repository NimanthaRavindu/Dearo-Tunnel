"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft,Coins,FileSpreadsheet,Fuel,RefreshCw} from "lucide-react";
import { ExpenseFilters } from "@/components/ExpenseFilters";

interface BranchExpense {
  id: number | string;
  branch_name: string;
  branch_code: string;
  salary_expenses?: number;
  other_expenses?: number;
  sales_expenses?: number;
  capital_expenses?: number;
  diesel_expenses?: number;
  total_expenses?: number;
}

interface FilterItem {
  id: number | string;
  name?: string;
  branch_name?: string;
  date?: string;
}

const formatCurrency = (value: unknown) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function TotalExpensesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [branches, setBranches] = useState<BranchExpense[]>([]);
  const [salesList, setSalesList] = useState<FilterItem[]>([]);
  const [capitalList, setCapitalList] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenseBreakdown = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (selectedSalesId) {
        params.set("selected_sales_id", selectedSalesId);
      }

      if (selectedCapitalId) {
        params.set("selected_capital_id", selectedCapitalId);
      }

      const query = params.toString();

      const response = await fetch(
        query
          ? `/api/dashboard/summary?${query}`
          : "/api/dashboard/summary",
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load expense breakdown.");
      }

      const json = await response.json();

      setBranches(json.branches || []);
      setSalesList(json.sales || []);
      setCapitalList(json.capital || []);
    } catch (error) {
      console.error("Failed to load expense breakdown:", error);
      setBranches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId]);

  useEffect(() => {
    fetchExpenseBreakdown();
  }, [fetchExpenseBreakdown]);

  const updateFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const query = params.toString();

    router.push(
      `/dashboard/total-expenses${query ? `?${query}` : ""}`,
    );
  };

  const handleBackToDashboard = () => {
    const query = searchParams.toString();

    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  const calculatedTotalSum = branches.reduce((total, branch) => {
    return (
      total +
      Number(branch.salary_expenses || 0) +
      Number(branch.sales_expenses || 0) +
      Number(branch.capital_expenses || 0) +
      Number(branch.other_expenses || 0) +
      Number(branch.diesel_expenses || 0)
    );
  }, 0);

  if (loading) {
    return (
      <LoadingState text="Compiling Expense Ledger Sheets..." />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-3 font-sans text-slate-100 antialiased sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col justify-between gap-3 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft size={13} />
              Back To Main Control Panel
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-1 text-emerald-400">
                <Coins size={14} />
              </span>

              <h1 className="text-base font-semibold tracking-tight text-white md:text-lg">
                Gross Expense Breakdown Sub-Ledger
              </h1>

              <ExpenseFilters
                selectedSalesId={selectedSalesId}
                selectedCapitalId={selectedCapitalId}
                salesList={salesList}
                capitalList={capitalList}
                onSelectSales={(id) =>
                  updateFilter("selected_sales_id", id)
                }
                onSelectCapital={(id) =>
                  updateFilter("selected_capital_id", id)
                }
                onClearSales={() =>
                  updateFilter("selected_sales_id")
                }
                onClearCapital={() =>
                  updateFilter("selected_capital_id")
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchExpenseBreakdown();
              }}
              disabled={refreshing}
              className="rounded-lg border border-slate-800 bg-slate-900/90 p-2 text-slate-400 transition-all hover:border-slate-700 hover:text-white disabled:opacity-50"
              title="Refresh Ledger"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>

            <div className="min-w-[190px] rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-1.5 shadow-sm">
              <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-wider text-emerald-400">
                Aggregate Gross Expenses
              </span>

              <span className="font-mono text-xs font-bold text-emerald-400 md:text-sm">
                LKR {formatCurrency(calculatedTotalSum)}
              </span>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border border-slate-800/90 bg-slate-900/70 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-1.5 border-b border-slate-800/80 bg-slate-950/40 px-4 py-2.5 text-xs font-semibold text-slate-300">
            <FileSpreadsheet
              size={14}
              className="text-emerald-400"
            />
            Infrastructure Financial Auditing Matrix
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[1100px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[9px] uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2.5 text-left">
                    Node / Branch Identity
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    Salary Expenses
                  </th>
                  <th className="px-3 py-2.5 text-right text-emerald-400">
                    Sales Expenses
                  </th>
                  <th className="px-3 py-2.5 text-right text-amber-400">
                    Capital Expenses
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    Other Expenses
                  </th>
                  <th className="px-3 py-2.5 text-right text-cyan-400">
                    Diesel Expenses
                  </th>
                  <th className="px-3 py-2.5 text-right text-emerald-400">
                    Gross Combined Expenses
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {branches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center font-mono text-[10px] uppercase tracking-widest text-slate-500"
                    >
                      No Expense Records Found
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => {
                    const salary = Number(
                      branch.salary_expenses || 0,
                    );
                    const sales = Number(
                      branch.sales_expenses || 0,
                    );
                    const capital = Number(
                      branch.capital_expenses || 0,
                    );
                    const other = Number(
                      branch.other_expenses || 0,
                    );
                    const diesel = Number(
                      branch.diesel_expenses || 0,
                    );

                    const grossTotal =
                      salary +
                      sales +
                      capital +
                      other +
                      diesel;

                    return (
                      <tr
                        key={branch.id}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          grossTotal <= 0
                            ? "bg-slate-950/20 opacity-30"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-2.5 font-mono font-medium text-slate-200">
                          {branch.branch_name}{" "}
                          <span className="text-[10px] font-normal text-slate-500">
                            ({branch.branch_code})
                          </span>
                        </td>

                        <MoneyCell value={salary} />

                        <MoneyCell
                          value={sales}
                          className="font-medium text-emerald-400"
                        />

                        <MoneyCell
                          value={capital}
                          className="font-medium text-amber-400"
                        />

                        <MoneyCell value={other} />

                        <td className="px-3 py-2.5 text-right font-mono text-[11px] font-medium text-cyan-400">
                          <span className="inline-flex items-center gap-1">
                            <Fuel size={12} />
                            {formatCurrency(diesel)}
                          </span>
                        </td>

                        <MoneyCell
                          value={grossTotal}
                          className="bg-emerald-950/10 font-bold text-emerald-400"
                        />
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MoneyCell({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <td
      className={`px-3 py-2.5 text-right font-mono text-[11px] ${className}`}
    >
      {formatCurrency(value)}
    </td>
  );
}

function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 font-mono text-xs text-slate-500">
      <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      <p className="uppercase tracking-widest">{text}</p>
    </div>
  );
}

export default function TotalExpensesPage() {
  return (
    <Suspense
      fallback={
        <LoadingState text="Compiling Expense Ledger Sheets..." />
      }
    >
      <TotalExpensesContent />
    </Suspense>
  );
}