import mongoose from 'mongoose';

// Use DATABASE_URI from environment variables with a default fallback
const MONGO_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/iceCreamWorkshop';

const connectDB = async (): Promise<void> => {
  try {
    // Ensure MONGO_URI is defined before attempting to connect
    if (!MONGO_URI) {
      throw new Error('DATABASE_URI is not defined in environment variables.');
    }
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error(`MongoDB Connection Error: ${errorMessage}`);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;