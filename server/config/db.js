import mongoose from 'mongoose';
import { config } from './index.js';

let cached = globalThis.__examflow_mongoose || null;

export async function connectDB() {
  mongoose.set('strictQuery', true);
  if (cached && mongoose.connection.readyState === 1) return cached;
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    cached = conn;
    globalThis.__examflow_mongoose = conn;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    if (config.env === 'development') process.exit(1);
    throw err;
  }
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}
