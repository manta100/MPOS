import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all items
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { categoryId, search, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.ItemWhereInput = {
      storeId: req.user!.storeId,
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { barcode: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, color: true } },
          variants: { where: { isActive: true } },
          _count: { select: { variants: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.item.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ success: false, message: 'Failed to get items' });
  }
});

// Get item by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const item = await prisma.item.findFirst({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        modifierGroups: {
          include: { group: { include: { modifiers: true } } },
        },
        taxes: { include: { tax: true } },
      },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ success: false, message: 'Failed to get item' });
  }
});

// Get item by barcode
router.get('/barcode/:code', async (req: AuthRequest, res) => {
  try {
    const { code } = req.params;

    // First try exact match on item barcode
    let item = await prisma.item.findFirst({
      where: {
        barcode: code,
        storeId: req.user!.storeId,
        isActive: true,
      },
      include: {
        category: true,
        variants: { where: { isActive: true } },
      },
    });

    // If not found, try variant barcode
    if (!item) {
      const variant = await prisma.itemVariant.findFirst({
        where: { barcode: code, isActive: true },
        include: { item: { include: { category: true, variants: { where: { isActive: true } } } } },
      });

      if (variant) {
        item = variant.item;
        // Mark the matched variant
        (item as any).matchedVariant = variant;
      }
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get item by barcode error:', error);
    res.status(500).json({ success: false, message: 'Failed to get item' });
  }
});

// Search items
router.get('/search/query', async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;

    const items = await prisma.item.findMany({
      where: {
        storeId: req.user!.storeId,
        isActive: true,
        OR: [
          { name: { contains: q as string, mode: 'insensitive' } },
          { barcode: { contains: q as string, mode: 'insensitive' } },
          { sku: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ success: false, message: 'Failed to search items' });
  }
});

// Create item
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      sku,
      barcode,
      price,
      costPrice,
      imageUrl,
      trackInventory,
      lowStockThreshold,
      sellByWeight,
      weightUnit,
      isService,
      hasModifiers,
      hasVariants,
      notes,
    } = req.body;

    const item = await prisma.item.create({
      data: {
        name,
        description,
        categoryId,
        sku,
        barcode,
        price: new Prisma.Decimal(price),
        costPrice: costPrice ? new Prisma.Decimal(costPrice) : null,
        imageUrl,
        trackInventory,
        lowStockThreshold,
        sellByWeight,
        weightUnit,
        isService,
        hasModifiers,
        hasVariants,
        notes,
        storeId: req.user!.storeId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ success: false, message: 'Failed to create item' });
  }
});

// Update item
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      sku,
      barcode,
      price,
      costPrice,
      imageUrl,
      trackInventory,
      lowStockThreshold,
      sellByWeight,
      weightUnit,
      isService,
      hasModifiers,
      hasVariants,
      notes,
      isActive,
    } = req.body;

    const item = await prisma.item.updateMany({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      data: {
        name,
        description,
        categoryId,
        sku,
        barcode,
        price: price ? new Prisma.Decimal(price) : undefined,
        costPrice: costPrice ? new Prisma.Decimal(costPrice) : undefined,
        imageUrl,
        trackInventory,
        lowStockThreshold,
        sellByWeight,
        weightUnit,
        isService,
        hasModifiers,
        hasVariants,
        notes,
        isActive,
      },
    });

    if (item.count === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const updated = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const item = await prisma.item.updateMany({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      data: { isActive: false },
    });

    if (item.count === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
});

// Create variant
router.post('/:id/variants', async (req: AuthRequest, res) => {
  try {
    const { name, sku, barcode, price, costPrice, stockQuantity, lowStockThreshold, imageUrl } = req.body;

    const variant = await prisma.itemVariant.create({
      data: {
        itemId: req.params.id,
        storeId: req.user!.storeId,
        name,
        sku,
        barcode,
        price: new Prisma.Decimal(price),
        costPrice: costPrice ? new Prisma.Decimal(costPrice) : null,
        stockQuantity,
        lowStockThreshold,
        imageUrl,
      },
    });

    res.status(201).json({ success: true, data: variant });
  } catch (error) {
    console.error('Create variant error:', error);
    res.status(500).json({ success: false, message: 'Failed to create variant' });
  }
});

// Update variant
router.put('/variants/:variantId', async (req: AuthRequest, res) => {
  try {
    const { name, sku, barcode, price, costPrice, stockQuantity, lowStockThreshold, isActive, imageUrl } = req.body;

    const variant = await prisma.itemVariant.update({
      where: { id: req.params.variantId },
      data: {
        name,
        sku,
        barcode,
        price: price ? new Prisma.Decimal(price) : undefined,
        costPrice: costPrice ? new Prisma.Decimal(costPrice) : undefined,
        stockQuantity,
        lowStockThreshold,
        isActive,
        imageUrl,
      },
    });

    res.json({ success: true, data: variant });
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ success: false, message: 'Failed to update variant' });
  }
});

export default router;
