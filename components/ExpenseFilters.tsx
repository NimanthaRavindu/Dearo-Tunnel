"use client";

import React, { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";

interface FilterItem {
  id: number | string;
  name?: string;
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sales Filter */}
      {selectedSalesId ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono">
          <Filter size={10} /> Sales Entry #{selectedSalesId}
          <button onClick={onClearSales} className="hover:text-white ml-1">
            <X size={10} />
          </button>
        </span>
      ) : (
        <div className="relative">
          <button
            onClick={() => setShowSalesDropdown(!showSalesDropdown)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono hover:text-white"
          >
            + Add Sales Filter <ChevronDown size={10} />
          </button>
          {showSalesDropdown && (
            <div className="absolute top-full mt-1 left-0 bg-slate-900 border border-slate-700 rounded-md shadow-xl z-50 p-2 min-w-[160px] max-h-60 overflow-y-auto">
              <p className="text-[9px] text-slate-500 uppercase px-1 pb-1">Select Sales ID</p>
              {salesList.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-slate-500">No sales entries</p>
              ) : (
                salesList.map((item) => {
                  const id = item.id;
                  const displayName = item.name ? `${item.name} (#${id})` : `Sales Entry #${id}`;
                  return (
                    <div
                      key={id}
                      onClick={() => {
                        onSelectSales(id.toString());
                        setShowSalesDropdown(false);
                      }}
                      className="px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 rounded cursor-pointer font-mono"
                    >
                      {displayName}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Capital Filter */}
      {selectedCapitalId ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800/80 text-[10px] font-mono">
          <Filter size={10} /> Capital Entry #{selectedCapitalId}
          <button onClick={onClearCapital} className="hover:text-white ml-1">
            <X size={10} />
          </button>
        </span>
      ) : (
        <div className="relative">
          <button
            onClick={() => setShowCapitalDropdown(!showCapitalDropdown)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono hover:text-white"
          >
            + Add Capital Filter <ChevronDown size={10} />
          </button>
          {showCapitalDropdown && (
            <div className="absolute top-full mt-1 left-0 bg-slate-900 border border-slate-700 rounded-md shadow-xl z-50 p-2 min-w-[160px] max-h-60 overflow-y-auto">
              <p className="text-[9px] text-slate-500 uppercase px-1 pb-1">Select Capital ID</p>
              {capitalList.length === 0 ? (
                <p className="px-2 py-1 text-[11px] text-slate-500">No capital entries</p>
              ) : (
                capitalList.map((item) => {
                  const id = item.id;
                  const displayName = item.name ? `${item.name} (#${id})` : `Capital Entry #${id}`;
                  return (
                    <div
                      key={id}
                      onClick={() => {
                        onSelectCapital(id.toString());
                        setShowCapitalDropdown(false);
                      }}
                      className="px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 rounded cursor-pointer font-mono"
                    >
                      {displayName}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}