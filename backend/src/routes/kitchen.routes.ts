import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get kitchen orders
router.get('/orders', async (req: AuthRequest, res) => {
  try {
    const { status, stationId } = req.query;

    const where: any = { storeId: req.user!.storeId };
    if (status) where.status = status;
    if (stationId) where.stationId = stationId;

    const orders = await prisma.kitchenOrder.findMany({
      where,
      include: {
        ticket: {
          include: {
            user: { select: { name: true } },
            customer: { select: { name: true } },
          },
        },
        items: {
          include: {
            ticketItem: { include: { item: true } },
          },
        },
        station: true,
      },
      orderBy: [{ priority: 'desc' }, { sentAt: 'asc' }],
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get kitchen orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get kitchen orders' });
  }
});

// Get new orders (for polling)
router.get('/orders/new', async (req: AuthRequest, res) => {
  try {
    const { since } = req.query;
    const sinceDate = since ? new Date(since as string) : new Date(Date.now() - 60000);

    const orders = await prisma.kitchenOrder.findMany({
      where: {
        storeId: req.user!.storeId,
        sentAt: { gte: sinceDate },
      },
      include: {
        ticket: {
          include: {
            user: { select: { name: true } },
            customer: { select: { name: true } },
          },
        },
        items: {
          include: {
            ticketItem: { include: { item: true } },
          },
        },
      },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get new orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get new orders' });
  }
});

// Update order status
router.post('/orders/:id/status', async (req: AuthRequest, res) => {
  try {
    const { status, itemId } = req.body;

    if (itemId) {
      // Update specific item
      await prisma.kitchenOrderItem.update({
        where: { id: itemId },
        data: {
          status: status.toUpperCase(),
          completedAt: status === 'READY' ? new Date() : null,
        },
      });
    } else {
      // Update entire order
      const data: any = { status: status.toUpperCase() };
      if (status === 'in_progress') data.startedAt = new Date();
      if (status === 'ready') data.readyAt = new Date();
      if (status === 'served') data.servedAt = new Date();

      await prisma.kitchenOrder.update({
        where: { id: req.params.id },
        data,
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`store_${req.user!.storeId}`).emit('kitchen:statusChanged', { orderId: req.params.id, status });

    res.json({ success: true });
  } catch (error) {
    console.error('Update kitchen order error:', error);
    res.status(500).json({ success: false, message: 'Failed to update kitchen order' });
  }
});

// Get kitchen stations
router.get('/stations', async (req: AuthRequest, res) => {
  try {
    const stations = await prisma.kitchenStation.findMany({
      where: { storeId: req.user!.storeId, isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: stations });
  } catch (error) {
    console.error('Get stations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get stations' });
  }
});

router.post('/stations', async (req: AuthRequest, res) => {
  try {
    const { name, printerName } = req.body;

    const station = await prisma.kitchenStation.create({
      data: {
        storeId: req.user!.storeId,
        name,
        printerName,
      },
    });

    res.status(201).json({ success: true, data: station });
  } catch (error) {
    console.error('Create station error:', error);
    res.status(500).json({ success: false, message: 'Failed to create station' });
  }
});

router.put('/stations/:id', async (req: AuthRequest, res) => {
  try {
    const { name, printerName, isActive } = req.body;

    const station = await prisma.kitchenStation.update({
      where: { id: req.params.id },
      data: { name, printerName, isActive },
    });

    res.json({ success: true, data: station });
  } catch (error) {
    console.error('Update station error:', error);
    res.status(500).json({ success: false, message: 'Failed to update station' });
  }
});

// Tables
router.get('/tables', async (req: AuthRequest, res) => {
  try {
    const tables = await prisma.table.findMany({
      where: { storeId: req.user!.storeId, isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: tables });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tables' });
  }
});

router.post('/tables', async (req: AuthRequest, res) => {
  try {
    const { name, capacity, positionX, positionY } = req.body;

    const table = await prisma.table.create({
      data: {
        storeId: req.user!.storeId,
        name,
        capacity,
        positionX,
        positionY,
      },
    });

    res.status(201).json({ success: true, data: table });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ success: false, message: 'Failed to create table' });
  }
});

router.put('/tables/:id', async (req: AuthRequest, res) => {
  try {
    const { name, capacity, positionX, positionY, isActive } = req.body;

    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: { name, capacity, positionX, positionY, isActive },
    });

    res.json({ success: true, data: table });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ success: false, message: 'Failed to update table' });
  }
});

export default router;
