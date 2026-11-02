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

// Component: Task Card Content (Used by both SortableCard and DragOverlay)
function TaskCardView({ task, isOverlay = false, onEdit, onDelete, onQuickMove, columns = [] }) {
  return (
    <div
      className={`space-y-2.5 ${
        isOverlay
          ? 'bg-white rounded-xl border-2 border-indigo-600 p-3.5 shadow-2xl rotate-1 cursor-grabbing'
          : ''
      }`}
    >
      {/* Priority and OCC Version */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            task.priority === 'URGENT'
              ? 'bg-red-100 text-red-800'
              : task.priority === 'HIGH'
              ? 'bg-amber-100 text-amber-800'
              : task.priority === 'LOW'
              ? 'bg-slate-100 text-slate-700'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {task.priority}
        </span>

        <span
          className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
          title="OCC Concurrency Version Counter"
        >
          v{task.version}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="font-semibold text-slate-900 text-sm leading-snug">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Card Footer: Assignee & Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="text-slate-600 text-[11px] font-medium truncate max-w-[120px]">
          {task.assignee?.fullName ? task.assignee.fullName : 'Unassigned'}
        </div>

        {!isOverlay && (
          <div className="flex items-center gap-1">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onEdit?.(task)}
              className="px-1.5 py-0.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
            >
              Edit
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDelete?.(task.id)}
              className="px-1.5 py-0.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Quick Move Dropdown (Accessible Fallback) */}
      {!isOverlay && columns.length > 0 && (
        <div className="pt-1 flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
          <span className="text-[10px] text-slate-400">Move:</span>
          <select
            value={task.columnId}
            onChange={(e) => onQuickMove?.(task, e.target.value)}
            className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer"
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
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border p-3.5 shadow-xs transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'border-dashed border-indigo-400 bg-indigo-50/20' : 'border-slate-200'
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
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-4 flex flex-col max-h-[750px] transition-colors ${
        isOver
          ? 'ring-2 ring-indigo-500 bg-indigo-50/50 border-indigo-300'
          : 'bg-slate-100/80 border-slate-200/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{column.name}</h3>
          <span className="w-5 h-5 rounded-full bg-white text-slate-600 text-[11px] font-bold flex items-center justify-center shadow-xs">
            {column.tasks?.length || 0}
          </span>
        </div>

        <button
          onClick={() => onOpenNewTask(column.id)}
          className="text-xs px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer border border-slate-200"
          title={`Add task to ${column.name}`}
        >
          + Add
        </button>
      </div>

      {/* Task Cards List (Sortable) */}
      <SortableContext
        items={column.tasks ? column.tasks.map((t) => t.id) : []}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-[120px]">
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
            <div className="py-8 text-center text-xs text-slate-400 italic border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center h-full">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// Main Component: KanbanBoard with Real-Time Socket.IO Synchronization
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

  // DnD Sensors: 5px distance prevents accidental drag when clicking buttons
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 1. Initial Load of Tenant Data
  useEffect(() => {
    if (tenant?.id && token) {
      loadTenantData();
    }
  }, [tenant?.id, token]);

  const loadTenantData = async () => {
    setLoading(true);
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
      setLoading(false);
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
      // Re-fetch board to reconcile missed mutations while disconnected
      loadTenantData();
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    // Presence updates
    socket.on('presence:update', ({ onlineUsers }) => {
      setOnlineUsers(onlineUsers || []);
    });

    // Real-Time Task Mutation Listeners (Ignore local actor to prevent duplicate updates)
    socket.on('task:created', ({ task, actorId }) => {
      if (actorId === user.id) return;
      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === task.columnId) {
              if (col.tasks.some((t) => t.id === task.id)) return col;
              return { ...col, tasks: [...col.tasks, task] };
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
            tasks: col.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
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
                tasks: col.tasks.filter((t) => t.id !== task.id),
              };
            }
            if (col.id === toColumnId) {
              const filtered = col.tasks.filter((t) => t.id !== task.id);
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
            tasks: col.tasks.filter((t) => t.id !== taskId),
          })),
        };
      });
    });

    // Real-Time Activity Log Stream Listener
    socket.on('activity:new', ({ log }) => {
      if (!log) return;
      setActivityLogs((prev) => {
        if (prev.some((l) => l.id === log.id)) return prev;
        return [log, ...prev];
      });
    });

    // Board & Column Structure changes
    socket.on('board:updated', () => loadTenantData());
    socket.on('column:created', () => loadTenantData());
    socket.on('column:updated', () => loadTenantData());
    socket.on('column:deleted', () => loadTenantData());

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

      const logs = await getActivityLogsApi(tenant.id, token);
      setActivityLogs(logs);
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: 'Conflict (HTTP 409): Another user moved or updated this task concurrently.',
          currentTask: err.currentTask,
        });
      } else {
        setError(err.message || 'Failed to persist task movement');
      }
      await loadTenantData();
    }
  };

  const handleQuickMoveTask = async (task, destColumnId) => {
    if (task.columnId === destColumnId) return;
    setConflictError(null);

    try {
      await moveTaskApi(
        tenant.id,
        task.id,
        {
          destinationColumnId: destColumnId,
          newPosition: 1000,
          expectedVersion: task.version,
        },
        token
      );
      await loadTenantData();
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: 'Conflict (HTTP 409): Another user moved or updated this task concurrently.',
          currentTask: err.currentTask,
        });
        await loadTenantData();
      } else {
        setError(err.message || 'Error moving task');
      }
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskColumnId) return;

    try {
      await createTaskApi(
        tenant.id,
        activeBoard.id,
        {
          title: newTaskTitle,
          description: newTaskDesc,
          columnId: newTaskColumnId,
          priority: newTaskPriority,
          assignedToId: newTaskAssigneeId || null,
        },
        token
      );

      setIsNewTaskOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      await loadTenantData();
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
      await updateTaskApi(
        tenant.id,
        editingTask.id,
        {
          title: editTitle,
          description: editDesc,
          priority: editPriority,
          assignedToId: editAssigneeId || null,
          expectedVersion: editingTask.version,
        },
        token
      );

      setEditingTask(null);
      await loadTenantData();
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: 'Conflict (HTTP 409): This task was modified by another user.',
          currentTask: err.currentTask,
        });
        await loadTenantData();
      } else {
        setError(err.message || 'Error updating task');
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTaskApi(tenant.id, taskId, token);
      await loadTenantData();
    } catch (err) {
      setError(err.message || 'Error deleting task');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-2">
        <p className="text-slate-500 text-sm">Loading branch Kanban board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Board Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {activeBoard?.name || 'No Boards Found'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              {tenant.name}
            </span>

            {/* Live Socket Connection Badge */}
            <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
              <span className="text-[11px] font-medium">
                {socketConnected ? 'Live Synced' : 'Reconnecting...'}
              </span>
            </span>
          </div>

          {/* Simple Text Presence Indicator */}
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTenantData()}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
          >
            Refresh
          </button>

          {activeBoard?.columns?.length > 0 && (
            <button
              onClick={() => {
                setNewTaskColumnId(activeBoard.columns[0].id);
                setIsNewTaskOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer shadow-sm"
            >
              + New Task
            </button>
          )}
        </div>
      </div>

      {/* Error & OCC Conflict Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
          <strong>Error: </strong> {error}
        </div>
      )}

      {conflictError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
          <div className="font-bold text-sm">Optimistic Concurrency Control (OCC) Alert</div>
          <div>{conflictError.message}</div>
          <div className="font-mono text-[11px] bg-white/70 p-1.5 rounded border border-amber-200">
            Database state protected from overwrite. Latest version has been synced.
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
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No boards available for this branch.
        </div>
      )}

      {/* Live Activity Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-sm">Tenant Activity Audit Trail</h3>
          <span className="text-[11px] text-slate-500 font-mono">
            {activityLogs.length} Events Recorded
          </span>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto text-xs">
          {activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'CREATED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.action === 'MOVED'
                        ? 'bg-indigo-100 text-indigo-800'
                        : log.action === 'DELETED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="font-medium text-slate-800">
                    {log.user?.fullName || 'System User'}
                  </span>
                  <span className="text-slate-500">
                    {log.action === 'MOVED' && log.details?.fromColumn
                      ? `moved task from "${log.details.fromColumn}" to "${log.details.toColumn}"`
                      : log.details?.taskTitle
                      ? `"${log.details.taskTitle}"`
                      : log.entityType}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No activity logs recorded yet.</p>
          )}
        </div>
      </div>

      {/* Modal: New Task */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-4">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Task details..."
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Column</label>
                  <select
                    value={newTaskColumnId}
                    onChange={(e) => setNewTaskColumnId(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                  >
                    {activeBoard?.columns?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                <select
                  value={newTaskAssigneeId}
                  onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Edit Task</h3>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Version: v{editingTask.version}
              </span>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    value={editAssigneeId}
                    onChange={(e) => setEditAssigneeId(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer"
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
