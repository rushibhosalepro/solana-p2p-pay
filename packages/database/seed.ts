import prisma from ".";

async function main() {
  const aliceId = "176659cd-1f55-4e6d-aa79-e8e1dd73b37e";
  const aliceWalletId = "cd301796-9517-442a-a034-7f789539eb97";

  const bobId = "9023346f-3ad9-4608-b603-357a522adb68";
  const bobWalletId = "3609567b-367b-4a4d-b3ca-e610f5d572ee";

  const proId = "b7deaafc-5058-40e0-b29e-2d68083d08a2";
  const proWalletId = "f1a870ca-f6e7-4bc8-9489-6a4925d97aef";

  await prisma.transaction.createMany({
    data: [
      {
        senderId: aliceId,
        receiverId: bobId,
        senderWalletId: aliceWalletId,
        receiverWalletId: bobWalletId,
        amount: BigInt(1500000000),
        tokenSymbol: "SOL",
        txHash: "txhash_1",
        msg: "Payment for service",
      },
      {
        senderId: bobId,
        receiverId: aliceId,
        senderWalletId: bobWalletId,
        receiverWalletId: aliceWalletId,
        amount: BigInt(500000000),
        tokenSymbol: "SOL",
        txHash: "txhash_2",
        msg: "Refund",
      },
      {
        senderId: proId,
        receiverId: aliceId,
        senderWalletId: proWalletId,
        receiverWalletId: aliceWalletId,
        amount: BigInt(2000000000),
        tokenSymbol: "SOL",
        txHash: "txhash_3",
        msg: "Bonus payout",
      },
      {
        senderId: aliceId,
        receiverId: proId,
        senderWalletId: aliceWalletId,
        receiverWalletId: proWalletId,
        amount: BigInt(1000000000),
        tokenSymbol: "SOL",
        txHash: "txhash_4",
        msg: "Payment for collaboration",
      },
    ],
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
