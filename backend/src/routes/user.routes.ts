import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all users (admin only)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { storeId: req.user!.storeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        avatarUrl: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        hourlyRate: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
});

// Create user
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, email, password, role, pinCode, hourlyRate } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'CASHIER',
        pinCode,
        hourlyRate,
        storeId: req.user!.storeId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, role, pinCode, hourlyRate, isActive } = req.body;

    const user = await prisma.user.updateMany({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      data: {
        name,
        role,
        pinCode,
        hourlyRate,
        isActive,
      },
    });

    if (user.count === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        hourlyRate: true,
      },
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Delete user (deactivate)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.updateMany({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      data: { isActive: false },
    });

    if (user.count === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

export default router;
