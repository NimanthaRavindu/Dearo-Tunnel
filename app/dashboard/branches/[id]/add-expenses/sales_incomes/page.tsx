"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {ArrowLeft,Calendar,CheckCircle2,DollarSign,FileText,Loader2,Plus,X} from "lucide-react";

interface SalesIncomeItem {
  id: string;
  name: string;
  date: string;
  amount: number;
  credit: number;
  branch_id?: string;
  created_at?: string;
}

interface SalesIncomeFormData {
  name: string;
  date: string;
  amount: string;
  credit: string;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function SalesIncomesContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = params?.id as string;

  const selectedSalesId = searchParams.get("selected_sales_id");
  const selectedCapitalId = searchParams.get("selected_capital_id");

  const [incomes, setIncomes] = useState<SalesIncomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [formData, setFormData] = useState<SalesIncomeFormData>({
    name: "",
    date: getToday(),
    amount: "",
    credit: "",
  });

  const filteredIncomes = filterDate
    ? incomes.filter((item) => item.date.slice(0, 10) === filterDate)
    : incomes;

  const totalAmount = filteredIncomes.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );

  const totalCredit = filteredIncomes.reduce(
    (total, item) => total + Number(item.credit || 0),
    0,
  );

  const fetchSalesIncomes = async () => {
    if (!branchId) return;

    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/expences/sales-incomes?branch_id=${encodeURIComponent(branchId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch sales incomes.");
      }

      setIncomes(result.data || []);
    } catch (error) {
      console.error("Failed to fetch sales incomes:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load sales income records.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) {
      fetchSalesIncomes();
    }
  }, [branchId]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const name = formData.name.trim();
    const amount = Number(formData.amount);
    const credit = Number(formData.credit || 0);

    if (!branchId || !name || !formData.date || !formData.amount) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setErrorMessage("Amount must be a valid non-negative number.");
      return;
    }

    if (!Number.isFinite(credit) || credit < 0) {
      setErrorMessage("Credit must be a valid non-negative number.");
      return;
    }

    if (credit > amount) {
      setErrorMessage("Credit cannot be greater than the total amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await fetch("/api/expences/sales-incomes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch_id: branchId,
          name,
          date: formData.date,
          amount,
          credit,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save sales income.");
      }

      setFormData({
        name: "",
        date: getToday(),
        amount: "",
        credit: "",
      });

      setSuccessMessage("Sales income successfully added to ledger.");

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

      await fetchSalesIncomes();
    } catch (error) {
      console.error("Failed to submit sales income:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to save sales income.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const queryParams = new URLSearchParams();

    if (selectedSalesId) {
      queryParams.append("selected_sales_id", selectedSalesId);
    }

    if (selectedCapitalId) {
      queryParams.append("selected_capital_id", selectedCapitalId);
    }

    const query = queryParams.toString();

    router.push(
      `/dashboard/total-incomes${query ? `?${query}` : ""}`,
    );
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 p-6 sm:p-10 flex flex-col items-center relative overflow-hidden font-mono text-xs">
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-red-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl space-y-6 relative z-10">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="p-3 bg-slate-900/90 hover:bg-slate-800/90 rounded-xl transition-all duration-200 border border-slate-800 text-slate-400 hover:text-white shadow-lg"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-100">
                Branch Sales Incomes
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Record and manage direct sales revenue entries for Branch Unit #
                {branchId}
              </p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-4 py-3 rounded-xl text-emerald-400">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center justify-between gap-3 bg-red-950/40 border border-red-500/40 px-4 py-3 rounded-xl text-red-400">
            <span>{errorMessage}</span>

            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="hover:text-red-200"
              title="Close error"
              aria-label="Close error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-[#0d1527]/60 border border-slate-800 shadow-2xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-4 flex items-center gap-2">
            <Plus size={14} className="text-red-400" />
            Add New Sales Income Entry
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} />
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter name..."
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} />
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={12} />
                Amount (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={12} />
                Credit (LKR)
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                max={formData.amount || undefined}
                name="credit"
                value={formData.credit}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors"
              />

              <p className="text-[10px] text-slate-500">
                Credit cannot exceed amount.
              </p>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}

                <span>
                  {isSubmitting ? "Saving..." : "Save Income Entry"}
                </span>
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 rounded-2xl bg-[#0d1527]/40 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">
                Registered Sales Incomes Ledger
              </h2>

              <p className="text-[10px] text-slate-500 mt-1">
                {filteredIncomes.length} record
                {filteredIncomes.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="filter-date"
                className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
              >
                Filter by Date
              </label>

              <input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:border-red-500/60 focus:outline-none transition-colors"
              />

              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate("")}
                  className="p-2 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/50 rounded-xl transition-colors"
                  title="Clear date filter"
                  aria-label="Clear date filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          {!isLoading && filteredIncomes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Total Amount
                </p>

                <p className="mt-1 text-lg font-black text-red-400">
                  LKR{" "}
                  {totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Total Credit
                </p>

                <p className="mt-1 text-lg font-black text-amber-400">
                  LKR{" "}
                  {totalCredit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-2">
              <Loader2 size={24} className="text-red-500 animate-spin" />
              <p className="text-slate-400">
                Loading branch entries...
              </p>
            </div>
          ) : filteredIncomes.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              {filterDate
                ? `No sales income records found for ${filterDate}.`
                : "No sales income records found for this branch."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a]/50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">
                      Amount (LKR)
                    </th>
                    <th className="py-3 px-4 text-right">
                      Credit (LKR)
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {filteredIncomes.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {item.name}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {item.date}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-red-400">
                        LKR{" "}
                        {Number(item.amount || 0).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                          },
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-amber-400">
                        LKR{" "}
                        {Number(item.credit || 0).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                          },
                        )}
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

function SalesIncomesFallback() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-slate-500 bg-[#070a12] font-mono text-xs">
      <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-2" />
      <p className="uppercase tracking-widest text-[10px]">
        Loading Revenue Ledger...
      </p>
    </div>
  );
}

export default function SalesIncomesPage() {
  return (
    <Suspense fallback={<SalesIncomesFallback />}>
      <SalesIncomesContent />
    </Suspense>
  );
}