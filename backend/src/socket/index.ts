import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  storeId?: string;
}

export const setupSocketHandlers = (io: SocketServer) => {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'default-secret';
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        storeId: string;
      };

      socket.userId = decoded.userId;
      socket.storeId = decoded.storeId;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join store room
    if (socket.storeId) {
      socket.join(`store_${socket.storeId}`);
      console.log(`User ${socket.userId} joined room: store_${socket.storeId}`);
    }

    // Join kitchen room if applicable
    socket.on('join:kitchen', (stationId: string) => {
      if (stationId) {
        socket.join(`kitchen_${stationId}`);
      }
    });

    // Leave kitchen room
    socket.on('leave:kitchen', (stationId: string) => {
      if (stationId) {
        socket.leave(`kitchen_${stationId}`);
      }
    });

    // Real-time ticket updates
    socket.on('ticket:update', (data: { ticketId: string; changes: any }) => {
      if (socket.storeId) {
        socket.to(`store_${socket.storeId}`).emit('ticket:updated', data);
      }
    });

    // Kitchen order events
    socket.on('kitchen:update', (data: { orderId: string; status: string; stationId?: string }) => {
      if (data.stationId) {
        socket.to(`kitchen_${data.stationId}`).emit('kitchen:statusChanged', data);
      }
      if (socket.storeId) {
        socket.to(`store_${socket.storeId}`).emit('kitchen:updated', data);
      }
    });

    // Inventory alerts
    socket.on('inventory:lowStock', (data: { itemId: string; itemName: string }) => {
      if (socket.storeId) {
        socket.to(`store_${socket.storeId}`).emit('inventory:lowStockAlert', data);
      }
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  console.log('Socket.io handlers initialized');
};
