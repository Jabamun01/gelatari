"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
// Use DATABASE_URI from environment variables with a default fallback
const MONGO_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/iceCreamWorkshop';
const connectDB = async () => {
    try {
        // Ensure MONGO_URI is defined before attempting to connect
        if (!MONGO_URI) {
            throw new Error('DATABASE_URI is not defined in environment variables.');
        }
        await mongoose_1.default.connect(MONGO_URI);
        console.log('MongoDB Connected...');
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error(`MongoDB Connection Error: ${errorMessage}`);
        // Exit process with failure
        process.exit(1);
    }
};
exports.default = connectDB;
