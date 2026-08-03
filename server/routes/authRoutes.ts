import { Router, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma.js';
import { hashPassword, verifyPassword, hashRecoveryKey, verifyRecoveryKey } from '../utils/crypto.js';
import { generateRecoveryKey } from '../utils/keyGen.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ourverse_cosmic_jwt_secret_key_2026_super_secure';

// Input Validation Schemas
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().max(50).optional(),
  avatarUrl: z.string().max(300).optional(),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const recoverSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  recoveryKey: z.string().min(1, 'Recovery Key is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional().nullable(),
  avatarUrl: z.string().max(300).optional().nullable(),
});

/**
 * Helper to strip hashes from user object
 */
function sanitizeUser(user: { id: string; username: string; displayName: string | null; avatarUrl: string | null; createdAt: Date }) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
  };
}

/**
 * POST /api/auth/register
 * Register a new user without email or phone number.
 */
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Invalid input payload';
      return res.status(400).json({ error: errorMsg });
    }

    const { username: rawUsername, password, displayName, avatarUrl } = parseResult.data;
    const username = rawUsername.toLowerCase().trim();

    // Check if username is already taken or permanently reserved
    const existingReserved = await prisma.reservedUsername.findUnique({
      where: { username },
    });

    if (existingReserved) {
      return res.status(400).json({
        error: 'This username is permanently reserved and cannot be used.',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Username is already taken.',
      });
    }

    // Generate Recovery Key & Hash Secrets using Argon2id
    const recoveryKey = generateRecoveryKey();
    const passwordHash = await hashPassword(password);
    const recoveryKeyHash = await hashRecoveryKey(recoveryKey);

    // Create user and reserve username permanently in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          username,
          passwordHash,
          recoveryKeyHash,
          displayName: displayName?.trim() || username,
          avatarUrl: avatarUrl?.trim() || null,
        },
      });

      await tx.reservedUsername.create({
        data: {
          username,
          originalUserId: createdUser.id,
          reason: 'REGISTERED',
        },
      });

      return createdUser;
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: sanitizeUser(newUser),
      recoveryKey, // Sent ONCE upon registration
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with Username + Password
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const { username: rawUsername, password } = parseResult.data;
    const username = rawUsername.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValidPassword = await verifyPassword(user.passwordHash, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * POST /api/auth/recover
 * Password recovery via Username + Recovery Key + New Password
 */
router.post('/recover', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = recoverSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Invalid recovery payload';
      return res.status(400).json({ error: errorMsg });
    }

    const { username: rawUsername, recoveryKey, newPassword } = parseResult.data;
    const username = rawUsername.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or recovery key' });
    }

    const isValidKey = await verifyRecoveryKey(user.recoveryKeyHash, recoveryKey);
    if (!isValidKey) {
      return res.status(400).json({ error: 'Invalid recovery key for this username' });
    }

    // Hash new password and generate a fresh recovery key
    const newPasswordHash = await hashPassword(newPassword);
    const newRecoveryKey = generateRecoveryKey();
    const newRecoveryKeyHash = await hashRecoveryKey(newRecoveryKey);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        recoveryKeyHash: newRecoveryKeyHash,
      },
    });

    return res.json({
      message: 'Password reset successfully. A new Recovery Key has been generated for your security.',
      newRecoveryKey,
    });
  } catch (error: any) {
    console.error('Password Recovery Error:', error);
    return res.status(500).json({ error: 'Internal server error during password recovery' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user display name and avatar URL
 */
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid profile data' });
    }

    const { displayName, avatarUrl } = parseResult.data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined ? { displayName: displayName?.trim() || null } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl?.trim() || null } : {}),
      },
    });

    return res.json({
      message: 'Profile updated successfully',
      user: sanitizeUser(updatedUser),
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * DELETE /api/auth/account
 * Delete account permanently.
 * Crucial Rule 7: Username stays in ReservedUsername permanently so it can NEVER be reused.
 */
router.delete('/account', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Ensure tombstone reservation entry exists
      await tx.reservedUsername.upsert({
        where: { username: user.username },
        create: {
          username: user.username,
          originalUserId: user.id,
          reason: 'DELETED',
        },
        update: {
          reason: 'DELETED',
        },
      });

      // Remove user record
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return res.json({
      message: 'Account deleted. Your username remains permanently reserved and will never be reused.',
    });
  } catch (error: any) {
    console.error('Account Deletion Error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
