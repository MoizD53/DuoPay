"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Search, UserPlus, Check, X, User } from "lucide-react";
import { toast } from "sonner";

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: network } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiFetch<any>("/api/friends"),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["friends", "search", searchQuery],
    queryFn: () => apiFetch<any[]>(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 3,
  });

  const sendRequest = useMutation({
    mutationFn: (receiverId: string) => 
      apiFetch("/api/friends/request", { method: "POST", body: JSON.stringify({ receiverId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request sent!");
    },
    onError: () => toast.error("Failed to send request"),
  });

  const acceptRequest = useMutation({
    mutationFn: (requestId: string) => 
      apiFetch("/api/friends/accept", { method: "POST", body: JSON.stringify({ requestId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
    onError: () => toast.error("Failed to accept request"),
  });

  const friends = network?.friends || [];
  const incoming = network?.incomingRequests || [];
  const sent = network?.sentRequests || [];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <header className="px-6 py-8 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-900 sticky top-0 z-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Friends</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-2xl py-4 pl-12 pr-4 outline-none font-medium text-gray-900 dark:text-white"
          />
        </div>
      </header>

      <div className="px-6 py-6 flex-1 overflow-y-auto no-scrollbar space-y-8">
        
        {/* Search Results */}
        {searchQuery.length >= 3 && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Search Results</h2>
            <div className="space-y-3">
              {searchResults?.length === 0 ? (
                <p className="text-gray-500 text-sm">No users found.</p>
              ) : (
                searchResults?.map((user) => {
                  const isFriend = friends.some((f: any) => f.id === user.id);
                  const isPending = sent.some((s: any) => s.receiverId === user.id);
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                          {user.name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      {isFriend ? (
                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold">
                          <Check size={14} /> Friends
                        </div>
                      ) : isPending ? (
                        <div className="text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-bold">
                          Requested
                        </div>
                      ) : (
                        <button 
                          onClick={() => sendRequest.mutate(user.id)}
                          disabled={sendRequest.isPending}
                          className="w-8 h-8 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-full"
                        >
                          <UserPlus size={16} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* Incoming Requests */}
        {incoming.length > 0 && !searchQuery && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Friend Requests</h2>
            <div className="space-y-3">
              {incoming.map((req: any) => (
                <div key={req.requestId} className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {req.sender.name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{req.sender.name}</p>
                      <p className="text-xs text-gray-500">Wants to be friends</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => acceptRequest.mutate(req.requestId)}
                      className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-sm font-bold"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Friends List */}
        {!searchQuery && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">My Friends</h2>
            {friends.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <User size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No friends yet.</p>
                <p className="text-gray-400 text-sm mt-1">Search for their email above to add them.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend: any) => (
                  <div key={friend.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                      {friend.name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{friend.name}</p>
                      <p className="text-sm text-gray-500">{friend.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
