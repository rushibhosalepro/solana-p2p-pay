import { Keypair, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";
import bs58 from "bs58";
import { connection } from "./utils";
export const getQuote = async (
  inputMint: string,
  outputMint: string,
  amount: string
) => {
  const res = await axios.get("https://lite-api.jup.ag/swap/v1/quote", {
    params: {
      inputMint,
      outputMint,
      amount,
      slippageBps: "50",
    },
  });
  return res.data;
};

export const prepareSwapTransaction = async (
  inputTokenMint: string,
  outputTokenMint: string,
  senderPublicKey: string,
  receiverPublicKey: string,
  amountLamports: string
) => {
  const quoteRes = await axios.get("https://lite-api.jup.ag/swap/v1/quote", {
    params: {
      inputMint: inputTokenMint,
      outputMint: outputTokenMint,
      amount: amountLamports,
      slippageBps: "50",
    },
  });
  const quote = quoteRes.data;

  const swapTxRes = await axios.post("https://lite-api.jup.ag/swap/v1/swap", {
    quoteResponse: quote,
    userPublicKey: senderPublicKey,
    destinationTokenAccount: receiverPublicKey,
    wrapAndUnwrapSol: true,
  });

  return {
    transaction: swapTxRes.data.swapTransaction,
    quote,
  };
};

export const swapViaCustodial = async (
  inputTokenMint: string,
  outputTokenMint: string,
  receiverPublicKey: string,
  amountLamports: string,
  privateKeyBase58: string
) => {
  const senderKeypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
  const quote = await getQuote(inputTokenMint, outputTokenMint, amountLamports);

  const swapTxRes = await axios.post("https://lite-api.jup.ag/swap/v1/swap", {
    quoteResponse: quote,
    userPublicKey: senderKeypair.publicKey.toBase58(),
    destinationTokenAccount: receiverPublicKey,
    wrapAndUnwrapSol: true,
  });

  const txBuffer = Buffer.from(swapTxRes.data.swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(txBuffer);

  transaction.sign([senderKeypair]);
  const txid = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(txid, "confirmed");

  return { txid, quote };
};
