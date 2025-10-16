"use client";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileView from "@/components/ui/MobileView";
import { api } from "@/lib/api";
import {
  blockchainExplorerLink,
  getFormatedDate,
  getInitials,
  lamportsToSol,
  solToLamports,
} from "@/lib/utils";
import { useWalletStore } from "@/store/useWalletStore";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type User = {
  name?: string;
  email?: string;
  phone?: string;
  publicKey: string;
};
const ToAddressPage = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const toAddress = params?.toAddress;
  const router = useRouter();
  const { publicKey, balance } = useWalletStore();
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transactions]);

  useEffect(() => {
    if (!toAddress || !publicKey) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, txRes] = await Promise.all([
          api.get(`/users/info/${toAddress}`),
          api.get(`/transactions/between/${publicKey}/${toAddress}`),
        ]);
        setUserInfo(userRes.data.user);
        if (txRes.data.ok) setTransactions(txRes.data.transactions);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toAddress, publicKey]);

  const handleSend = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      alert("Enter a valid amount greater than zero");
      return;
    }

    if (balance && solToLamports(numericAmount) > balance) {
      alert("Balance is low");
      return;
    }
    try {
      router.push(
        `/send/confirm/${toAddress}?amount=${solToLamports(numericAmount)}`
      );
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  if (loading) {
    return (
      <MobileView>
        <div className="w-full h-full flex items-center justify-center">
          <Loader size={20} />
        </div>
      </MobileView>
    );
  }

  return (
    <MobileView>
      <div className="w-full h-full relative">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <button
              className="p-2 -ml-2 cursor-pointer rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getInitials(
                  userInfo?.name ? userInfo.name : userInfo?.publicKey
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold max-w-[220px] truncate text-gray-900">
                  {userInfo?.name ? userInfo.name : userInfo?.publicKey}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userInfo?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 thin-scrollbar overflow-y-auto h-[80%] px-6 pb-16 pt-3 space-y-3 scroll-smooth"
        >
          {transactions.length > 0 ? (
            transactions.map((tx) => {
              const sent = publicKey == tx.fromAddress ? true : false;
              const blockchainLink = tx.txHash
                ? blockchainExplorerLink(tx.hash)
                : null;

              return (
                <div
                  key={tx.id}
                  className={`flex ${sent ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-xs px-4 py-3 rounded-2xl bg-gray-100 text-gray-900">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs opacity-70">
                        {sent ? "You paid" : "You received"}
                      </span>
                    </div>
                    <p className="text-xl font-bold mt-1">
                      {lamportsToSol(tx.amount)} SOL
                    </p>
                    {tx.msg && (
                      <p className="text-xs mt-1 italic text-gray-500">
                        {tx.msg}
                      </p>
                    )}

                    <p className="text-xs mt-1 font-medium text-gray-800">
                      fee {lamportsToSol(tx.metadata.fee)} sol
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      {getFormatedDate(tx.blockTime)}
                    </p>
                    {blockchainLink && (
                      <Link
                        href={blockchainLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline mt-1 block"
                      >
                        View on Solana Explorer
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-400 text-center">
                no previous transactions
              </p>
            </div>
          )}
        </div>

        <div className="p-4 absolute z-99 bottom-0 left-0 w-full bg-white gap-2   border-t border-gray-100 ">
          <p className="text-xs mb-1 ml-1 text-gray-400">
            Available: {lamportsToSol(balance ?? 0)} SOL
          </p>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              placeholder="Enter amount (SOL)"
              className="h-12 text-lg font-semibold border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              onClick={handleSend}
              className="h-12 text-lg  cursor-pointer border-none rounded-md "
              variant={"default"}
            >
              {/* <Send className="w-6 h-6 [&_svg]:size-10" /> */}
              Pay
            </Button>
          </div>
        </div>
      </div>
    </MobileView>
  );
};

export default ToAddressPage;
