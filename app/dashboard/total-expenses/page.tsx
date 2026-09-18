"use client";
import React, { Suspense,useCallback,useEffect,useState } from "react";
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
}

interface FilterItem {
  id: number | string;
  name?: string;
  branch_name?: string;
  date?: string;
  machine?: string;
  amount?: number;
  payable?: number;
  paid?: number;
  balance?: number;
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
  const selectedDieselId = searchParams.get("selected_diesel_id");

  const [branches, setBranches] = useState<BranchExpense[]>([]);
  const [salesList, setSalesList] = useState<FilterItem[]>([]);
  const [capitalList, setCapitalList] = useState<FilterItem[]>([]);
  const [dieselList, setDieselList] = useState<FilterItem[]>([]);
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

      if (selectedDieselId) {
        params.set("selected_diesel_id", selectedDieselId);
      }

      const query = params.toString();
      const response = await fetch(
        query
          ? `/api/dashboard/summary?${query}`
          : "/api/dashboard/summary",
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load expense breakdown.");
      }

      const json = await response.json();

      setBranches(json.branches || []);
      setSalesList(json.sales || []);
      setCapitalList(json.capital || []);
      setDieselList(json.diesel || []);
    } catch (error) {
      console.error("Failed to load expense breakdown:", error);
      setBranches([]);
      setSalesList([]);
      setCapitalList([]);
      setDieselList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalesId, selectedCapitalId, selectedDieselId]);

  useEffect(() => {
    fetchExpenseBreakdown();
  }, [fetchExpenseBreakdown]);

  const updateFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) params.set(key, value);
    else params.delete(key);

    const query = params.toString();

    router.push(
      `/dashboard/total-expenses${query ? `?${query}` : ""}`,
    );
  };

  const total = branches.reduce(
    (sum, branch) =>
      sum +
      Number(branch.salary_expenses || 0) +
      Number(branch.sales_expenses || 0) +
      Number(branch.capital_expenses || 0) +
      Number(branch.other_expenses || 0) +
      Number(branch.diesel_expenses || 0),
    0,
  );

  if (loading) {
    return <Loading text="Compiling Expense Ledger Sheets..." />;
  }

  return (
    <main className="min-h-screen bg-slate-950 p-3 text-slate-100 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col justify-between gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                const query = searchParams.toString();
                router.push(`/dashboard${query ? `?${query}` : ""}`);
              }}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white"
            >
              <ArrowLeft size={13} />
              Back To Main Control Panel
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <Coins size={15} className="text-emerald-400" />

              <h1 className="text-base font-semibold text-white">
                Gross Expense Breakdown Sub-Ledger
              </h1>

              <ExpenseFilters
                selectedSalesId={selectedSalesId}
                selectedCapitalId={selectedCapitalId}
                selectedDieselId={selectedDieselId}
                salesList={salesList}
                capitalList={capitalList}
                dieselList={dieselList}
                onSelectSales={(id) =>
                  updateFilter("selected_sales_id", id)
                }
                onSelectCapital={(id) =>
                  updateFilter("selected_capital_id", id)
                }
                onSelectDiesel={(id) =>
                  updateFilter("selected_diesel_id", id)
                }
                onClearSales={() =>
                  updateFilter("selected_sales_id")
                }
                onClearCapital={() =>
                  updateFilter("selected_capital_id")
                }
                onClearDiesel={() =>
                  updateFilter("selected_diesel_id")
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
              className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2">
              <span className="block text-[9px] uppercase text-emerald-400">
                Aggregate Gross Expenses
              </span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                LKR {formatCurrency(total)}
              </span>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3 text-xs font-semibold">
            <FileSpreadsheet size={14} className="text-emerald-400" />
            Infrastructure Financial Auditing Matrix
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[1050px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-400">
                  <th className="px-3 py-2 text-left">Node / Branch Identity</th>
                  <th className="px-3 py-2 text-right">Salary Expenses</th>
                  <th className="px-3 py-2 text-right text-emerald-400">Sales Expenses</th>
                  <th className="px-3 py-2 text-right text-amber-400">Capital Expenses</th>
                  <th className="px-3 py-2 text-right">Other Expenses</th>
                  <th className="px-3 py-2 text-right text-cyan-400">Diesel Expenses</th>
                  <th className="px-3 py-2 text-right text-emerald-400">Gross Combined Expenses</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/50">
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No Expense Records Found
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => {
                    const salary = Number(branch.salary_expenses || 0);
                    const sales = Number(branch.sales_expenses || 0);
                    const capital = Number(branch.capital_expenses || 0);
                    const other = Number(branch.other_expenses || 0);
                    const diesel = Number(branch.diesel_expenses || 0);
                    const rowTotal =
                      salary + sales + capital + other + diesel;

                    return (
                      <tr key={branch.id} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 font-mono text-slate-200">
                          {branch.branch_name}{" "}
                          <span className="text-[10px] text-slate-500">
                            ({branch.branch_code})
                          </span>
                        </td>
                        <MoneyCell value={salary} />
                        <MoneyCell value={sales} className="text-emerald-400" />
                        <MoneyCell value={capital} className="text-amber-400" />
                        <MoneyCell value={other} />
                        <MoneyCell value={diesel} className="text-cyan-400" icon />
                        <MoneyCell value={rowTotal} className="font-bold text-emerald-400" />
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
  icon = false,
}: {
  value: number;
  className?: string;
  icon?: boolean;
}) {
  return (
    <td className={`px-3 py-2.5 text-right font-mono text-[11px] ${className}`}>
      <span className="inline-flex items-center gap-1">
        {icon && <Fuel size={12} />}
        {formatCurrency(value)}
      </span>
    </td>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 font-mono text-xs text-slate-500">
      <div className="text-center">
        <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        {text}
      </div>
    </div>
  );
}

export default function TotalExpensesPage() {
  return (
    <Suspense fallback={<Loading text="Loading Expense Ledger..." />}>
      <TotalExpensesContent />
    </Suspense>
  );
}