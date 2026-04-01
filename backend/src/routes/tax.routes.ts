import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all taxes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const taxes = await prisma.tax.findMany({
      where: { storeId: req.user!.storeId },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: taxes });
  } catch (error) {
    console.error('Get taxes error:', error);
    res.status(500).json({ success: false, message: 'Failed to get taxes' });
  }
});

// Create tax
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      rate,
      inclusive,
      applicableTo,
      itemsJson,
      diningOptions,
      isDefault,
    } = req.body;

    // If setting as default, unset others
    if (isDefault) {
      await prisma.tax.updateMany({
        where: { storeId: req.user!.storeId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const tax = await prisma.tax.create({
      data: {
        storeId: req.user!.storeId,
        name,
        rate: new Prisma.Decimal(rate),
        inclusive: inclusive || false,
        applicableTo: applicableTo || 'ALL',
        itemsJson: itemsJson || [],
        diningOptions: diningOptions || [],
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({ success: true, data: tax });
  } catch (error) {
    console.error('Create tax error:', error);
    res.status(500).json({ success: false, message: 'Failed to create tax' });
  }
});

// Update tax
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      rate,
      inclusive,
      applicableTo,
      itemsJson,
      diningOptions,
      isDefault,
      isActive,
    } = req.body;

    if (isDefault) {
      await prisma.tax.updateMany({
        where: { storeId: req.user!.storeId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const tax = await prisma.tax.update({
      where: { id: req.params.id },
      data: {
        name,
        rate: rate ? new Prisma.Decimal(rate) : undefined,
        inclusive,
        applicableTo,
        itemsJson,
        diningOptions,
        isDefault,
        isActive,
      },
    });

    res.json({ success: true, data: tax });
  } catch (error) {
    console.error('Update tax error:', error);
    res.status(500).json({ success: false, message: 'Failed to update tax' });
  }
});

// Delete tax
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.tax.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Tax deleted' });
  } catch (error) {
    console.error('Delete tax error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete tax' });
  }
});

export default router;
