import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get sales summary
router.get('/sales', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = dateTo ? new Date(dateTo as string) : new Date();

    const tickets = await prisma.ticket.findMany({
      where: {
        storeId: req.user!.storeId,
        status: 'CLOSED',
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        payments: { include: { payment: true } },
        items: true,
        user: { select: { name: true } },
      },
    });

    const totalSales = tickets.reduce((sum, t) => sum + t.total.toNumber(), 0);
    const totalRefunds = tickets.reduce((sum, t) => {
      return sum + t.items.filter((i) => i.taxAmount.toNumber() < 0).reduce((s, i) => s + Math.abs(i.taxAmount.toNumber()), 0);
    }, 0);
    const ticketCount = tickets.length;
    const avgTicket = ticketCount > 0 ? totalSales / ticketCount : 0;

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
        totalSales,
        totalRefunds,
        netSales: totalSales - totalRefunds,
        ticketCount,
        avgTicket,
        paymentsByType,
        tickets,
      },
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sales report' });
  }
});

// Get sales by item
router.get('/sales-by-item', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = dateTo ? new Date(dateTo as string) : new Date();

    const items = await prisma.ticketItem.groupBy({
      by: ['itemId', 'name'],
      where: {
        ticket: {
          storeId: req.user!.storeId,
          status: 'CLOSED',
          closedAt: { gte: startDate, lte: endDate },
        },
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 50,
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get sales by item error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sales by item report' });
  }
});

// Get sales by category
router.get('/sales-by-category', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = dateTo ? new Date(dateTo as string) : new Date();

    const result = await prisma.$queryRaw`
      SELECT 
        c.name as categoryName,
        c.id as categoryId,
        COUNT(ti.id) as itemCount,
        SUM(ti.quantity) as totalQuantity,
        SUM(ti.total) as totalSales
      FROM ticket_items ti
      JOIN tickets t ON ti.ticketId = t.id
      JOIN items i ON ti.itemId = i.id
      LEFT JOIN categories c ON i.categoryId = c.id
      WHERE t.storeId = ${req.user!.storeId}
        AND t.status = 'CLOSED'
        AND t.closedAt >= ${startDate}
        AND t.closedAt <= ${endDate}
      GROUP BY c.id, c.name
      ORDER BY totalSales DESC
    `;

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get sales by category error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sales by category' });
  }
});

// Get sales by payment type
router.get('/sales-by-payment', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = dateTo ? new Date(dateTo as string) : new Date();

    const result = await prisma.ticketPayment.groupBy({
      by: ['paymentId'],
      where: {
        ticket: {
          storeId: req.user!.storeId,
          status: 'CLOSED',
          closedAt: { gte: startDate, lte: endDate },
        },
      },
      _sum: { amount: true },
      _count: true,
    });

    const payments = await prisma.payment.findMany({
      where: { id: { in: result.map((r) => r.paymentId) } },
    });

    const data = result.map((r) => ({
      payment: payments.find((p) => p.id === r.paymentId),
      count: r._count,
      total: r._sum.amount,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get sales by payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sales by payment' });
  }
});

// Get sales by employee
router.get('/sales-by-employee', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = dateTo ? new Date(dateTo as string) : new Date();

    const result = await prisma.ticket.groupBy({
      by: ['userId'],
      where: {
        storeId: req.user!.storeId,
        status: 'CLOSED',
        closedAt: { gte: startDate, lte: endDate },
      },
      _sum: { total: true, discountAmount: true },
      _count: true,
    });

    const users = await prisma.user.findMany({
      where: { id: { in: result.map((r) => r.userId) } },
      select: { id: true, name: true },
    });

    const data = result.map((r) => ({
      user: users.find((u) => u.id === r.userId),
      ticketCount: r._count,
      totalSales: r._sum.total,
      totalDiscounts: r._sum.discountAmount,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get sales by employee error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sales by employee' });
  }
});

// Get sales by hour
router.get('/sales-by-hour', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = dateTo ? new Date(dateTo as string) : new Date();

    const tickets = await prisma.ticket.findMany({
      where: {
        storeId: req.user!.storeId,
        status: 'CLOSED',
        closedAt: { gte: startDate, lte: endDate },
      },
      select: { total: true, closedAt: true },
    });

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sales: 0,
      transactions: 0,
    }));

    tickets.forEach((ticket) => {
      const hour = ticket.closedAt!.getHours();
      hourlyData[hour].sales += ticket.total.toNumber();
      hourlyData[hour].transactions += 1;
    });

    res.json({ success: true, data: hourlyData });
  } catch (error) {
    console.error('Get sales by hour error:', error);
    res.status(500).json({ success: false, message: 'Failed to get sales by hour' });
  }
});

// Get tax report
router.get('/tax', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = dateTo ? new Date(dateTo as string) : new Date();

    const tickets = await prisma.ticket.findMany({
      where: {
        storeId: req.user!.storeId,
        status: 'CLOSED',
        closedAt: { gte: startDate, lte: endDate },
      },
      select: { subtotal: true, taxAmount: true, total: true },
    });

    const totalSales = tickets.reduce((sum, t) => sum + t.total.toNumber(), 0);
    const totalTax = tickets.reduce((sum, t) => sum + t.taxAmount.toNumber(), 0);

    res.json({
      success: true,
      data: {
        totalSales,
        totalTax,
        taxRate: totalSales > 0 ? (totalTax / totalSales) * 100 : 0,
        ticketCount: tickets.length,
      },
    });
  } catch (error) {
    console.error('Get tax report error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tax report' });
  }
});

// Get shift report
router.get('/shift/:shiftId', async (req: AuthRequest, res) => {
  try {
    const shift = await prisma.shift.findFirst({
      where: { id: req.params.shiftId, storeId: req.user!.storeId },
      include: {
        user: { select: { name: true } },
        cashEvents: true,
      },
    });

    if (!shift) {
      return res.status(404).json({ success: false, message: 'Shift not found' });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        userId: shift.userId,
        status: 'CLOSED',
        closedAt: { gte: shift.openedAt, lte: shift.closedAt || new Date() },
      },
      include: { payments: { include: { payment: true } } },
    });

    const cashPayments = tickets.flatMap((t) => t.payments).filter((p) => p.payment.type === 'CASH');
    const totalCash = cashPayments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const totalCard = tickets.flatMap((t) => t.payments).filter((p) => p.payment.type === 'CARD')
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    res.json({
      success: true,
      data: {
        shift,
        tickets,
        totalCash,
        totalCard,
        expectedCash: shift.openingCash.toNumber() + totalCash + shift.cashAdded.toNumber() - shift.cashWithdrawn.toNumber(),
      },
    });
  } catch (error) {
    console.error('Get shift report error:', error);
    res.status(500).json({ success: false, message: 'Failed to get shift report' });
  }
});

// Get receipts history
router.get('/receipts', async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '20', dateFrom, dateTo } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.TicketWhereInput = {
      storeId: req.user!.storeId,
      status: 'CLOSED',
    };

    if (dateFrom || dateTo) {
      where.closedAt = {};
      if (dateFrom) where.closedAt.gte = new Date(dateFrom as string);
      if (dateTo) where.closedAt.lte = new Date(dateTo as string);
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: { select: { name: true } },
          customer: { select: { name: true } },
          items: { include: { item: { select: { name: true } } } },
          payments: { include: { payment: true } },
        },
        orderBy: { closedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ success: false, message: 'Failed to get receipts' });
  }
});

// Export report to CSV
router.get('/export', async (req: AuthRequest, res) => {
  try {
    const { type, dateFrom, dateTo } = req.query;
    const startDate = dateFrom ? new Date(dateFrom as string) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = dateTo ? new Date(dateTo as string) : new Date();

    let csv = 'Date,Total,Tickets\n';

    if (type === 'daily') {
      // Group by day
      const tickets = await prisma.ticket.groupBy({
        by: ['closedAt'],
        where: {
          storeId: req.user!.storeId,
          status: 'CLOSED',
          closedAt: { gte: startDate, lte: endDate },
        },
        _sum: { total: true },
        _count: true,
      });

      csv = tickets.map((t) =>
        `${t.closedAt?.toISOString().split('T')[0]},${t._sum.total?.toString() || 0},${t._count}`
      ).join('\n');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ success: false, message: 'Failed to export report' });
  }
});

export default router;
