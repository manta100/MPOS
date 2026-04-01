import { Router } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { ReceiptService } from '../services/receipt.service.js';

const router = Router();

// Get receipt by ticket ID
router.get('/:ticketId', async (req: AuthRequest, res) => {
  try {
    const receiptText = await ReceiptService.generateReceipt(req.params.ticketId, 'CASH');
    res.json({ success: true, data: { text: receiptText } });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to get receipt' });
  }
});

// Print receipt
router.post('/print', async (req: AuthRequest, res) => {
  try {
    const { ticketId, paymentMethod, printerUrl } = req.body;
    
    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'Ticket ID required' });
    }

    const result = await ReceiptService.printReceipt(ticketId, paymentMethod || 'CASH', printerUrl);
    res.json(result);
  } catch (error) {
    console.error('Print receipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to print receipt' });
  }
});

// Email receipt
router.post('/email', async (req: AuthRequest, res) => {
  try {
    const { ticketId, email } = req.body;
    
    if (!ticketId || !email) {
      return res.status(400).json({ success: false, message: 'Ticket ID and email required' });
    }

    const result = await ReceiptService.emailReceipt(ticketId, email);
    res.json(result);
  } catch (error) {
    console.error('Email receipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to email receipt' });
  }
});

export default router;