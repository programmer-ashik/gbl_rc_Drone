import mongoose from 'mongoose';
import { config } from '../config/env.js';

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(config.MONGODB_URI);
  console.log('MongoDB connected');
};
