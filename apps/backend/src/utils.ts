import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
export function detectRecipientType(
  identifier: string
): "publicKey" | "email" | "phone" | "invalid" {
  const pubKeyRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (pubKeyRegex.test(identifier)) return "publicKey";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(identifier)) return "email";

  const phoneRegex = /^\+?\d{10,15}$/;
  if (phoneRegex.test(identifier)) return "phone";

  return "invalid";
}

export const verifyWalletSignature = (
  publicKeyString: string,
  signatureBase58: string,
  message: string
) => {
  try {
    const pubKey = new PublicKey(publicKeyString);
    const signature = bs58.decode(signatureBase58);
    const messageBytes = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(messageBytes, signature, pubKey.toBytes());
  } catch (err) {
    console.error("Signature verification failed:", err);
    return false;
  }
};

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function getTokenBalance(
  walletAddress: string,
  tokenMintAddress: string,
  tokenSymbol: string
) {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(tokenMintAddress);

    const tokenAccountAddress = await getAssociatedTokenAddress(
      mintPubkey,
      walletPubkey
    );

    const tokenAccount = await getAccount(connection, tokenAccountAddress);

    const decimals = tokenSymbol === "BONK" ? 5 : 6;
    const balance = Number(tokenAccount.amount) / LAMPORTS_PER_SOL;

    return balance;
  } catch (error) {
    console.log(`${tokenSymbol}: 0 (no token account found or error)`);
  }
}
