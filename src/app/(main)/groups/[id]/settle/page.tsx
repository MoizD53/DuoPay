"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export default function SmartSettlementPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const groupId = params.id as string;

  const { data: planData, isLoading } = useQuery({
    queryKey: ["groups", groupId, "settlement-plan"],
    queryFn: () => apiFetch<any>(`/api/groups/${groupId}/settlement-plan`),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["groups", groupId, "expenses"],
    queryFn: () => apiFetch<any[]>(`/api/groups/${groupId}/expenses`),
  });

  const plan = planData?.plan || [];
  
  // Basic heuristic: if plan has fewer payments than total expenses/debt relationships, it was simplified.
  const isSimplified = plan.length > 0 && expenses.length > plan.length;

  const totalOutstanding = plan.reduce((sum: number, p: any) => sum + p.amountMinor, 0);

  const settleMutation = useMutation({
    mutationFn: async (p: any) => {
      // In reality, this would hit POST /api/groups/:id/settlements
      // For Phase 5 we just simulate success and invalidate to recalculate
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    }
  });

  if (isLoading) {
    return <div className="p-6">Loading optimal settlements...</div>;
  }

  if (plan.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-950 items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <Link href={`/groups/${groupId}`} className="absolute top-12 left-6 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-8xl font-black text-green-500 mb-6 tracking-tighter"># ₹0</h1>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Everyone is settled.</p>
        <p className="text-gray-500">No debts remain in this group.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <header className="px-6 pt-12 pb-6 bg-white dark:bg-gray-950 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <Link href={`/groups/${groupId}`} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold uppercase tracking-widest">Get To Zero</h1>
        </div>
      </header>

      <div className="px-6 py-6 flex-1 overflow-y-auto">
        <div className="mb-8">
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Outstanding</p>
          <p className="text-4xl font-black">{formatMoney(totalOutstanding)}</p>
          <p className="text-sm font-medium text-gray-500 mt-2">{plan.length} payments to settle everyone.</p>
        </div>

        {isSimplified && (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-2xl mb-8 text-sm font-medium">
            ✨ Your group had unnecessary payment loops. We've simplified them to reduce money movement.
          </div>
        )}

        <div className="space-y-4">
          {plan.map((p: any, i: number) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                    {p.payerId.slice(0, 6)}... <span className="text-gray-400 font-normal mx-2">→</span> {p.receiverId.slice(0, 6)}...
                  </p>
                </div>
                <p className="font-bold text-xl">{formatMoney(p.amountMinor)}</p>
              </div>
              
              <button 
                onClick={() => settleMutation.mutate(p)}
                disabled={settleMutation.isPending}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
              >
                PAY {formatMoney(p.amountMinor)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
