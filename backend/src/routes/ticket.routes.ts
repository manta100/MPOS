import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Get all tickets
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { storeId: req.user!.storeId };

    if (status) {
      where.status = status;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              item: { select: { name: true, imageUrl: true } },
              modifiers: true,
            },
          },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
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
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to get tickets' });
  }
});

// Get ticket by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: req.params.id,
        storeId: req.user!.storeId,
      },
      include: {
        user: { select: { id: true, name: true } },
        customer: true,
        items: {
          include: {
            item: true,
            variant: true,
            modifiers: { include: { modifier: true } },
          },
        },
        payments: { include: { payment: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to get ticket' });
  }
});

// Create new ticket
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { customerId, diningOption, tableName, tableId, notes } = req.body;

    const ticket = await prisma.ticket.create({
      data: {
        storeId: req.user!.storeId,
        userId: req.user!.id,
        customerId,
        diningOption: diningOption || 'DINE_IN',
        tableName,
        tableId,
        notes,
        status: 'OPEN',
      },
      include: {
        user: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`store_${req.user!.storeId}`).emit('ticket:created', ticket);

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
});

// Update ticket
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { diningOption, tableName, tableId, notes, customerId } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        diningOption,
        tableName,
        tableId,
        notes,
        customerId,
      },
    });

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
});

// Hold ticket
router.post('/:id/hold', async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        status: 'HOLD',
        holdAt: new Date(),
      },
    });

    const io = req.app.get('io');
    io.to(`store_${req.user!.storeId}`).emit('ticket:updated', ticket);

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Hold ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to hold ticket' });
  }
});

// Reopen ticket
router.post('/:id/reopen', async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        status: 'OPEN',
        holdAt: null,
      },
    });

    const io = req.app.get('io');
    io.to(`store_${req.user!.storeId}`).emit('ticket:updated', ticket);

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Reopen ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to reopen ticket' });
  }
});

// Assign customer to ticket
router.put('/:id/customer', async (req: AuthRequest, res) => {
  try {
    const { customerId } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { customerId },
      include: { customer: true },
    });

    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Assign customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign customer' });
  }
});

// Add item to ticket
router.post('/:id/items', async (req: AuthRequest, res) => {
  try {
    const { itemId, variantId, quantity, unitPrice, notes, modifiers } = req.body;

    // Get item details
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { taxes: { include: { tax: true } } },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Calculate price
    const price = unitPrice || item.price.toNumber();
    const itemTotal = price * quantity;

    // Calculate tax (simplified)
    let taxAmount = 0;
    if (item.taxes.length > 0) {
      const taxRate = item.taxes[0].tax.rate.toNumber() / 100;
      taxAmount = itemTotal * taxRate;
    }

    const ticketItem = await prisma.ticketItem.create({
      data: {
        ticketId: req.params.id,
        itemId,
        variantId,
        name: item.name,
        quantity,
        unitPrice: new Prisma.Decimal(price),
        taxAmount: new Prisma.Decimal(taxAmount),
        total: new Prisma.Decimal(itemTotal + taxAmount),
        notes,
        modifiersJson: modifiers || [],
      },
      include: {
        item: { select: { name: true, imageUrl: true } },
        modifiers: { include: { modifier: true } },
      },
    });

    // Update ticket totals
    await updateTicketTotals(req.params.id);

    // Decrement inventory if tracked
    if (item.trackInventory && !item.isService) {
      await prisma.inventoryLog.create({
        data: {
          storeId: req.user!.storeId,
          itemId,
          variantId,
          changeType: 'SALE',
          quantityChange: -quantity,
          quantityBefore: 0, // Will be calculated
          quantityAfter: 0,
          referenceId: req.params.id,
          referenceType: 'ticket',
          userId: req.user!.id,
        },
      });
    }

    const io = req.app.get('io');
    io.to(`store_${req.user!.storeId}`).emit('ticket:updated', { id: req.params.id });

    res.status(201).json({ success: true, data: ticketItem });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ success: false, message: 'Failed to add item' });
  }
});

// Update ticket item quantity
router.put('/:id/items/:itemId', async (req: AuthRequest, res) => {
  try {
    const { quantity, unitPrice, notes } = req.body;

    const ticketItem = await prisma.ticketItem.findUnique({
      where: { id: req.params.itemId },
    });

    if (!ticketItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const newQuantity = quantity ?? ticketItem.quantity;
    const newPrice = unitPrice ?? ticketItem.unitPrice.toNumber();
    const newTotal = newPrice * newQuantity + ticketItem.taxAmount.toNumber();

    const updated = await prisma.ticketItem.update({
      where: { id: req.params.itemId },
      data: {
        quantity: newQuantity,
        unitPrice: new Prisma.Decimal(newPrice),
        total: new Prisma.Decimal(newTotal),
        notes,
      },
      include: {
        item: { select: { name: true, imageUrl: true } },
      },
    });

    await updateTicketTotals(req.params.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
});

// Remove item from ticket
router.delete('/:id/items/:itemId', async (req: AuthRequest, res) => {
  try {
    await prisma.ticketItem.delete({
      where: { id: req.params.itemId },
    });

    await updateTicketTotals(req.params.id);

    res.json({ success: true, message: 'Item removed' });
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

// Process payment
router.post('/:id/pay', async (req: AuthRequest, res) => {
  try {
    const { paymentId, amount, tipAmount, cardLastFour, cardBrand, referenceNumber } = req.body;

    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId },
      include: { customer: true },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.total.toNumber() <= 0) {
      return res.status(400).json({ success: false, message: 'Ticket has no balance' });
    }

    // Create payment record
    const payment = await prisma.ticketPayment.create({
      data: {
        ticketId: req.params.id,
        paymentId,
        amount: new Prisma.Decimal(amount || ticket.total.toNumber()),
        tipAmount: tipAmount ? new Prisma.Decimal(tipAmount) : new Prisma.Decimal(0),
        cardLastFour,
        cardBrand,
        referenceNumber,
      },
      include: { payment: true },
    });

    // Update ticket status
    await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    // Update customer stats if present
    if (ticket.customerId && ticket.customer) {
      await prisma.customer.update({
        where: { id: ticket.customerId },
        data: {
          totalSpent: { increment: ticket.total.toNumber() },
          visitCount: { increment: 1 },
        },
      });

      // Award loyalty points
      const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
        where: { storeId: req.user!.storeId, isActive: true },
      });

      if (loyaltyProgram) {
        const pointsEarned = Math.floor(ticket.total.toNumber() * loyaltyProgram.pointsPerDollar.toNumber());
        await prisma.loyaltyTransaction.create({
          data: {
            customerId: ticket.customerId,
            ticketId: ticket.id,
            type: 'EARN',
            pointsChange: pointsEarned,
            pointsBalance: ticket.customer.loyaltyPoints + pointsEarned,
            description: `Purchase reward`,
          },
        });

        await prisma.customer.update({
          where: { id: ticket.customerId },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });
      }
    }

    const io = req.app.get('io');
    io.to(`store_${req.user!.storeId}`).emit('ticket:paid', { id: req.params.id });

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

// Apply discount to ticket
router.post('/:id/discount', async (req: AuthRequest, res) => {
  try {
    const { discountId, type, value } = req.body;

    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId },
      include: { items: true },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    let discountAmount = 0;

    if (type === 'PERCENTAGE') {
      discountAmount = ticket.subtotal.toNumber() * (value / 100);
    } else if (type === 'FIXED_AMOUNT') {
      discountAmount = value;
    } else if (discountId) {
      const discount = await prisma.discount.findUnique({ where: { id: discountId } });
      if (discount) {
        if (discount.type === 'PERCENTAGE') {
          discountAmount = ticket.subtotal.toNumber() * (discount.value.toNumber() / 100);
        } else {
          discountAmount = discount.value.toNumber();
        }
      }
    }

    // Cap discount at subtotal
    discountAmount = Math.min(discountAmount, ticket.subtotal.toNumber());

    // Recalculate tax
    const taxableAmount = ticket.subtotal.toNumber() - discountAmount;
    const taxAmount = taxableAmount * 0.08; // Simplified 8% tax
    const total = taxableAmount + taxAmount;

    const updated = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        discountAmount: new Prisma.Decimal(discountAmount),
        taxAmount: new Prisma.Decimal(taxAmount),
        total: new Prisma.Decimal(total),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply discount' });
  }
});

// Split ticket
router.post('/:id/split', async (req: AuthRequest, res) => {
  try {
    const { itemIds } = req.body; // Items to move to new ticket

    const originalTicket = await prisma.ticket.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId },
      include: { items: true },
    });

    if (!originalTicket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Create new ticket
    const newTicket = await prisma.ticket.create({
      data: {
        storeId: req.user!.storeId,
        userId: req.user!.id,
        customerId: originalTicket.customerId,
        diningOption: originalTicket.diningOption,
        status: 'OPEN',
      },
    });

    // Move selected items to new ticket
    if (itemIds && itemIds.length > 0) {
      await prisma.ticketItem.updateMany({
        where: { id: { in: itemIds }, ticketId: req.params.id },
        data: { ticketId: newTicket.id },
      });
    }

    // Recalculate totals for both tickets
    await updateTicketTotals(req.params.id);
    await updateTicketTotals(newTicket.id);

    res.status(201).json({ success: true, data: { originalTicketId: req.params.id, newTicketId: newTicket.id } });
  } catch (error) {
    console.error('Split ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to split ticket' });
  }
});

// Merge tickets
router.post('/:id/merge', async (req: AuthRequest, res) => {
  try {
    const { mergeWithTicketId } = req.body;

    const sourceTicket = await prisma.ticket.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId },
      include: { items: true },
    });

    if (!sourceTicket) {
      return res.status(404).json({ success: false, message: 'Source ticket not found' });
    }

    // Move all items to target ticket
    await prisma.ticketItem.updateMany({
      where: { ticketId: sourceTicket.id },
      data: { ticketId: mergeWithTicketId },
    });

    // Delete source ticket
    await prisma.ticket.delete({ where: { id: sourceTicket.id } });

    // Recalculate target ticket totals
    await updateTicketTotals(mergeWithTicketId);

    res.json({ success: true, message: 'Tickets merged' });
  } catch (error) {
    console.error('Merge tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to merge tickets' });
  }
});

// Process refund
router.post('/:id/refund', async (req: AuthRequest, res) => {
  try {
    const { refundType, items, reason, amount } = req.body;

    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const refundAmount = amount || ticket.total.toNumber();

    const refund = await prisma.refund.create({
      data: {
        ticketId: req.params.id,
        userId: req.user!.id,
        refundType: refundType || 'FULL',
        amount: new Prisma.Decimal(refundAmount),
        itemsJson: items || [],
        reason,
      },
    });

    // Void the original ticket
    await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        status: 'VOID',
        voidedAt: new Date(),
        voidReason: reason,
      },
    });

    res.status(201).json({ success: true, data: refund });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund' });
  }
});

// Void ticket
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;

    await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        status: 'VOID',
        voidedAt: new Date(),
        voidReason: reason,
      },
    });

    const io = req.app.get('io');
    io.to(`store_${req.user!.storeId}`).emit('ticket:voided', { id: req.params.id });

    res.json({ success: true, message: 'Ticket voided' });
  } catch (error) {
    console.error('Void ticket error:', error);
    res.status(500).json({ success: false, message: 'Failed to void ticket' });
  }
});

// Helper function to update ticket totals
async function updateTicketTotals(ticketId: string) {
  const items = await prisma.ticketItem.findMany({
    where: { ticketId },
  });

  const subtotal = items.reduce((sum, item) => sum + item.total.toNumber(), 0);
  const taxAmount = subtotal * 0.08; // Simplified 8% tax
  const total = subtotal + taxAmount;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      subtotal: new Prisma.Decimal(subtotal),
      taxAmount: new Prisma.Decimal(taxAmount),
      total: new Prisma.Decimal(total),
    },
  });
}

export default router;
