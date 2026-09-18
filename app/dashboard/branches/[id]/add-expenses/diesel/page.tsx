"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle,CalendarDays,CreditCard,Droplets,Fuel,Plus,RefreshCw,Trash2,Truck,Wallet} from "lucide-react";
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
  "Landy",
];

const numberValue = (value: number | string | undefined) =>
  Number(value || 0);

const formatNumber = (value: number | string) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

  const [filterDate, setFilterDate] = useState("");
  const [filterMachine, setFilterMachine] = useState("");

  const loadExpenses = async () => {
    if (!branchId) return;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/expences/diesel?branch_id=${encodeURIComponent(branchId)}`,
        { cache: "no-store" },
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
          : "Failed to load diesel expenses",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [branchId]);

  const resetForm = () => {
    setSelectedMachine("");
    setOtherMachine("");
    setDate("");
    setDiesel("");
    setPayable("");
    setPaid("");
  };

  const formPayable = numberValue(payable);
  const formPaid = numberValue(paid);
  const formAmount = formPayable + formPaid;
  const formBalance = Math.max(0, formPayable - formPaid);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const dateMatches =
        !filterDate || item.date.slice(0, 10) === filterDate;

      const machineMatches =
        !filterMachine || item.machine === filterMachine;

      return dateMatches && machineMatches;
    });
  }, [expenses, filterDate, filterMachine]);

  const previousExpenses = useMemo(() => {
    if (!filterDate) return [];

    return expenses.filter((item) => {
      const dateMatches = item.date.slice(0, 10) < filterDate;
      const machineMatches =
        !filterMachine || item.machine === filterMachine;

      return dateMatches && machineMatches;
    });
  }, [expenses, filterDate, filterMachine]);

  const totals = useMemo(() => {
    return filteredExpenses.reduce(
      (total, item) => {
        total.diesel += numberValue(item.diesel);
        total.amount += numberValue(item.amount);
        total.paid += numberValue(item.paid);
        return total;
      },
      { diesel: 0, amount: 0, paid: 0 },
    );
  }, [filteredExpenses]);

  const previousDiesel = previousExpenses.reduce(
    (total, item) => total + numberValue(item.diesel),
    0,
  );

  const remainingDiesel = Math.max(
    0,
    previousDiesel - totals.diesel,
  );

  const remainingBalance = Math.max(
    0,
    totals.amount - totals.paid,
  );

  const totalDiesel = previousDiesel + totals.diesel;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!branchId || !selectedMachine || !date) {
      alert("Branch, machine and date are required.");
      return;
    }

    if (
      selectedMachine === "Other Machine" &&
      !otherMachine.trim()
    ) {
      alert("Please enter the machine name.");
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
      alert("Please enter a valid payable amount.");
      return;
    }

    if (!Number.isFinite(paidValue) || paidValue < 0) {
      alert("Please enter a valid paid amount.");
      return;
    }

    if (paidValue > payableValue) {
      alert("Paid amount cannot be greater than payable amount.");
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
        headers: { "Content-Type": "application/json" },
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

      resetForm();
      await loadExpenses();
    } catch (error) {
      console.error("SAVE DIESEL EXPENSE ERROR:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save diesel expense",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this diesel expense?")) return;

    try {
      const response = await fetch(
        `/api/expences/diesel?id=${encodeURIComponent(String(id))}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete expense");
      }

      setExpenses((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("DELETE DIESEL EXPENSE ERROR:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete diesel expense",
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-cyan-500/15 p-4 text-cyan-400">
              <Fuel size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Diesel Expenses</h1>
              <p className="text-sm text-slate-400">
                Manage machine-wise diesel expenses and payments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadExpenses}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 py-3 font-semibold hover:bg-slate-700 disabled:opacity-60"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Filter Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Filter Machine
            </label>
            <select
              value={filterMachine}
              onChange={(event) => setFilterMachine(event.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
            >
              <option value="">All Machines</option>
              {Array.from(new Set(expenses.map((item) => item.machine))).map(
                (machine) => (
                  <option key={machine} value={machine}>
                    {machine}
                  </option>
                ),
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setFilterDate("");
              setFilterMachine("");
            }}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 hover:bg-slate-700"
          >
            Clear Filters
          </button>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            title="Diesel Used"
            value={`${formatNumber(totals.diesel)} L`}
            icon={<Droplets size={24} />}
            color="cyan"
          />
          <SummaryCard
            title="Total Amount"
            value={`Rs. ${formatNumber(totals.amount)}`}
            icon={<Wallet size={24} />}
            color="blue"
          />
          <SummaryCard
            title="Remaining Diesel"
            value={`${formatNumber(remainingDiesel)} L`}
            icon={<Droplets size={24} />}
            color="orange"
          />
          <SummaryCard
            title="Remaining Balance"
            value={`Rs. ${formatNumber(remainingBalance)}`}
            icon={<CreditCard size={24} />}
            color="green"
          />
          <SummaryCard
            title="Total Diesel"
            value={`${formatNumber(totalDiesel)} L`}
            icon={<AlertCircle size={24} />}
            color="red"
          />
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add Diesel Expense</h2>
              <p className="text-sm text-slate-400">
                Enter machine, date, quantity and payment details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Machine">
                <select
                  value={selectedMachine}
                  onChange={(event) => {
                    setSelectedMachine(event.target.value);
                    if (event.target.value !== "Other Machine") {
                      setOtherMachine("");
                    }
                  }}
                  className="input"
                >
                  <option value="">Select Machine</option>
                  {machines.map((machine) => (
                    <option key={machine} value={machine}>
                      {machine}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="input"
                />
              </Field>
            </div>

            {selectedMachine === "Other Machine" && (
              <Field label="Machine Name">
                <input
                  value={otherMachine}
                  onChange={(event) => setOtherMachine(event.target.value)}
                  placeholder="Enter machine name"
                  className="input"
                />
              </Field>
            )}

            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Diesel Quantity (L)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={diesel}
                  onChange={(event) => setDiesel(event.target.value)}
                  className="input"
                  placeholder="0.00"
                />
              </Field>

              <Field label="Payable (Rs.)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payable}
                  onChange={(event) => setPayable(event.target.value)}
                  className="input"
                  placeholder="0.00"
                />
              </Field>

              <Field label="Paid (Rs.)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paid}
                  onChange={(event) => setPaid(event.target.value)}
                  className="input"
                  placeholder="0.00"
                />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Amount (Payable + Paid)">
                <input
                  readOnly
                  value={`Rs. ${formatNumber(formAmount)}`}
                  className="input cursor-not-allowed text-blue-400"
                />
              </Field>

              <Field label="Balance (Payable - Paid)">
                <input
                  readOnly
                  value={`Rs. ${formatNumber(formBalance)}`}
                  className="input cursor-not-allowed text-red-400"
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-7 py-3 font-semibold hover:bg-cyan-500 disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                {saving ? "Saving..." : "Save Diesel Expense"}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-700 p-5">
            <div>
              <h2 className="text-xl font-bold">Diesel Expense Records</h2>
              <p className="text-sm text-slate-400">
                Filtered diesel expense records
              </p>
            </div>
            <span className="rounded-lg bg-slate-800 px-4 py-2 text-sm">
              {filteredExpenses.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-slate-800 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Machine</th>
                  <th className="px-5 py-4 text-right">Diesel (L)</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                  <th className="px-5 py-4 text-right">Payable</th>
                  <th className="px-5 py-4 text-right">Paid</th>
                  <th className="px-5 py-4 text-right">Balance</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredExpenses.map((item) => {
                  const itemPayable = numberValue(item.payable);
                  const itemPaid = numberValue(item.paid);
                  const itemAmount = itemPayable + itemPaid;
                  const itemBalance = Math.max(
                    0,
                    itemPayable - itemPaid,
                  );

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800 hover:bg-slate-800/60"
                    >
                      <td className="px-5 py-4 text-sm">
                        {item.date
                          ? new Date(
                              `${item.date.slice(0, 10)}T00:00:00`,
                            ).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 font-semibold">
                          <Truck size={16} className="text-cyan-400" />
                          {item.machine}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {formatNumber(item.diesel)}
                      </td>
                      <td className="px-5 py-4 text-right text-blue-400">
                        Rs. {formatNumber(itemAmount)}
                      </td>
                      <td className="px-5 py-4 text-right text-orange-400">
                        Rs. {formatNumber(itemPayable)}
                      </td>
                      <td className="px-5 py-4 text-right text-green-400">
                        Rs. {formatNumber(itemPaid)}
                      </td>
                      <td className="px-5 py-4 text-right text-red-400">
                        Rs. {formatNumber(itemBalance)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredExpenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No diesel expenses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm text-blue-300">
          Amount = Payable + Paid. Remaining Balance = Payable − Paid.
          Remaining Diesel is calculated using previous diesel quantity.
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "cyan" | "blue" | "orange" | "green" | "red";
}) {
  const styles = {
    cyan: "border-cyan-500/20 text-cyan-400",
    blue: "border-blue-500/20 text-blue-400",
    orange: "border-orange-500/20 text-orange-400",
    green: "border-green-500/20 text-green-400",
    red: "border-red-500/20 text-red-400",
  };

  return (
    <div
      className={`rounded-2xl border bg-slate-900 p-5 shadow-lg ${styles[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h2 className="mt-2 text-xl font-bold text-white">{value}</h2>
        </div>
        {icon}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}