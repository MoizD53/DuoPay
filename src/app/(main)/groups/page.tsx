"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api-client";

export default function GroupsPage() {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => apiFetch<any[]>("/api/groups"),
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <header className="px-6 pt-12 pb-4 bg-white dark:bg-gray-950 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-900">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Groups</h1>
      </header>

      <div className="px-6 py-6 flex-1 overflow-y-auto no-scrollbar">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState 
            icon={Users}
            title="No groups yet"
            description="Split your first expense with friends."
            action={
              <Link href="/groups/new" className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-semibold active:scale-95 transition-transform shadow-md inline-block">
                Create Group
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <Link 
                key={group.id} 
                href={`/groups/${group.id}`}
                className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between active:scale-[0.98] transition-transform block"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{group.name}</h3>
                  <p className="text-sm text-gray-500">View Group</p>
                </div>
              </Link>
            ))}

            <Link href="/groups/new" className="w-full mt-6 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-5 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform border border-dashed border-gray-300 dark:border-gray-700">
              <Plus size={20} />
              Create Group
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
