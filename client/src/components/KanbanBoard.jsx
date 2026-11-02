import React, { useState, useEffect, useRef } from 'react';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  getBoardsApi,
  getBoardDetailsApi,
  createTaskApi,
  updateTaskApi,
  moveTaskApi,
  deleteTaskApi,
  getActivityLogsApi,
  getBranchMembersApi,
} from '../services/api.js';
import { connectSocket } from '../services/socket.js';

// Helper: Calculate new integer position between neighboring tasks
const calculateNewPosition = (tasks, targetIndex) => {
  if (!tasks || tasks.length <= 1) {
    return 1000;
  }
  if (targetIndex === 0) {
    const nextPos = tasks[1]?.position || 1000;
    return nextPos > 10 ? Math.round(nextPos / 2) : Math.max(1, nextPos - 10);
  }
  if (targetIndex >= tasks.length - 1) {
    const prevPos = tasks[tasks.length - 2]?.position || 1000;
    return prevPos + 1000;
  }
  const prevPos = tasks[targetIndex - 1]?.position || 1000;
  const nextPos = tasks[targetIndex + 1]?.position || prevPos + 1000;
  return Math.round((prevPos + nextPos) / 2);
};

// Priority badge helper
const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'HIGH':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'LOW':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-sky-50 text-sky-700 border-sky-200';
  }
};

// Component: Task Card View (Used by both SortableCard and DragOverlay)
function TaskCardView({ task, isOverlay = false, onEdit, onDelete, onQuickMove, columns = [] }) {
  const assigneeName = task.assignee?.fullName || 'Unassigned';
  const assigneeInitial = assigneeName.charAt(0).toUpperCase();

  return (
    <div
      className={`space-y-3 ${
        isOverlay
          ? 'bg-white rounded-xl border-2 border-indigo-500 p-4 shadow-xl rotate-1 cursor-grabbing'
          : ''
      }`}
    >
      {/* Card Header: Priority & OCC Version Badge */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadgeClass(
            task.priority
          )}`}
        >
          {task.priority || 'MEDIUM'}
        </span>

        <span
          className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80"
          title="Optimistic Concurrency Control (OCC) Version"
        >
          v{task.version}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="font-semibold text-slate-900 text-sm leading-snug tracking-tight">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Card Footer: Assignee & Action Buttons */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        {/* Assignee Avatar & Name */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
            {assigneeInitial}
          </div>
          <span className="text-slate-600 text-xs truncate max-w-[110px]" title={assigneeName}>
            {assigneeName}
          </span>
        </div>

        {/* Action Buttons */}
        {!isOverlay && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onEdit?.(task)}
              className="px-2 py-0.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer font-medium"
            >
              Edit
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDelete?.(task.id)}
              className="px-2 py-0.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Accessible Quick Move */}
      {!isOverlay && columns.length > 1 && (
        <div className="pt-1 flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <span className="text-[10px] text-slate-400 font-medium">Move:</span>
          <select
            value={task.columnId}
            onChange={(e) => onQuickMove?.(task, e.target.value)}
            className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 cursor-pointer focus:outline-none focus:border-indigo-400"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// Component: Sortable Task Card
function SortableTaskCard({ task, onEdit, onDelete, onQuickMove, columns }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border p-3.5 shadow-xs transition-all cursor-grab active:cursor-grabbing select-none hover:border-slate-300 hover:shadow-sm ${
        isDragging ? 'border-dashed border-indigo-400 bg-indigo-50/20' : 'border-slate-200/90'
      }`}
    >
      <TaskCardView
        task={task}
        isOverlay={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onQuickMove={onQuickMove}
        columns={columns}
      />
    </div>
  );
}

// Component: Droppable Column Container
function DroppableColumn({
  column,
  columns,
  onOpenNewTask,
  onEditTask,
  onDeleteTask,
  onQuickMoveTask,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-3.5 flex flex-col min-h-[500px] transition-colors ${
        isOver
          ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/10'
          : 'bg-slate-100/70 border-slate-200/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{column.name}</h3>
          <span className="w-5 h-5 rounded-full bg-white text-slate-600 text-[11px] font-bold flex items-center justify-center shadow-xs border border-slate-200/60">
            {column.tasks?.length || 0}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewTask(column.id)}
          className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 font-semibold cursor-pointer border border-slate-200 shadow-xs transition-colors"
          title={`Add task to ${column.name}`}
        >
          + Add
        </button>
      </div>

      {/* Sortable Task Cards List */}
      <SortableContext
        items={column.tasks ? column.tasks.map((t) => t.id) : []}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-[140px]">
          {column.tasks && column.tasks.length > 0 ? (
            column.tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onQuickMove={onQuickMoveTask}
                columns={columns}
              />
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200/80 rounded-xl flex items-center justify-center h-full">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// Main Component: KanbanBoard
export default function KanbanBoard({ tenant, token, user }) {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  // Active dragged task for DragOverlay
  const [activeDragTask, setActiveDragTask] = useState(null);
  const dragStartRef = useRef(null);

  // Modal states: Create Task
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  // Modal states: Edit Task
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editAssigneeId, setEditAssigneeId] = useState('');

  // Sensors: 5px distance prevents accidental drag when clicking buttons
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 1. Initial Load of Tenant Data (Only shows full loading spinner on initial mount or branch change)
  useEffect(() => {
    if (tenant?.id && token) {
      loadTenantData(true);
    }
  }, [tenant?.id, token]);

  const loadTenantData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError(null);
    setConflictError(null);

    try {
      const boardList = await getBoardsApi(tenant.id, token);
      setBoards(boardList);

      if (boardList.length > 0) {
        const details = await getBoardDetailsApi(tenant.id, boardList[0].id, token);
        setActiveBoard(details);
      } else {
        setActiveBoard(null);
      }

      const [membersData, logsData] = await Promise.all([
        getBranchMembersApi(tenant.id, token),
        getActivityLogsApi(tenant.id, token),
      ]);
      setMembers(membersData);
      setActivityLogs(logsData);
    } catch (err) {
      setError(err.message || 'Failed to load branch workspace');
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  // 2. Real-Time Collaboration & Presence via Socket.IO
  useEffect(() => {
    if (!tenant?.id || !token || !user?.id) return;

    const socket = connectSocket(token);

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit('tenant:join', { tenantId: tenant.id });
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleReconnect = () => {
      setSocketConnected(true);
      socket.emit('tenant:join', { tenantId: tenant.id });
      // Background silent reconcile without full page wipe
      loadTenantData(false);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    // Presence update
    socket.on('presence:update', ({ onlineUsers }) => {
      setOnlineUsers(onlineUsers || []);
    });

    // Real-Time Task Mutation Listeners (Ignore local actor to prevent redundant state recalculation)
    socket.on('task:created', ({ task, actorId }) => {
      if (actorId === user.id) return;
      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === task.columnId) {
              if (col.tasks?.some((t) => t.id === task.id)) return col;
              return { ...col, tasks: [...(col.tasks || []), task] };
            }
            return col;
          }),
        };
      });
    });

    socket.on('task:updated', ({ task, actorId }) => {
      if (actorId === user.id) return;
      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: (col.tasks || []).map((t) => (t.id === task.id ? { ...t, ...task } : t)),
          })),
        };
      });
    });

    socket.on('task:moved', ({ task, actorId, fromColumnId, toColumnId, newPosition }) => {
      if (actorId === user.id) return;
      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === fromColumnId && fromColumnId !== toColumnId) {
              return {
                ...col,
                tasks: (col.tasks || []).filter((t) => t.id !== task.id),
              };
            }
            if (col.id === toColumnId) {
              const filtered = (col.tasks || []).filter((t) => t.id !== task.id);
              const updatedList = [
                ...filtered,
                { ...task, columnId: toColumnId, position: newPosition },
              ];
              updatedList.sort((a, b) => a.position - b.position);
              return {
                ...col,
                tasks: updatedList,
              };
            }
            return col;
          }),
        };
      });
    });

    socket.on('task:deleted', ({ taskId, actorId }) => {
      if (actorId === user.id) return;
      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: (col.tasks || []).filter((t) => t.id !== taskId),
          })),
        };
      });
    });

    // Real-Time Activity Log Stream
    socket.on('activity:new', ({ log }) => {
      if (!log) return;
      setActivityLogs((prev) => {
        if (prev.some((l) => l.id === log.id)) return prev;
        return [log, ...prev];
      });
    });

    // Silent background updates for structure changes
    socket.on('board:updated', () => loadTenantData(false));
    socket.on('column:created', () => loadTenantData(false));
    socket.on('column:updated', () => loadTenantData(false));
    socket.on('column:deleted', () => loadTenantData(false));

    return () => {
      socket.emit('tenant:leave', { tenantId: tenant.id });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('presence:update');
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('activity:new');
      socket.off('board:updated');
      socket.off('column:created');
      socket.off('column:updated');
      socket.off('column:deleted');
    };
  }, [tenant?.id, token, user?.id]);

  // Drag and Drop Handlers
  const handleDragStart = (event) => {
    const { active } = event;
    if (!activeBoard?.columns) return;

    for (const col of activeBoard.columns) {
      const task = col.tasks?.find((t) => t.id === active.id);
      if (task) {
        setActiveDragTask(task);
        dragStartRef.current = {
          taskId: task.id,
          columnId: col.id,
          position: task.position,
          version: task.version,
        };
        break;
      }
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || !activeBoard?.columns) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const sourceCol = activeBoard.columns.find((c) => c.tasks?.some((t) => t.id === activeId));
    if (!sourceCol) return;

    let destCol = activeBoard.columns.find((c) => c.id === overId);
    if (!destCol) {
      destCol = activeBoard.columns.find((c) => c.tasks?.some((t) => t.id === overId));
    }
    if (!destCol) return;

    if (sourceCol.id !== destCol.id) {
      setActiveBoard((prev) => {
        const activeTask = sourceCol.tasks.find((t) => t.id === activeId);
        if (!activeTask) return prev;

        const overIndex = destCol.tasks.findIndex((t) => t.id === overId);
        const newDestTasks = [...destCol.tasks];
        const taskWithNewCol = { ...activeTask, columnId: destCol.id };

        if (overIndex >= 0) {
          newDestTasks.splice(overIndex, 0, taskWithNewCol);
        } else {
          newDestTasks.push(taskWithNewCol);
        }

        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === sourceCol.id) {
              return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
            }
            if (col.id === destCol.id) {
              return { ...col, tasks: newDestTasks };
            }
            return col;
          }),
        };
      });
    } else {
      const oldIndex = sourceCol.tasks.findIndex((t) => t.id === activeId);
      const newIndex = sourceCol.tasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setActiveBoard((prev) => {
          const reorderedTasks = arrayMove(sourceCol.tasks, oldIndex, newIndex);
          return {
            ...prev,
            columns: prev.columns.map((col) => {
              if (col.id === sourceCol.id) {
                return { ...col, tasks: reorderedTasks };
              }
              return col;
            }),
          };
        });
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (!over || !activeBoard?.columns) return;

    const activeId = active.id;
    const overId = over.id;

    let destCol = activeBoard.columns.find((col) => col.id === overId);
    if (!destCol) {
      destCol = activeBoard.columns.find((col) => col.tasks?.some((t) => t.id === overId));
    }
    if (!destCol) {
      destCol = activeBoard.columns.find((col) => col.tasks?.some((t) => t.id === activeId));
    }
    if (!destCol) return;

    const targetTasks = destCol.tasks;
    const taskIndex = targetTasks.findIndex((t) => t.id === activeId);
    if (taskIndex === -1) return;

    const task = targetTasks[taskIndex];
    const original = dragStartRef.current;

    const newPosition = calculateNewPosition(targetTasks, taskIndex);
    const columnChanged = original && original.columnId !== destCol.id;
    const positionChanged = original && Math.abs(original.position - newPosition) > 1;

    if (!columnChanged && !positionChanged) {
      return;
    }

    setConflictError(null);

    try {
      const movedTask = await moveTaskApi(
        tenant.id,
        task.id,
        {
          destinationColumnId: destCol.id,
          newPosition,
          expectedVersion: original ? original.version : task.version,
        },
        token
      );

      // Silently patch the moved task version in local state without any full board unmounting
      setActiveBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id === destCol.id) {
            return {
              ...col,
              tasks: col.tasks.map((t) => (t.id === task.id ? { ...t, ...movedTask } : t)),
            };
          }
          return col;
        }),
      }));

      getActivityLogsApi(tenant.id, token).then(setActivityLogs).catch(() => {});
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: 'Conflict (HTTP 409): Another user moved or updated this task concurrently.',
          currentTask: err.currentTask,
        });
      } else {
        setError(err.message || 'Failed to persist task movement');
      }
      loadTenantData(false); // Background silent sync
    }
  };

  const handleQuickMoveTask = async (task, destColumnId) => {
    if (task.columnId === destColumnId) return;
    setConflictError(null);

    try {
      const movedTask = await moveTaskApi(
        tenant.id,
        task.id,
        {
          destinationColumnId: destColumnId,
          newPosition: 1000,
          expectedVersion: task.version,
        },
        token
      );

      // Directly update local state without reloading the whole screen
      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === task.columnId) {
              return { ...col, tasks: (col.tasks || []).filter((t) => t.id !== task.id) };
            }
            if (col.id === destColumnId) {
              return {
                ...col,
                tasks: [...(col.tasks || []).filter((t) => t.id !== task.id), movedTask],
              };
            }
            return col;
          }),
        };
      });

      getActivityLogsApi(tenant.id, token).then(setActivityLogs).catch(() => {});
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: 'Conflict (HTTP 409): Another user moved or updated this task concurrently.',
          currentTask: err.currentTask,
        });
        loadTenantData(false);
      } else {
        setError(err.message || 'Error moving task');
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskColumnId) return;

    try {
      const res = await createTaskApi(
        tenant.id,
        activeBoard.id,
        {
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim() || null,
          columnId: newTaskColumnId,
          priority: newTaskPriority,
          assignedToId: newTaskAssigneeId || null,
        },
        token
      );

      setIsNewTaskOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');

      // Directly insert the created task into local board state (NO FULL-SCREEN RELOAD)
      if (res && res.task) {
        setActiveBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            columns: prev.columns.map((col) => {
              if (col.id === res.task.columnId) {
                if (col.tasks?.some((t) => t.id === res.task.id)) return col;
                return { ...col, tasks: [...(col.tasks || []), res.task] };
              }
              return col;
            }),
          };
        });
      }

      getActivityLogsApi(tenant.id, token).then(setActivityLogs).catch(() => {});
    } catch (err) {
      setError(err.message || 'Error creating task');
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority || 'MEDIUM');
    setEditAssigneeId(task.assignedToId || '');
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setConflictError(null);

    try {
      const res = await updateTaskApi(
        tenant.id,
        editingTask.id,
        {
          title: editTitle.trim(),
          description: editDesc.trim() || null,
          priority: editPriority,
          assignedToId: editAssigneeId || null,
          expectedVersion: editingTask.version,
        },
        token
      );

      setEditingTask(null);

      // Directly update the task in local state (NO FULL-SCREEN RELOAD)
      if (res && res.task) {
        setActiveBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            columns: prev.columns.map((col) => ({
              ...col,
              tasks: (col.tasks || []).map((t) => (t.id === res.task.id ? res.task : t)),
            })),
          };
        });
      }

      getActivityLogsApi(tenant.id, token).then(setActivityLogs).catch(() => {});
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: 'Conflict (HTTP 409): This task was modified by another user.',
          currentTask: err.currentTask,
        });
        loadTenantData(false);
      } else {
        setError(err.message || 'Error updating task');
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTaskApi(tenant.id, taskId, token);

      // Directly remove the task from local state (NO FULL-SCREEN RELOAD)
      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: (col.tasks || []).filter((t) => t.id !== taskId),
          })),
        };
      });

      getActivityLogsApi(tenant.id, token).then(setActivityLogs).catch(() => {});
    } catch (err) {
      setError(err.message || 'Error deleting task');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-slate-500 text-xs font-medium">Loading branch Kanban board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Board Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {activeBoard?.name || 'Kanban Workspace'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
              {tenant.name}
            </span>

            {/* Live Socket Connection Badge */}
            <span className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/80">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-600">
                {socketConnected ? 'Live Synced' : 'Reconnecting...'}
              </span>
            </span>
          </div>

          {/* Connected Presence Tracker */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold text-slate-600">
              Online ({onlineUsers.length}):
            </span>
            <span className="text-xs text-slate-500 truncate max-w-md">
              {onlineUsers.length > 0
                ? onlineUsers.map((u) => u.fullName).join(', ')
                : 'Connecting to room...'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadTenantData(false)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Refresh
          </button>

          {activeBoard?.columns?.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setNewTaskColumnId(activeBoard.columns[0].id);
                setIsNewTaskOpen(true);
              }}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              + New Task
            </button>
          )}
        </div>
      </div>

      {/* Error & OCC Conflict Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span><strong>Error: </strong> {error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 font-bold ml-2">✕</button>
        </div>
      )}

      {conflictError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1 shadow-xs">
          <div className="font-bold text-sm">Optimistic Concurrency Control (OCC) Notice</div>
          <div>{conflictError.message}</div>
          <div className="font-mono text-[11px] bg-white/80 p-2 rounded border border-amber-200">
            Database state protected from concurrent overwrite. Board has been synchronized with the latest version.
          </div>
        </div>
      )}

      {/* Interactive Drag-and-Drop Kanban Columns */}
      {activeBoard?.columns ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {activeBoard.columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                columns={activeBoard.columns}
                onOpenNewTask={(colId) => {
                  setNewTaskColumnId(colId);
                  setIsNewTaskOpen(true);
                }}
                onEditTask={openEditModal}
                onDeleteTask={handleDeleteTask}
                onQuickMoveTask={handleQuickMoveTask}
              />
            ))}
          </div>

          {/* Floating Drag Overlay */}
          <DragOverlay>
            {activeDragTask ? (
              <TaskCardView
                task={activeDragTask}
                isOverlay={true}
                columns={activeBoard.columns}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No boards available for this branch.
        </div>
      )}

      {/* Real-Time Activity Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Activity Audit Trail
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Live Stream
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {activityLogs.length} Events Logged
          </span>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto text-xs pr-1">
          {activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                      log.action === 'CREATED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.action === 'MOVED'
                        ? 'bg-indigo-100 text-indigo-800'
                        : log.action === 'DELETED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {log.user?.fullName || 'System User'}
                  </span>
                  <span className="text-slate-500 truncate">
                    {log.action === 'MOVED' && log.details?.fromColumn
                      ? `moved task from "${log.details.fromColumn}" to "${log.details.toColumn}"`
                      : log.details?.taskTitle
                      ? `"${log.details.taskTitle}"`
                      : log.entityType}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2">No activity logs recorded yet.</p>
          )}
        </div>
      </div>

      {/* Modal: New Task */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-4 tracking-tight">
              Create New Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement user profile endpoint"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                  Description
                </label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Provide context or acceptance criteria..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Column
                  </label>
                  <select
                    value={newTaskColumnId}
                    onChange={(e) => setNewTaskColumnId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {activeBoard?.columns?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                  Assignee
                </label>
                <select
                  value={newTaskAssigneeId}
                  onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user.id}>
                      {m.user.fullName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Task */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base tracking-tight">Edit Task</h3>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Current: v{editingTask.version}
              </span>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                  Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Assignee
                  </label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.user.id}>
                        {m.user.fullName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
