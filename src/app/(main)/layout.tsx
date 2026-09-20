import { BottomNav } from "@/components/layout/BottomNav";
import { AddExpenseSheet } from "@/components/expense/AddExpenseSheet";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden pb-16">
        {children}
      </main>
      <BottomNav />
      <AddExpenseSheet />
    </>
  );
}
