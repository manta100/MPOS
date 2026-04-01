import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all discounts
router.get('/', async (req: AuthRequest, res) => {
  try {
    const discounts = await prisma.discount.findMany({
      where: { storeId: req.user!.storeId },
      orderBy: { priority: 'desc' },
    });

    res.json({ success: true, data: discounts });
  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get discounts' });
  }
});

// Create discount
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      type,
      value,
      applicableTo,
      itemsJson,
      minPurchase,
      maxDiscount,
      isAutoApply,
      startsAt,
      endsAt,
      priority,
    } = req.body;

    const discount = await prisma.discount.create({
      data: {
        storeId: req.user!.storeId,
        name,
        type: type || 'PERCENTAGE',
        value: new Prisma.Decimal(value),
        applicableTo: applicableTo || 'ALL',
        itemsJson: itemsJson || [],
        minPurchase: minPurchase ? new Prisma.Decimal(minPurchase) : null,
        maxDiscount: maxDiscount ? new Prisma.Decimal(maxDiscount) : null,
        isAutoApply: isAutoApply || false,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        priority: priority || 0,
      },
    });

    res.status(201).json({ success: true, data: discount });
  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({ success: false, message: 'Failed to create discount' });
  }
});

// Update discount
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      type,
      value,
      applicableTo,
      itemsJson,
      minPurchase,
      maxDiscount,
      isAutoApply,
      startsAt,
      endsAt,
      priority,
      isActive,
    } = req.body;

    const discount = await prisma.discount.update({
      where: { id: req.params.id },
      data: {
        name,
        type,
        value: value ? new Prisma.Decimal(value) : undefined,
        applicableTo,
        itemsJson,
        minPurchase: minPurchase ? new Prisma.Decimal(minPurchase) : undefined,
        maxDiscount: maxDiscount ? new Prisma.Decimal(maxDiscount) : undefined,
        isAutoApply,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        priority,
        isActive,
      },
    });

    res.json({ success: true, data: discount });
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({ success: false, message: 'Failed to update discount' });
  }
});

// Delete discount
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.discount.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Discount deleted' });
  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete discount' });
  }
});

export default router;
