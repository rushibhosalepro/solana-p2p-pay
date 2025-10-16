import { getAuth } from "@clerk/express";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import prisma from "database";
import express from "express";
import { TOKENS, type TokenTypes } from "types";
import { prepareSwapTransaction } from "../jupiter";
import { connection, detectRecipientType } from "../utils";
// import { connection, detectRecipientType } from "../utils";

const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId)
      return res.status(401).json({ ok: false, error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: { wallets: { select: { publicKey: true } } },
    });

    if (!user)
      return res.status(404).json({ ok: false, error: "Invalid user" });

    const userPublicKeys = user.wallets.map((w: any) => w.publicKey);

    if (userPublicKeys.length === 0)
      return res.json({ ok: true, transactions: [] });

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAddress: { in: userPublicKeys } },
          { toAddress: { in: userPublicKeys } },
        ],
      },
      orderBy: { blockTime: "desc" },
    });

    const addressesInTx = [
      ...new Set(
        transactions.flatMap((tx: any) =>
          [tx.fromAddress, tx.toAddress].filter(
            (addr): addr is string => !!addr
          )
        )
      ),
    ];

    if (addressesInTx.length === 0)
      return res.json({ ok: true, transactions: [] });

    const relatedWallets = await prisma.wallet.findMany({
      where: { publicKey: { in: addressesInTx } },
      include: { user: { select: { name: true, clerkUserId: true } } },
    });

    const walletMap = Object.fromEntries(
      relatedWallets.map((w: any) => [w.publicKey, w.user])
    );

    const txBySignature = new Map<
      string,
      (typeof transactions)[0] & { type: string }
    >();

    for (const tx of transactions) {
      let type = "UNKNOWN";

      if (tx.fromAddress && userPublicKeys.includes(tx.fromAddress)) {
        type = "SEND";
      } else if (tx.toAddress && userPublicKeys.includes(tx.toAddress)) {
        type = "RECEIVE";
      }

      if (!txBySignature.has(tx.signature)) {
        txBySignature.set(tx.signature, { ...tx, type });
      }
    }

    const formattedTx = Array.from(txBySignature.values())
      .sort((a, b) => b.blockTime.getTime() - a.blockTime.getTime())
      .slice(0, 10)
      .map((tx) => {
        const fromUser = tx.fromAddress ? walletMap[tx.fromAddress] : null;
        const toUser = tx.toAddress ? walletMap[tx.toAddress] : null;

        return {
          ...tx,
          amount: tx.amount.toString(),
          fee: tx.fee.toString(),
          slot: tx.slot.toString(),
          fromUser: fromUser?.name || null,
          toUser: toUser?.name || null,
        };
      });

    return res.json({ ok: true, transactions: formattedTx });
  } catch (err) {
    console.error("Transaction fetch error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
// router.get("/recent", async (req, res) => {
//   try {
//     const { userId: clerkUserId } = getAuth(req);
//     if (!clerkUserId)
//       return res.status(401).json({ ok: false, error: "Unauthorized" });

//     const user = await prisma.user.findUnique({
//       where: { clerkUserId },
//       include: { wallets: { select: { id: true, publicKey: true } } },
//     });

//     if (!user)
//       return res.status(404).json({ ok: false, error: "Invalid user" });

//     const userPublicKeys = user.wallets.map((w) => w.publicKey);
//     if (userPublicKeys.length === 0)
//       return res.json({ ok: true, participants: [] });

//     const transactions = await prisma.transaction.findMany({
//       where: {
//         OR: [
//           { fromAddress: { in: userPublicKeys } },
//           { toAddress: { in: userPublicKeys } },
//         ],
//       },
//       orderBy: { blockTime: "desc" },
//     });

//     if (transactions.length === 0)
//       return res.json({ ok: true, participants: [] });

//     const addressesInTx = [
//       ...new Set(
//         transactions.flatMap((tx) =>
//           [tx.fromAddress, tx.toAddress].filter(
//             (addr): addr is string => !!addr
//           )
//         )
//       ),
//     ];

//     const relatedWallets = await prisma.wallet.findMany({
//       where: { publicKey: { in: addressesInTx } },
//       include: { user: { select: { name: true, clerkUserId: true } } },
//     });

//     const participantsMap = new Map<
//       string,
//       { name: string | null; publicKey: string; recentTx: Date }
//     >();

//     for (const tx of transactions) {
//       const otherAddress =
//         tx.fromAddress && !userPublicKeys.includes(tx.fromAddress)
//           ? tx.fromAddress
//           : tx.toAddress && !userPublicKeys.includes(tx.toAddress)
//             ? tx.toAddress
//             : null;

//       if (!otherAddress) continue;

//       const wallet = relatedWallets.find((w) => w.publicKey === otherAddress);
//       if (!wallet || !wallet.user || wallet.user.clerkUserId === clerkUserId)
//         continue;

//       const existing = participantsMap.get(otherAddress);
//       if (!existing || existing.recentTx < tx.blockTime) {
//         participantsMap.set(otherAddress, {
//           name: wallet.user.name || null,
//           publicKey: otherAddress,
//           recentTx: tx.blockTime,
//         });
//       }
//     }

//     const participants = Array.from(participantsMap.values()).sort(
//       (a, b) => b.recentTx.getTime() - a.recentTx.getTime()
//     );

//     return res.json({ ok: true, participants });
//   } catch (err) {
//     console.error("Recent transaction fetch error:", err);
//     res.status(500).json({ ok: false, error: "Internal server error" });
//   }
// });

router.get("/recent", async (req, res) => {
  try {
    const { userId: clerkUserId } = getAuth(req);
    if (!clerkUserId)
      return res.status(401).json({ ok: false, error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: { wallets: { select: { id: true, publicKey: true } } },
    });

    if (!user)
      return res.status(404).json({ ok: false, error: "Invalid user" });

    const userPublicKeys = user.wallets.map((w: any) => w.publicKey);
    if (userPublicKeys.length === 0)
      return res.json({ ok: true, participants: [] });

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAddress: { in: userPublicKeys } },
          { toAddress: { in: userPublicKeys } },
        ],
      },
      orderBy: { blockTime: "desc" },
    });

    if (transactions.length === 0)
      return res.json({ ok: true, participants: [] });

    const addressesInTx = [
      ...new Set(
        transactions.flatMap((tx) =>
          [tx.fromAddress, tx.toAddress].filter(
            (addr): addr is string => !!addr
          )
        )
      ),
    ];

    const relatedWallets = await prisma.wallet.findMany({
      where: { publicKey: { in: addressesInTx } },
      include: { user: { select: { name: true, clerkUserId: true } } },
    });

    const participantsMap = new Map<
      string,
      { name: string | null; publicKey: string; recentTx: Date }
    >();

    for (const tx of transactions) {
      const otherAddress =
        tx.fromAddress && !userPublicKeys.includes(tx.fromAddress)
          ? tx.fromAddress
          : tx.toAddress && !userPublicKeys.includes(tx.toAddress)
            ? tx.toAddress
            : null;

      if (!otherAddress) continue;

      const wallet = relatedWallets.find((w) => w.publicKey === otherAddress);

      const existing = participantsMap.get(otherAddress);
      const isNewer = !existing || existing.recentTx < tx.blockTime;

      if (isNewer) {
        participantsMap.set(otherAddress, {
          name: wallet?.user?.name || null,
          publicKey: otherAddress,
          recentTx: tx.blockTime,
        });
      }
    }

    // Find any addresses that were in transactions but not found in wallet table
    for (const addr of addressesInTx) {
      if (userPublicKeys.includes(addr)) continue;
      if (!participantsMap.has(addr)) {
        participantsMap.set(addr, {
          name: null,
          publicKey: addr,
          recentTx:
            transactions.find(
              (t) => t.fromAddress === addr || t.toAddress === addr
            )?.blockTime || new Date(0),
        });
      }
    }

    const participants = Array.from(participantsMap.values()).sort(
      (a, b) => b.recentTx.getTime() - a.recentTx.getTime()
    );

    return res.json({ ok: true, participants });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/between/:walletA/:walletB", async (req, res) => {
  try {
    const { walletA, walletB } = req.params;

    if (!walletA || !walletB) {
      return res.json({ ok: false, error: "all fields are required" });
    }

    const { userId } = getAuth(req);
    if (!userId) return res.json({ ok: false, error: "un authorized" });

    const user = await prisma.user.findFirst({
      where: {
        clerkUserId: userId,
      },
      include: {
        wallets: {
          where: { OR: [{ publicKey: walletA }, { publicKey: walletB }] },
        },
      },
    });
    if (!user || !user?.wallets) {
      return res.json({ ok: false, error: "un authorized" });
    }
    const allTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { AND: [{ fromAddress: walletA }, { toAddress: walletB }] },
          { AND: [{ fromAddress: walletB }, { toAddress: walletA }] },
        ],
      },
      orderBy: {
        blockTime: "asc",
      },
    });

    console.log(allTransactions);
    return res.json({
      ok: true,
      transactions: allTransactions.map((tx) => {
        return {
          ...tx,
          slot: tx.slot.toString(),
          amount: tx.slot.toString(),
          fee: tx.slot.toString(),
        };
      }),
    });
  } catch (err) {
    console.error("Transaction fetch error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.post("/send-wallet/:senderPubKey/:recipientPubKey", async (req, res) => {
  const { recipientPubKey, senderPubKey } = req.params;
  const { amount, message, fromToken, toToken } = req.body;
  if (!amount || !recipientPubKey || !senderPubKey || !fromToken || !toToken)
    return res
      .status(400)
      .json({ ok: false, error: "All fields are required" });

  const lamports = Number(amount);
  if (isNaN(lamports) || lamports <= 0)
    return res
      .status(400)
      .json({ ok: false, error: "Amount must be greater than 0" });

  const { userId: clerkUserId } = getAuth(req);
  if (!clerkUserId)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const sender = await prisma.user.findUnique({
      where: { clerkUserId },
      include: { wallets: { where: { publicKey: senderPubKey } } },
    });
    if (!sender?.wallets?.length)
      return res
        .status(400)
        .json({ ok: false, error: "Sender wallet not found" });

    const senderWallet = sender.wallets[0];
    const senderKeypair = Keypair.fromSecretKey(
      bs58.decode(senderWallet?.encryptedPrivateKey!)
    );

    const walletBalance = await connection.getBalance(senderKeypair.publicKey);
    if (walletBalance < lamports)
      return res
        .status(400)
        .json({ ok: false, error: "Insufficient wallet balance" });

    let receiverWallet, receiverUser;

    const type = detectRecipientType(recipientPubKey); // "email", "phone", "publicKey"
    if (type === "publicKey") {
      const walletRecord = await prisma.wallet.findFirst({
        where: { publicKey: recipientPubKey },
        include: { user: true },
      });
      if (!walletRecord)
        return res
          .status(404)
          .json({ ok: false, error: "Recipient wallet not found" });

      receiverWallet = walletRecord;
      receiverUser = walletRecord.user!;
    } else {
      receiverUser = await prisma.user.findFirst({
        where: { OR: [{ email: recipientPubKey }, { phone: recipientPubKey }] },
        include: { wallets: true },
      });
      if (!receiverUser?.wallets?.length)
        return res
          .status(404)
          .json({ ok: false, error: "Recipient not found or has no wallet" });

      receiverWallet = receiverUser.wallets[0];
    }

    const receiverAddress = receiverWallet?.publicKey;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new PublicKey(receiverAddress!),
        lamports,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderKeypair.publicKey;
    transaction.sign(senderKeypair);

    const sig = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(sig);

    res.json({
      ok: true,
      receiverAddress,
      signature: sig,
      lamports: lamports.toString(),
    });
  } catch (error) {
    console.error("Error in /send-wallet:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// router.post("/confirm", async (req, res) => {
//   try {
//     const { txId, method, message, recipientKey, amount, senderKey } = req.body;

//     if (!txId || !method || !recipientKey || !amount || !senderKey)
//       return res
//         .status(400)
//         .json({ ok: false, error: "Missing required fields" });

//     const { userId } = getAuth(req);
//     if (!userId)
//       return res.status(401).json({ ok: false, error: "Unauthorized" });

//     const txInfo = await connection.getTransaction(txId);
//     if (!txInfo)
//       return res
//         .status(400)
//         .json({ ok: false, error: "Transaction not found on-chain" });

//     const sender = await prisma.user.findFirst({
//       where: { clerkUserId: userId },
//       include: { wallets: { where: { publicKey: senderKey } } },
//     });

//     const receiver = await prisma.wallet.findFirst({
//       where: { publicKey: recipientKey },
//       include: { user: true },
//     });

//     const transaction = await prisma.transaction.create({
//       data: {
//         txHash: txId,
//         amount: Number(amount),
//         msg: message,
//         sendersPublicKeys: senderKey,
//         senderId: sender?.id ?? null,
//         senderWalletId: sender?.wallets[0]?.id ?? null,
//         reciversPublicKeys: recipientKey,
//         receiverWalletId: receiver?.id ?? null,
//         receiverId: receiver?.user?.id ?? null,
//         status: "COMPLETED",
//       },
//     });

//     const safeTx = JSON.parse(
//       JSON.stringify(transaction, (_, value) =>
//         typeof value === "bigint" ? value.toString() : value
//       )
//     );

//     return res.json({ ok: true, transaction: safeTx });
//   } catch (err) {
//     console.error("Confirm transaction error:", err);
//     return res.status(500).json({ ok: false, error: "Internal server error" });
//   }
// });

router.post("/send/:sender/:recipient", async (req, res) => {
  const { sender, recipient } = req.params;
  const { amount, fromToken, toToken, custodial } = req.body;

  if (!sender || !recipient || !amount || !fromToken || !toToken) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.json({ ok: false, error: "un authorzied" });
  }

  try {
    const tx = await prepareSwapTransaction(
      TOKENS[fromToken as TokenTypes],
      TOKENS[toToken as TokenTypes],
      sender,
      recipient,
      amount
    );

    return res.json({ ok: true, ...tx });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
