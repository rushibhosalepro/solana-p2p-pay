import { PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import prisma from "database";
import rpcManager from "./rpcManger";

export class TransactionSyncService {
  async syncAllWallets() {
    const wallets = await prisma.wallet.findMany({
      where: { isActive: true },
      select: { id: true, publicKey: true, lastSignature: true },
    });

    console.log(`Syncing ${wallets.length} wallets...`);

    const batchSize = 5;
    for (let i = 0; i < wallets.length; i += batchSize) {
      const batch = wallets.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map((wallet) =>
          this.syncWallet(wallet.id, wallet.publicKey, wallet.lastSignature)
        )
      );

      if (i + batchSize < wallets.length) {
        await this.sleep(1000);
      }
    }
  }

  async syncWallet(
    walletId: string,
    publicKeyStr: string,
    lastSignature?: string | null
  ) {
    try {
      const publicKey = new PublicKey(publicKeyStr);

      const signatures = await rpcManager.withRetry((connection) =>
        connection.getSignaturesForAddress(publicKey, {
          limit: 100,
        })
      );

      if (signatures.length === 0) {
        console.log(`No new transactions for ${publicKeyStr}`);
        return;
      }

      let signaturesToProcess = signatures;

      if (lastSignature) {
        const lastIndex = signatures.findIndex(
          (sig) => sig.signature === lastSignature
        );

        if (lastIndex === -1) {
          console.log(
            `Last signature not found in recent history for ${publicKeyStr}, processing all available`
          );
        } else if (lastIndex === 0) {
          console.log(`No new transactions for ${publicKeyStr}`);
          return;
        } else {
          signaturesToProcess = signatures.slice(0, lastIndex);
        }
      }

      console.log(
        `Found ${signaturesToProcess.length} new transactions for ${publicKeyStr}`
      );

      const reversedSigs = [...signaturesToProcess].reverse();

      for (const sigInfo of reversedSigs) {
        await this.processTransaction(
          walletId,
          publicKeyStr,
          sigInfo.signature
        );
      }
      const balance = await rpcManager.withRetry((connection) =>
        connection.getBalance(publicKey)
      );

      await prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: BigInt(balance),
          lastSyncedAt: new Date(),
          lastSignature: signatures[0]?.signature,
        },
      });

      console.log(
        `Synced ${signaturesToProcess.length} transactions for ${publicKeyStr}`
      );
    } catch (error) {
      console.error(`Error syncing wallet ${publicKeyStr}:`, error);
    }
  }

  async processTransaction(
    walletId: string,
    walletPublicKey: string,
    signature: string
  ) {
    try {
      const existing = await prisma.transaction.findUnique({
        where: { signature },
      });

      if (existing) {
        console.log(`Transaction ${signature} already exists, skipping`);
        return;
      }

      const tx = await rpcManager.withRetry((connection) =>
        connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        })
      );

      if (!tx || !tx.meta) {
        console.log(`Transaction ${signature} not found or no metadata`);
        return;
      }

      const txData = this.parseTransaction(tx, walletPublicKey);

      console.log(txData);
      try {
        await prisma.transaction.create({
          data: {
            signature,
            message: "",
            blockTime: tx.blockTime
              ? new Date(tx.blockTime * 1000)
              : new Date(),
            slot: BigInt(tx.slot),
            amount: BigInt(Math.abs(txData.amount)),
            fee: BigInt(txData.metadata?.fee ?? 0),
            status: tx.meta.err ? "FAILED" : "CONFIRMED",
            fromAddress: txData.from,
            toAddress: txData.to,
            memo: txData.memo,
            metadata: txData.metadata ?? {},
          },
        });

        console.log(
          `Saved transaction ${signature} (${Math.abs(txData.amount)} lamports, from: ${txData.from?.slice(0, 8)}..., to: ${txData.to?.slice(0, 8)}...)`
        );
      } catch (dbError: any) {
        if (dbError.code === "P2002") {
          console.log(
            `Transaction ${signature} was already saved by another process, skipping`
          );
          return;
        }
        throw dbError;
      }
    } catch (error) {
      console.error(`Error processing transaction ${signature}:`, error);
    }
  }

  private parseTransaction(
    tx: ParsedTransactionWithMeta,
    walletPublicKey: string
  ) {
    console.log(`raw ${tx}`);
    const accountKeys = tx.transaction.message.accountKeys;

    const walletIndex = accountKeys.findIndex(
      (key) => key.pubkey.toString() === walletPublicKey
    );

    if (walletIndex === -1) {
      console.warn(
        `Wallet ${walletPublicKey} not found in transaction account keys`
      );
      return {
        amount: 0,
        from: null,
        to: null,
        memo: null,
        metadata: null,
      };
    }

    const preBalance = tx.meta!.preBalances[walletIndex] ?? 0;
    const postBalance = tx.meta!.postBalances[walletIndex] ?? 0;
    const balanceChange = postBalance - preBalance;
    const fee = tx.meta!.fee;

    let from: string | null = null;
    let to: string | null = null;
    let amount = 0;

    if (balanceChange > 0) {
      // Receiving
      amount = balanceChange;
      to = walletPublicKey;

      // Find sender
      for (let i = 0; i < tx.meta!.preBalances.length; i++) {
        if (i === walletIndex) continue;

        const prebal = tx.meta!.preBalances[i] ?? 0;
        const postbal = tx.meta!.postBalances[i] ?? 0;
        const change = postbal - prebal;

        if (change < 0 && Math.abs(change) > fee) {
          from = accountKeys[i]?.pubkey.toString() ?? null;
          break;
        }
      }
    } else if (balanceChange < 0) {
      // Sending
      amount = Math.abs(balanceChange + fee);
      from = walletPublicKey;

      // Find receiver
      for (let i = 0; i < tx.meta!.preBalances.length; i++) {
        if (i === walletIndex) continue;

        const prebal = tx.meta!.preBalances[i] ?? 0;
        const postbal = tx.meta!.postBalances[i] ?? 0;
        const change = postbal - prebal;

        if (change > 0) {
          to = accountKeys[i]?.pubkey.toString() ?? null;
          break;
        }
      }
    } else {
      // No balance change (might be token transfer or contract interaction)
      amount = 0;
    }

    // Extract memo
    let memo: string | null = null;
    const memoInstruction = tx.transaction.message.instructions.find(
      (ix: any) => {
        const programId = ix.programId.toString();
        return (
          programId === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr" ||
          programId === "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"
        );
      }
    );

    if (memoInstruction) {
      if ("parsed" in memoInstruction) {
        memo = memoInstruction.parsed;
      } else if ("data" in memoInstruction) {
        memo = memoInstruction.data as string;
      }
    }

    return {
      amount,
      from,
      to,
      memo,
      metadata: {
        instructions: tx.transaction.message.instructions.length,
        accounts: accountKeys.length,
        fee,
        balanceChange,
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
