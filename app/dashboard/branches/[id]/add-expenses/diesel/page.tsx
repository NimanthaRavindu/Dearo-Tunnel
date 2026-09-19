"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CreditCard, Droplets, Fuel, Plus, RefreshCw, Trash2, Truck, Wallet } from "lucide-react";
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

type CardColor = "cyan" | "blue" | "orange" | "green" | "red";

const machines = [
  "Komatsu",
  "CAT",
  "JCB",
  "Excavator",
  "Backhoe Loader",
  "Wheel Loader",
  "Landy",
  "Other Machine",
];

const inputClass =
  "h-12 w-full rounded-xl border border-slate-600/80 bg-slate-800/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10";

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

  const [initialDieselStock, setInitialDieselStock] = useState<number>(331.00); // Diesel Used කාඩ් එකේ මුල් අගය
  const [initialTotalAmount, setInitialTotalAmount] = useState<number>(317000.00); // Total Amount කාඩ් එකේ මුල් අගය

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
        { method: "GET", cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load diesel expenses",
        );
      }

      setExpenses(
        Array.isArray(data.expenses) ? data.expenses : [],
      );
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
    if (branchId) loadExpenses();
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
  const formAmount = formPayable;
  const formBalance = Math.max(0, formPayable - formPaid);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((item) => {
        const itemDate = item.date?.slice(0, 10);

        return (
          (!filterDate || itemDate === filterDate) &&
          (!filterMachine || item.machine === filterMachine)
        );
      }),
    [expenses, filterDate, filterMachine],
  );

  const totalUsedDieselFromList = useMemo(
    () => expenses.reduce((sum, item) => sum + numberValue(item.diesel), 0),
    [expenses]
  );

  const totalUsedAmountFromList = useMemo(
    () => expenses.reduce((sum, item) => sum + numberValue(item.payable), 0),
    [expenses]
  );

  const filteredDieselTotal = useMemo(
    () => filteredExpenses.reduce((sum, item) => sum + numberValue(item.diesel), 0),
    [filteredExpenses]
  );

  const filteredAmountTotal = useMemo(
    () => filteredExpenses.reduce((sum, item) => sum + numberValue(item.payable), 0),
    [filteredExpenses]
  );

  const isFiltered = Boolean(filterDate || filterMachine);

  const activeDieselUsed = isFiltered ? filteredDieselTotal : totalUsedDieselFromList;
  const activeAmountUsed = isFiltered ? filteredAmountTotal : totalUsedAmountFromList;

  const dieselUsedDisplay = Math.max(0, initialDieselStock - activeDieselUsed);
  const remainingDiesel = Math.max(0, dieselUsedDisplay - numberValue(diesel));

  const totalAmountDisplay = Math.max(0, initialTotalAmount - activeAmountUsed);
  const remainingBalance = Math.max(0, totalAmountDisplay - numberValue(payable));

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!branchId) {
      alert("Branch ID is missing.");
      return;
    }

    if (!selectedMachine) {
      alert("Please select a machine.");
      return;
    }

    if (
      selectedMachine === "Other Machine" &&
      !otherMachine.trim()
    ) {
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
        throw new Error(
          data?.error || "Failed to save diesel expense",
        );
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
    if (
      !window.confirm(
        "Are you sure you want to delete this diesel expense?",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/expences/diesel?id=${encodeURIComponent(String(id))}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to delete expense",
        );
      }

      setExpenses((items) =>
        items.filter((item) => item.id !== id),
      );
    } catch (error) {
      console.error("DELETE DIESEL EXPENSE ERROR:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete expense",
      );
    }
  };

  const machineOptions = Array.from(
    new Set(expenses.map((item) => item.machine)),
  );

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-700/80 bg-slate-900 p-5 shadow-2xl md:flex-row md:items-center md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-400/20">
              <Fuel size={29} />
            </div>

            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-cyan-400">
                Expense Management
              </p>

              <h1 className="text-2xl font-bold md:text-3xl">
                Diesel Expenses
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage machine-wise diesel usage and payments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadExpenses}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-5 text-sm font-bold transition hover:bg-slate-700 disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* Filter Section */}
        <section className="rounded-3xl border border-slate-700/80 bg-slate-900 p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">
                Filter Records
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                View records by date and machine
              </p>
            </div>

            {isFiltered && (
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                Filter active
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Filter Date">
              <div className="relative">
                <CalendarDays size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />

                <input
                  type="date"
                  value={filterDate}
                  onChange={(event) =>
                    setFilterDate(event.target.value)
                  }
                  className={`${inputClass} pl-11`}
                />
              </div>
            </Field>

            <Field label="Filter Machine">
              <div className="relative">
                <Truck size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />

                <select
                  value={filterMachine}
                  onChange={(event) =>
                    setFilterMachine(event.target.value)
                  }
                  className={`${inputClass} cursor-pointer appearance-none pl-11`}
                >
                  <option value="">All Machines</option>

                  {machineOptions.map((machine) => (
                    <option key={machine} value={machine}>
                      {machine}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <button
              type="button"
              onClick={() => {
                setFilterDate("");
                setFilterMachine("");
              }}
              className="h-12 self-end rounded-xl border border-slate-600 bg-slate-800 px-5 text-sm font-bold transition hover:bg-slate-700"
            >
              Clear Filters
            </button>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            title="Diesel Used"
            subtitle={isFiltered ? "Filtered usage" : "Current available stock"}
            value={`${formatNumber(dieselUsedDisplay)} L`}
            icon={<Droplets size={22} />}
            color="cyan"
          />

          <SummaryCard
            title="Total Amount"
            subtitle={isFiltered ? "Filtered amount" : "Current available balance"}
            value={`Rs. ${formatNumber(totalAmountDisplay)}`}
            icon={<Wallet size={22} />}
            color="blue"
          />

          <SummaryCard
            title="Remaining Diesel"
            subtitle="After form input"
            value={`${formatNumber(remainingDiesel)} L`}
            icon={<Droplets size={22} />}
            color="orange"
          />

          <SummaryCard
            title="Remaining Balance"
            subtitle="After amount input"
            value={`Rs. ${formatNumber(remainingBalance)}`}
            icon={<CreditCard size={22} />}
            color="green"
          />

          <SummaryCard
            title="Total Diesel"
            subtitle="Initial stock"
            value={`${formatNumber(initialDieselStock)} L`}
            icon={<AlertCircle size={22} />}
            color="red"
          />
        </section>

        {/* Add Expense Form */}
        <section className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl">
          <div className="border-b border-slate-700/80 bg-slate-800/30 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                <Plus size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Add Diesel Expense
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Enter machine usage and payment information
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-7 p-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Machine">
                <div className="relative">
                  <Truck size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />

                  <select
                    value={selectedMachine}
                    onChange={(event) => {
                      setSelectedMachine(event.target.value);

                      if (
                        event.target.value !== "Other Machine"
                      ) {
                        setOtherMachine("");
                      }
                    }}
                    className={`${inputClass} cursor-pointer appearance-none pl-11`}
                  >
                    <option value="">Select Machine</option>

                    {machines.map((machine) => (
                      <option key={machine} value={machine}>
                        {machine}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Date">
                <div className="relative">
                  <CalendarDays size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />

                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </Field>
            </div>

            {selectedMachine === "Other Machine" && (
              <Field label="Machine Name">
                <input
                  type="text"
                  value={otherMachine}
                  onChange={(event) =>
                    setOtherMachine(event.target.value)
                  }
                  placeholder="Enter machine name"
                  className={inputClass}
                />
              </Field>
            )}

            <div className="grid gap-6 md:grid-cols-3">
              <Field label="Diesel Quantity (L)">
                <div className="relative">
                  <Droplets size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={diesel}
                    onChange={(event) =>
                      setDiesel(event.target.value)
                    }
                    placeholder="0.00"
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </Field>

              <Field label="Payable Amount (Rs.)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payable}
                  onChange={(event) =>
                    setPayable(event.target.value)
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>

              <Field label="Paid Amount (Rs.)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paid}
                  onChange={(event) =>
                    setPaid(event.target.value)
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-5 border-t border-slate-700/80 pt-6 md:grid-cols-2">
              <CalculationCard
                title="Amount"
                value={`Rs. ${formatNumber(formAmount)}`}
                description="Total payable amount"
                icon={<Wallet size={19} />}
                color="blue"
              />

              <CalculationCard
                title="Remaining Balance"
                value={`Rs. ${formatNumber(formBalance)}`}
                description="Payable − Paid"
                icon={<CreditCard size={19} />}
                color="red"
              />
            </div>

            <div className="flex justify-end border-t border-slate-700/80 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-7 text-sm font-bold transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={18} />
                )}

                {saving ? "Saving..." : "Save Diesel Expense"}
              </button>
            </div>
          </form>
        </section>

        {/* Table Records */}
        <section className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-700/80 p-5 md:flex-row md:items-center md:p-6">
            <div>
              <h2 className="text-xl font-bold">
                Diesel Expense Records
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Filtered machine-wise expense records
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-300">
              {filteredExpenses.length} Records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-slate-800/80">
                <tr className="border-b border-slate-700 text-left">
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Machine</TableHeader>
                  <TableHeader align="right">Diesel (L)</TableHeader>
                  <TableHeader align="right">Amount</TableHeader>
                  <TableHeader align="right">Payable</TableHeader>
                  <TableHeader align="right">Paid</TableHeader>
                  <TableHeader align="right">Balance</TableHeader>
                  <TableHeader align="center">Action</TableHeader>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center text-sm text-slate-400"
                    >
                      <RefreshCw size={18} className="mx-auto animate-spin text-cyan-400" />
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center"
                    >
                      <Fuel
                        size={30}
                        className="mx-auto mb-3 text-slate-600"
                      />

                      <p className="font-semibold text-slate-300">
                        No diesel expenses found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Add a new expense or change the filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((item) => {
                    const itemPayable = numberValue(item.payable);
                    const itemPaid = numberValue(item.paid);
                    const itemAmount = itemPayable;
                    const itemBalance = Math.max(
                      0,
                      itemPayable - itemPaid,
                    );

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-800 transition hover:bg-slate-800/50"
                      >
                        <td className="px-5 py-4 text-sm text-slate-300">
                          {item.date
                            ? new Date(
                                `${item.date.slice(0, 10)}T00:00:00`,
                              ).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                              <Truck size={15} />
                            </span>

                            <span className="font-semibold text-slate-200">
                              {item.machine}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-semibold text-slate-300">
                          {formatNumber(item.diesel)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-blue-400">
                          Rs. {formatNumber(itemAmount)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-orange-400">
                          Rs. {formatNumber(itemPayable)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-green-400">
                          Rs. {formatNumber(itemPaid)}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-bold text-red-400">
                          Rs. {formatNumber(itemBalance)}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            title="Delete expense"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
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

function SummaryCard({
  title,
  subtitle,
  value,
  icon,
  color,
}: {
  title: string;
  subtitle: string;
  value: string;
  icon: React.ReactNode;
  color: CardColor;
}) {
  const styles: Record<
    CardColor,
    { border: string; icon: string; value: string }
  > = {
    cyan: {
      border: "border-cyan-500/25 hover:border-cyan-400/50",
      icon: "bg-cyan-500/10 text-cyan-400",
      value: "text-cyan-300",
    },
    blue: {
      border: "border-blue-500/25 hover:border-blue-400/50",
      icon: "bg-blue-500/10 text-blue-400",
      value: "text-blue-300",
    },
    orange: {
      border: "border-orange-500/25 hover:border-orange-400/50",
      icon: "bg-orange-500/10 text-orange-400",
      value: "text-orange-300",
    },
    green: {
      border: "border-green-500/25 hover:border-green-400/50",
      icon: "bg-green-500/10 text-green-400",
      value: "text-green-300",
    },
    red: {
      border: "border-red-500/25 hover:border-red-400/50",
      icon: "bg-red-500/10 text-red-400",
      value: "text-red-300",
    },
  };

  const selected = styles[color];

  return (
    <div
      className={`rounded-2xl border bg-slate-900 p-5 shadow-xl transition ${selected.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-300">
            {title}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {subtitle}
          </p>

          <h2
            className={`mt-4 break-words text-xl font-bold ${selected.value}`}
          >
            {value}
          </h2>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected.icon}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

function CalculationCard({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "red";
}) {
  const styles = {
    blue: {
      border: "border-blue-500/20",
      background: "bg-blue-500/10",
      icon: "text-blue-400",
      value: "text-blue-400",
    },
    red: {
      border: "border-red-500/20",
      background: "bg-red-500/10",
      icon: "text-red-400",
      value: "text-red-400",
    },
  };

  const selected = styles[color];

  return (
    <div
      className={`rounded-2xl border ${selected.border} ${selected.background} p-5`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-300">
          {title}
        </span>

        <span className={selected.icon}>{icon}</span>
      </div>

      <p className={`mt-3 text-2xl font-bold ${selected.value}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
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
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>

      {children}
    </label>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  const alignment = {
    left: "text-left",
    right: "text-right",
    center: "text-center",
  };

  return (
    <th
      className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 ${alignment[align]}`}
    >
      {children}
    </th>
  );
}