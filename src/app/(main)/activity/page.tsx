"use client";

import { formatMoney } from "@/lib/utils";

export default function ActivityPage() {
  const activities: any[] = [];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <header className="px-6 pt-12 pb-4 bg-white dark:bg-gray-950 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-900">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Activity</h1>
      </header>

      <div className="px-6 py-6 flex-1 overflow-y-auto no-scrollbar">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No recent activity.</div>
          ) : (
            activities.map(act => (
              <div key={act.id} className="p-4 flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <span className="text-lg">{act.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{act.text}</p>
                  <p className="text-sm text-gray-500">{act.subtext}</p>
                </div>
                {act.amount && (
                  <div className="text-right">
                     <p className="font-bold">{formatMoney(act.amount)}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
