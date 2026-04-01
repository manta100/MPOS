import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import itemRoutes from './routes/item.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import customerRoutes from './routes/customer.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import reportRoutes from './routes/report.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import shiftRoutes from './routes/shift.routes.js';
import storeRoutes from './routes/store.routes.js';
import kitchenRoutes from './routes/kitchen.routes.js';
import discountRoutes from './routes/discount.routes.js';
import taxRoutes from './routes/tax.routes.js';
import receiptRoutes from './routes/receipt.routes.js';

import { errorHandler } from './middleware/error.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { setupSocketHandlers } from './socket/index.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/items', authMiddleware, itemRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/shifts', authMiddleware, shiftRoutes);
app.use('/api/stores', authMiddleware, storeRoutes);
app.use('/api/kitchen', authMiddleware, kitchenRoutes);
app.use('/api/discounts', authMiddleware, discountRoutes);
app.use('/api/taxes', authMiddleware, taxRoutes);
app.use('/api/receipts', authMiddleware, receiptRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Setup socket handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 MPOS Backend running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
});

export { app, httpServer, io };
