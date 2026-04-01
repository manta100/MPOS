import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();

export const createStore = async (req: Request, res: Response) => {
  try {
    const { name, address, phone, email, currency, timezone } = req.body;

    const store = await prisma.store.create({
      data: {
        name,
        address,
        phone,
        email,
        currency: currency || 'USD',
        timezone: timezone || 'UTC',
      },
    });

    // Create default payment methods
    await prisma.payment.createMany({
      data: [
        { storeId: store.id, name: 'Cash', type: 'CASH', isDefault: true, sortOrder: 1 },
        { storeId: store.id, name: 'Card', type: 'CARD', sortOrder: 2 },
      ],
    });

    // Create default tax
    await prisma.tax.create({
      data: {
        storeId: store.id,
        name: 'Default Tax',
        rate: 0,
        isDefault: true,
      },
    });

    res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create store',
    });
  }
};

export const getStores = async (req: AuthRequest, res: Response) => {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stores',
    });
  }
};

export const getStore = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found',
      });
    }

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get store',
    });
  }
};

export const updateStore = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, currency, timezone, logoUrl } = req.body;

    const store = await prisma.store.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        email,
        currency,
        timezone,
        logoUrl,
      },
    });

    res.json({
      success: true,
      data: store,
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update store',
    });
  }
};
