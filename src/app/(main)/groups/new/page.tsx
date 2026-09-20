"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewGroupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const { data: network } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiFetch<any>("/api/friends"),
  });

  const createGroup = useMutation({
    mutationFn: (data: { name: string; memberIds: string[] }) =>
      apiFetch("/api/groups", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created!");
      router.push(`/groups/${res.group.id}`);
    },
    onError: () => toast.error("Failed to create group"),
  });

  const friends = network?.friends || [];

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    createGroup.mutate({ name, memberIds: selectedFriends });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <header className="px-4 pt-12 pb-4 bg-white dark:bg-gray-950 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-900 flex items-center gap-4">
        <Link href="/groups" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">New Group</h1>
      </header>

      <div className="px-6 py-6 flex-1 overflow-y-auto no-scrollbar space-y-8">
        <section>
          <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 block">Group Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Goa Trip, Apartment"
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 outline-none font-bold text-xl"
          />
        </section>

        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Add Friends</h2>
            <Link href="/friends" className="text-sm font-semibold text-blue-600 dark:text-blue-400">Add New</Link>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            {friends.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                You haven't added any friends yet.
              </div>
            ) : (
              friends.map((friend: any) => {
                const isSelected = selectedFriends.includes(friend.id);
                return (
                  <div 
                    key={friend.id} 
                    onClick={() => toggleFriend(friend.id)}
                    className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {friend.name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{friend.name}</p>
                        <p className="text-xs text-gray-500">{friend.email}</p>
                      </div>
                    </div>
                    
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" 
                        : "border-gray-300 dark:border-gray-700"
                    }`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900 sticky bottom-0">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || createGroup.isPending}
          className="w-full bg-black dark:bg-white text-white dark:text-black font-bold rounded-2xl py-4 active:scale-95 transition-transform disabled:opacity-50"
        >
          {createGroup.isPending ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
}
