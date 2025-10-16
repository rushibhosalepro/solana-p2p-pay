import { getAuth } from "@clerk/express";
import prisma from "database";
import express from "express";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const q = (req.query.q as string)?.trim();
    if (!q) {
      return res
        .status(400)
        .json({ ok: false, error: "Search query is required" });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { startsWith: q, mode: "insensitive" } },
          { email: { startsWith: q, mode: "insensitive" } },
          { phone: { startsWith: q, mode: "insensitive" } },
          { wallets: { some: { publicKey: { startsWith: q } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        wallets: { select: { publicKey: true } },
      },
      take: 20,
    });

    return res.json({
      ok: true,
      count: users.length,
      users: users.map((u) => ({
        id: u.id,
        name: u.name || "Unnamed User",
        email: u.email,
        phone: u.phone,
        publicKeys: u.wallets.map((w) => w.publicKey),
      })),
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/info/:publicKey", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { publicKey } = req.params;
    if (!publicKey)
      return res.status(400).json({ error: "missing public key" });

    const users = await prisma.wallet.findFirst({
      where: {
        publicKey,
      },
      include: {
        user: true,
      },
    });

    return res.json({
      ok: true,
      user: {
        email: users?.user?.email,
        name: users?.user?.name,
        publicKey,
      },
    });
  } catch (error) {
    console.error("Error searching user:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
export default router;
