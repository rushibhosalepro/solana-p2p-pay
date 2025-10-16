"use client";
import { useWalletStore } from "@/store/useWalletStore";
import axios from "axios";
import { useEffect } from "react";

const useSolanaLivePrice = () => {
  const { setEqDoller, balance } = useWalletStore();

  useEffect(() => {
    const fetchSolanaPrice = async () => {
      try {
        const res = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        );
        setEqDoller(res.data.solana.usd);
      } catch (error) {
        console.error("Error fetching Solana price:", error);
      }
    };

    if (!balance || balance == 0) return;
    fetchSolanaPrice();
    const interval = setInterval(fetchSolanaPrice, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, [balance]);

  return null;
};

export default useSolanaLivePrice;
