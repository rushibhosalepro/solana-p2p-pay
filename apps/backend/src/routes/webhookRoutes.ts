// @ts-nocheck
import prisma from "database";
import express from "express";
import { createHelius } from "helius-sdk";
import { config } from "../config";
const router = express.Router();

const helius = createHelius({
  apiKey: config.heliusApiKey,
});

router.post("/clerk", async (req, res) => {
  try {
    const body = req.body;
    console.log("Received Clerk webhook:", body);

    switch (body.type) {
      case "user.created": {
        const userData = body.data;

        const user = await prisma.user.create({
          data: {
            email: userData.email_addresses[0]?.email_address || "",
            phone: userData.phone_numbers?.[0]?.phone_number || "",
            name: `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
            clerkUserId: userData.id,
          },
        });

        console.log("User saved to DB:", user);
        break;
      }

      case "user.updated": {
        const userData = body.data;

        const updatedUser = await prisma.user.update({
          where: {
            clerkUserId: userData.id,
          },
          data: {
            email: userData.email_addresses[0]?.email_address || "",
            phone: userData.phone_numbers?.[0]?.phone_number || "",
            name: `${userData.first_name || ""} ${userData.last_name || ""}`.trim(),
          },
        });

        console.log("User updated in DB:", updatedUser);
        break;
      }

      default:
        console.log("Other event:", body.type);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error handling webhook:", err);

    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
