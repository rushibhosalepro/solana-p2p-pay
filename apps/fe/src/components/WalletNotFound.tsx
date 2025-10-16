"use client";
import { api } from "@/lib/api";

import { useUser } from "@clerk/nextjs";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useState } from "react";

import { externalWallets } from "@/lib/constants";
import { useWalletStore } from "@/store/useWalletStore";
const WalletNotFound = () => {
  const { isSignedIn, user } = useUser();
  const { setWallet } = useWalletStore();

  const [showPopup, setShowPopup] = useState(true);
  const [showExternalWallets, setShowExternalWallets] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const { select, connect, publicKey, signMessage } = useWallet();

  const handleCreateCustodialWallet = async () => {
    if (!isSignedIn) return;
    try {
      setProcessing(true);
      const res = await api.get("/wallet/create");

      setSuccess(true);

      setTimeout(() => {
        setWallet({
          publicKey: res.data.publicKey,
          isCustodial: true,
          walletType: "",
        });
        // setShowPopup(false);
      }, 2500);
    } catch (err) {
      console.error("Error creating custodial wallet", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleLinkExternalWallet = async (walletType: any) => {
    try {
      select(walletType);
      await connect();

      if (!publicKey) {
        console.error("Wallet not connected");
        return;
      }

      const message = `Linking wallet for user ${crypto?.randomUUID()} at ${new Date().toISOString()}`;
      const encodedMessage = new TextEncoder().encode(message);

      const signatureBytes = await signMessage?.(encodedMessage)!;
      const signature = bs58.encode(signatureBytes);

      // console.log(walletName, walletName.__brand__);
      const res = await api.post("/wallet/link-external", {
        publicKey: publicKey.toString(),
        signature,
        message,
        walletType,
      });

      if (res.data.ok) {
        setWallet({
          publicKey: res.data.publicKey,
          isCustodial: false,
          walletType: res.data.walletType,
        });
        setSuccess(true);
        setTimeout(() => setShowPopup(false), 2000);
      }
    } catch (err: any) {
      if (err.message?.includes("User rejected")) {
        console.log("User rejected wallet signature request");
      } else {
        console.error("Error linking external wallet:", err);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    setShowPopup(false);
  };

  return (
    showPopup && (
      <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/40 to-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className=" bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {success ? (
            <div className="flex flex-col items-center gap-4 p-8">
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <CheckCircle
                  className="w-12 h-12 text-green-400 relative animate-in zoom-in duration-500"
                  strokeWidth={2}
                />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold  mb-1">Success!</h3>
                <p className="text-gray-300 text-sm">
                  Your wallet has been connected
                </p>
              </div>
            </div>
          ) : !showExternalWallets ? (
            <>
              {/* Header */}
              <div className="p-6 pb-4 text-center">
                <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-gray-400 text-xs">
                  Choose how you'd like to get started
                </p>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 space-y-3">
                {/* Custodial Wallet Option */}
                <button
                  onClick={handleCreateCustodialWallet}
                  disabled={processing}
                  className="w-full group cursor-pointer  relative"
                >
                  <div className="relative bg-gradient-to-br  border border-slate-600 rounded-xl p-4 hover:border-slate-500 transition-all duration-200 group-hover:shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold  text-sm">
                            Create Custodial Wallet
                          </h3>
                          <span className="text-xs bg-slate-900/20 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          Quick setup with built-in security
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>🛡️ Secure</span>
                          <span>⚡ Instant</span>
                        </div>
                      </div>
                    </div>
                    {processing && (
                      <div className="absolute inset-0 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <div className="flex items-center gap-2  font-medium text-sm">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </div>
                      </div>
                    )}
                  </div>
                </button>

                {/* External Wallet Option */}
                <button
                  onClick={() => setShowExternalWallets(true)}
                  disabled={processing}
                  className="w-full group cursor-pointer "
                >
                  <div className=" border border-slate-600 rounded-xl p-4 hover:border-slate-500 transition-all duration-200 group-hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold mb-1 text-sm">
                          Link External Wallet
                        </h3>
                        <p className="text-xs text-gray-400">
                          Connect your existing wallet
                        </p>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Skip Button */}
                <button
                  onClick={handleSkip}
                  disabled={processing}
                  className="w-full cursor-pointer  text-center text-sm text-gray-400 hover:text-gray-300 py-2 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </>
          ) : (
            <>
              {/* External Wallets View */}
              <div className="p-6">
                <button
                  onClick={() => setShowExternalWallets(false)}
                  disabled={processing}
                  className="flex cursor-pointer items-center gap-2 text-gray-400 hover:text-gray-300 mb-6 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-medium">Back</span>
                </button>

                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold  mb-2">
                    Choose Your Wallet
                  </h3>
                  <p className="text-xs text-gray-400">
                    Select a wallet to connect
                  </p>
                </div>

                <div className="space-y-3">
                  {externalWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleLinkExternalWallet(wallet.adapter)}
                      disabled={processing}
                      className="w-full group cursor-pointer relative"
                    >
                      <div className="relative  border  border-slate-600 rounded-xl p-4 hover:border-slate-500 transition-all duration-200 group-hover:shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 text-left">
                            <h4 className="font-semibold capitalize text-sm">
                              {wallet.id}
                            </h4>
                            <p className="text-xs text-gray-400">
                              Connect instantly
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                        {processing && (
                          <div className="absolute inset-0  bg-white rounded-xl flex items-center justify-center">
                            <div className="flex items-center gap-2  font-medium text-sm">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Connecting...
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSkip}
                  disabled={processing}
                  className="w-full cursor-pointer  text-center text-sm text-gray-400 hover:text-gray-300 py-3 mt-4 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  );
};

export default WalletNotFound;
