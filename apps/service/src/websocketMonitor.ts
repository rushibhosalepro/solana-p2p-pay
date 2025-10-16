import { Connection, PublicKey } from "@solana/web3.js";
import prisma from "database";
import { TransactionSyncService } from "./transactionSync";

export class WebSocketMonitorService {
  private connection: Connection;
  private subscriptions: Map<string, number> = new Map();
  private syncService: TransactionSyncService;
  private syncLocks: Map<string, boolean> = new Map();

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, "confirmed");
    this.syncService = new TransactionSyncService();
  }

  async subscribeAllWallets() {
    const wallets = await prisma.wallet.findMany({
      where: { isActive: true },
      select: { id: true, publicKey: true, lastSignature: true },
    });

    for (const wallet of wallets) {
      await this.subscribeWallet(
        wallet.id,
        wallet.publicKey,
        wallet.lastSignature
      );
    }

    console.log(`Subscribed to ${wallets.length} wallets`);
  }

  async subscribeWallet(
    walletId: string,
    publicKeyStr: string,
    lastSignature?: string | null
  ) {
    try {
      if (this.subscriptions.has(walletId)) {
        console.log(`Wallet ${walletId} already subscribed`);
        return;
      }

      const publicKey = new PublicKey(publicKeyStr);

      const subscriptionId = this.connection.onAccountChange(
        publicKey,
        async (accountInfo, context) => {
          console.log(`💰 Balance changed for ${publicKeyStr}`);

          if (this.syncLocks.get(walletId)) {
            console.log(`Sync already in progress for ${walletId}, skipping`);
            return;
          }

          this.syncLocks.set(walletId, true);

          try {
            await prisma.wallet.update({
              where: { id: walletId },
              data: { balance: BigInt(accountInfo.lamports) },
            });

            const wallet = await prisma.wallet.findUnique({
              where: { id: walletId },
              select: { lastSignature: true },
            });

            await this.syncService.syncWallet(
              walletId,
              publicKeyStr,
              wallet?.lastSignature
            );
          } catch (error) {
            console.error(
              `Error processing balance change for ${walletId}:`,
              error
            );
          } finally {
            this.syncLocks.set(walletId, false);
          }
        },
        "confirmed"
      );

      this.subscriptions.set(walletId, subscriptionId);
      console.log(`✅ Subscribed to ${publicKeyStr}`);
    } catch (error) {
      console.error(`Error subscribing to ${publicKeyStr}:`, error);
    }
  }

  async unsubscribeWallet(walletId: string) {
    const subscriptionId = this.subscriptions.get(walletId);
    if (subscriptionId !== undefined) {
      try {
        await this.connection.removeAccountChangeListener(subscriptionId);
        this.subscriptions.delete(walletId);
        this.syncLocks.delete(walletId);
        console.log(`Unsubscribed wallet ${walletId}`);
      } catch (error) {
        console.error(`Error unsubscribing wallet ${walletId}:`, error);
      }
    }
  }

  async cleanup() {
    const unsubscribePromises = Array.from(this.subscriptions.entries()).map(
      async ([walletId, subscriptionId]) => {
        try {
          await this.connection.removeAccountChangeListener(subscriptionId);
        } catch (error) {
          console.error(`Error removing listener for ${walletId}:`, error);
        }
      }
    );

    await Promise.allSettled(unsubscribePromises);
    this.subscriptions.clear();
    this.syncLocks.clear();
    console.log("WebSocket monitor cleanup completed");
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  isWalletSubscribed(walletId: string): boolean {
    return this.subscriptions.has(walletId);
  }
}
