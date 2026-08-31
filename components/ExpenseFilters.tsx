"use client";

import React, { useState, useRef, useEffect } from "react";
import { Filter, X, ChevronDown } from "lucide-react";

interface FilterItem {
  id: number | string;
  name?: string;
  branch_name?: string;
  date?: string;
}

interface ExpenseFiltersProps {
  selectedSalesId: string | null;
  selectedCapitalId: string | null;
  salesList: FilterItem[];
  capitalList: FilterItem[];
  onSelectSales: (id: string) => void;
  onSelectCapital: (id: string) => void;
  onClearSales: () => void;
  onClearCapital: () => void;
}

export function ExpenseFilters({
  selectedSalesId,
  selectedCapitalId,
  salesList,
  capitalList,
  onSelectSales,
  onSelectCapital,
  onClearSales,
  onClearCapital,
}: ExpenseFiltersProps) {
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);
  const [showCapitalDropdown, setShowCapitalDropdown] = useState(false);

  const salesRef = useRef<HTMLDivElement>(null);
  const capitalRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (salesRef.current && !salesRef.current.contains(event.target as Node)) {
        setShowSalesDropdown(false);
      }
      if (capitalRef.current && !capitalRef.current.contains(event.target as Node)) {
        setShowCapitalDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sales Filter */}
      <div className="relative" ref={salesRef}>
        {selectedSalesId ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono">
            <Filter size={10} /> Sales Entry #{selectedSalesId}
            <button onClick={onClearSales} className="hover:text-white ml-1">
              <X size={10} />
            </button>
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setShowSalesDropdown(!showSalesDropdown);
                setShowCapitalDropdown(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono hover:text-white transition-all"
            >
              + Add Sales Filter <ChevronDown size={10} />
            </button>
            {showSalesDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 min-w-[260px] max-h-60 overflow-y-auto">
                <p className="text-[9px] text-slate-500 uppercase px-1 pb-1.5 font-bold tracking-wider">Select Sales Entry</p>
                {salesList.length === 0 ? (
                  <p className="px-2 py-2 text-[11px] text-slate-500 font-mono">No sales entries available</p>
                ) : (
                  salesList.map((item) => {
                    const id = item.id;
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          onSelectSales(id.toString());
                          setShowSalesDropdown(false);
                        }}
                        className="px-2.5 py-2 text-[11px] text-slate-300 hover:bg-slate-800/80 rounded-lg cursor-pointer font-mono flex flex-col gap-0.5 border-b border-slate-800/40 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400">{item.name || `Sales #${id}`}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">#{id}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>🏢 {item.branch_name || "N/A"}</span>
                          <span>📅 {item.date || "N/A"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Capital Filter */}
      <div className="relative" ref={capitalRef}>
        {selectedCapitalId ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800/80 text-[10px] font-mono">
            <Filter size={10} /> Capital Entry #{selectedCapitalId}
            <button onClick={onClearCapital} className="hover:text-white ml-1">
              <X size={10} />
            </button>
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setShowCapitalDropdown(!showCapitalDropdown);
                setShowSalesDropdown(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono hover:text-white transition-all"
            >
              + Add Capital Filter <ChevronDown size={10} />
            </button>
            {showCapitalDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 min-w-[260px] max-h-60 overflow-y-auto">
                <p className="text-[9px] text-slate-500 uppercase px-1 pb-1.5 font-bold tracking-wider">Select Capital Entry</p>
                {capitalList.length === 0 ? (
                  <p className="px-2 py-2 text-[11px] text-slate-500 font-mono">No capital entries available</p>
                ) : (
                  capitalList.map((item) => {
                    const id = item.id;
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          onSelectCapital(id.toString());
                          setShowCapitalDropdown(false);
                        }}
                        className="px-2.5 py-2 text-[11px] text-slate-300 hover:bg-slate-800/80 rounded-lg cursor-pointer font-mono flex flex-col gap-0.5 border-b border-slate-800/40 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-400">{item.name || `Capital #${id}`}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">#{id}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>🏢 {item.branch_name || "N/A"}</span>
                          <span>📅 {item.date || "N/A"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}