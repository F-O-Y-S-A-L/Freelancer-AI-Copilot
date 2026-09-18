import mongoose from "mongoose";
import { ENV } from "./env.js";
import { PRO_PLAN_AI_CREDITS_LIMIT } from "../../shared/planConfig.js";

let isConnected = false;
let isInMemoryMode = false;
let connectionPromise: Promise<void> | null = null;

// Memory storage fallback when local Mongo daemon is unavailable
export const memoryStore = {
  users: [] as any[],
  profiles: [] as any[],
  clients: [] as any[],
  inquiries: [] as any[],
  templates: [] as any[],
  notifications: [] as any[],
  followUps: [] as any[],
};

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1 && isConnected) return;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      mongoose.set("strictQuery", true);
      mongoose.set("bufferCommands", false);
      await mongoose.connect(ENV.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      isInMemoryMode = false;
      console.log("MongoDB connected successfully via Mongoose.");

      try {
        const { User } = await import("../models/User.js");
        await User.updateMany(
          {
            $or: [
              { aiCreditsRemaining: { $exists: false } },
              { aiCreditsRemaining: { $lt: PRO_PLAN_AI_CREDITS_LIMIT } },
            ],
          },
          { $set: { aiCreditsRemaining: PRO_PLAN_AI_CREDITS_LIMIT } },
        );
      } catch (migErr) {
        console.warn("User credits migration notice:", migErr);
      }
    } catch (error) {
      isConnected = false;
      isInMemoryMode = false;
      console.error("MongoDB connection failed:", error);
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export function isUsingMemoryDB(): boolean {
  return isInMemoryMode;
}

export function getDbStatus(): {
  connected: boolean;
  mode: "mongodb" | "memory";
} {
  return {
    connected: isConnected,
    mode: isInMemoryMode ? "memory" : "mongodb",
  };
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnection error
    }
  }
  isConnected = false;
}
