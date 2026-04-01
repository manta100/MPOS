import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all settings
router.get('/', async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.setting.findMany({
      where: { storeId: req.user!.storeId },
    });

    const settingsObj = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get settings' });
  }
});

// Get settings by category
router.get('/:category', async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.setting.findMany({
      where: { storeId: req.user!.storeId, category: req.params.category },
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get settings' });
  }
});

// Update settings
router.put('/', async (req: AuthRequest, res) => {
  try {
    const { settings } = req.body; // { key: value }

    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.setting.upsert({
          where: { storeId_key: { storeId: req.user!.storeId, key } },
          create: { storeId: req.user!.storeId, key, value: value as string },
          update: { value: value as string },
        })
      )
    );

    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// Store settings
router.get('/store', async (req: AuthRequest, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.user!.storeId },
    });

    res.json({ success: true, data: store });
  } catch (error) {
    console.error('Get store settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get store settings' });
  }
});

router.put('/store', async (req: AuthRequest, res) => {
  try {
    const { name, address, phone, email, currency, timezone, logoUrl } = req.body;

    const store = await prisma.store.update({
      where: { id: req.user!.storeId },
      data: { name, address, phone, email, currency, timezone, logoUrl },
    });

    res.json({ success: true, data: store });
  } catch (error) {
    console.error('Update store settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update store settings' });
  }
});

// Tax settings
router.get('/tax', async (req: AuthRequest, res) => {
  try {
    const taxes = await prisma.tax.findMany({
      where: { storeId: req.user!.storeId, isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: taxes });
  } catch (error) {
    console.error('Get tax settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tax settings' });
  }
});

// Receipt settings
router.get('/receipt', async (req: AuthRequest, res) => {
  try {
    const template = await prisma.receiptTemplate.findFirst({
      where: { storeId: req.user!.storeId, isDefault: true },
    });

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Get receipt settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get receipt settings' });
  }
});

// Currency settings
router.get('/currency', async (req: AuthRequest, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.user!.storeId },
      select: { currency: true },
    });

    res.json({ success: true, data: { currency: store?.currency || 'USD' } });
  } catch (error) {
    console.error('Get currency settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get currency settings' });
  }
});

export default router;
