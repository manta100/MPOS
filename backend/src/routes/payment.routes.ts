import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all payment methods
router.get('/', async (req: AuthRequest, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { storeId: req.user!.storeId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payments' });
  }
});

// Create payment method
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, type, isDefault, accountName } = req.body;

    // If setting as default, unset others
    if (isDefault) {
      await prisma.payment.updateMany({
        where: { storeId: req.user!.storeId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const payment = await prisma.payment.create({
      data: {
        storeId: req.user!.storeId,
        name,
        type: type || 'CASH',
        isDefault: isDefault || false,
        accountName,
      },
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment' });
  }
});

// Update payment method
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, type, isDefault, accountName, isActive, sortOrder } = req.body;

    if (isDefault) {
      await prisma.payment.updateMany({
        where: { storeId: req.user!.storeId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { name, type, isDefault, accountName, isActive, sortOrder },
    });

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment' });
  }
});

// Delete payment method
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.payment.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Payment method deleted' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete payment' });
  }
});

export default router;
