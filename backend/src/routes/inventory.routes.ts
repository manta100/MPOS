import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get inventory
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { lowStock, categoryId } = req.query;

    const where: Prisma.ItemWhereInput = {
      storeId: req.user!.storeId,
      isActive: true,
      trackInventory: true,
    };

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: { select: { name: true, color: true } },
        variants: { where: { isActive: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to get inventory' });
  }
});

// Get low stock items
router.get('/low-stock', async (req: AuthRequest, res) => {
  try {
    const items = await prisma.item.findMany({
      where: {
        storeId: req.user!.storeId,
        isActive: true,
        trackInventory: true,
      },
      include: {
        category: { select: { name: true } },
        variants: {
          where: {
            isActive: true,
            stockQuantity: { lte: prisma.item.fields.lowStockThreshold },
          },
        },
      },
    });

    // Filter items that are actually low stock
    const lowStockItems = items.filter((item) => {
      const hasLowStockVariant = item.variants.some(
        (v) => v.stockQuantity <= item.lowStockThreshold
      );
      return hasLowStockVariant;
    });

    res.json({ success: true, data: lowStockItems });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to get low stock items' });
  }
});

// Get inventory history
router.get('/history', async (req: AuthRequest, res) => {
  try {
    const { itemId, startDate, endDate, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.InventoryLogWhereInput = {
      storeId: req.user!.storeId,
    };

    if (itemId) where.itemId = itemId as string;
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) {
      where.createdAt = { ...where.createdAt as any, lte: new Date(endDate as string) };
    }

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        include: {
          item: { select: { name: true, sku: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.inventoryLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get inventory history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get inventory history' });
  }
});

// Get inventory valuation
router.get('/valuation', async (req: AuthRequest, res) => {
  try {
    const items = await prisma.item.findMany({
      where: {
        storeId: req.user!.storeId,
        isActive: true,
        trackInventory: true,
      },
      include: { variants: { where: { isActive: true } } },
    });

    let totalCost = 0;
    let totalRetail = 0;
    let totalItems = 0;

    for (const item of items) {
      if (item.variants.length > 0) {
        for (const variant of item.variants) {
          const cost = (item.costPrice?.toNumber() || 0) * variant.stockQuantity;
          const retail = variant.price.toNumber() * variant.stockQuantity;
          totalCost += cost;
          totalRetail += retail;
          totalItems += variant.stockQuantity;
        }
      } else {
        // Item without variants - would need stock quantity field
        totalItems += 0;
      }
    }

    res.json({
      success: true,
      data: {
        totalItems,
        totalCost,
        totalRetail,
        potentialProfit: totalRetail - totalCost,
      },
    });
  } catch (error) {
    console.error('Get valuation error:', error);
    res.status(500).json({ success: false, message: 'Failed to get valuation' });
  }
});

// Update item stock
router.put('/:itemId', async (req: AuthRequest, res) => {
  try {
    const { variantId, quantity, type, reason } = req.body;

    const item = await prisma.item.findFirst({
      where: { id: req.params.itemId, storeId: req.user!.storeId },
      include: { variants: { where: { id: variantId || undefined, isActive: true } } },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const variant = variantId ? item.variants[0] : null;
    const currentStock = variant ? variant.stockQuantity : 0;
    const newStock = quantity;

    // Update variant stock
    if (variant) {
      await prisma.itemVariant.update({
        where: { id: variantId },
        data: { stockQuantity: newStock },
      });
    }

    // Create inventory log
    await prisma.inventoryLog.create({
      data: {
        storeId: req.user!.storeId,
        itemId: req.params.itemId,
        variantId,
        changeType: type || 'ADJUSTMENT',
        quantityChange: newStock - currentStock,
        quantityBefore: currentStock,
        quantityAfter: newStock,
        reason,
        userId: req.user!.id,
      },
    });

    res.json({ success: true, data: { newStock } });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to update stock' });
  }
});

// Perform inventory count
router.post('/count', async (req: AuthRequest, res) => {
  try {
    const { counts } = req.body; // Array of { itemId, variantId?, counted, reason }

    const results = await Promise.all(
      counts.map(async (count: any) => {
        const item = await prisma.item.findFirst({
          where: { id: count.itemId, storeId: req.user!.storeId },
          include: { variants: { where: { id: count.variantId || undefined } } },
        });

        if (!item) return { itemId: count.itemId, success: false };

        const variant = item.variants[0];
        const currentStock = variant?.stockQuantity || 0;
        const difference = count.counted - currentStock;

        if (variant) {
          await prisma.itemVariant.update({
            where: { id: variant.id },
            data: { stockQuantity: count.counted },
          });
        }

        await prisma.inventoryLog.create({
          data: {
            storeId: req.user!.storeId,
            itemId: count.itemId,
            variantId: count.variantId,
            changeType: 'ADJUSTMENT',
            quantityChange: difference,
            quantityBefore: currentStock,
            quantityAfter: count.counted,
            reason: count.reason || 'Inventory count',
            userId: req.user!.id,
          },
        });

        return { itemId: count.itemId, success: true };
      })
    );

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Inventory count error:', error);
    res.status(500).json({ success: false, message: 'Failed to perform inventory count' });
  }
});

// Purchase Orders
router.get('/purchase-orders', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const where: Prisma.PurchaseOrderWhereInput = {
      storeId: req.user!.storeId,
    };

    if (status) where.status = status as any;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: true,
        createdBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get purchase orders' });
  }
});

router.post('/purchase-orders', async (req: AuthRequest, res) => {
  try {
    const { vendorId, items, notes, expectedDate } = req.body;

    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const total = item.quantity * item.unitCost;
      subtotal += total;
      return {
        itemId: item.itemId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitCost: new Prisma.Decimal(item.unitCost),
        taxAmount: new Prisma.Decimal(0),
      };
    });

    const order = await prisma.purchaseOrder.create({
      data: {
        storeId: req.user!.storeId,
        vendorId,
        createdById: req.user!.id,
        notes,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        items: { create: orderItems },
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(subtotal),
      },
      include: { items: true, vendor: true },
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create purchase order' });
  }
});

router.post('/purchase-orders/:id/receive', async (req: AuthRequest, res) => {
  try {
    const order = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: {
        status: 'RECEIVED',
        receivedDate: new Date(),
      },
    });

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Receive PO error:', error);
    res.status(500).json({ success: false, message: 'Failed to receive purchase order' });
  }
});

// Transfers
router.get('/transfers', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const where: Prisma.TransferWhereInput = {};

    if (status) where.status = status as any;

    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        fromStore: { select: { name: true } },
        toStore: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: transfers });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get transfers' });
  }
});

router.post('/transfers', async (req: AuthRequest, res) => {
  try {
    const { toStoreId, items, notes } = req.body;

    const transfer = await prisma.transfer.create({
      data: {
        fromStoreId: req.user!.storeId,
        toStoreId,
        createdById: req.user!.id,
        notes,
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create transfer' });
  }
});

export default router;
