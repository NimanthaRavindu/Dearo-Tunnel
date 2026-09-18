"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDown,Filter,Fuel,X} from "lucide-react";

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
  selectedDieselId?: string | null;

  salesList: FilterItem[];
  capitalList: FilterItem[];
  dieselList?: FilterItem[];

  onSelectSales: (id: string) => void;
  onSelectCapital: (id: string) => void;
  onSelectDiesel?: (id: string) => void;

  onClearSales: () => void;
  onClearCapital: () => void;
  onClearDiesel?: () => void;
}

export function ExpenseFilters({
  selectedSalesId,
  selectedCapitalId,
  selectedDieselId,
  salesList,
  capitalList,
  dieselList = [],
  onSelectSales,
  onSelectCapital,
  onSelectDiesel,
  onClearSales,
  onClearCapital,
  onClearDiesel,
}: ExpenseFiltersProps) {
  const [showSalesDropdown, setShowSalesDropdown] =
    useState(false);
  const [showCapitalDropdown, setShowCapitalDropdown] =
    useState(false);
  const [showDieselDropdown, setShowDieselDropdown] =
    useState(false);

  const salesRef = useRef<HTMLDivElement>(null);
  const capitalRef = useRef<HTMLDivElement>(null);
  const dieselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        salesRef.current &&
        !salesRef.current.contains(target)
      ) {
        setShowSalesDropdown(false);
      }

      if (
        capitalRef.current &&
        !capitalRef.current.contains(target)
      ) {
        setShowCapitalDropdown(false);
      }

      if (
        dieselRef.current &&
        !dieselRef.current.contains(target)
      ) {
        setShowDieselDropdown(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  const closeOtherDropdowns = (
    dropdown: "sales" | "capital" | "diesel",
  ) => {
    setShowSalesDropdown(dropdown === "sales");
    setShowCapitalDropdown(dropdown === "capital");
    setShowDieselDropdown(dropdown === "diesel");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative" ref={salesRef}>
        {selectedSalesId ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-800/80 bg-emerald-950/80 px-2.5 py-1 text-[10px] font-mono text-emerald-400">
            <Filter size={10} />
            Sales Entry #{selectedSalesId}

            <button
              type="button"
              onClick={onClearSales}
              className="ml-1 hover:text-white"
            >
              <X size={10} />
            </button>
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() =>
                closeOtherDropdowns("sales")
              }
              className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-mono text-slate-400 transition-all hover:text-white"
            >
              + Add Sales Filter
              <ChevronDown size={10} />
            </button>

            {showSalesDropdown && (
              <Dropdown>
                <DropdownTitle>
                  Select Sales Entry
                </DropdownTitle>

                {salesList.length === 0 ? (
                  <EmptyText>
                    No sales entries available
                  </EmptyText>
                ) : (
                  salesList.map((item) => (
                    <FilterOption
                      key={item.id}
                      item={item}
                      color="emerald"
                      label={item.name || `Sales #${item.id}`}
                      onClick={() => {
                        onSelectSales(String(item.id));
                        setShowSalesDropdown(false);
                      }}
                    />
                  ))
                )}
              </Dropdown>
            )}
          </>
        )}
      </div>

      <div className="relative" ref={capitalRef}>
        {selectedCapitalId ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-800/80 bg-amber-950/80 px-2.5 py-1 text-[10px] font-mono text-amber-400">
            <Filter size={10} />
            Capital Entry #{selectedCapitalId}

            <button
              type="button"
              onClick={onClearCapital}
              className="ml-1 hover:text-white"
            >
              <X size={10} />
            </button>
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() =>
                closeOtherDropdowns("capital")
              }
              className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-mono text-slate-400 transition-all hover:text-white"
            >
              + Add Capital Filter
              <ChevronDown size={10} />
            </button>

            {showCapitalDropdown && (
              <Dropdown>
                <DropdownTitle>
                  Select Capital Entry
                </DropdownTitle>

                {capitalList.length === 0 ? (
                  <EmptyText>
                    No capital entries available
                  </EmptyText>
                ) : (
                  capitalList.map((item) => (
                    <FilterOption
                      key={item.id}
                      item={item}
                      color="amber"
                      label={
                        item.name || `Capital #${item.id}`
                      }
                      onClick={() => {
                        onSelectCapital(String(item.id));
                        setShowCapitalDropdown(false);
                      }}
                    />
                  ))
                )}
              </Dropdown>
            )}
          </>
        )}
      </div>

      {onSelectDiesel && onClearDiesel && (
        <div className="relative" ref={dieselRef}>
          {selectedDieselId ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-cyan-800/80 bg-cyan-950/80 px-2.5 py-1 text-[10px] font-mono text-cyan-400">
              <Fuel size={10} />
              Diesel Entry #{selectedDieselId}

              <button
                type="button"
                onClick={onClearDiesel}
                className="ml-1 hover:text-white"
              >
                <X size={10} />
              </button>
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  closeOtherDropdowns("diesel")
                }
                className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-mono text-slate-400 transition-all hover:text-white"
              >
                + Add Diesel Filter
                <ChevronDown size={10} />
              </button>

              {showDieselDropdown && (
                <Dropdown>
                  <DropdownTitle>
                    Select Diesel Entry
                  </DropdownTitle>

                  {dieselList.length === 0 ? (
                    <EmptyText>
                      No diesel entries available
                    </EmptyText>
                  ) : (
                    dieselList.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectDiesel(String(item.id));
                          setShowDieselDropdown(false);
                        }}
                        className="flex w-full flex-col gap-1 rounded-lg border-b border-slate-800/40 px-2.5 py-2 text-left font-mono text-[11px] text-slate-300 last:border-0 hover:bg-slate-800/80"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-bold text-cyan-400">
                            <Fuel size={11} />
                            {item.machine ||
                              `Diesel #${item.id}`}
                          </span>

                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                            #{item.id}
                          </span>
                        </div>

                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>
                            🏢 {item.branch_name || "N/A"}
                          </span>
                          <span>
                            📅 {item.date || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between text-[10px] text-cyan-300">
                          <span>
                            Payable:{" "}
                            {Number(item.payable || 0).toFixed(2)}
                          </span>
                          <span>
                            Balance:{" "}
                            {Number(item.balance || 0).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </Dropdown>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Dropdown({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute left-0 top-full z-50 mt-1 max-h-60 min-w-[280px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
      {children}
    </div>
  );
}

function DropdownTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="px-1 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </p>
  );
}

function EmptyText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="px-2 py-2 font-mono text-[11px] text-slate-500">
      {children}
    </p>
  );
}

function FilterOption({
  item,
  label,
  color,
  onClick,
}: {
  item: FilterItem;
  label: string;
  color: "emerald" | "amber";
  onClick: () => void;
}) {
  const colorClass =
    color === "emerald"
      ? "text-emerald-400"
      : "text-amber-400";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-0.5 rounded-lg border-b border-slate-800/40 px-2.5 py-2 text-left font-mono text-[11px] text-slate-300 last:border-0 hover:bg-slate-800/80"
    >
      <div className="flex items-center justify-between">
        <span className={`font-bold ${colorClass}`}>
          {label}
        </span>

        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
          #{item.id}
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>🏢 {item.branch_name || "N/A"}</span>
        <span>📅 {item.date || "N/A"}</span>
      </div>
    </button>
  );
}