"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Building2, ChevronRight, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Branch {
  id: number;
  branch_name: string;
  branch_code: string;
}

interface BranchSearchProps{
  searchQuery:string;
  setSearchQuery:(query:string) => void;

}

export default function BranchSearch({searchQuery,setSearchQuery}:BranchSearchProps) {
 
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filtered, setFiltered] = useState<Branch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => {
        setBranches(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching branches:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFiltered(branches);
    } else {
      const lower = searchQuery.toLowerCase();
      setFiltered(
        branches.filter(
          (b) =>
            b.branch_name.toLowerCase().includes(lower) ||
            b.branch_code.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchQuery, branches]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectBranch = (id: number) => {
    setIsOpen(false);
    setSearchQuery("");
    router.push(`/dashboard/branches/${id}`);
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-md z-50">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search corporate branch network..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800/80 text-slate-200 text-xs rounded-lg focus:outline-none focus:border-blue-500/50 placeholder:text-slate-500 font-medium transition-all shadow-inner"
        />

        {
          searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setIsOpen(false);
              }}>
                <X size={13}/>   
            </button>
          )
        }

        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-3.5 h-3.5 animate-spin" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1.5 bg-slate-900/95 border border-slate-800 rounded-lg overflow-hidden shadow-xl backdrop-blur-md max-h-60 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
          {filtered.length > 0 ? (
            filtered.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelectBranch(branch.id)}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-800/50 flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-950 border border-slate-800/60 rounded-md text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-colors">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                      {branch.branch_name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5 tracking-wider">
                      CODE: {branch.branch_code}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-xs text-slate-500 font-medium">
              No matching branches registered
            </div>
          )}
        </div>
      )}
    </div>
  );
}