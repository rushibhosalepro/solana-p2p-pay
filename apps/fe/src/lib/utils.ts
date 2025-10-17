import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import currencyFormatter from "currency-formatter";
import { twMerge } from "tailwind-merge";

import { formatDistanceToNow } from "date-fns";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const solToLamports = (sol: number) =>
  Math.floor(sol * LAMPORTS_PER_SOL);

export const lamportsToSol = (
  lamports: number | bigint,
  decimals = 9
): string => {
  const sol = Number(lamports) / LAMPORTS_PER_SOL;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(sol);
};

export const formatUSD = (value: number) => {
  return currencyFormatter.format(value, {
    code: "USD",
    precision: value < 1 ? 3 : 2,
  });
};

export const getInitials = (name: string | null | undefined) => {
  if (!name) return "";
  return name?.[0].toUpperCase();
};

export const blockchainExplorerLink = (txn: string) => {
  return `https://explorer.solana.com/tx/${txn}?cluster=devnet`;
};

export const getFormatedDate = (date: string) => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
  });
};
