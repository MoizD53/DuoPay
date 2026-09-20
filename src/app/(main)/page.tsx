"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function HomePage() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<any>("/api/me"),
  });

  const { data: summary } = useQuery({
    queryKey: ["me", "summary"],
    queryFn: () => apiFetch<any>("/api/me/summary"),
  });

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: () => apiFetch<any[]>("/api/groups"),
  });

  const groups = groupsData || [];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <header className="px-6 pt-12 pb-6 bg-white dark:bg-gray-950">
        <h1 className="text-2xl font-bold tracking-tight mb-6">
          Good evening, {user?.name?.split(" ")[0] || "..."}
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl">
            <p className="text-sm font-bold text-red-500 uppercase tracking-wider mb-1">You Owe</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary ? formatMoney(summary.youOwe) : "..."}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-2xl">
            <p className="text-sm font-bold text-green-500 uppercase tracking-wider mb-1">You're Owed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary ? formatMoney(summary.youAreOwed) : "..."}
            </p>
          </div>
        </div>
        
        <div className="bg-black dark:bg-white text-white dark:text-black p-5 rounded-2xl flex items-center justify-between mb-8 shadow-lg">
          <div>
            <p className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-1">Net Balance</p>
            <p className="text-3xl font-bold">
              {summary ? (summary.net > 0 ? "+" : "") + formatMoney(summary.net) : "..."}
            </p>
          </div>
          <Link href="/groups" className="bg-white dark:bg-black text-black dark:text-white px-4 py-2 rounded-full font-bold text-sm">
            GET TO ZERO
          </Link>
        </div>
      </header>

      <div className="px-6 py-8 flex-1 overflow-y-auto no-scrollbar">
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Pending Settlements</h2>
          <div className="space-y-3">
             <p className="text-sm text-gray-500">No pending settlements.</p>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Activity</h2>
            <Link href="/activity" className="text-sm font-medium text-blue-600 dark:text-blue-400">See all</Link>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 p-4 text-center">
            <p className="text-sm text-gray-500">No recent activity.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
