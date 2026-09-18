"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Filter, Fuel, X } from "lucide-react";

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

interface ExpenseFiltersProps {
  selectedSalesId: string | null;
  selectedCapitalId: string | null;
  selectedDieselId: string | null;
  salesList: FilterItem[];
  capitalList: FilterItem[];
  dieselList: FilterItem[];
  onSelectSales: (id: string) => void;
  onSelectCapital: (id: string) => void;
  onSelectDiesel: (id: string) => void;
  onClearSales: () => void;
  onClearCapital: () => void;
  onClearDiesel: () => void;
}

export function ExpenseFilters({
  selectedSalesId,
  selectedCapitalId,
  selectedDieselId,
  salesList,
  capitalList,
  dieselList,
  onSelectSales,
  onSelectCapital,
  onSelectDiesel,
  onClearSales,
  onClearCapital,
  onClearDiesel,
}: ExpenseFiltersProps) {
  const [open, setOpen] = useState<
    "sales" | "capital" | "diesel" | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center gap-2"
    >
      <FilterDropdown
        label="Sales"
        selectedId={selectedSalesId}
        list={salesList}
        open={open === "sales"}
        color="emerald"
        onToggle={() =>
          setOpen(open === "sales" ? null : "sales")
        }
        onSelect={(id) => {
          onSelectSales(id);
          setOpen(null);
        }}
        onClear={onClearSales}
      />

      <FilterDropdown
        label="Capital"
        selectedId={selectedCapitalId}
        list={capitalList}
        open={open === "capital"}
        color="amber"
        onToggle={() =>
          setOpen(open === "capital" ? null : "capital")
        }
        onSelect={(id) => {
          onSelectCapital(id);
          setOpen(null);
        }}
        onClear={onClearCapital}
      />

      <DieselDropdown
        selectedId={selectedDieselId}
        list={dieselList}
        open={open === "diesel"}
        onToggle={() =>
          setOpen(open === "diesel" ? null : "diesel")
        }
        onSelect={(id) => {
          onSelectDiesel(id);
          setOpen(null);
        }}
        onClear={onClearDiesel}
      />
    </div>
  );
}

function FilterDropdown({
  label,
  selectedId,
  list,
  open,
  color,
  onToggle,
  onSelect,
  onClear,
}: {
  label: string;
  selectedId: string | null;
  list: FilterItem[];
  open: boolean;
  color: "emerald" | "amber";
  onToggle: () => void;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const textColor =
    color === "emerald"
      ? "text-emerald-400"
      : "text-amber-400";

  const selectedStyle =
    color === "emerald"
      ? "border-emerald-800/80 bg-emerald-950/80 text-emerald-400"
      : "border-amber-800/80 bg-amber-950/80 text-amber-400";

  if (selectedId) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[10px] font-mono ${selectedStyle}`}
      >
        <Filter size={10} />
        {label} Entry #{selectedId}
        <button
          type="button"
          onClick={onClear}
          className="ml-1 hover:text-white"
        >
          <X size={10} />
        </button>
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-white"
      >
        + Add {label} Filter
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 min-w-[270px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
          <p className="px-1 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Select {label} Entry
          </p>

          {list.length === 0 ? (
            <p className="px-2 py-2 text-[11px] text-slate-500">
              No {label.toLowerCase()} entries available
            </p>
          ) : (
            list.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(String(item.id))}
                className="flex w-full flex-col gap-0.5 rounded-lg border-b border-slate-800/40 px-2.5 py-2 text-left text-[11px] hover:bg-slate-800/80"
              >
                <span className="flex items-center justify-between">
                  <span className={`font-bold ${textColor}`}>
                    {item.name || `${label} #${item.id}`}
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                    #{item.id}
                  </span>
                </span>

                <span className="flex justify-between text-[10px] text-slate-400">
                  <span>🏢 {item.branch_name || "N/A"}</span>
                  <span>📅 {item.date || "N/A"}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DieselDropdown({
  selectedId,
  list,
  open,
  onToggle,
  onSelect,
  onClear,
}: {
  selectedId: string | null;
  list: FilterItem[];
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  if (selectedId) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-cyan-800/80 bg-cyan-950/80 px-2.5 py-1 text-[10px] font-mono text-cyan-400">
        <Fuel size={10} />
        Diesel Entry #{selectedId}
        <button
          type="button"
          onClick={onClear}
          className="ml-1 hover:text-white"
        >
          <X size={10} />
        </button>
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-mono text-slate-400 hover:text-white"
      >
        <Fuel size={10} />
        + Add Diesel Filter
        <ChevronDown size={10} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 min-w-[290px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
          <p className="px-1 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Select Diesel Entry
          </p>

          {list.length === 0 ? (
            <p className="px-2 py-2 text-[11px] text-slate-500">
              No diesel entries available
            </p>
          ) : (
            list.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(String(item.id))}
                className="flex w-full flex-col gap-1 rounded-lg border-b border-slate-800/40 px-2.5 py-2 text-left text-[11px] hover:bg-slate-800/80"
              >
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-bold text-cyan-400">
                    <Fuel size={11} />
                    {item.machine || `Diesel #${item.id}`}
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                    #{item.id}
                  </span>
                </span>

                <span className="flex justify-between text-[10px] text-slate-400">
                  <span>🏢 {item.branch_name || "N/A"}</span>
                  <span>📅 {item.date || "N/A"}</span>
                </span>

                <span className="flex justify-between text-[10px] text-cyan-300">
                  <span>
                    Payable:{" "}
                    {Number(item.payable ?? item.amount ?? 0).toFixed(2)}
                  </span>
                  <span>
                    Balance: {Number(item.balance ?? 0).toFixed(2)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}