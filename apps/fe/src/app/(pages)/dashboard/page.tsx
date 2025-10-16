"use client";

import { Button } from "@/components/ui/button";
import MobileView from "@/components/ui/MobileView";
import WalletNotFound from "@/components/WalletNotFound";
import useTransactions from "@/hooks/useTransactions";
import { formatUSD, lamportsToSol } from "@/lib/utils";
import { useWalletStore } from "@/store/useWalletStore";
import { UserButton, useUser } from "@clerk/nextjs";
import { ArrowDownLeft, ArrowUpRight, Bell, Check, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
const NotificationCard = () => {
  return (
    <div className="cursor-pointer">
      <Bell className="w-5 h-5 text-white opacity-80" />
    </div>
  );
};

const BalanceCard = ({
  userName,
  balance,
  eqDoller,
  publicKey,
}: {
  userName: string;
  balance: number;
  eqDoller: number;
  publicKey: string | null;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!publicKey) return;
    setCopied(true);
    navigator.clipboard.writeText(publicKey);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };
  const actions = [
    {
      name: "Scan QR",
      route: "/qr",
      icon: (
        <svg
          className="[&_svg]:size-8 w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 21H4C3.73478 21 3.48043 20.8946 3.29289 20.7071C3.10536 20.5196 3 20.2652 3 20V16C3 15.7348 2.89464 15.4804 2.70711 15.2929C2.51957 15.1054 2.26522 15 2 15C1.73478 15 1.48043 15.1054 1.29289 15.2929C1.10536 15.4804 1 15.7348 1 16V20C1 20.7956 1.31607 21.5587 1.87868 22.1213C2.44129 22.6839 3.20435 23 4 23H8C8.26522 23 8.51957 22.8946 8.70711 22.7071C8.89464 22.5196 9 22.2652 9 22C9 21.7348 8.89464 21.4804 8.70711 21.2929C8.51957 21.1054 8.26522 21 8 21V21ZM22 15C21.7348 15 21.4804 15.1054 21.2929 15.2929C21.1054 15.4804 21 15.7348 21 16V20C21 20.2652 20.8946 20.5196 20.7071 20.7071C20.5196 20.8946 20.2652 21 20 21H16C15.7348 21 15.4804 21.1054 15.2929 21.2929C15.1054 21.4804 15 21.7348 15 22C15 22.2652 15.1054 22.5196 15.2929 22.7071C15.4804 22.8946 15.7348 23 16 23H20C20.7956 23 21.5587 22.6839 22.1213 22.1213C22.6839 21.5587 23 20.7956 23 20V16C23 15.7348 22.8946 15.4804 22.7071 15.2929C22.5196 15.1054 22.2652 15 22 15ZM20 1H16C15.7348 1 15.4804 1.10536 15.2929 1.29289C15.1054 1.48043 15 1.73478 15 2C15 2.26522 15.1054 2.51957 15.2929 2.70711C15.4804 2.89464 15.7348 3 16 3H20C20.2652 3 20.5196 3.10536 20.7071 3.29289C20.8946 3.48043 21 3.73478 21 4V8C21 8.26522 21.1054 8.51957 21.2929 8.70711C21.4804 8.89464 21.7348 9 22 9C22.2652 9 22.5196 8.89464 22.7071 8.70711C22.8946 8.51957 23 8.26522 23 8V4C23 3.20435 22.6839 2.44129 22.1213 1.87868C21.5587 1.31607 20.7956 1 20 1V1ZM2 9C2.26522 9 2.51957 8.89464 2.70711 8.70711C2.89464 8.51957 3 8.26522 3 8V4C3 3.73478 3.10536 3.48043 3.29289 3.29289C3.48043 3.10536 3.73478 3 4 3H8C8.26522 3 8.51957 2.89464 8.70711 2.70711C8.89464 2.51957 9 2.26522 9 2C9 1.73478 8.89464 1.48043 8.70711 1.29289C8.51957 1.10536 8.26522 1 8 1H4C3.20435 1 2.44129 1.31607 1.87868 1.87868C1.31607 2.44129 1 3.20435 1 4V8C1 8.26522 1.10536 8.51957 1.29289 8.70711C1.48043 8.89464 1.73478 9 2 9ZM10 5H6C5.73478 5 5.48043 5.10536 5.29289 5.29289C5.10536 5.48043 5 5.73478 5 6V10C5 10.2652 5.10536 10.5196 5.29289 10.7071C5.48043 10.8946 5.73478 11 6 11H10C10.2652 11 10.5196 10.8946 10.7071 10.7071C10.8946 10.5196 11 10.2652 11 10V6C11 5.73478 10.8946 5.48043 10.7071 5.29289C10.5196 5.10536 10.2652 5 10 5ZM9 9H7V7H9V9ZM14 11H18C18.2652 11 18.5196 10.8946 18.7071 10.7071C18.8946 10.5196 19 10.2652 19 10V6C19 5.73478 18.8946 5.48043 18.7071 5.29289C18.5196 5.10536 18.2652 5 18 5H14C13.7348 5 13.4804 5.10536 13.2929 5.29289C13.1054 5.48043 13 5.73478 13 6V10C13 10.2652 13.1054 10.5196 13.2929 10.7071C13.4804 10.8946 13.7348 11 14 11ZM15 7H17V9H15V7ZM10 13H6C5.73478 13 5.48043 13.1054 5.29289 13.2929C5.10536 13.4804 5 13.7348 5 14V18C5 18.2652 5.10536 18.5196 5.29289 18.7071C5.48043 18.8946 5.73478 19 6 19H10C10.2652 19 10.5196 18.8946 10.7071 18.7071C10.8946 18.5196 11 18.2652 11 18V14C11 13.7348 10.8946 13.4804 10.7071 13.2929C10.5196 13.1054 10.2652 13 10 13ZM9 17H7V15H9V17ZM14 16C14.2652 16 14.5196 15.8946 14.7071 15.7071C14.8946 15.5196 15 15.2652 15 15C15.2652 15 15.5196 14.8946 15.7071 14.7071C15.8946 14.5196 16 14.2652 16 14C16 13.7348 15.8946 13.4804 15.7071 13.2929C15.5196 13.1054 15.2652 13 15 13H14C13.7348 13 13.4804 13.1054 13.2929 13.2929C13.1054 13.4804 13 13.7348 13 14V15C13 15.2652 13.1054 15.5196 13.2929 15.7071C13.4804 15.8946 13.7348 16 14 16ZM18 13C17.7348 13 17.4804 13.1054 17.2929 13.2929C17.1054 13.4804 17 13.7348 17 14V17C16.7348 17 16.4804 17.1054 16.2929 17.2929C16.1054 17.4804 16 17.7348 16 18C16 18.2652 16.1054 18.5196 16.2929 18.7071C16.4804 18.8946 16.7348 19 17 19H18C18.2652 19 18.5196 18.8946 18.7071 18.7071C18.8946 18.5196 19 18.2652 19 18V14C19 13.7348 18.8946 13.4804 18.7071 13.2929C18.5196 13.1054 18.2652 13 18 13ZM14 17C13.8022 17 13.6089 17.0586 13.4444 17.1685C13.28 17.2784 13.1518 17.4346 13.0761 17.6173C13.0004 17.8 12.9806 18.0011 13.0192 18.1951C13.0578 18.3891 13.153 18.5673 13.2929 18.7071C13.4327 18.847 13.6109 18.9422 13.8049 18.9808C13.9989 19.0194 14.2 18.9996 14.3827 18.9239C14.5654 18.8482 14.7216 18.72 14.8315 18.5556C14.9414 18.3911 15 18.1978 15 18C15 17.7348 14.8946 17.4804 14.7071 17.2929C14.5196 17.1054 14.2652 17 14 17Z"
            fill="black"
          />
        </svg>
      ),
    },
    {
      name: "Send",
      route: "/send",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="[&_svg]:size-8 w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.1002 18.5786H4.50048C3.17502 18.5786 2.10051 17.5041 2.10048 16.1787L2.10022 7.17885C2.10018 5.85334 3.17471 4.77878 4.50022 4.77878H18.8997C20.2252 4.77878 21.2997 5.85267 21.2997 7.17819L21.2998 11.3788M2.69976 8.97863H20.6998M17.0998 16.2212L19.554 13.7786M19.554 13.7786L21.8998 16.1108M19.554 13.7786L19.554 19.2212"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },

    {
      name: "Withdraw",
      route: "/withdraw",
      icon: (
        <svg
          className="[&_svg]:size-8 w-6 h-6"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.6 13.6V10.9313M7.93333 13.6V10.9313M13.2667 13.6V10.9313M18.6 13.6V10.9313M1 17H20.2V20.2H1V17ZM1 7.4V5.26667L10.2055 1L20.2 5.26667V7.4H1Z"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },

    {
      name: "Add",
      route: "/deposit",
      icon: (
        <svg
          className="[&_svg]:size-8 w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 7.20001L12 16.8M16.8 12L7.20001 12"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full p-6 rounded-b-3xl bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white shadow-xl overflow-hidden">
      <header className="flex items-center mb-8 justify-between">
        <div>
          <p className="text-sm text-gray-300">Welcome back,</p>
          <p className="text-lg font-semibold">{userName}</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCard />
          <UserButton />
        </div>
      </header>
      <div className="mb-8 flex flex-col items-center ">
        <div className="flex items-center justify-center w-full max-w-[200px] bg-white/10 rounded-sm h-6 mb-2">
          <p className="text-[10px] font-medium truncate text-gray-200/60 pl-1">
            {publicKey || "No wallet connected"}
          </p>
          <Button
            size="sm"
            variant="ghost"
            className={`h-6 w-6 p-0 flex items-center justify-center  hover:bg-transparent cursor-pointer ${
              copied ? "text-green-400" : "text-gray-300 hover:text-gray-500 "
            }`}
            onClick={handleCopy}
            disabled={copied}
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>

        <div className="text-5xl font-semibold tracking-tight mb-1 font-sans">
          {lamportsToSol(balance)}
        </div>
        <p>{formatUSD(eqDoller * Number(lamportsToSol(balance)))}</p>
        <p className="text-sm opacity-70">Account Balance (SOL)</p>
      </div>

      <div className="flex items-center justify-between px-6">
        {actions.map((action) => (
          <Link
            href={action.route}
            key={action.name}
            className="flex flex-col items-center text-center text-sm font-medium cursor-pointer"
          >
            <div className=" bg-white bg-opacity-20 w-12 h-12 rounded-full flex items-center justify-center mb-1 hover:bg-opacity-30 transition">
              <span className="text-lg">{action.icon}</span>
            </div>
            {action.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

const TransactionHistory = () => {
  const { transactions } = useTransactions();

  return (
    <div className=" w-full overflow-hidden">
      <div className="flex justify-between items-center p-4 ">
        <h2 className="text-gray-800 font-semibold text-base">Transactions</h2>
        <button className="text-blue-600 text-sm font-medium hover:underline">
          See all
        </button>
      </div>

      <div className="max-h-60 overflow-hidden p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {transactions.length == 0 && (
          <p className="text-center mt-5 text-gray-400">
            no recent transactions
          </p>
        )}
        {transactions.map((txn) => {
          const amount = BigInt(txn.amount);
          const user = txn.type === "RECEIVE" ? txn.fromUser : txn.toUser;
          const address =
            txn.type === "RECEIVE" ? txn.fromAddress : txn.toAddress;
          return (
            <Link
              href={`/send/${address}`}
              key={txn.id}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {txn.type === "RECEIVE" ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-base text-gray-800 truncate block max-w-[180px] overflow-hidden">
                    {user ? user : address}
                  </span>
                  <span className="text-xs text-gray-500">{txn.date}</span>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  txn.type === "SEND" ? "text-red-500" : "text-green-600"
                }`}
              >
                {txn.type === "SEND"
                  ? `-$${lamportsToSol(amount)}`
                  : `+$${lamportsToSol(amount)}`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { publicKey, balance, eqDoller, isCustodial, fetchWallet, loading } =
    useWalletStore();
  const { user } = useUser();
  console.log(publicKey);
  return (
    <MobileView>
      <BalanceCard
        balance={balance ?? 0}
        eqDoller={eqDoller ?? 0}
        publicKey={publicKey}
        userName={user?.firstName ?? ""}
      />
      <TransactionHistory />

      {loading == "completed" && !publicKey && <WalletNotFound />}
    </MobileView>
  );
};

export default DashboardPage;
