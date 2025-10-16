"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileView from "@/components/ui/MobileView";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { externalWallets } from "@/lib/constants";
import {
  blockchainExplorerLink,
  getInitials,
  lamportsToSol,
  solToLamports,
} from "@/lib/utils";
import { useWalletStore } from "@/store/useWalletStore";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { CheckCircle, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TOKENS, TokenTypes } from "types";

const PaymentConfirmPage = () => {
  const params = useParams<{ paymentLink: string }>();

  const searchParams = useSearchParams();
  const [recipient, setRecipient] = useState(params.paymentLink);
  const [amount, setAmount] = useState("");
  const [mounted, setMounted] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<
    "wallet" | "external" | "fiat"
  >("wallet");

  const [selectedExternalWallet, setSelectedExternalWallet] = useState<
    string | null
  >(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string }>({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [response, setResponse] = useState({
    receiverAddress: "",
    signature: "",
    lamports: "",
  });
  const [showDeposit, setShowDeposit] = useState(false);

  const [fromToken, setFromToken] = useState<TokenTypes>("SOL");
  const [toToken, setToToken] = useState<TokenTypes>("SOL");

  const { publicKey, balance, walletType, fetchWallet, isCustodial } =
    useWalletStore();
  const { publicKey: extPublicKey } = useWallet();
  const { connection } = useConnection();

  const tokens = TOKENS;
  const paymentMethods = [
    { id: "wallet", label: "Wallet", desc: "Use SOL from your in-app wallet" },
    {
      id: "external",
      label: "External Wallet",
      desc: "Send via Phantom, Backpack, etc.",
    },
    { id: "fiat", label: "Fiat", desc: "Pay with card or bank" },
  ];

  const depositOptions = [
    { id: "upi", label: "UPI", desc: "Instant via UPI apps" },
    { id: "card", label: "Card", desc: "Use debit or credit card" },
    { id: "bank", label: "Bank Transfer", desc: "Direct bank transfer" },
  ];

  useEffect(() => {
    setMounted(true);
    setRecipient(params.paymentLink || "");
    setAmount(lamportsToSol(Number(searchParams.get("amount") ?? 0)) || "");
    setMsg(searchParams.get("message") || "");
  }, [params, searchParams]);

  useEffect(() => {
    if (!publicKey) fetchWallet();
  }, [publicKey, fetchWallet]);

  useEffect(() => {
    if (!mounted || !recipient) return;

    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/info/${recipient}`);
        setUserInfo(res.data.user || { name: "Unknown", email: "" });
      } catch {
        setUserInfo({ name: "Unknown", email: "" });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [mounted, recipient]);

  const handleSend = async () => {
    const solAmount = Number(amount);
    if (!solAmount || isNaN(solAmount) || solAmount <= 0)
      return alert("Enter a valid amount");
    if (!selectedMethod) return alert("Select a payment method");
    if (selectedMethod === "external" && !selectedExternalWallet)
      return alert("Select external wallet");

    const lamports = solToLamports(solAmount);
    setSending(true);

    try {
      if (selectedMethod === "wallet" && isCustodial) {
        if (fromToken === toToken) {
          const res = await api.post(
            `/transactions/send-wallet/${publicKey}/${recipient}`,
            {
              amount: lamports,
              message: msg,
              fromToken,
              toToken,
              sendViaCustodial: true,
            }
          );
          if (res.data.ok) {
            setResponse(res.data);
            setSuccess(true);
          } else alert(res.data.error || "Transaction failed");
        } else {
          const res = await api.post("/transactions/send-wallet-swap", {
            recipient,
            amount: lamports,
            message: msg,
            fromToken,
            toToken,
          });
          if (res.data.ok) {
            setResponse(res.data);
            setSuccess(true);
          } else alert(res.data.error || "Swap transaction failed");
        }
      } else {
        const walletToPay =
          selectedMethod === "external"
            ? selectedExternalWallet
            : selectedMethod === "wallet" && !isCustodial
              ? walletType
              : null;
        if (!walletToPay) return alert("Select a wallet to continue");

        let walletAdapter;

        console.log(walletToPay);
        if (walletToPay === "Phantom")
          walletAdapter = new PhantomWalletAdapter();
        else if (walletToPay === "Backpack")
          walletAdapter = new BackpackWalletAdapter();
        else return alert("Invalid wallet selected");

        await walletAdapter.connect();
        if (!walletAdapter.publicKey)
          return alert("Failed to connect to wallet");

        const recipientPubKey = new PublicKey(recipient);

        if (fromToken === toToken) {
          const tx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: walletAdapter.publicKey,
              toPubkey: recipientPubKey,
              lamports,
            })
          );

          const signature = await walletAdapter.sendTransaction(tx, connection);
          await connection.confirmTransaction(signature, "confirmed");

          setResponse({
            receiverAddress: recipient,
            signature: signature,
            lamports: lamports.toString(),
          });
          setSuccess(true);
        } else {
          const serializedTx = await api.post(
            `/transactions/send/${walletAdapter.publicKey}/${recipient}`,
            {
              amount: lamports,
              fromToken,
              toToken,
              sendViaCustodial: true,
            }
          );

          const tx = VersionedTransaction.deserialize(
            Buffer.from(serializedTx.data.transaction, "base64")
          );
          const signedTx = await (
            walletAdapter.signTransaction as (
              tx: VersionedTransaction
            ) => Promise<VersionedTransaction>
          )(tx);
          const txid = await connection.sendRawTransaction(
            signedTx.serialize()
          );
          await connection.confirmTransaction(txid, "confirmed");

          setResponse({
            receiverAddress: recipient,
            signature: txid,
            lamports: lamports.toString(),
          });
          setSuccess(true);
        }
      }
    } catch (err: any) {
      console.error("Transaction error:", err);
      if (err?.logs) console.log(err.logs);
      alert("Transaction failed. Try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <MobileView>
      <div className="flex p-0 flex-col h-full relative bg-white">
        {success && (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-20 p-8 rounded-2xl shadow-xl border border-green-100">
            <CheckCircle className="w-12 h-12 text-green-600 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Payment Sent Successfully
            </h2>
            <div className="w-full max-w-sm bg-white rounded-xl p-5 shadow-sm space-y-3 mb-6">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Recipient</span>
                <span className="font-medium text-gray-900 text-xs">
                  {userInfo.name || response.receiverAddress}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Amount</span>
                <span className="font-semibold text-gray-900 text-lg">
                  {amount} {fromToken}
                </span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                <Link
                  target="_blank"
                  href={blockchainExplorerLink(response.signature)}
                  className="text-xs text-gray-700 break-all font-mono bg-gray-50 p-2 rounded"
                >
                  {response.signature}
                </Link>
              </div>
            </div>
            <button
              className="w-full max-w-sm px-6 py-3 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white font-medium rounded-lg"
              onClick={() => setSuccess(false)}
            >
              Done
            </button>
          </div>
        )}

        <div className="p-5 bg-gray-50  rounded-sm border border-gray-100 flex items-center gap-3 mx-4 mt-4">
          <div className="w-10 h-10  rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {userInfo.name
              ? getInitials(userInfo.name)
              : recipient.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Receiver
            </p>
            {userInfo.name ? (
              <>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userInfo.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userInfo.email}
                </p>
              </>
            ) : (
              <p className="text-xs font-mono text-gray-700 break-all">
                {recipient}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 thin-scrollbar">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Amount (SOL)
            </label>
            <Input
              type="number"
              value={amount ?? 0}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 h-12 text-lg font-semibold border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {lamportsToSol(balance ?? 0)} SOL available
              </p>
              <button
                onClick={() => setShowDeposit(!showDeposit)}
                className="text-xs text-blue-600 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Deposit
              </button>
            </div>
            {showDeposit && (
              <div className="mt-2 space-y-2">
                {depositOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">
              Message (optional)
            </label>
            <Textarea
              value={msg ?? ""}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Add a note..."
              className="mt-1 w-full h-12 resize-none border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">
              From Token
            </label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {Object.keys(tokens).map((t) => (
                <button
                  key={t}
                  onClick={() => setFromToken(t as "SOL" | "BONK")}
                  className={`px-4 py-2 rounded-xl border ${
                    fromToken === t
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">
              To Token
            </label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {Object.keys(tokens).map((t) => (
                <button
                  key={t}
                  onClick={() => setToToken(t as "SOL" | "BONK")}
                  className={`px-4 py-2 rounded-xl border ${
                    toToken === t
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">
              Payment Method
            </label>
            <div className="mt-2 space-y-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() =>
                    setSelectedMethod(m.id as "wallet" | "external" | "fiat")
                  }
                  className={`w-full text-left px-4 py-3 rounded-xl border ${
                    selectedMethod === m.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedMethod === "external" && (
            <div>
              <label className="text-xs font-medium text-gray-500">
                Select External Wallet
              </label>
              <div className="mt-2 space-y-2">
                {externalWallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedExternalWallet(w.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border ${
                      selectedExternalWallet === w.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {w.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <Button
            onClick={handleSend}
            disabled={sending}
            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-b from-[#0f172a] to-[#1e293b]"
          >
            {sending ? "Processing..." : "Confirm & Send"}
          </Button>
        </div>
      </div>
    </MobileView>
  );
};

export default PaymentConfirmPage;
