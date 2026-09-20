"use client";

import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, Monitor, Bell, Shield, Wallet, ChevronRight, Edit3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUpi, setEditUpi] = useState("");

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<any>("/api/me"),
  });

  useEffect(() => {
    if (user && !isEditing) {
      setEditName(user.name || "");
      setEditUpi(user.upiId || "");
    }
  }, [user, isEditing]);

  const updateProfile = useMutation({
    mutationFn: (data: { name: string; upiId: string }) => 
      apiFetch("/api/me/profile", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setIsEditing(false);
      toast.success("Profile updated");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <header className="px-6 pt-12 pb-8 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-900">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 flex items-center justify-center font-bold text-2xl uppercase">
            {user?.name?.[0] || "?"}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-2xl font-bold tracking-tight bg-transparent border-b border-gray-300 dark:border-gray-700 outline-none w-full"
                placeholder="Your Name"
              />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight">{user?.name || "Loading..."}</h1>
            )}
            <p className="text-gray-500">{user?.email || "..."}</p>
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Edit3 size={18} />
            </button>
          )}
        </div>
      </header>

      <div className="px-6 py-6 flex-1 overflow-y-auto no-scrollbar space-y-8">
        
        {isEditing && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Edit Profile</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">UPI ID (Optional)</label>
                <input 
                  value={editUpi}
                  onChange={(e) => setEditUpi(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 outline-none font-medium"
                  placeholder="e.g. name@upi"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => updateProfile.mutate({ name: editName, upiId: editUpi })}
                  disabled={updateProfile.isPending}
                  className="flex-1 py-3 font-semibold rounded-xl bg-black dark:bg-white text-white dark:text-black disabled:opacity-50"
                >
                  {updateProfile.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </section>
        )}

        {!isEditing && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">UPI Details</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="font-semibold">{user?.upiId ? "Your UPI ID" : "No UPI configured"}</p>
                  {user?.upiId && <p className="text-sm text-gray-500">{user.upiId}</p>}
                </div>
              </div>
              <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {user?.upiId ? "Edit" : "Add"}
              </button>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Settings</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-gray-500" />
                <span className="font-medium">Notifications</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon size={20} className="text-gray-500" /> : 
                 theme === "light" ? <Sun size={20} className="text-gray-500" /> : 
                 <Monitor size={20} className="text-gray-500" />}
                <span className="font-medium">Theme</span>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button onClick={() => setTheme('light')} className={`px-3 py-1 rounded-md text-sm ${theme === 'light' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}>Light</button>
                <button onClick={() => setTheme('dark')} className={`px-3 py-1 rounded-md text-sm ${theme === 'dark' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}>Dark</button>
                <button onClick={() => setTheme('system')} className={`px-3 py-1 rounded-md text-sm ${theme === 'system' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}>System</button>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-gray-500" />
                <span className="font-medium">Privacy & Security</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </div>

          </div>
        </section>

        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-semibold rounded-2xl py-4 flex justify-center items-center gap-2 active:scale-95 transition-transform"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}
