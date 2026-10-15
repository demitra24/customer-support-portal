import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/relay_support';
  await mongoose.connect(uri);
  console.log(`[db] connected -> ${mongoose.connection.name}`);
};