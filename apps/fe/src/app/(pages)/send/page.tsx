"use client";
import { Input } from "@/components/ui/input";
import MobileView from "@/components/ui/MobileView";
import { api } from "@/lib/api";
import { getFormatedDate, getInitials } from "@/lib/utils";
import { useWalletStore } from "@/store/useWalletStore";
import { ArrowLeft, Clock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SendPage = () => {
  const [recipient, setRecipient] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recents, setRecents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const router = useRouter();

  const { publicKey } = useWalletStore();

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  useEffect(() => {
    if (!publicKey) return;

    const fetchRecents = async () => {
      try {
        const res = await api.get(`/transactions/recent/`);
        if (res.data.ok) setRecents(res.data.participants);
      } catch (err) {
        console.error("Failed to fetch recent transactions:", err);
        setRecents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecents();
  }, [publicKey]);

  useEffect(() => {
    if (!recipient.trim()) {
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(() => {
      handleSearch(recipient);
    }, 400);

    return () => clearTimeout(delay);
  }, [recipient]);

  const handleSearch = async (query: string) => {
    setLoadingSearch(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      let results = res.data.users || [];

      // If not found, check if query looks like a public key
      const publicKeyPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      if (results.length === 0 && publicKeyPattern.test(query)) {
        results = [
          {
            name: "Wallet Address",
            email: query,
            wallet: query,
            isWalletOnly: true,
          },
        ];
      }

      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelect = (walletAddress: string) => {
    setSearchResults([]);
    router.push(`/send/${walletAddress}`);
  };

  return (
    <MobileView>
      <div className="w-full">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-6">
            <button
              className="p-2 -ml-2 cursor-pointer rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Send</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Name, email, or wallet address"
              className="h-14 pl-12 pr-4 bg-gray-100 border-0 rounded-2xl text-base placeholder:text-gray-400 focus:bg-gray-50 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loadingSearch && (
          <div className="flex justify-center items-center py-4 text-gray-500 text-sm">
            Searching...
          </div>
        )}

        {!loadingSearch && searchResults.length > 0 && (
          <div className="px-6 pb-4 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {searchResults.map((user) => {
                if (user.publicKeys.includes(publicKey)) return;
                return (
                  <button
                    key={user.email}
                    className="w-full cursor-pointer px-4 py-3 flex items-center gap-4 rounded-2xl hover:bg-gray-50 transition-colors"
                    onClick={() => handleSelect(user.publicKeys[0])}
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-semibold text-base flex-shrink-0`}
                    >
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-base font-semibold text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.isWalletOnly
                          ? "Direct wallet address"
                          : user.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {searchResults.length === 0 && (
          <div className="px-6 pb-6 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-500 tracking-wide">
                Recent
              </h2>
            </div>

            <div className="space-y-1 overflow-x-hidden">
              {recents.length > 0 ? (
                recents.map((rc) => {
                  return (
                    <button
                      key={rc.publicKey}
                      className="w-full cursor-pointer px-2  py-3 flex items-center justify-between rounded-2xl hover:bg-gray-50 transition-colors group"
                      onClick={() => handleSelect(rc.publicKey)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full ${getAvatarColor(rc.name ? rc.name : rc.publicKey)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
                        >
                          {getInitials(rc.name ? rc.name : rc.publicKey)}
                        </div>
                        <div className="text-left">
                          <p className="text-base truncate max-w-[250px]  font-semibold text-gray-900">
                            {rc.name ?? rc.publicKey}
                          </p>
                          <p className="text-sm text-gray-500">
                            {rc.email ?? ""}
                          </p>

                          {rc.recentTx && (
                            <span className="text-xs text-gray-400 group-hover:text-gray-500 transition-colors">
                              {getFormatedDate(rc.recentTx.toLocaleString())}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center py-8">
                  <p className="text-sm text-gray-400 text-center">
                    No recent transactions
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileView>
  );
};

export default SendPage;
