import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JWT_SECRET, SALT_ROUNDS, TOKEN_EXPIRY, MIN_PASSWORD_LENGTH } from '../config/auth';

/**
 * Seed the default user if no users exist in the database.
 * Uses findOneAndUpdate with upsert to prevent race conditions on concurrent startup.
 */
export const seedDefaultUser = async (): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultUsername = (process.env.DEFAULT_USERNAME || 'tresxalats').toLowerCase();
      const defaultPassword = process.env.DEFAULT_PASSWORD || 'placeholder';

      if (!process.env.DEFAULT_PASSWORD || process.env.DEFAULT_PASSWORD === 'placeholder') {
        console.warn('WARNING: Using default password "placeholder". Set DEFAULT_PASSWORD in .env for production.');
      }

      const passwordHash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
      await User.findOneAndUpdate(
        { username: defaultUsername },
        { $setOnInsert: { username: defaultUsername, passwordHash } },
        { upsert: true },
      );
      console.log(`Default user '${defaultUsername}' created.`);
    }
  } catch (error) {
    console.error('Error seeding default user:', error);
  }
};

/**
 * Authenticate a user and return a JWT token (with tokenVersion).
 */
export const login = async (
  username: string,
  password: string,
): Promise<{ token: string; username: string } | null> => {
  const user = await User.findOne({ username: username.trim().toLowerCase() });

  if (!user) {
    return null;
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return null;
  }

  const token = jwt.sign(
    { userId: String(user._id), username: user.username, tokenVersion: user.tokenVersion },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY } as jwt.SignOptions,
  );

  return { token, username: user.username };
};

/**
 * Verify a JWT token and return user info.
 */
export const verifyToken = async (
  token: string,
): Promise<{ userId: string; username: string } | null> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; tokenVersion?: number };
    const user = await User.findById(decoded.userId);
    if (!user) return null;
    // Check token version (invalidated on password change)
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
      return null;
    }
    return { userId: decoded.userId, username: decoded.username };
  } catch {
    return null;
  }
};

/**
 * Change the password for a user. Increments tokenVersion to invalidate existing sessions.
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> => {
  const user = await User.findById(userId);
  if (!user) return false;

  const currentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentValid) return false;

  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) return false;

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Use atomic update to avoid race conditions on tokenVersion increment
  const updated = await User.findOneAndUpdate(
    { _id: userId },
    { $set: { passwordHash: newHash }, $inc: { tokenVersion: 1 } },
    { new: true },
  );
  if (!updated) return false;

  return true;
};
