import mongoose from 'mongoose';
import { env } from './env.js';

interface DbHealthStatus {
  status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'unknown';
  readyState: number;
  host?: string;
  name?: string;
}

/**
 * Connects to MongoDB with automatic retry and event listeners.
 */
export async function connectDb(): Promise<typeof mongoose> {
  const uri = env.MONGODB_URI;

  // Mask credentials if present for safe logging
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

  // Prevent multiple connections
  if (mongoose.connection.readyState === 1) {
    console.log(`[Database] Already connected to ${maskedUri}`);
    return mongoose;
  }

  // Register connection event listeners
  mongoose.connection.on('connected', () => {
    console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] MongoDB reconnected successfully');
  });

  try {
    console.log(`[Database] Connecting to MongoDB at ${maskedUri}...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    return conn;
  } catch (error: any) {
    console.error(`[Database] Initial MongoDB connection failed: ${error.message}`);
    console.warn('[Database] The server will still run, but operations requiring database access will fail until MongoDB is available.');
    return mongoose;
  }
}

/**
 * Disconnects from MongoDB gracefully.
 */
export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed gracefully.');
  }
}

/**
 * Returns current health status of the database connection.
 */
export function checkDbHealth(): DbHealthStatus {
  const readyStates: Record<number, DbHealthStatus['status']> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const state = mongoose.connection.readyState;
  return {
    status: readyStates[state] || 'unknown',
    readyState: state,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  };
}
