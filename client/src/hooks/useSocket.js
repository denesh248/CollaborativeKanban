// client/src/hooks/useSocket.js
// Custom hook to manage Socket.IO lifecycle, room subscription, and presence

import { useState, useEffect } from 'react';
import { connectSocket } from '../services/socket.js';

export function useSocket({ tenantId, token, user, onEvent, onReconnect }) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!tenantId || !token || !user?.id) return;

    const socket = connectSocket(token);

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit('tenant:join', { tenantId });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    const handleDisconnect = () => setSocketConnected(false);

    const handleReconnect = () => {
      setSocketConnected(true);
      socket.emit('tenant:join', { tenantId });
      onReconnect?.();
    };

    const handlePresence = ({ onlineUsers: users }) => {
      setOnlineUsers(users || []);
    };

    const handleTaskCreated = (payload) => {
      if (payload.actorId === user.id) return;
      onEvent?.('task:created', payload);
    };

    const handleTaskUpdated = (payload) => {
      if (payload.actorId === user.id) return;
      onEvent?.('task:updated', payload);
    };

    const handleTaskMoved = (payload) => {
      if (payload.actorId === user.id) return;
      onEvent?.('task:moved', payload);
    };

    const handleTaskDeleted = (payload) => {
      if (payload.actorId === user.id) return;
      onEvent?.('task:deleted', payload);
    };

    const handleActivityNew = (payload) => {
      onEvent?.('activity:new', payload);
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('presence:update', handlePresence);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('activity:new', handleActivityNew);

    return () => {
      socket.emit('tenant:leave', { tenantId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('presence:update', handlePresence);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('activity:new', handleActivityNew);
    };
  }, [tenantId, token, user?.id]);

  return { socketConnected, onlineUsers };
}
