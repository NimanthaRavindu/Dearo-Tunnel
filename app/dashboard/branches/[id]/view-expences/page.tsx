"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";
import {ArrowLeft,ArrowUpRight,Building,Coins,Fuel,Landmark,Wallet} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface Branch {
  id: number | string;
  branchName?: string;
  bName?: string;
}

export default function ViewExpensesMainPage({
  params,
}: PageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);

  const branchId = unwrappedParams?.id
    ? decodeURIComponent(unwrappedParams.id)
    : "";

  const [branchName, setBranchName] = useState("");
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    if (!branchId || branchId === "[id]") {
      setLoadingContext(false);
      return;
    }

    const fetchBranchIdentity = async () => {
      try {
        const response = await fetch("/api/branches", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load branches.");
        }

        const branches: Branch[] = await response.json();

        if (Array.isArray(branches)) {
          const currentBranch = branches.find(
            (branch) =>
              String(branch.id) === String(branchId),
          );

          if (currentBranch) {
            setBranchName(
              currentBranch.branchName ||
                currentBranch.bName ||
                "",
            );
          }
        }
      } catch (error) {
        console.error(
          "Identity Matrix Fetch Error:",
          error,
        );
      } finally {
        setLoadingContext(false);
      }
    };

    fetchBranchIdentity();
  }, [branchId]);

  const navigateTo = (path: string) => {
    router.push(
      `/dashboard/branches/${encodeURIComponent(
        branchId,
      )}/view-expences/${path}`,
    );
  };

  return (
    <div className="min-h-screen bg-[#070a12] p-4 font-sans text-slate-300 antialiased md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3.5 border-b border-slate-900 pb-5">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/branches/${encodeURIComponent(
                  branchId,
                )}`,
              )
            }
            className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 shadow-sm transition-all hover:bg-slate-800 hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-1 text-amber-400">
                <Landmark size={14} />
              </div>

              <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                Expense Ledger Directory
              </h1>
            </div>

            <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-purple-400">
              <Building size={11} className="opacity-70" />

              {loadingContext
                ? "Syncing Directory Context..."
                : branchName ||
                  `Branch Node ID: ${branchId}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ExpenseCard
            title="Salary Expenditures"
            description="Audit internal employee compensation matrices, disbursed transactions, and outstanding balance logs."
            icon={<Coins size={16} />}
            color="amber"
            onClick={() => navigateTo("salary")}
          />

          <ExpenseCard
            title="Other Expenditures"
            description="Examine utilities indices, food logging statements, and contingent environmental branch node costs."
            icon={<Wallet size={16} />}
            color="purple"
            onClick={() => navigateTo("other")}
          />

          <ExpenseCard
            title="Diesel Expenses"
            description="Review diesel expense records, machines, payable amounts, paid amounts, and outstanding balances."
            icon={<Fuel size={16} />}
            color="cyan"
            onClick={() => navigateTo("diesel")}
          />
        </div>
      </div>
    </div>
  );
}

function ExpenseCard({
  title,
  description,
  icon,
  color,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "amber" | "purple" | "cyan";
  onClick: () => void;
}) {
  const colorStyles = {
    amber: {
      icon: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      hover: "hover:border-amber-500/30",
      title: "group-hover:text-amber-400",
      arrow: "group-hover:text-amber-500",
    },
    purple: {
      icon: "border-purple-500/20 bg-purple-500/10 text-purple-400",
      hover: "hover:border-purple-500/30",
      title: "group-hover:text-purple-400",
      arrow: "group-hover:text-purple-500",
    },
    cyan: {
      icon: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
      hover: "hover:border-cyan-500/30",
      title: "group-hover:text-cyan-400",
      arrow: "group-hover:text-cyan-500",
    },
  };

  const styles = colorStyles[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[140px] w-full flex-col justify-between overflow-hidden rounded-xl border border-slate-900 bg-slate-900/10 p-4 text-left backdrop-blur-md transition-all hover:bg-slate-900/20 ${styles.hover}`}
    >
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div
            className={`rounded-lg border p-2 transition-transform group-hover:scale-105 ${styles.icon}`}
          >
            {icon}
          </div>

          <ArrowUpRight size={14} className={`text-slate-600 transition-colors ${styles.arrow}`} />
        </div>

        <h3
          className={`font-mono text-xs font-bold uppercase tracking-wider text-slate-200 transition-colors ${styles.title}`}
        >
          {title}
        </h3>
      </div>

      <p className="mt-2 text-[10px] leading-normal text-slate-500">
        {description}
      </p>
    </button>
  );
}