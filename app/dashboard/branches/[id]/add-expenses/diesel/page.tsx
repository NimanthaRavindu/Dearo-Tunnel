"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {ArrowLeft,Fuel,Plus,Trash2,Save,CalendarDays,Truck,Droplets,Wallet,CircleDollarSign,CreditCard,RefreshCw} from "lucide-react";

type DieselExpense = {
  id: number;
  branch_id: string;
  date: string;
  machine: string;
  diesel: number;
  amount: number;
  payable: number;
  paid: number;
};

const MACHINE_OPTIONS = [
  "Komatsu",
  "CAT",
  "JCB",
  "Excavator",
  "Backhoe Loader",
  "Wheel Loader",
  "Other Machine",
];

export default function DieselExpensesPage() {
  const params = useParams();
  const router = useRouter();

  const branchId = String(params.id);

  const [machine, setMachine] = useState("");
  const [otherMachine, setOtherMachine] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [diesel, setDiesel] = useState("");
  const [amount, setAmount] = useState("");
  const [payable, setPayable] = useState("");
  const [paid, setPaid] = useState("");

  const [expenses, setExpenses] = useState<DieselExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedMachine =
    machine === "Other Machine" ? otherMachine : machine;

  const balance = Math.max(
    0,
    Number(payable || 0) - Number(paid || 0)
  );

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load expenses");
      }

      setExpenses(data.expenses || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load diesel expenses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [branchId]);

  const totals = useMemo(() => {
    return expenses.reduce(
      (acc, item) => {
        acc.diesel += Number(item.diesel);
        acc.amount += Number(item.amount);
        acc.payable += Number(item.payable);
        acc.paid += Number(item.paid);
        return acc;
      },
      {
        diesel: 0,
        amount: 0,
        payable: 0,
        paid: 0,
      }
    );
  }, [expenses]);

  const outstanding = totals.payable - totals.paid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMachine) {
      alert("Please select a machine.");
      return;
    }

    if (
      !date ||
      !diesel ||
      !amount ||
      !payable ||
      !paid
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (Number(diesel) <= 0) {
      alert("Diesel quantity must be greater than 0.");
      return;
    }

    if (Number(amount) < 0 || Number(payable) < 0 || Number(paid) < 0) {
      alert("Amounts cannot be negative.");
      return;
    }

    if (Number(paid) > Number(payable)) {
      alert("Total Paid cannot be greater than Total Payable.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/expences/diesel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch_id: branchId,
          date,
          machine: selectedMachine,
          diesel: Number(diesel),
          amount: Number(amount),
          payable: Number(payable),
          paid: Number(paid),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save expense");
      }

      setExpenses((prev) => [data.expense, ...prev]);

      setMachine("");
      setOtherMachine("");
      setDiesel("");
      setAmount("");
      setPayable("");
      setPaid("");

      alert("Diesel expense saved successfully.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save diesel expense."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (expenseId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this diesel expense?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/expences/diesel?id=${expenseId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete expense");
      }

      setExpenses((prev) =>
        prev.filter((item) => item.id !== expenseId)
      );
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete expense."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-5 md:p-8">
      <div className="max-w-7xl mx-auto space-y-7">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/branches/${branchId}/add-expenses`
                )
              }
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-cyan-400 transition"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Fuel className="text-cyan-400" size={23} />
                <h1 className="text-xl md:text-2xl font-bold">
                  Diesel Expenses
                </h1>
              </div>

              <p className="text-xs text-slate-400 mt-1">
                Machine-wise diesel consumption and payment management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadExpenses}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
              title="Refresh"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
            </button>

            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              Branch ID:{" "}
              <span className="text-cyan-400 font-bold">
                #{branchId}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            icon={<Droplets size={19} />}
            title="Diesel Used"
            value={`${totals.diesel.toFixed(2)} L`}
          />

          <SummaryCard
            icon={<CircleDollarSign size={19} />}
            title="Total Amount"
            value={`Rs. ${totals.amount.toFixed(2)}`}
          />

          <SummaryCard
            icon={<Wallet size={19} />}
            title="Payable"
            value={`Rs. ${totals.payable.toFixed(2)}`}
          />

          <SummaryCard
            icon={<CreditCard size={19} />}
            title="Paid"
            value={`Rs. ${totals.paid.toFixed(2)}`}
          />

          <SummaryCard
            icon={<Wallet size={19} />}
            title="Outstanding"
            value={`Rs. ${outstanding.toFixed(2)}`}
          />
        </div>

        {/* Form */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Plus size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Add Diesel Expense
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* Machine */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Machine
                </label>

                <div className="relative">
                  <Truck
                    size={16}
                    className="absolute left-3 top-3.5 text-slate-500"
                  />

                  <select
                    value={machine}
                    onChange={(e) => setMachine(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm outline-none focus:border-cyan-500"
                  >
                    <option value="">Select Machine</option>

                    {MACHINE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Other Machine */}
              {machine === "Other Machine" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Machine Name
                  </label>

                  <input
                    type="text"
                    value={otherMachine}
                    onChange={(e) =>
                      setOtherMachine(e.target.value)
                    }
                    placeholder="Enter machine name"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="absolute left-3 top-3.5 text-slate-500"
                  />

                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <InputField
                label="Total Diesel Quantity (L)"
                value={diesel}
                setValue={setDiesel}
                placeholder="0.00"
              />

              <InputField
                label="Amount (Rs.)"
                value={amount}
                setValue={setAmount}
                placeholder="0.00"
              />

              <InputField
                label="Total Payable (Rs.)"
                value={payable}
                setValue={setPayable}
                placeholder="0.00"
              />

              <InputField
                label="Total Paid (Rs.)"
                value={paid}
                setValue={setPaid}
                placeholder="0.00"
              />

              {/* Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Balance (Rs.)
                </label>

                <div className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-sm text-amber-400 font-bold">
                  Rs. {balance.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition shadow-lg shadow-cyan-500/10"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Submit Expense
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Diesel Expense Records
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Saved database records for this branch
              </p>
            </div>

            <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
              {expenses.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800">
                  <th className="text-left px-5 py-4 text-xs font-bold text-slate-400 uppercase">
                    Date
                  </th>

                  <th className="text-left px-5 py-4 text-xs font-bold text-slate-400 uppercase">
                    Machine
                  </th>

                  <th className="text-right px-5 py-4 text-xs font-bold text-slate-400 uppercase">
                    Diesel (L)
                  </th>

                  <th className="text-right px-5 py-4 text-xs font-bold text-slate-400 uppercase">
                    Amount
                  </th>

                  <th className="text-right px-5 py-4 text-xs font-bold text-slate-400 uppercase">
                    Payable
                  </th>

                  <th className="text-right px-5 py-4 text-xs font-bold text-slate-400 uppercase">
                    Paid
                  </th>

                  <th className="text-right px-5 py-4 text-xs font-bold text-slate-400 uppercase">
                    Balance
                  </th>

                  <th className="text-center px-5 py-4 text-xs font-bold text-slate-400 uppercase">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <RefreshCw
                        size={25}
                        className="mx-auto text-cyan-400 animate-spin mb-3"
                      />
                      <p className="text-sm text-slate-500">
                        Loading records...
                      </p>
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Fuel
                        size={35}
                        className="mx-auto text-slate-700 mb-3"
                      />

                      <p className="text-sm text-slate-500">
                        No diesel expense records found.
                      </p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800/70 hover:bg-slate-900/40 transition"
                    >
                      <td className="px-5 py-4 text-slate-300">
                        {new Date(item.date).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">
                          <Truck size={14} />
                          {item.machine}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-slate-200">
                        {Number(item.diesel).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right text-slate-300">
                        Rs. {Number(item.amount).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right text-slate-300">
                        Rs. {Number(item.payable).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right text-emerald-400">
                        Rs. {Number(item.paid).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right text-amber-400 font-bold">
                        Rs.{" "}
                        {(
                          Number(item.payable) -
                          Number(item.paid)
                        ).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => deleteExpense(item.id)}
                          className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-2">
        {label}
      </label>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm outline-none focus:border-cyan-500 transition"
      />
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 hover:border-cyan-500/30 transition">
      <div className="flex items-center gap-2 text-cyan-400 mb-3">
        {icon}

        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
          {title}
        </span>
      </div>

      <div className="text-base md:text-lg font-bold text-slate-100 truncate">
        {value}
      </div>
    </div>
  );
}