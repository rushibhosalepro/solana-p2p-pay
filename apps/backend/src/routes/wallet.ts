import { getAuth } from "@clerk/express";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import prisma from "database";
import express from "express";
import { TOKENS } from "types";
import { connection, getTokenBalance, verifyWalletSignature } from "../utils";
// import { registerWalletWithHelius } from "./webhookRoutes";

const router = express.Router();

// create custodial wallet
router.get("/create", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  const user = await prisma.user.findFirst({
    where: {
      clerkUserId: userId,
    },
  });
  if (!user) {
    return res.json({ error: "user not found" });
  }

  try {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const secretKey = bs58.encode(keypair.secretKey);
    await prisma.wallet.create({
      data: {
        publicKey,
        balance: 0,
        encryptedPrivateKey: secretKey,
        isCustodial: true,
        userId: user.id,
      },
    });

    res.json({ ok: true, publicKey });
  } catch (error) {
    console.error(`error creating new wallet - ${error}`);
    res.status(500).json({ ok: false, error: "internal server error" });
  }
});

router.get("/balance/:publicKey", async (req, res) => {
  try {
    const { publicKey } = req.params;
    if (!publicKey)
      return res.status(400).json({ error: "missing public key" });

    const balance = await connection.getBalance(new PublicKey(publicKey));
    const walletAddress = new PublicKey(publicKey);
    const solBalance =
      (await connection.getBalance(walletAddress)) / LAMPORTS_PER_SOL;
    const usdcBalance = await getTokenBalance(publicKey, TOKENS.USDC, "USDC");
    const usdtBalance = await getTokenBalance(publicKey, TOKENS.USDT, "USDT");
    console.log(`
       solana:${solBalance},
       bonk:${0},
       USDC:${usdcBalance},
       USDT:${usdtBalance}            
      `);
    res.json({ ok: true, balance });
  } catch (error) {
    console.error("error fetching balance:", error);
    res.status(500).json({ ok: false, error: "internal server error" });
  }
});

// get seleted wallet
router.get("/info", async (req, res) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.json({ error: "unauthorize" });
  }
  const user = await prisma.user.findFirst({
    where: {
      clerkUserId: userId,
    },
  });
  if (!user) {
    return res.json({ error: "user not found" });
  }
  const seletedWallet = await prisma.wallet.findFirst({
    where: {
      userId: user.id,
      isSeleted: true,
    },
  });
  if (!seletedWallet)
    return res.status(404).json({ ok: false, error: "wallet not found" });

  const balance = await connection.getBalance(
    new PublicKey(seletedWallet?.publicKey)
  );
  console.log(seletedWallet.publicKey);
  res.json({
    ok: true,
    publicKey: seletedWallet?.publicKey,
    isCustodial: seletedWallet?.isCustodial,
    walletType: seletedWallet.walletType,
    balance,
  });
});
// this will export wallet info including private key
router.get("/export-wallet-info", (req, res) => {
  try {
  } catch (error) {}
});

// link external wallet
router.post("/link-external", async (req, res) => {
  const { publicKey, signature, message, walletType } = req.body;
  console.log(publicKey, walletType, signature, message);

  if (!publicKey || !signature || !message || !walletType) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }
  const { userId } = getAuth(req);
  if (!userId) {
    return res.json({ error: "unauthorize" });
  }
  const user = await prisma.user.findFirst({
    where: { clerkUserId: userId },
  });
  if (!user) {
    return res.json({ error: "user not found" });
  }
  try {
    const verified = verifyWalletSignature(publicKey, signature, message);
    if (!verified) {
      return res.status(400).json({ ok: false, error: "Invalid signature" });
    }

    const balance = await connection.getBalance(new PublicKey(publicKey));
    const response = await prisma.wallet.create({
      data: {
        publicKey,
        isCustodial: false,
        balance,

        userId: user.id,
        walletType,
        isSeleted: true,
      },
    });
    return res.json({ ok: true, data: { publicKey, isCustodial: false } });
  } catch (err) {
    console.error("Wallet verification error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
