"use client";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import useSolanaLivePrice from "@/hooks/useLivePrice";
import { useWalletStore } from "@/store/useWalletStore";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode, useEffect } from "react";

const ProviderWrapper = ({ children }: { children: ReactNode }) => {
  const { fetchWallet, publicKey, fetchBalance } = useWalletStore();
  useSolanaLivePrice();
  useEffect(() => {
    if (!publicKey) fetchWallet();
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey) return;
    const id = setInterval(fetchBalance, 1000 * 60);
    return () => {
      clearInterval(id);
    };
  }, [publicKey]);
  console.log(publicKey);
  return (
    <ClerkProvider>
      <SolanaWalletProvider>{children}</SolanaWalletProvider>
    </ClerkProvider>
  );
};

export default ProviderWrapper;
