import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface ReceiptData {
  ticketId: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  cashierName: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    modifiers?: string[];
    notes?: string;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  changeAmount?: number;
  tipAmount?: number;
  receiptDate: Date;
  receiptNumber: string;
}

export class ReceiptService {
  static formatReceipt(receipt: ReceiptData): string {
    const lineWidth = 40;
    const center = (text: string) => text.padStart((lineWidth + text.length) / 2).padEnd(lineWidth);
    const leftRight = (left: string, right: string) => left.padEnd(lineWidth - right.length) + right;
    const divider = '-'.repeat(lineWidth);

    let receiptText = '';
    
    // Store Header
    receiptText += center(receipt.storeName) + '\n';
    if (receipt.storeAddress) {
      receiptText += center(receipt.storeAddress) + '\n';
    }
    if (receipt.storePhone) {
      receiptText += center(receipt.storePhone) + '\n';
    }
    receiptText += divider + '\n';

    // Receipt Info
    receiptText += leftRight(`Receipt: ${receipt.receiptNumber}`, receipt.receiptDate.toLocaleDateString()) + '\n';
    receiptText += leftRight('Cashier:', receipt.cashierName) + '\n';
    if (receipt.customerName) {
      receiptText += leftRight('Customer:', receipt.customerName) + '\n';
    }
    receiptText += divider + '\n';

    // Items
    receiptText += 'ITEMS\n';
    receiptText += divider + '\n';
    
    for (const item of receipt.items) {
      const itemTotal = (item.unitPrice * item.quantity).toFixed(2);
      receiptText += leftRight(`${item.name} x${item.quantity}`, itemTotal) + '\n';
      
      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          receiptText += leftRight(`  + ${mod}`, '') + '\n';
        }
      }
      
      if (item.notes) {
        receiptText += leftRight(`  Note: ${item.notes}`, '') + '\n';
      }
    }
    
    receiptText += divider + '\n';

    // Totals
    receiptText += leftRight('Subtotal', receipt.subtotal.toFixed(2)) + '\n';
    
    if (receipt.discountAmount > 0) {
      receiptText += leftRight('Discount', `-${receipt.discountAmount.toFixed(2)}`) + '\n';
    }
    
    receiptText += leftRight('Tax', receipt.taxAmount.toFixed(2)) + '\n';
    receiptText += divider + '\n';
    receiptText += center('TOTAL') + '\n';
    receiptText += center(`$${receipt.total.toFixed(2)}`) + '\n';
    receiptText += divider + '\n';

    // Payment Info
    receiptText += leftRight('Payment:', receipt.paymentMethod) + '\n';
    receiptText += leftRight('Amount Tendered:', (receipt.total + (receipt.changeAmount || 0)).toFixed(2)) + '\n';
    
    if (receipt.changeAmount && receipt.changeAmount > 0) {
      receiptText += leftRight('Change:', receipt.changeAmount.toFixed(2)) + '\n';
    }
    
    if (receipt.tipAmount && receipt.tipAmount > 0) {
      receiptText += leftRight('Tip:', receipt.tipAmount.toFixed(2)) + '\n';
    }

    receiptText += '\n';
    receiptText += center('Thank you for your purchase!') + '\n';
    receiptText += center('Please come again') + '\n';
    receiptText += '\n';

    return receiptText;
  }

  static async getReceiptData(ticketId: string, paymentMethod: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true } },
        store: { select: { name: true, address: true, phone: true } },
        items: {
          include: {
            modifiers: { include: { modifier: true } },
          },
        },
        payments: {
          include: { payment: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const payment = ticket.payments[0];
    const receiptNumber = `RCP-${ticket.id.slice(0, 8).toUpperCase()}`;

    return {
      ticketId: ticket.id,
      storeName: ticket.store.name,
      storeAddress: ticket.store.address || undefined,
      storePhone: ticket.store.phone || undefined,
      cashierName: ticket.user.name,
      customerName: ticket.customer?.name,
      items: ticket.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        total: item.total.toNumber(),
        modifiers: item.modifiers?.map((m) => m.name),
        notes: item.notes || undefined,
      })),
      subtotal: ticket.subtotal.toNumber(),
      discountAmount: ticket.discountAmount.toNumber(),
      taxAmount: ticket.taxAmount.toNumber(),
      total: ticket.total.toNumber(),
      paymentMethod: payment?.payment.name || paymentMethod,
      changeAmount: payment?.changeAmount.toNumber(),
      tipAmount: payment?.tipAmount.toNumber(),
      receiptDate: ticket.closedAt || new Date(),
      receiptNumber,
    };
  }

  static async generateReceipt(ticketId: string, paymentMethod: string): Promise<string> {
    const receiptData = await this.getReceiptData(ticketId, paymentMethod);
    return this.formatReceipt(receiptData);
  }

  static async printReceipt(ticketId: string, paymentMethod: string, printerUrl?: string): Promise<{ success: boolean; message: string }> {
    try {
      const receiptText = await this.generateReceipt(ticketId, paymentMethod);
      
      if (printerUrl) {
        // Send to network printer
        const response = await fetch(printerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: receiptText,
        });
        
        if (!response.ok) {
          throw new Error('Printer connection failed');
        }
      }
      
      // Also save to database for email
      await prisma.receipt.create({
        data: {
          ticketId,
          receiptText,
          printedAt: new Date(),
        },
      });

      return { success: true, message: 'Receipt printed successfully' };
    } catch (error) {
      console.error('Print receipt error:', error);
      return { success: false, message: 'Failed to print receipt' };
    }
  }

  static async emailReceipt(ticketId: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      const receiptText = await this.generateReceipt(ticketId, 'N/A');
      
      // In production, integrate with email service (nodemailer, sendgrid, etc.)
      console.log(`Email receipt to ${email}:`, receiptText);
      
      return { success: true, message: 'Receipt sent to email' };
    } catch (error) {
      console.error('Email receipt error:', error);
      return { success: false, message: 'Failed to email receipt' };
    }
  }
}

export default ReceiptService;