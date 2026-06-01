import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'gelatari-dev-secret-change-in-production';
const SALT_ROUNDS = 12;

/**
 * Seed the default user if no users exist in the database.
 */
export const seedDefaultUser = async (): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultUsername = process.env.DEFAULT_USERNAME || 'tresxalats';
      const defaultPassword = process.env.DEFAULT_PASSWORD || 'placeholder';

      const passwordHash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
      await User.create({ username: defaultUsername, passwordHash });
      console.log(`Default user '${defaultUsername}' created.`);
    }
  } catch (error) {
    console.error('Error seeding default user:', error);
  }
};

/**
 * Authenticate a user and return a JWT token.
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
    { userId: String(user._id), username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' },
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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    const user = await User.findById(decoded.userId);
    if (!user) return null;
    return { userId: decoded.userId, username: decoded.username };
  } catch {
    return null;
  }
};

/**
 * Change the password for a user.
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

  if (!newPassword || newPassword.length < 4) return false;

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordHash = newHash;
  await user.save();
  return true;
};
