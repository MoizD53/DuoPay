import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amountMinor: number, currency = "INR") {
  // Minor units to major (e.g. paise to rupees)
  const amountMajor = amountMinor / 100;
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMajor);
}

export function formatMoneyNoSymbol(amountMinor: number) {
  const amountMajor = amountMinor / 100;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMajor);
}
