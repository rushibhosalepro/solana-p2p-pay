import { PhantomWalletName } from "@solana/wallet-adapter-wallets";

import { BackpackWalletName } from "@solana/wallet-adapter-backpack";
export const externalWallets = [
  {
    id: "Phantom",
    adapter: PhantomWalletName,
  },

  {
    id: "Backpack",
    adapter: BackpackWalletName,
  },
];
