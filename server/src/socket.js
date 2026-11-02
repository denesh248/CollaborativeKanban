// server/src/socket.js
// Real-time synchronization & presence tracking using Socket.IO
// Beginner-friendly, robust, pure JavaScript ES modules.

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, CLIENT_ORIGIN } from './config/environment.js';
import { prisma } from './lib/prisma.js';

let io = null;

// In-memory presence registry: Map<tenantId, Map<userId, { id, fullName, email, socketIds: Set<string> }>>
const presenceMap = new Map();

function addPresence(tenantId, user, socketId) {
  if (!presenceMap.has(tenantId)) {
    presenceMap.set(tenantId, new Map());
  }
  const tenantUsers = presenceMap.get(tenantId);
  if (!tenantUsers.has(user.id)) {
    tenantUsers.set(user.id, {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      socketIds: new Set([socketId]),
    });
  } else {
    tenantUsers.get(user.id).socketIds.add(socketId);
  }
}

function removePresence(tenantId, userId, socketId) {
  const tenantUsers = presenceMap.get(tenantId);
  if (!tenantUsers) return;

  const userData = tenantUsers.get(userId);
  if (userData) {
    userData.socketIds.delete(socketId);
    if (userData.socketIds.size === 0) {
      tenantUsers.delete(userId);
    }
  }
  if (tenantUsers.size === 0) {
    presenceMap.delete(tenantId);
  }
}

function getOnlineUsers(tenantId) {
  const tenantUsers = presenceMap.get(tenantId);
  if (!tenantUsers) return [];
  return Array.from(tenantUsers.values()).map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
  }));
}

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: CLIENT_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // 1. Socket Authentication Middleware (JWT Validation)
  io.use(async (socket, next) => {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      return next(new Error('Authentication required: No token provided'));
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, fullName: true },
      });

      if (!user) {
        return next(new Error('Authentication failed: User not found'));
      }

      // Attach verified user to socket
      socket.user = user;
      socket.joinedTenants = new Set();
      next();
    } catch (err) {
      return next(new Error('Authentication failed: Invalid or expired token'));
    }
  });

  // 2. Connection Lifecycle & Event Handlers
  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.IO] User connected: ${socket.user.fullName} (${socket.id})`);

    // Tenant Room Join with Strict Membership Verification
    socket.on('tenant:join', async ({ tenantId }) => {
      if (!tenantId) return;

      try {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { id: true, organizationId: true, name: true },
        });

        if (!tenant) {
          return socket.emit('error:unauthorized', { message: 'Branch not found' });
        }

        // Verify user has authorized membership in this tenant or parent org as ORG_ADMIN
        const membership = await prisma.membership.findFirst({
          where: {
            userId: socket.user.id,
            OR: [
              { tenantId: tenant.id },
              { organizationId: tenant.organizationId, role: 'ORG_ADMIN' },
            ],
          },
        });

        if (!membership) {
          return socket.emit('error:unauthorized', {
            message: `Access denied to branch: ${tenant.name}`,
          });
        }

        const roomName = `tenant:${tenantId}`;
        socket.join(roomName);
        socket.joinedTenants.add(tenantId);

        // Update Presence
        addPresence(tenantId, socket.user, socket.id);
        const onlineUsers = getOnlineUsers(tenantId);

        // Broadcast updated presence to the branch room
        io.to(roomName).emit('presence:update', { onlineUsers });
        console.log(`👤 ${socket.user.fullName} joined room: ${roomName} (Online: ${onlineUsers.length})`);
      } catch (error) {
        console.error('Error in tenant:join:', error);
        socket.emit('error:server', { message: 'Failed to join tenant room' });
      }
    });

    // Tenant Room Leave (e.g. When user switches branch in UI)
    socket.on('tenant:leave', ({ tenantId }) => {
      if (!tenantId) return;

      const roomName = `tenant:${tenantId}`;
      socket.leave(roomName);
      socket.joinedTenants.delete(tenantId);

      removePresence(tenantId, socket.user.id, socket.id);
      const onlineUsers = getOnlineUsers(tenantId);
      io.to(roomName).emit('presence:update', { onlineUsers });
      console.log(`👋 ${socket.user.fullName} left room: ${roomName}`);
    });

    // Disconnect Handler
    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] User disconnected: ${socket.user.fullName} (${socket.id})`);

      // Clean up presence across all joined tenant rooms
      if (socket.joinedTenants) {
        for (const tenantId of socket.joinedTenants) {
          removePresence(tenantId, socket.user.id, socket.id);
          const onlineUsers = getOnlineUsers(tenantId);
          io.to(`tenant:${tenantId}`).emit('presence:update', { onlineUsers });
        }
      }
    });
  });

  return io;
};

// Helper: Broadcast an event to all connected sockets in a tenant room
export const emitToTenant = (tenantId, event, payload) => {
  const roomName = `tenant:${tenantId}`;
  const roomSize = io?.sockets?.adapter?.rooms?.get(roomName)?.size || 0;
  console.log(`📡 [emitToTenant] ${event} -> ${roomName} (Sockets in room: ${roomSize})`);
  if (io && tenantId) {
    io.to(roomName).emit(event, payload);
  }
};

export const getIO = () => io;
