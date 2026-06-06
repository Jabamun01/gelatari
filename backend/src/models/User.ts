import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, 'Username must be at least 2 characters.'],
      maxlength: [50, 'Username must be at most 50 characters.'],
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: [60, 'Invalid password hash length.'],
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const User = model<IUser>('User', userSchema);

export default User;
