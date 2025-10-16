import { TransactionSyncService } from "./src/transactionSync";
import { WebSocketMonitorService } from "./src/websocketMonitor";

const syncService = new TransactionSyncService();
// const wsMonitor = new WebSocketMonitorService(
//   process.env.SOLANA_WS_URL || "wss://api.mainnet-beta.solana.com"
// );

const wsMonitor = new WebSocketMonitorService(
  process.env.SOLANA_WS_URL || "https://api.devnet.solana.com" // HTTP RPC
);

wsMonitor.subscribeAllWallets();

setInterval(
  () => {
    syncService.syncAllWallets();
  },
  5 * 60 * 1000
);

// Initial sync on startup
syncService.syncAllWallets();
