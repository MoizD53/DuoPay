"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { v4 as uuidv4 } from "uuid";
import { AnimatePresence, motion } from "framer-motion";

export function AddExpenseSheet() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [groupId, setGroupId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => apiFetch<any[]>("/api/groups"),
    enabled: isOpen,
  });

  // Fetch members of selected group
  const { data: members = [] } = useQuery({
    queryKey: ["groups", groupId, "members"],
    queryFn: () => apiFetch<any[]>(`/api/groups/${groupId}/members`),
    enabled: !!groupId && isOpen,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: any) => {
      return apiFetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: {
          "Idempotency-Key": uuidv4(),
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      close();
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Your expense wasn't saved, so no money was changed.");
    }
  });

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-add-expense", handleOpen);
    return () => window.removeEventListener("open-add-expense", handleOpen);
  }, []);

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep(1);
      setAmount("");
      setTitle("");
      setGroupId("");
      setErrorMsg("");
      setSelectedMembers([]);
    }, 300);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const submitExpense = () => {
    if (selectedMembers.length === 0) {
      setErrorMsg("Please select at least one participant.");
      return;
    }

    const amountMinor = Math.round(Number(amount) * 100);
    const splitAmount = Math.floor(amountMinor / selectedMembers.length);
    const remainder = amountMinor % selectedMembers.length;

    // Assumes logged in user is paying for simplicity, or select the first member
    const paidById = selectedMembers[0]; 

    const splits = selectedMembers.map((userId, idx) => ({
      userId,
      amountMinor: splitAmount + (idx < remainder ? 1 : 0),
      splitType: "EQUAL"
    }));
    
    mutate({
      title,
      amountMinor,
      currency: "INR",
      paidById,
      splits
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" 
            onClick={close} 
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[90vh] bg-white dark:bg-black rounded-t-[2rem] z-50 flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800"
          >
            <div className="flex justify-center pt-3 pb-2 w-full absolute top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-t-[2rem]">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>

            <div className="px-6 pb-4 pt-10 flex items-center justify-between border-b border-gray-100 dark:border-gray-900 shrink-0">
              <h2 className="text-xl font-bold tracking-tight">Add Expense</h2>
              <button onClick={close} className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full active:scale-95 transition-transform">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 fade-in animate-in">
              <div className="w-full bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl mb-8">
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>✨</span> Just tell DuoPay
                </p>
                <textarea 
                  className="w-full bg-transparent outline-none resize-none text-lg font-medium placeholder:text-gray-400"
                  placeholder="I paid 2400 for dinner for me, Hatim and Ali..."
                  rows={3}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const val = (e.target as HTMLTextAreaElement).value;
                      if (!val || !groupId) {
                        setErrorMsg("Please select a group and type something first.");
                        return;
                      }
                      
                      try {
                        const res = await apiFetch<any>('/api/expenses/parse', {
                          method: 'POST',
                          body: JSON.stringify({ text: val })
                        });
                        
                        setAmount((res.amountMinor / 100).toString());
                        setTitle(res.description);
                        
                        // Try to map extracted names to real UUIDs based on 'members' array
                        const matchedIds: string[] = [];
                        res.participantNames.forEach((name: string) => {
                          const m = members.find(mbr => 
                            mbr.user.name.toLowerCase().includes(name.toLowerCase()) || 
                            (name === 'me' && mbr.user.id === members[0]?.user.id) // simplistic me matching
                          );
                          if (m) matchedIds.push(m.user.id);
                        });
                        
                        if (matchedIds.length > 0) {
                          setSelectedMembers(matchedIds);
                        } else {
                          setSelectedMembers(members.map(m => m.user.id));
                        }
                        
                        setStep(3); // Skip straight to review
                      } catch (err: any) {
                        setErrorMsg("Could not understand that. " + err.message);
                      }
                    }
                  }}
                ></textarea>
                <p className="text-xs text-gray-500 mt-2">Press enter to preview. (Select group first below)</p>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 block">Group</label>
                <select 
                  className="w-full bg-gray-100 dark:bg-gray-900 rounded-xl p-4 font-medium outline-none mb-6"
                  value={groupId}
                  onChange={(e) => {
                    setGroupId(e.target.value);
                    setSelectedMembers([]);
                  }}
                >
                  <option value="" disabled>Select Group</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="w-full flex items-center gap-4 py-4">
                <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                <span className="text-gray-400 font-semibold text-sm uppercase">OR ENTER MANUALLY</span>
                <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
              </div>

              <div className="flex items-center text-6xl font-bold text-gray-900 dark:text-gray-100 mt-4">
                <span className="text-4xl mr-2 text-gray-400">₹</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="bg-transparent outline-none w-[200px] text-center"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!amount || !groupId}
                className={cn(
                  "w-full max-w-[200px] py-4 rounded-full font-bold transition-all",
                  amount && groupId ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                )}
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col space-y-6 fade-in animate-in">
              <div>
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 block">What was it for?</label>
                <input 
                  type="text"
                  placeholder="Dinner, Taxi, etc."
                  className="w-full text-2xl font-semibold bg-transparent border-b-2 border-gray-200 dark:border-gray-800 focus:border-black dark:focus:border-white outline-none py-2 transition-colors"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              
              {groupId && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Split Between</label>
                    <button 
                      onClick={() => setSelectedMembers(members.map(m => m.user.id))}
                      className="text-sm text-blue-600 font-medium"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="space-y-2 border border-gray-200 dark:border-gray-800 rounded-xl p-2">
                    {members.map(m => (
                      <div 
                        key={m.user.id} 
                        onClick={() => toggleMember(m.user.id)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                          selectedMembers.includes(m.user.id) ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black" : "border-gray-300 dark:border-gray-700"
                        )}>
                          {selectedMembers.includes(m.user.id) && <Check size={14} />}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{m.user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 mt-auto">
                <button 
                  onClick={() => setStep(3)}
                  disabled={!title || !groupId || selectedMembers.length === 0}
                  className={cn(
                    "w-full py-4 rounded-full font-bold transition-all",
                    title && groupId && selectedMembers.length > 0 ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Review Summary
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col space-y-6 fade-in animate-in">
              <div className="text-center mb-4">
                <p className="text-2xl font-bold">{title}</p>
                <p className="text-gray-500">₹{amount}</p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-5 flex-1">
                <p className="font-semibold mb-4">Final Split Plan</p>
                <div className="space-y-4">
                  {selectedMembers.map((id, idx) => {
                    const member = members.find(m => m.user.id === id);
                    const amountMinor = Math.round(Number(amount) * 100);
                    const splitAmount = Math.floor(amountMinor / selectedMembers.length) + (idx < (amountMinor % selectedMembers.length) ? 1 : 0);
                    return (
                      <div key={id} className="flex justify-between items-center">
                        <span className="font-medium">{member?.user?.name || "Unknown"}</span>
                        <span className="text-gray-500 font-medium">₹{(splitAmount / 100).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button 
                  onClick={submitExpense}
                  disabled={isPending}
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="animate-spin" />}
                  {isPending ? "Confirming..." : "Confirm Expense"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  );
}
