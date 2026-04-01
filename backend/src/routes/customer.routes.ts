import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all customers
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Prisma.CustomerWhereInput = {
      storeId: req.user!.storeId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { loyaltyCardNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get customers' });
  }
});

// Get customer by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      include: {
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to get customer' });
  }
});

// Get customer by phone
router.get('/phone/:phone', async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        phone: req.params.phone,
        storeId: req.user!.storeId,
        isActive: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Get customer by phone error:', error);
    res.status(500).json({ success: false, message: 'Failed to get customer' });
  }
});

// Get customer by loyalty card
router.get('/loyalty-card/:cardNumber', async (req: AuthRequest, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        loyaltyCardNumber: req.params.cardNumber,
        storeId: req.user!.storeId,
        isActive: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Get customer by card error:', error);
    res.status(500).json({ success: false, message: 'Failed to get customer' });
  }
});

// Get customer history
router.get('/:id/history', async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const tickets = await prisma.ticket.findMany({
      where: {
        customerId: req.params.id,
        storeId: req.user!.storeId,
        status: 'CLOSED',
      },
      include: {
        items: {
          include: { item: { select: { name: true } } },
        },
        user: { select: { name: true } },
      },
      orderBy: { closedAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    });

    const total = await prisma.ticket.count({
      where: { customerId: req.params.id, storeId: req.user!.storeId, status: 'CLOSED' },
    });

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
    console.error('Get customer history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get customer history' });
  }
});

// Create customer
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      notes,
      birthdate,
      loyaltyCardNumber,
      tags,
      isTaxExempt,
      taxExemptNumber,
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        storeId: req.user!.storeId,
        name,
        email,
        phone,
        address,
        notes,
        birthdate: birthdate ? new Date(birthdate) : null,
        loyaltyCardNumber,
        tags: tags || [],
        isTaxExempt: isTaxExempt || false,
        taxExemptNumber,
      },
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      notes,
      birthdate,
      loyaltyCardNumber,
      tags,
      isTaxExempt,
      taxExemptNumber,
      isActive,
    } = req.body;

    const customer = await prisma.customer.updateMany({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      data: {
        name,
        email,
        phone,
        address,
        notes,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        loyaltyCardNumber,
        tags,
        isTaxExempt,
        taxExemptNumber,
        isActive,
      },
    });

    if (customer.count === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const updated = await prisma.customer.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to update customer' });
  }
});

// Delete customer (soft delete)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.customer.updateMany({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete customer' });
  }
});

// Redeem loyalty points
router.post('/:id/redeem', async (req: AuthRequest, res) => {
  try {
    const { points, description } = req.body;

    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (customer.loyaltyPoints < points) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId: req.params.id,
        type: 'REDEEM',
        pointsChange: -points,
        pointsBalance: customer.loyaltyPoints - points,
        description: description || 'Points redeemed',
      },
    });

    await prisma.customer.update({
      where: { id: req.params.id },
      data: { loyaltyPoints: { decrement: points } },
    });

    res.json({ success: true, data: { transaction, newBalance: customer.loyaltyPoints - points } });
  } catch (error) {
    console.error('Redeem points error:', error);
    res.status(500).json({ success: false, message: 'Failed to redeem points' });
  }
});

// Import customers (CSV)
router.post('/import', async (req: AuthRequest, res) => {
  try {
    const { customers } = req.body;

    if (!customers || !Array.isArray(customers)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    const created = await Promise.all(
      customers.map((c: any) =>
        prisma.customer.create({
          data: {
            storeId: req.user!.storeId,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: c.address,
            notes: c.notes,
          },
        })
      )
    );

    res.status(201).json({ success: true, data: { count: created.length } });
  } catch (error) {
    console.error('Import customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to import customers' });
  }
});

// Export customers
router.get('/export/csv', async (req: AuthRequest, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { storeId: req.user!.storeId, isActive: true },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        loyaltyPoints: true,
        totalSpent: true,
        visitCount: true,
        createdAt: true,
      },
    });

    const csv = [
      ['Name', 'Email', 'Phone', 'Address', 'Loyalty Points', 'Total Spent', 'Visits', 'Created'].join(','),
      ...customers.map((c) =>
        [c.name, c.email, c.phone, c.address, c.loyaltyPoints, c.totalSpent.toString(), c.visitCount, c.createdAt.toISOString()].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to export customers' });
  }
});

export default router;
