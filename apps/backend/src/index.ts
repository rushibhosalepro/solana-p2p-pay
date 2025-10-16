import { clerkMiddleware, requireAuth } from "@clerk/express";
import cors from "cors";
import express from "express";
import { config } from "./config";
// import transactionRoutes from "./routes/transactions";
import transactionRoutes from "./routes/transactions";
import userRoutes from "./routes/users";
import walletRoutes from "./routes/wallet";
import webhookRoutes from "./routes/webhookRoutes";
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

app.use("/webhook", webhookRoutes);

// Protected API routes with custom error handling
app.use("/api/v0/wallet", requireAuth(), walletRoutes);
app.use("/api/v0/users", requireAuth(), userRoutes);
app.use("/api/v0/transactions", requireAuth(), transactionRoutes);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
