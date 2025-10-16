import { Connection } from "@solana/web3.js";
class RPCConnectionManager {
  private connections: Connection[] = [];
  private currentIndex = 0;
  private readonly maxRetries = 3;

  constructor(rpcUrls: string[]) {
    // Use multiple RPC endpoints for load balancing and failover
    this.connections = rpcUrls.map(
      (url) =>
        new Connection(url, {
          commitment: "confirmed",
          confirmTransactionInitialTimeout: 60000,
        })
    );
  }

  // Round-robin load balancing
  getConnection(): Connection {
    const connection = this.connections[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.connections.length;
    return connection!;
  }

  // Retry logic for failed requests
  async withRetry<T>(
    operation: (connection: Connection) => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        const connection = this.getConnection();
        return await operation(connection);
      } catch (error) {
        console.error(
          `RPC request failed (attempt ${i + 1}/${retries}):`,
          error
        );
        if (i === retries - 1) throw error;
        await this.sleep(1000 * (i + 1)); // Exponential backoff
      }
    }
    throw new Error("Max retries reached");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// const rpcManager = new RPCConnectionManager([
//   process.env.SOLANA_RPC_URL_1 || "https://api.mainnet-beta.solana.com",
//   process.env.SOLANA_RPC_URL_2 || "https://solana-api.projectserum.com",

// ]);

const rpcManager = new RPCConnectionManager([
  process.env.SOLANA_RPC_URL_1 || "https://api.devnet.solana.com", // Official Solana Devnet
  //   process.env.SOLANA_RPC_URL_2 || "https://devnet.solana.rpcpool.com", // RPC Pool Devnet
  //   process.env.SOLANA_RPC_URL_3 || "https://solana-devnet.rpcpool.com", // Another Devnet RPC
  process.env.SOLANA_RPC_URL_4 || "https://api.devnet.solana.com", // fallback
]);
export default rpcManager;
