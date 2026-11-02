import { prisma } from '../lib/prisma.js';
import { emitToTenant } from '../socket.js';

// -------------------------------------------------------------
// 1. Create a column in a board
// -------------------------------------------------------------
export const createColumn = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { boardId } = req.params;
    const { name, position } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Column name is required' });
    }

    // Verify board belongs to this tenant
    const board = await prisma.board.findFirst({
      where: { id: boardId, tenantId },
    });

    if (!board) {
      return res.status(404).json({ message: 'Board not found in this branch' });
    }

    // Auto-calculate position if not provided
    let colPosition = position;
    if (colPosition === undefined) {
      const highest = await prisma.column.findFirst({
        where: { boardId },
        orderBy: { position: 'desc' },
      });
      colPosition = highest ? highest.position + 1000 : 1000;
    }

    const column = await prisma.column.create({
      data: {
        name: name.trim(),
        position: colPosition,
        boardId,
        tenantId,
      },
    });

    // Real-Time Socket.IO Broadcast
    emitToTenant(tenantId, 'column:created', { column, actorId: req.user.id });

    return res.status(201).json({ message: 'Column created successfully', column });
  } catch (error) {
    console.error('Error creating column:', error);
    return res.status(500).json({ message: 'Failed to create column' });
  }
};

// -------------------------------------------------------------
// 2. Update a column (name or position)
// -------------------------------------------------------------
export const updateColumn = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { columnId } = req.params;
    const { name, position } = req.body;

    // Verify column belongs to this tenant
    const existing = await prisma.column.findFirst({
      where: { id: columnId, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Column not found in this branch' });
    }

    const updated = await prisma.column.update({
      where: { id: columnId },
      data: {
        ...(name && { name: name.trim() }),
        ...(position !== undefined && { position }),
      },
    });

    // Real-Time Socket.IO Broadcast
    emitToTenant(tenantId, 'column:updated', { column: updated, actorId: req.user.id });

    return res.status(200).json({ message: 'Column updated successfully', column: updated });
  } catch (error) {
    console.error('Error updating column:', error);
    return res.status(500).json({ message: 'Failed to update column' });
  }
};

// -------------------------------------------------------------
// 3. Delete a column
// -------------------------------------------------------------
export const deleteColumn = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { columnId } = req.params;

    const existing = await prisma.column.findFirst({
      where: { id: columnId, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Column not found in this branch' });
    }

    await prisma.column.delete({
      where: { id: columnId },
    });

    // Real-Time Socket.IO Broadcast
    emitToTenant(tenantId, 'column:deleted', { columnId, actorId: req.user.id });

    return res.status(200).json({ message: 'Column deleted successfully' });
  } catch (error) {
    console.error('Error deleting column:', error);
    return res.status(500).json({ message: 'Failed to delete column' });
  }
};
