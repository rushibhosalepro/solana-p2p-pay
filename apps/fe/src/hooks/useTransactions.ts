"use client";
import { api } from "@/lib/api";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const useTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { user } = useUser();
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await api.get(`/transactions`);
        setTransactions(response.data.transactions);
        setLoading(false);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    if (!user) return;
    fetchTransaction();
    let intervalId = setInterval(fetchTransaction, 1000 * 60 * 1);
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);
  return { transactions };
};

export default useTransactions;
