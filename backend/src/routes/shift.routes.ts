import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all shifts
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, userId } = req.query;

    const where: Prisma.ShiftWhereInput = { storeId: req.user!.storeId };
    if (status) where.status = status as 'OPEN' | 'CLOSED';
    if (userId) where.userId = userId as string;

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        user: { select: { name: true } },
        closedBy: { select: { name: true } },
        _count: { select: { cashEvents: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: shifts });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get shifts' });
  }
});

// Get current shift
router.get('/current', async (req: AuthRequest, res) => {
  try {
    const shift = await prisma.shift.findFirst({
      where: {
        userId: req.user!.id,
        storeId: req.user!.storeId,
        status: 'OPEN',
      },
      include: { cashEvents: true },
    });

    res.json({ success: true, data: shift });
  } catch (error) {
    console.error('Get current shift error:', error);
    res.status(500).json({ success: false, message: 'Failed to get current shift' });
  }
});

// Open shift
router.post('/', async (req: AuthRequest, res) => {
  try {
    // Check for existing open shift
    const existingShift = await prisma.shift.findFirst({
      where: { userId: req.user!.id, status: 'OPEN' },
    });

    if (existingShift) {
      return res.status(400).json({ success: false, message: 'You already have an open shift' });
    }

    const { openingCash } = req.body;

    const shift = await prisma.shift.create({
      data: {
        storeId: req.user!.storeId,
        userId: req.user!.id,
        openingCash: new Prisma.Decimal(openingCash || 0),
        expectedCash: new Prisma.Decimal(openingCash || 0),
        status: 'OPEN',
      },
    });

    res.status(201).json({ success: true, data: shift });
  } catch (error) {
    console.error('Open shift error:', error);
    res.status(500).json({ success: false, message: 'Failed to open shift' });
  }
});

// Close shift
router.post('/:id/close', async (req: AuthRequest, res) => {
  try {
    const { actualCash, notes } = req.body;

    const shift = await prisma.shift.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId },
      include: { cashEvents: true },
    });

    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    // Calculate expected cash
    const cashIn = shift.cashEvents
      .filter((e) => e.eventType === 'FLOAT' || e.eventType === 'PAY_IN')
      .reduce((sum, e) => sum + e.amount.toNumber(), 0);

    const cashOut = shift.cashEvents
      .filter((e) => e.eventType === 'PAY_OUT' || e.eventType === 'SAFE_DROP')
      .reduce((sum, e) => sum + e.amount.toNumber(), 0);

    // Get total cash payments from tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: shift.userId,
        status: 'CLOSED',
        closedAt: { gte: shift.openedAt },
      },
      include: { payments: { include: { payment: true } } },
    });

    const cashSales = tickets
      .flatMap((t) => t.payments)
      .filter((p) => p.payment.type === 'CASH')
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    const expectedCash = shift.openingCash.toNumber() + cashIn + cashSales - cashOut;
    const cashDifference = actualCash ? actualCash - expectedCash : null;

    const updated = await prisma.shift.update({
      where: { id: req.params.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: req.user!.id,
        expectedCash: new Prisma.Decimal(expectedCash),
        actualCash: actualCash ? new Prisma.Decimal(actualCash) : null,
        cashDifference: cashDifference ? new Prisma.Decimal(cashDifference) : null,
        salesTotal: tickets.reduce((sum, t) => sum + t.total.toNumber(), 0),
        notes,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Close shift error:', error);
    res.status(500).json({ success: false, message: 'Failed to close shift' });
  }
});

// Get shift report
router.get('/:id/report', async (req: AuthRequest, res) => {
  try {
    const shift = await prisma.shift.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId },
      include: {
        user: { select: { name: true } },
        cashEvents: true,
      },
    });

    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    // Get tickets for this shift
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: shift.userId,
        status: 'CLOSED',
        closedAt: { gte: shift.openedAt, lte: shift.closedAt || new Date() },
      },
      include: { payments: { include: { payment: true } } },
    });

    const totalSales = tickets.reduce((sum, t) => sum + t.total.toNumber(), 0);
    const totalRefunds = tickets.reduce((sum, t) => sum + t.discountAmount.toNumber(), 0);

    const paymentsByType = tickets.reduce((acc, ticket) => {
      ticket.payments.forEach((payment) => {
        const type = payment.payment.type;
        if (!acc[type]) acc[type] = 0;
        acc[type] += payment.amount.toNumber();
      });
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        shift,
        tickets,
        totalSales,
        totalRefunds,
        netSales: totalSales - totalRefunds,
        paymentsByType,
        ticketCount: tickets.length,
      },
    });
  } catch (error) {
    console.error('Get shift report error:', error);
    res.status(500).json({ success: false, message: 'Failed to get shift report' });
  }
});

// Time Clock
router.post('/time-clock/clock-in', async (req: AuthRequest, res) => {
  try {
    const timeClock = await prisma.timeClock.create({
      data: {
        userId: req.user!.id,
        storeId: req.user!.storeId,
        status: 'CLOCKED_IN',
      },
    });

    res.status(201).json({ success: true, data: timeClock });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ success: false, message: 'Failed to clock in' });
  }
});

router.post('/time-clock/clock-out', async (req: AuthRequest, res) => {
  try {
    const timeClock = await prisma.timeClock.findFirst({
      where: { userId: req.user!.id, status: { in: ['CLOCKED_IN', 'ON_BREAK'] } },
      orderBy: { clockIn: 'desc' },
    });

    if (!timeClock) {
      return res.status(400).json({ success: false, message: 'Not clocked in' });
    }

    const clockOut = new Date();
    const totalHours = (clockOut.getTime() - timeClock.clockIn.getTime()) / (1000 * 60 * 60);

    const updated = await prisma.timeClock.update({
      where: { id: timeClock.id },
      data: {
        status: 'CLOCKED_OUT',
        clockOut,
        totalHours: new Prisma.Decimal(totalHours.toFixed(2)),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ success: false, message: 'Failed to clock out' });
  }
});

router.get('/time-clock/status', async (req: AuthRequest, res) => {
  try {
    const timeClock = await prisma.timeClock.findFirst({
      where: { userId: req.user!.id },
      orderBy: { clockIn: 'desc' },
    });

    res.json({
      success: true,
      data: {
        isClockedIn: timeClock?.status === 'CLOCKED_IN' || timeClock?.status === 'ON_BREAK',
        isOnBreak: timeClock?.status === 'ON_BREAK',
        currentSession: timeClock,
      },
    });
  } catch (error) {
    console.error('Get time clock status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get status' });
  }
});

router.get('/time-clock/history', async (req: AuthRequest, res) => {
  try {
    const { userId, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.TimeClockWhereInput = {};
    if (userId) where.userId = userId as string;

    const [records, total] = await Promise.all([
      prisma.timeClock.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { clockIn: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.timeClock.count({ where }),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get time clock history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get history' });
  }
});

// Cash Events
router.get('/cash-events', async (req: AuthRequest, res) => {
  try {
    const { shiftId } = req.query;

    const events = await prisma.cashEvent.findMany({
      where: { storeId: req.user!.storeId, shiftId: shiftId as string },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Get cash events error:', error);
    res.status(500).json({ success: false, message: 'Failed to get cash events' });
  }
});

router.post('/cash-events', async (req: AuthRequest, res) => {
  try {
    const { shiftId, eventType, amount, notes } = req.body;

    const event = await prisma.cashEvent.create({
      data: {
        shiftId,
        userId: req.user!.id,
        storeId: req.user!.storeId,
        eventType,
        amount: new Prisma.Decimal(amount),
        notes,
      },
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Create cash event error:', error);
    res.status(500).json({ success: false, message: 'Failed to create cash event' });
  }
});

export default router;
