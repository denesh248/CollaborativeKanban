import { prisma } from '../lib/prisma.js';

// -------------------------------------------------------------
// 1. Create a task in a column
// -------------------------------------------------------------
export const createTask = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { boardId } = req.params;
    const { title, description, columnId, priority, dueDate, assignedToId } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Task title is required' });
    }

    if (!columnId) {
      return res.status(400).json({ message: 'Column ID is required' });
    }

    // Verify column exists and belongs to this tenant and board
    const column = await prisma.column.findFirst({
      where: { id: columnId, boardId, tenantId },
    });

    if (!column) {
      return res.status(400).json({ message: 'Invalid column specified for this board and branch' });
    }

    // Compute next position in column
    const highestTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
    });
    const position = highestTask ? highestTask.position + 1000 : 1000;

    // Create task and activity log in a transaction
    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          position,
          version: 1, // Initial concurrency version
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          boardId,
          columnId,
          tenantId,
          assignedToId: assignedToId || null,
          createdById: req.user.id,
        },
        include: {
          assignee: {
            select: { id: true, fullName: true, email: true },
          },
          creator: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      // Audit log entry
      await tx.activityLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          entityType: 'TASK',
          entityId: newTask.id,
          action: 'CREATED',
          details: { taskTitle: newTask.title, column: column.name },
        },
      });

      return newTask;
    });

    return res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Failed to create task' });
  }
};

// -------------------------------------------------------------
// 2. Get task details by ID
// -------------------------------------------------------------
export const getTaskById = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { taskId } = req.params;

    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
      include: {
        column: { select: { id: true, name: true } },
        board: { select: { id: true, name: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
        creator: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found in this branch' });
    }

    return res.status(200).json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return res.status(500).json({ message: 'Failed to retrieve task' });
  }
};

// -------------------------------------------------------------
// 3. Update task with Optimistic Concurrency Control (OCC)
// -------------------------------------------------------------
export const updateTask = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { taskId } = req.params;
    const { title, description, priority, dueDate, assignedToId, expectedVersion } = req.body;

    const existing = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Task not found in this branch' });
    }

    // Concurrency Check: If expectedVersion is provided, detect stale edits
    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      return res.status(409).json({
        statusCode: 409,
        error: 'Conflict',
        message: 'Conflict detected: This task was modified by another user.',
        currentTask: existing,
      });
    }

    // Update task and log activity
    const updated = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          ...(title && { title: title.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(priority && { priority }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
          version: { increment: 1 }, // Bump version counter
        },
        include: {
          assignee: { select: { id: true, fullName: true, email: true } },
          creator: { select: { id: true, fullName: true, email: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          entityType: 'TASK',
          entityId: task.id,
          action: 'UPDATED',
          details: { taskTitle: task.title, newVersion: task.version },
        },
      });

      return task;
    });

    return res.status(200).json({ message: 'Task updated successfully', task: updated });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ message: 'Failed to update task' });
  }
};

// -------------------------------------------------------------
// 4. Move task (Kanban reordering and column changes)
// -------------------------------------------------------------
export const moveTask = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { taskId } = req.params;
    const { destinationColumnId, newPosition, expectedVersion } = req.body;

    if (!destinationColumnId) {
      return res.status(400).json({ message: 'destinationColumnId is required' });
    }

    // Verify task exists in this tenant
    const existing = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
      include: { column: true },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Task not found in this branch' });
    }

    // Concurrency Check
    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      return res.status(409).json({
        statusCode: 409,
        error: 'Conflict',
        message: 'Conflict detected: Task was moved or updated by another user.',
        currentTask: existing,
      });
    }

    // Verify destination column belongs to this tenant
    const destColumn = await prisma.column.findFirst({
      where: { id: destinationColumnId, tenantId },
    });

    if (!destColumn) {
      return res.status(400).json({ message: 'Destination column does not belong to this branch' });
    }

    // Execute atomic move and activity log
    const moved = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: destinationColumnId,
          position: newPosition !== undefined ? newPosition : existing.position,
          version: { increment: 1 },
        },
        include: {
          assignee: { select: { id: true, fullName: true, email: true } },
          column: { select: { id: true, name: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          entityType: 'TASK',
          entityId: task.id,
          action: 'MOVED',
          details: {
            taskTitle: task.title,
            fromColumn: existing.column.name,
            toColumn: destColumn.name,
            newPosition: task.position,
          },
        },
      });

      return task;
    });

    return res.status(200).json({ message: 'Task moved successfully', task: moved });
  } catch (error) {
    console.error('Error moving task:', error);
    return res.status(500).json({ message: 'Failed to move task' });
  }
};

// -------------------------------------------------------------
// 5. Delete a task
// -------------------------------------------------------------
export const deleteTask = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { taskId } = req.params;

    const existing = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Task not found in this branch' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.activityLog.create({
        data: {
          tenantId,
          userId: req.user.id,
          entityType: 'TASK',
          entityId: existing.id,
          action: 'DELETED',
          details: { taskTitle: existing.title },
        },
      });

      await tx.task.delete({
        where: { id: taskId },
      });
    });

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ message: 'Failed to delete task' });
  }
};
