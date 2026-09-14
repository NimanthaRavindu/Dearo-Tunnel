"use client";
import { useEffect, useMemo, useState } from "react";
import {Fuel,Plus,RefreshCw,Trash2,CalendarDays,Wallet,CreditCard,CircleDollarSign,Droplets,AlertCircle,Truck} from "lucide-react";
import { useParams } from "next/navigation";

type DieselExpense = {
  id: number;
  branch_id: string;
  date: string;
  machine: string;
  diesel: number | string;
  amount: number | string;
  payable: number | string;
  paid: number | string;
};

const machines = [
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

  const branchId = Array.isArray(params?.id)
    ? params.id[0]
    : String(params?.id || "");

  const [expenses, setExpenses] = useState<DieselExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedMachine, setSelectedMachine] = useState("");
  const [otherMachine, setOtherMachine] = useState("");

  const [date, setDate] = useState("");
  const [diesel, setDiesel] = useState("");
  const [payable, setPayable] = useState("");
  const [paid, setPaid] = useState("");

  // ----------------------------------------------------
  // LOAD DATA
  // ----------------------------------------------------

  const loadExpenses = async () => {
    if (!branchId) return;
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
        throw new Error(data?.error || "Failed to load diesel expenses");
      }

      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
    } catch (error) {
      console.error("LOAD DIESEL EXPENSE ERROR:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to load diesel expenses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) {
      loadExpenses();
    }
  }, [branchId]);

  // ----------------------------------------------------
  // FORM RESET
  // ----------------------------------------------------

  const resetForm = () => {
    setSelectedMachine("");
    setOtherMachine("");
    setDate("");
    setDiesel("");
    setPayable("");
    setPaid("");
  };

  // ----------------------------------------------------
  // CALCULATIONS
  // ----------------------------------------------------

  const formPayable = Number(payable || 0);
  const formPaid = Number(paid || 0);

  // Amount = Total Payable
  const formAmount = formPayable;

  // Balance = Total Payable - Total Paid
  const formBalance = Math.max(0, formPayable - formPaid);

  // ----------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!branchId) {
      alert("Branch ID is missing.");
      return;
    }

    if (!selectedMachine) {
      alert("Please select a machine.");
      return;
    }

    if (selectedMachine === "Other Machine" && !otherMachine.trim()) {
      alert("Please enter the machine name.");
      return;
    }

    if (!date) {
      alert("Please select a date.");
      return;
    }

    const dieselValue = Number(diesel);
    const payableValue = Number(payable);
    const paidValue = Number(paid);

    if (!Number.isFinite(dieselValue) || dieselValue <= 0) {
      alert("Please enter a valid diesel quantity.");
      return;
    }

    if (!Number.isFinite(payableValue) || payableValue < 0) {
      alert("Please enter a valid Total Payable amount.");
      return;
    }

    if (!Number.isFinite(paidValue) || paidValue < 0) {
      alert("Please enter a valid Total Paid amount.");
      return;
    }

    if (paidValue > payableValue) {
      alert("Total Paid cannot be greater than Total Payable.");
      return;
    }

    const machineName =
      selectedMachine === "Other Machine"
        ? otherMachine.trim()
        : selectedMachine;
    try {
      setSaving(true);

      const response = await fetch("/api/expences/diesel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch_id: branchId,
          date,
          machine: machineName,
          diesel: dieselValue,
          payable: payableValue,
          paid: paidValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save diesel expense");
      }

      alert("Diesel expense saved successfully.");
      resetForm();
      await loadExpenses();
    } catch (error) {
      console.error("SAVE DIESEL EXPENSE ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save diesel expense"
      );
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // DELETE
  // ----------------------------------------------------

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this diesel expense?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/expences/diesel?id=${encodeURIComponent(String(id))}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete diesel expense");
      }

      setExpenses((previous) =>
        previous.filter((expense) => expense.id !== id)
      );

      alert("Diesel expense deleted successfully.");
    } catch (error) {
      console.error("DELETE DIESEL EXPENSE ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete diesel expense"
      );
    }
  };

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  const totals = useMemo(() => {
    return expenses.reduce(
      (acc, item) => {
        acc.diesel += Number(item.diesel || 0);

        // Amount = Total Payable
        acc.amount += Number(item.payable || 0);

        acc.payable += Number(item.payable || 0);
        acc.paid += Number(item.paid || 0);

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

  const outstanding = Math.max(
    0,
    totals.payable - totals.paid
  );

  // ----------------------------------------------------
  // CURRENCY FORMAT
  // ----------------------------------------------------

  const formatNumber = (value: number | string) => {
    return Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <Fuel size={30} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Diesel Expenses
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage machine-wise diesel expenses and payments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadExpenses}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />

            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

          {/* Diesel Used */}
          <div className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Diesel Used
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                  {formatNumber(totals.diesel)} L
                </h2>
              </div>

              <div className="rounded-xl bg-cyan-100 p-3 text-cyan-700">
                <Droplets size={24} />
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Amount
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                  Rs. {formatNumber(totals.amount)}
                </h2>
              </div>

              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <CircleDollarSign size={24} />
              </div>
            </div>
          </div>

          {/* Payable */}
          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Payable
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                  Rs. {formatNumber(totals.payable)}
                </h2>
              </div>

              <div className="rounded-xl bg-orange-100 p-3 text-orange-700">
                <Wallet size={24} />
              </div>
            </div>
          </div>

          {/* Paid */}
          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Paid
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                  Rs. {formatNumber(totals.paid)}
                </h2>
              </div>

              <div className="rounded-xl bg-green-100 p-3 text-green-700">
                <CreditCard size={24} />
              </div>
            </div>
          </div>

          {/* Outstanding */}
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Outstanding
                </p>

                <h2 className="mt-2 text-2xl font-bold text-red-600">
                  Rs. {formatNumber(outstanding)}
                </h2>
              </div>

              <div className="rounded-xl bg-red-100 p-3 text-red-600">
                <AlertCircle size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* ADD FORM */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-100 p-3 text-cyan-700">
              <Plus size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Add Diesel Expense
              </h2>

              <p className="text-sm text-slate-500">
                Enter machine diesel usage and payment details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* MACHINE + DATE */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Machine */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Machine
                </label>

                <div className="relative">
                  <Truck
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={selectedMachine}
                    onChange={(e) => {
                      setSelectedMachine(e.target.value);

                      if (e.target.value !== "Other Machine") {
                        setOtherMachine("");
                      }
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">
                      Select Machine
                    </option>

                    {machines.map((machine) => (
                      <option key={machine} value={machine}>
                        {machine}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>
            </div>

            {/* OTHER MACHINE */}
            {selectedMachine === "Other Machine" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Machine Name
                </label>

                <input
                  type="text"
                  value={otherMachine}
                  onChange={(e) => setOtherMachine(e.target.value)}
                  placeholder="Enter machine name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </div>
            )}

            {/* DIESEL + PAYMENTS */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

              {/* Diesel */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Total Diesel Quantity (L)
                </label>

                <div className="relative">
                  <Droplets
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={diesel}
                    onChange={(e) => setDiesel(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pl-10 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              {/* Payable */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Total Payable (Rs.)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payable}
                  onChange={(e) => setPayable(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Paid */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Total Paid (Rs.)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>

            {/* AMOUNT + BALANCE */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Amount */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Amount (Rs.)
                </label>

                <input
                  type="text"
                  value={formatNumber(formAmount)}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 outline-none"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Amount is based on Total Payable
                </p>
              </div>

              {/* Balance */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Balance (Rs.)
                </label>

                <input
                  type="text"
                  value={formatNumber(formBalance)}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 outline-none"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Total Payable − Total Paid
                </p>
              </div>
            </div>

            {/* SUBMIT */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={19} />

                {saving
                  ? "Saving..."
                  : "Save Diesel Expense"}
              </button>
            </div>
          </form>
        </div>

        {/* TABLE */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Diesel Expense Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Saved diesel expense records for this branch
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              {expenses.length} Records
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] border-collapse">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Machine
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Diesel (L)
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Total Payable
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Total Paid
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Balance
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw
                          size={18}
                          className="animate-spin"
                        />
                        Loading diesel expenses...
                      </div>
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">

                        <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400">
                          <Fuel size={28} />
                        </div>

                        <p className="font-semibold text-slate-700">
                          No diesel expenses found
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Add a diesel expense using the form above.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((item) => {

                    const itemAmount =
                      Number(item.payable || 0);

                    const itemPayable =
                      Number(item.payable || 0);

                    const itemPaid =
                      Number(item.paid || 0);

                    const itemBalance =
                      Math.max(
                        0,
                        itemPayable - itemPaid
                      );

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* DATE */}
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {item.date
                            ? new Date(
                                `${item.date}T00:00:00`
                              ).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        {/* MACHINE */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">

                            <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                              <Truck size={16} />
                            </div>

                            <span className="font-semibold text-slate-700">
                              {item.machine}
                            </span>
                          </div>
                        </td>

                        {/* DIESEL */}
                        <td className="px-5 py-4 text-right text-sm font-medium text-slate-700">
                          {formatNumber(item.diesel)}
                        </td>

                        {/* AMOUNT */}
                        <td className="px-5 py-4 text-right text-sm font-semibold text-blue-700">
                          Rs. {formatNumber(itemAmount)}
                        </td>

                        {/* PAYABLE */}
                        <td className="px-5 py-4 text-right text-sm font-semibold text-orange-700">
                          Rs. {formatNumber(itemPayable)}
                        </td>

                        {/* PAID */}
                        <td className="px-5 py-4 text-right text-sm font-semibold text-green-700">
                          Rs. {formatNumber(itemPaid)}
                        </td>

                        {/* BALANCE */}
                        <td className="px-5 py-4 text-right text-sm font-semibold text-red-600">
                          Rs. {formatNumber(itemBalance)}
                        </td>

                        {/* DELETE */}
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(item.id)
                            }
                            className="inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAYMENT INFORMATION */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <div className="flex gap-3">

            <div className="mt-0.5 text-blue-600">
              <AlertCircle size={20} />
            </div>

            <div>
              <h3 className="font-semibold text-blue-800">
                Payment Calculation
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                Amount is equal to Total Payable.
                Balance is calculated as Total Payable
                minus Total Paid.
              </p>

              <p className="mt-1 text-sm font-semibold text-blue-800">
                Example: Payable Rs. 100,000 − Paid
                Rs. 60,000 = Balance Rs. 40,000
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}