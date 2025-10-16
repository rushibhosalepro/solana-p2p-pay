"use client";
import { api } from "@/lib/api";
import { create } from "zustand";

interface WalletState {
  publicKey: string | null;
  balance: number | null;
  eqDoller: number | null;
  isCustodial: boolean | null;
  loading: "idle" | "loading" | "completed";
  walletType: string;
  error: string | null;
  setWallet: (data: {
    publicKey: string | null;
    isCustodial: boolean;
    walletType: string;
  }) => void;
  setBalance: (balance: number) => void;
  setEqDoller: (eqDoller: number) => void;
  resetWallet: () => void;
  fetchBalance: () => Promise<void>;
  fetchWallet: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  publicKey: null,
  balance: null,
  eqDoller: null,
  isCustodial: null,
  loading: "idle",
  error: null,
  walletType: "",

  setWallet: ({ publicKey, isCustodial, walletType }) =>
    set({ publicKey, isCustodial, walletType }),

  setEqDoller: (eqDoller) => set({ eqDoller }),

  setBalance: (balance) => set({ balance }),

  resetWallet: () =>
    set({
      publicKey: null,
      balance: null,
      isCustodial: null,
      error: null,
      walletType: "",
    }),

  fetchBalance: async () => {
    const { publicKey } = get();
    if (!publicKey) {
      set({ error: "No publicKey available", loading: "completed" });
      return;
    }

    set({ loading: "loading", error: null });
    try {
      const res = await api.get(`/wallet/balance/${publicKey}`);

      set({
        balance: res.data.balance,
        loading: "completed",
      });
    } catch (err: any) {
      set({
        error: err.message || "Failed to load wallet balance",
        loading: "completed",
      });
    }
  },

  fetchWallet: async () => {
    set({ loading: "loading", error: null });
    try {
      const res = await api.get("/wallet/info");
      const { publicKey, isCustodial, balance, walletType } = res.data;
      set({
        publicKey,
        isCustodial,
        balance,
        loading: "completed",
        walletType,
      });
    } catch (err: any) {
      set({
        error: err.message || "Failed to fetch wallet",
        loading: "completed",
      });
    }
  },
}));
