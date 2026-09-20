"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Activity, User, Plus, Contact } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/groups", icon: Users, label: "Groups" },
  { href: "FAB", isFab: true },
  { href: "/friends", icon: Contact, label: "Friends" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center px-2 z-50">
      {NAV_ITEMS.map((item, idx) => {
        if (item.isFab) {
          return (
            <div key="fab" className="relative -top-5">
              <button
                className="bg-black dark:bg-white text-white dark:text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                onClick={() => {
                  // Open Add Expense Sheet
                  window.dispatchEvent(new CustomEvent("open-add-expense"));
                }}
              >
                <Plus size={28} />
              </button>
            </div>
          );
        }

        const Icon = item.icon!;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
              isActive ? "text-black dark:text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
