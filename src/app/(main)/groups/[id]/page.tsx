"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [activeTab, setActiveTab] = useState<"expenses" | "summary" | "activity">("expenses");

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => apiFetch<any>(`/api/groups/${groupId}`),
  });

  const { data: summary } = useQuery({
    queryKey: ["groups", groupId, "summary"],
    queryFn: () => apiFetch<any>(`/api/groups/${groupId}/summary`),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["groups", groupId, "expenses"],
    queryFn: () => apiFetch<any[]>(`/api/groups/${groupId}/expenses`),
  });

  const { data: activityData } = useQuery({
    queryKey: ["groups", groupId, "activity"],
    queryFn: () => apiFetch<any>(`/api/groups/${groupId}/activity`),
  });

  const activities = activityData?.activities || [];
  const netBalance = summary?.netBalance || 0;

  if (groupLoading) {
    return <div className="p-6 animate-pulse bg-gray-50 dark:bg-gray-950 h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <header className="px-6 pt-12 pb-4 bg-white dark:bg-gray-950 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/groups" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{group?.name || "Group"}</h1>
        </div>
        
        {summary && (
          <p className={cn("font-semibold mb-6 text-xl", netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
            {netBalance > 0 ? `You're owed ${formatMoney(netBalance)}` : netBalance < 0 ? `You owe ${formatMoney(Math.abs(netBalance))}` : "You are settled up"}
          </p>
        )}

        <Link href={`/groups/${groupId}/settle`} className="w-full mb-6 bg-black dark:bg-white text-white dark:text-black py-4 rounded-full font-bold text-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform block text-center">
          GET TO ZERO
        </Link>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(["expenses", "summary", "activity"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors",
                activeTab === tab 
                  ? "bg-white dark:bg-gray-950 text-black dark:text-white shadow-sm" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 py-6 flex-1 overflow-y-auto">
        {activeTab === "expenses" && (
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center mt-10">No expenses yet.</p>
            ) : (
              expenses.map((expense: any) => (
                <div key={expense.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                      <span className="text-xl">📄</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{expense.title}</h3>
                      <p className="text-sm text-gray-500">{expense.paidBy} paid {formatMoney(expense.amountMinor)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "summary" && summary && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">Trip Summary</h3>
              
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-500">Total Spent</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{formatMoney(summary.totalSpent)}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-gray-900 dark:text-gray-100">Your true cost</p>
                  <p className="font-bold text-xl">{formatMoney(summary.yourShare)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-500">You physically paid</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatMoney(summary.youPaid)}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-500">Settlement status</p>
                {netBalance === 0 ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">✓ Settled</span>
                ) : (
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Unsettled</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center mt-10">No activity yet.</p>
            ) : (
              <div className="flex gap-4">
                <div className="w-2 bg-gray-200 dark:bg-gray-800 rounded-full mt-2 mb-2"></div>
                <div className="flex-1 space-y-6 py-2">
                  {activities.map((act: any) => (
                    <div key={act.id}>
                      <p className="text-sm text-gray-500 mb-1">{new Date(act.createdAt).toLocaleString()}</p>
                      <p className="text-gray-900 dark:text-gray-100"><span className="font-semibold">{act.userName}</span>: {act.eventType}</p>
                      <p className="font-bold">{formatMoney(Math.abs(act.amountMinor))}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
