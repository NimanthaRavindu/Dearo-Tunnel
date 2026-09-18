"use client";

import React, { Suspense,useCallback,useEffect,useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft,FileSpreadsheet,Fuel,RefreshCw,TrendingUp,X } from "lucide-react";
import { ExpenseFilters } from "@/components/ExpenseFilters";

interface BranchBalance {
  id: number | string;
  branch_name: string;
  branch_code: string;
  salary_balance?: number;
  salary_expenses?: number;
  sales_expenses?: number;
  capital_expenses?: number;
  other_balance?: number;
  other_expenses?: number;
  diesel_balance?: number;
  diesel_expenses?: number;
}

interface FilterItem {
  id: number | string;
  name?: string;
}

const formatCurrency = (value: unknown) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function RemainingBalanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");
  const selectedDieselId = searchParams.get("selected_diesel_id");

  const [branches, setBranches] = useState<BranchBalance[]>([]);
  const [salesList, setSalesList] = useState<FilterItem[]>([]);
  const [capitalList, setCapitalList] = useState<FilterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalanceBreakdown = useCallback(async () => {
    try {
      const params = new URLSearchParams();

      if (selectedSalesId) {
        params.set("selected_sales_id", selectedSalesId);
      }

      if (selectedCapitalId) {
        params.set("selected_capital_id", selectedCapitalId);
      }

      if (selectedDieselId) {
        params.set("selected_diesel_id", selectedDieselId);
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
        throw new Error("Failed to load balance summary.");
      }

      const json = await response.json();

      setBranches(json.branches || []);
      setSalesList(json.sales || []);
      setCapitalList(json.capital || []);
    } catch (error) {
      console.error("Failed to load balance breakdown:", error);
      setBranches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    selectedSalesId,
    selectedCapitalId,
    selectedDieselId,
  ]);

  useEffect(() => {
    fetchBalanceBreakdown();
  }, [fetchBalanceBreakdown]);

  const updateFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const query = params.toString();
    router.push(
      `/dashboard/remaining-balance${query ? `?${query}` : ""}`,
    );
  };

  const handleBack = () => {
    const query = searchParams.toString();
    router.push(`/dashboard${query ? `?${query}` : ""}`);
  };

  const totalBalance = branches.reduce((total, branch) => {
    return (
      total +
      Number(
        branch.salary_balance ??
          branch.salary_expenses ??
          0,
      ) +
      Number(branch.sales_expenses || 0) +
      Number(branch.capital_expenses || 0) +
      Number(
        branch.other_balance ??
          branch.other_expenses ??
          0,
      ) +
      Number(
        branch.diesel_balance ??
          branch.diesel_expenses ??
          0,
      )
    );
  }, 0);

  if (loading) {
    return (
      <Loading text="Compiling Balance Portfolio Sheets..." />
    );
  }

  return (
    <main className="min-h-screen bg-[#070a12] p-4 font-mono text-xs text-slate-300 md:p-6">
      <div className="space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-900 pb-4 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 transition-colors hover:text-white"
            >
              <ArrowLeft size={12} />
              Back To Main Control Panel
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-white">
                <TrendingUp size={15} className="text-amber-500" />
                Outstanding Balances Portfolio Sub-Ledger
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

              {selectedDieselId && (
                <button
                  type="button"
                  onClick={() =>
                    updateFilter("selected_diesel_id")
                  }
                  className="flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase text-cyan-400"
                >
                  <Fuel size={11} />
                  Diesel #{selectedDieselId}
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                fetchBalanceBreakdown();
              }}
              disabled={refreshing}
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:text-white disabled:opacity-50"
              title="Refresh Ledger"
            >
              <RefreshCw size={14} className={ refreshing ? "animate-spin" : "" } />
            </button>

            <div className="min-w-[190px] rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-2 text-right">
              <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-amber-400">
                Aggregate Remaining Balance
              </span>
              <span className="font-sans text-sm font-bold text-white">
                LKR {formatCurrency(totalBalance)}
              </span>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border border-slate-900 bg-[#0d1527]/30 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-900 bg-[#0a0f1d] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet size={13} />
              Infrastructure Outstanding Liability Ledger Matrix
            </div>

            {(selectedSalesId ||
              selectedCapitalId ||
              selectedDieselId) && (
              <span className="rounded border border-amber-900/50 bg-amber-950/40 px-2 py-0.5 text-amber-400">
                Filtered View Active
              </span>
            )}
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[1050px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-900 bg-[#090e1a]/30 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5 text-left">
                    Node / Branch Identity
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    Salary Balance
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    Sales Expenses
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    Capital Expenses
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    Other Balance
                  </th>
                  <th className="px-3 py-2.5 text-right text-cyan-400">
                    Diesel Balance
                  </th>
                  <th className="px-3 py-2.5 text-right text-amber-500">
                    Cumulative Net Liability
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-900/40 font-sans text-slate-400">
                {branches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-slate-600"
                    >
                      No Outstanding Balance Records Found
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => {
                    const salary = Number(
                      branch.salary_balance ??
                        branch.salary_expenses ??
                        0,
                    );

                    const sales = Number(
                      branch.sales_expenses || 0,
                    );

                    const capital = Number(
                      branch.capital_expenses || 0,
                    );

                    const other = Number(
                      branch.other_balance ??
                        branch.other_expenses ??
                        0,
                    );
                    const diesel = Number(
                      branch.diesel_balance ??
                        branch.diesel_expenses ??
                        0,
                    );
                    const total =
                      salary +
                      sales +
                      capital +
                      other +
                      diesel;

                    return (
                      <tr
                        key={branch.id}
                        className={`transition-all hover:bg-slate-900/10 ${
                          total <= 0
                            ? "bg-slate-950/5 opacity-30"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-2.5 font-mono font-semibold text-slate-300">
                          {branch.branch_name}{" "}
                          <span className="text-[10px] font-normal text-slate-600">
                            ({branch.branch_code})
                          </span>
                        </td>
                        <MoneyCell value={salary} />

                        <MoneyCell
                          value={sales}
                          className="text-emerald-400"
                        />

                        <MoneyCell
                          value={capital}
                          className="text-cyan-400"
                        />

                        <MoneyCell value={other} />

                        <MoneyCell
                          value={diesel}
                          className="text-cyan-400"
                        />

                        <MoneyCell
                          value={total}
                          className="bg-amber-950/5 font-bold text-slate-200"
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
      className={`px-3 py-2.5 text-right font-mono ${className}`}
    >
      {formatCurrency(value)}
    </td>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#070a12] font-mono text-xs text-slate-500">
      <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      <p className="uppercase tracking-widest">{text}</p>
    </div>
  );
}

export default function RemainingBalancePage() {
  return (
    <Suspense
      fallback={
        <Loading text="Loading Balance Portfolio..." />
      }
    >
      <RemainingBalanceContent />
    </Suspense>
  );
}
