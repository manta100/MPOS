import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all categories
router.get('/', async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        storeId: req.user!.storeId,
        isActive: true,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to get categories' });
  }
});

// Get category by ID with items
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const category = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Failed to get category' });
  }
});

// Create category
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, description, parentId, imageUrl, color, sortOrder } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
        parentId,
        imageUrl,
        color,
        sortOrder: sortOrder || 0,
        storeId: req.user!.storeId,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, description, parentId, imageUrl, color, sortOrder, isActive } = req.body;

    const category = await prisma.category.updateMany({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      data: {
        name,
        description,
        parentId,
        imageUrl,
        color,
        sortOrder,
        isActive,
      },
    });

    if (category.count === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const updated = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const category = await prisma.category.updateMany({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      data: { isActive: false },
    });

    if (category.count === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// Reorder categories
router.put('/reorder', async (req: AuthRequest, res) => {
  try {
    const { categories } = req.body; // Array of { id, sortOrder }

    await prisma.$transaction(
      categories.map((cat: { id: string; sortOrder: number }) =>
        prisma.category.update({
          where: { id: cat.id },
          data: { sortOrder: cat.sortOrder },
        })
      )
    );

    res.json({ success: true, message: 'Categories reordered' });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder categories' });
  }
});

export default router;
