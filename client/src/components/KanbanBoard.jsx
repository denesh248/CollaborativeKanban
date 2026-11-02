// client/src/components/KanbanBoard.jsx
// Interactive Kanban Board with dnd-kit drag-and-drop, OCC concurrency, and Socket.IO real-time sync

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

// Calculate new integer position between neighboring tasks for drag-and-drop ordering
const calculateNewPosition = (tasks, targetIndex) => {
  if (!tasks || tasks.length <= 1) return 1000;
  if (targetIndex === 0) {
    const nextPos = tasks[1]?.position || 1000;
    return Math.max(1, Math.round(nextPos / 2));
  }
  if (targetIndex >= tasks.length - 1) {
    const prevPos = tasks[tasks.length - 2]?.position || 1000;
    return prevPos + 1000;
  }
  const prevPos = tasks[targetIndex - 1]?.position || 1000;
  const nextPos = tasks[targetIndex + 1]?.position || prevPos + 1000;
  return Math.round((prevPos + nextPos) / 2);
};

// Priority badge style helper
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

// -------------------------------------------------------------
// Sub-Component: Task Card Content (Used by card & DragOverlay)
// -------------------------------------------------------------
function TaskCardView({ task, isOverlay = false, onEdit, onDelete, onQuickMove, columns = [] }) {
  const assigneeName = task.assignee?.fullName || 'Unassigned';

  return (
    <div className={`space-y-3 ${isOverlay ? 'bg-white rounded-xl border-2 border-indigo-500 p-4 shadow-xl cursor-grabbing' : ''}`}>
      {/* Priority & OCC Version */}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadgeClass(task.priority)}`}>
          {task.priority || 'MEDIUM'}
        </span>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80" title="OCC Version">
          v{task.version}
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="font-semibold text-slate-900 text-sm leading-snug tracking-tight">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
        )}
      </div>

      {/* Card Footer: Assignee & Action Buttons */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
            {assigneeName.charAt(0).toUpperCase()}
          </div>
          <span className="text-slate-600 text-xs truncate max-w-[110px]" title={assigneeName}>
            {assigneeName}
          </span>
        </div>

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

      {/* Accessible Quick Move select */}
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

// -------------------------------------------------------------
// Sub-Component: Sortable Task Card Wrapper
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// Sub-Component: Droppable Column Container
// -------------------------------------------------------------
function DroppableColumn({ column, columns, onOpenAdd, onEditTask, onDeleteTask, onQuickMoveTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border p-3.5 flex flex-col min-h-[500px] transition-colors ${
        isOver ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/10' : 'bg-slate-100/70 border-slate-200/80'
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
          onClick={() => onOpenAdd(column.id)}
          className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 font-semibold cursor-pointer border border-slate-200 shadow-xs transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Sortable Tasks List */}
      <SortableContext items={column.tasks ? column.tasks.map((t) => t.id) : []} strategy={verticalListSortingStrategy}>
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

// -------------------------------------------------------------
// Main Component: KanbanBoard
// -------------------------------------------------------------
export default function KanbanBoard({ tenant, token, user }) {
  const [activeBoard, setActiveBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  // Drag-and-drop state
  const [activeDragTask, setActiveDragTask] = useState(null);
  const dragStartRef = useRef(null);

  // Unified Task Modal State (Handles both Create and Edit modes simply)
  const [taskModal, setTaskModal] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    task: null,
    formData: { title: '', description: '', columnId: '', priority: 'MEDIUM', assignedToId: '' },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 1. Initial Load of Branch Data
  useEffect(() => {
    if (tenant?.id && token) {
      loadBranchData(true);
    }
  }, [tenant?.id, token]);

  const loadBranchData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);

    try {
      const boardList = await getBoardsApi(tenant.id, token);
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
      if (showSpinner) setLoading(false);
    }
  };

  // 2. Real-Time Socket.IO Synchronization & Presence
  useEffect(() => {
    if (!tenant?.id || !token || !user?.id) return;

    const socket = connectSocket(token);

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit('tenant:join', { tenantId: tenant.id });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('reconnect', () => {
      setSocketConnected(true);
      socket.emit('tenant:join', { tenantId: tenant.id });
      loadBranchData(false);
    });

    // Real-time presence updates
    socket.on('presence:update', ({ onlineUsers }) => {
      setOnlineUsers(onlineUsers || []);
    });

    // Real-time task events (ignore if current user is the actor to avoid duplicate mutations)
    socket.on('task:created', ({ task, actorId }) => {
      if (actorId === user.id) return;
      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === task.columnId && !c.tasks?.some((t) => t.id === task.id)
              ? { ...c, tasks: [...(c.tasks || []), task] }
              : c
          ),
        };
      });
    });

    socket.on('task:updated', ({ task, actorId }) => {
      if (actorId === user.id) return;
      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((c) => ({
            ...c,
            tasks: (c.tasks || []).map((t) => (t.id === task.id ? { ...t, ...task } : t)),
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
              return { ...col, tasks: (col.tasks || []).filter((t) => t.id !== task.id) };
            }
            if (col.id === toColumnId) {
              const filtered = (col.tasks || []).filter((t) => t.id !== task.id);
              const list = [...filtered, { ...task, columnId: toColumnId, position: newPosition }];
              list.sort((a, b) => a.position - b.position);
              return { ...col, tasks: list };
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
          columns: prev.columns.map((c) => ({
            ...c,
            tasks: (c.tasks || []).filter((t) => t.id !== taskId),
          })),
        };
      });
    });

    socket.on('activity:new', ({ log }) => {
      if (!log) return;
      setActivityLogs((prev) => (prev.some((l) => l.id === log.id) ? prev : [log, ...prev]));
    });

    return () => {
      socket.emit('tenant:leave', { tenantId: tenant.id });
      socket.off('connect', handleConnect);
      socket.off('disconnect');
      socket.off('reconnect');
      socket.off('presence:update');
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('activity:new');
    };
  }, [tenant?.id, token, user?.id]);

  // 3. Drag and Drop Handlers
  const handleDragStart = ({ active }) => {
    if (!activeBoard?.columns) return;
    for (const col of activeBoard.columns) {
      const task = col.tasks?.find((t) => t.id === active.id);
      if (task) {
        setActiveDragTask(task);
        dragStartRef.current = { taskId: task.id, columnId: col.id, position: task.position, version: task.version };
        break;
      }
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (!over || !activeBoard?.columns) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const sourceCol = activeBoard.columns.find((c) => c.tasks?.some((t) => t.id === activeId));
    let destCol = activeBoard.columns.find((c) => c.id === overId) || activeBoard.columns.find((c) => c.tasks?.some((t) => t.id === overId));
    if (!sourceCol || !destCol) return;

    if (sourceCol.id !== destCol.id) {
      setActiveBoard((prev) => {
        const activeTask = sourceCol.tasks.find((t) => t.id === activeId);
        if (!activeTask) return prev;

        const overIndex = destCol.tasks.findIndex((t) => t.id === overId);
        const newDestTasks = [...destCol.tasks];
        const taskWithNewCol = { ...activeTask, columnId: destCol.id };

        if (overIndex >= 0) newDestTasks.splice(overIndex, 0, taskWithNewCol);
        else newDestTasks.push(taskWithNewCol);

        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === sourceCol.id) return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
            if (col.id === destCol.id) return { ...col, tasks: newDestTasks };
            return col;
          }),
        };
      });
    } else {
      const oldIndex = sourceCol.tasks.findIndex((t) => t.id === activeId);
      const newIndex = sourceCol.tasks.findIndex((t) => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setActiveBoard((prev) => ({
          ...prev,
          columns: prev.columns.map((col) =>
            col.id === sourceCol.id ? { ...col, tasks: arrayMove(sourceCol.tasks, oldIndex, newIndex) } : col
          ),
        }));
      }
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveDragTask(null);
    if (!over || !activeBoard?.columns) return;

    const activeId = active.id;
    const overId = over.id;
    let destCol = activeBoard.columns.find((c) => c.id === overId) || activeBoard.columns.find((c) => c.tasks?.some((t) => t.id === overId)) || activeBoard.columns.find((c) => c.tasks?.some((t) => t.id === activeId));
    if (!destCol) return;

    const taskIndex = destCol.tasks.findIndex((t) => t.id === activeId);
    if (taskIndex === -1) return;

    const task = destCol.tasks[taskIndex];
    const original = dragStartRef.current;
    const newPosition = calculateNewPosition(destCol.tasks, taskIndex);

    if (original && original.columnId === destCol.id && Math.abs(original.position - newPosition) <= 1) {
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

      // In-place version update without page reload
      setActiveBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === destCol.id
            ? { ...c, tasks: c.tasks.map((t) => (t.id === task.id ? { ...t, ...movedTask } : t)) }
            : c
        ),
      }));

      getActivityLogsApi(tenant.id, token).then(setActivityLogs).catch(() => {});
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: 'Conflict (HTTP 409): Another user moved or updated this task concurrently.',
          currentTask: err.currentTask,
        });
      } else {
        setError(err.message || 'Failed to move task');
      }
      loadBranchData(false);
    }
  };

  // Quick move dropdown for accessibility
  const handleQuickMoveTask = async (task, destColumnId) => {
    if (task.columnId === destColumnId) return;
    setConflictError(null);

    try {
      const movedTask = await moveTaskApi(
        tenant.id,
        task.id,
        { destinationColumnId: destColumnId, newPosition: 1000, expectedVersion: task.version },
        token
      );

      setActiveBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => {
            if (col.id === task.columnId) return { ...col, tasks: (col.tasks || []).filter((t) => t.id !== task.id) };
            if (col.id === destColumnId) return { ...col, tasks: [...(col.tasks || []).filter((t) => t.id !== task.id), movedTask] };
            return col;
          }),
        };
      });

      getActivityLogsApi(tenant.id, token).then(setActivityLogs).catch(() => {});
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: 'Conflict (HTTP 409): Task was modified concurrently by another user.',
          currentTask: err.currentTask,
        });
        loadBranchData(false);
      } else {
        setError(err.message || 'Error moving task');
      }
    }
  };

  // 4. Modal Open/Close & Submit Handlers
  const openCreateModal = (columnId) => {
    setTaskModal({
      isOpen: true,
      mode: 'create',
      task: null,
      formData: {
        title: '',
        description: '',
        columnId: columnId || activeBoard?.columns?.[0]?.id || '',
        priority: 'MEDIUM',
        assignedToId: '',
      },
    });
  };

  const openEditModal = (task) => {
    setTaskModal({
      isOpen: true,
      mode: 'edit',
      task,
      formData: {
        title: task.title,
        description: task.description || '',
        columnId: task.columnId,
        priority: task.priority || 'MEDIUM',
        assignedToId: task.assignedToId || '',
      },
    });
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const { mode, task, formData } = taskModal;
    if (!formData.title.trim()) return;

    setConflictError(null);

    try {
      if (mode === 'create') {
        const res = await createTaskApi(tenant.id, activeBoard.id, formData, token);
        if (res?.task) {
          setActiveBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((col) =>
              col.id === res.task.columnId ? { ...col, tasks: [...(col.tasks || []), res.task] } : col
            ),
          }));
        }
      } else {
        const res = await updateTaskApi(
          tenant.id,
          task.id,
          { ...formData, expectedVersion: task.version },
          token
        );
        if (res?.task) {
          setActiveBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((col) => ({
              ...col,
              tasks: (col.tasks || []).map((t) => (t.id === res.task.id ? res.task : t)),
            })),
          }));
        }
      }

      setTaskModal({ isOpen: false, mode: 'create', task: null, formData: {} });
      getActivityLogsApi(tenant.id, token).then(setActivityLogs).catch(() => {});
    } catch (err) {
      if (err.status === 409) {
        setConflictError({
          message: 'Conflict (HTTP 409): Task was modified concurrently by another user.',
          currentTask: err.currentTask,
        });
        loadBranchData(false);
      } else {
        setError(err.message || 'Operation failed');
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTaskApi(tenant.id, taskId, token);
      setActiveBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          tasks: (col.tasks || []).filter((t) => t.id !== taskId),
        })),
      }));
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

            {/* Live Socket Status Badge */}
            <span className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/80">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] font-semibold text-slate-600">
                {socketConnected ? 'Live Synced' : 'Reconnecting...'}
              </span>
            </span>
          </div>

          {/* Simple Text Presence Indicator */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold text-slate-600">Online ({onlineUsers.length}):</span>
            <span className="text-xs text-slate-500 truncate max-w-md">
              {onlineUsers.length > 0 ? onlineUsers.map((u) => u.fullName).join(', ') : 'Connecting to room...'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadBranchData(false)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Refresh
          </button>
          {activeBoard?.columns?.length > 0 && (
            <button
              type="button"
              onClick={() => openCreateModal(activeBoard.columns[0].id)}
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
            Database state protected from concurrent overwrite. Synced with the latest version.
          </div>
        </div>
      )}

      {/* Interactive Drag-and-Drop Columns */}
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
                onOpenAdd={openCreateModal}
                onEditTask={openEditModal}
                onDeleteTask={handleDeleteTask}
                onQuickMoveTask={handleQuickMoveTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDragTask ? <TaskCardView task={activeDragTask} isOverlay={true} columns={activeBoard.columns} /> : null}
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
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Activity Audit Trail</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Live Stream
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">{activityLogs.length} Events Logged</span>
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
                  <span className="font-semibold text-slate-800">{log.user?.fullName || 'System User'}</span>
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

      {/* Unified Task Modal (Create & Edit) */}
      {taskModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base tracking-tight">
                {taskModal.mode === 'create' ? 'Create New Task' : 'Edit Task'}
              </h3>
              {taskModal.mode === 'edit' && (
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  Current: v{taskModal.task?.version}
                </span>
              )}
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={taskModal.formData.title}
                  onChange={(e) =>
                    setTaskModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, title: e.target.value },
                    }))
                  }
                  placeholder="Task title..."
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
                  value={taskModal.formData.description}
                  onChange={(e) =>
                    setTaskModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, description: e.target.value },
                    }))
                  }
                  placeholder="Details..."
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
                    value={taskModal.formData.columnId}
                    onChange={(e) =>
                      setTaskModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, columnId: e.target.value },
                      }))
                    }
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
                    value={taskModal.formData.priority}
                    onChange={(e) =>
                      setTaskModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, priority: e.target.value },
                      }))
                    }
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
                  value={taskModal.formData.assignedToId}
                  onChange={(e) =>
                    setTaskModal((prev) => ({
                      ...prev,
                      formData: { ...prev.formData, assignedToId: e.target.value },
                    }))
                  }
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
                  onClick={() => setTaskModal({ isOpen: false, mode: 'create', task: null, formData: {} })}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {taskModal.mode === 'create' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
