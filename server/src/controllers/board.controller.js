import { prisma } from '../lib/prisma.js';

// -------------------------------------------------------------
// 1. Get all boards for the active tenant
// -------------------------------------------------------------
export const getBoards = async (req, res) => {
  try {
    const tenantId = req.tenant.id;

    const boards = await prisma.board.findMany({
      where: { tenantId },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { tasks: true, columns: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ boards });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return res.status(500).json({ message: 'Failed to retrieve boards' });
  }
};

// -------------------------------------------------------------
// 2. Get single board with all its columns and tasks
// -------------------------------------------------------------
export const getBoardById = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { boardId } = req.params;

    const board = await prisma.board.findFirst({
      where: { id: boardId, tenantId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, fullName: true, email: true },
                },
                creator: {
                  select: { id: true, fullName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ message: 'Board not found in this branch' });
    }

    return res.status(200).json({ board });
  } catch (error) {
    console.error('Error fetching board details:', error);
    return res.status(500).json({ message: 'Failed to retrieve board details' });
  }
};

// -------------------------------------------------------------
// 3. Create a new board (Admin only)
// -------------------------------------------------------------
export const createBoard = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const organizationId = req.tenant.organizationId;
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Board name is required' });
    }

    // Create board and 4 default columns in a transaction
    const newBoard = await prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          tenantId,
          organizationId,
          createdById: req.user.id,
        },
      });

      // Default Kanban columns
      await tx.column.createMany({
        data: [
          { name: 'To Do', position: 1000, boardId: board.id, tenantId },
          { name: 'In Progress', position: 2000, boardId: board.id, tenantId },
          { name: 'Testing', position: 3000, boardId: board.id, tenantId },
          { name: 'Done', position: 4000, boardId: board.id, tenantId },
        ],
      });

      // Log board creation activity
      await tx.activityLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          entityType: 'BOARD',
          entityId: board.id,
          action: 'CREATED',
          details: { boardName: board.name },
        },
      });

      return board;
    });

    return res.status(201).json({ message: 'Board created successfully', board: newBoard });
  } catch (error) {
    console.error('Error creating board:', error);
    return res.status(500).json({ message: 'Failed to create board' });
  }
};

// -------------------------------------------------------------
// 4. Update board details
// -------------------------------------------------------------
export const updateBoard = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { boardId } = req.params;
    const { name, description } = req.body;

    const existing = await prisma.board.findFirst({
      where: { id: boardId, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Board not found in this branch' });
    }

    const updated = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    return res.status(200).json({ message: 'Board updated successfully', board: updated });
  } catch (error) {
    console.error('Error updating board:', error);
    return res.status(500).json({ message: 'Failed to update board' });
  }
};

// -------------------------------------------------------------
// 5. Delete a board
// -------------------------------------------------------------
export const deleteBoard = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { boardId } = req.params;

    const existing = await prisma.board.findFirst({
      where: { id: boardId, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Board not found in this branch' });
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    return res.status(200).json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Error deleting board:', error);
    return res.status(500).json({ message: 'Failed to delete board' });
  }
};
