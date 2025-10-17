"use client";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitials, solToLamports } from "@/lib/utils";
import { useWalletStore } from "@/store/useWalletStore";
import { useUser } from "@clerk/nextjs";
import { createQR, encodeURL } from "@solana/pay";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { ArrowLeft, Check, Copy, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SolanaPayQRGenerator = () => {
  const router = useRouter();
  const { publicKey } = useWalletStore();
  const { user } = useUser();

  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState("");
  const [value, setValue] = useState("0");
  const [amount, setAmount] = useState("0.1");
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const updateAmount = () => {
    setAmount(value);
    setShowPopup(false);
  };

  const generateQR = async () => {
    try {
      setError("");
      if (!publicKey) return;
      const pubKey = new PublicKey(publicKey);
      const url = encodeURL({
        recipient: pubKey,
        amount: amount
          ? new BigNumber(solToLamports(Number(amount)))
          : undefined,
        label: user?.fullName || undefined,
        message: "Payment",
      });
      const qr = createQR(url);
      const qrBlob = await qr.getRawData("png");
      if (qrBlob) {
        const qrUrl = URL.createObjectURL(qrBlob);
        setQrCode(qrUrl);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate QR code"
      );
    }
  };

  useEffect(() => {
    generateQR();
  }, [publicKey, amount]);

  const handleDownload = () => {
    if (!qrCode) return;
    const a = document.createElement("a");
    a.href = qrCode;
    a.download = "solana-pay-qr.png";
    a.click();
  };

  const handleCopy = () => {
    if (!publicKey) return;
    setCopied(true);
    navigator.clipboard.writeText(publicKey);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <main className="min-h-screen h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm h-full bg-white rounded-2xl shadow-2xl overflow-hidden p-4 flex flex-col items-center relative">
        <div className="flex w-full justify-between mb-4">
          <Button
            variant="outline"
            className="border-none text-left shadow-none hover:bg-transparent"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              className="border-none text-left shadow-none hover:bg-transparent"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreVertical className="w-6 h-6" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-10 bg-white border rounded-md shadow-md p-4 flex flex-col gap-2 z-50">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPopup(true);
                    setMenuOpen(false);
                  }}
                >
                  Add amount
                </Button>
              </div>
            )}
          </div>
        </div>

        {showPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-4 w-[80%] rounded-md">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type="number"
                placeholder="20"
                min="0"
                className="border-none shadow-none text-3xl font-medium h-20 outline-none"
              />
              <div className="mt-2 flex justify-between gap-2 items-center">
                <Button
                  className="flex-1"
                  variant="ghost"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={updateAmount}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {!qrCode ? (
          <Loader size={20} />
        ) : (
          <>
            <div className="flex flex-col items-center gap-4 mt-8 p-6 bg-gray-100 rounded-md w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials(user?.fullName)}
                </div>
                <h1 className="text-lg font-semibold capitalize">
                  {user?.fullName}
                </h1>
              </div>

              <Image
                width={200}
                height={200}
                src={qrCode}
                alt="Solana Pay QR"
                className="mt-2 w-full max-w-64 object-cover rounded-lg shadow-md"
              />

              <p className="text-sm mt-1">Scan to pay</p>

              <div className="flex flex-col w-full mt-1 gap-1">
                <div className="w-full flex items-center">
                  <p className="text-xs font-medium truncate flex-1">
                    {publicKey}
                  </p>
                  <Button size="sm" onClick={handleCopy} disabled={copied}>
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4 w-full">
              <Button
                variant="outline"
                onClick={() => router.push("/qr")}
                className="flex-1 cursor-pointer"
              >
                Open Scanner
              </Button>
              <Button onClick={handleDownload} className="flex-1">
                Share / Download
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default SolanaPayQRGenerator;
