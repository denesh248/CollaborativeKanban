import React, { useState, useEffect, useRef } from 'react';
import {
  KanbanSquare,
  Plus,
  ArrowRight,
  Trash2,
  Edit2,
  Clock,
  User,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle2,
  Layers,
  RefreshCw,
  GripVertical,
} from 'lucide-react';

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

// -------------------------------------------------------------
// Helper: Calculate new integer position between neighboring tasks
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// Component: Visual Card Body (shared by SortableCard & DragOverlay)
// -------------------------------------------------------------
function TaskCardContent({
  task,
  isOverlay = false,
  onEdit,
  onDelete,
  onQuickMove,
  columns = [],
}) {
  return (
    <div
      className={`space-y-3 ${
        isOverlay
          ? 'bg-white rounded-xl border-2 border-indigo-500 p-4 shadow-2xl rotate-2 cursor-grabbing'
          : ''
      }`}
    >
      {/* Priority & Version Badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              task.priority === 'URGENT'
                ? 'bg-red-100 text-red-700'
                : task.priority === 'HIGH'
                ? 'bg-amber-100 text-amber-700'
                : task.priority === 'LOW'
                ? 'bg-slate-100 text-slate-600'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {task.priority}
          </span>
        </div>

        <span
          className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
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
        <div className="flex items-center gap-1.5 text-slate-600">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-medium truncate max-w-[90px]">
            {task.assignee?.fullName || 'Unassigned'}
          </span>
        </div>

        {!isOverlay && (
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onEdit?.(task)}
              className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onDelete?.(task.id)}
              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Move Dropdown (Fallback for accessibility) */}
      {!isOverlay && columns.length > 0 && (
        <div
          className="pt-1 flex items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-slate-400">Move:</span>
          <select
            value={task.columnId}
            onChange={(e) => onQuickMove?.(task, e.target.value)}
            className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none cursor-pointer"
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
// Component: Sortable Task Card
// -------------------------------------------------------------
function SortableTaskCard({ task, onEdit, onDelete, onQuickMove, columns }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition-all space-y-3 group cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? 'border-dashed border-indigo-400 bg-indigo-50/20'
          : 'border-slate-200'
      }`}
    >
      <TaskCardContent
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
// Component: Droppable Column Container
// -------------------------------------------------------------
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
          ? 'ring-2 ring-indigo-500 bg-indigo-50/60 border-indigo-300'
          : 'bg-slate-100/80 border-slate-200/80'
      }`}
    >
      {/* Column Title */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{column.name}</h3>
          <span className="w-5 h-5 rounded-full bg-white text-slate-600 text-[11px] font-bold flex items-center justify-center shadow-2xs">
            {column.tasks?.length || 0}
          </span>
        </div>

        <button
          onClick={() => onOpenNewTask(column.id)}
          className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          title={`Add task to ${column.name}`}
        >
          <Plus className="w-4 h-4" />
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

// -------------------------------------------------------------
// Main Component: KanbanBoard
// -------------------------------------------------------------
export default function KanbanBoard({ tenant, token, user }) {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  // Active dragged task for DragOverlay
  const [activeDragTask, setActiveDragTask] = useState(null);
  const dragStartRef = useRef(null);

  // Modal states
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  // Edit Task modal
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editAssigneeId, setEditAssigneeId] = useState('');

  // Configure DnD Sensors (PointerSensor with 5px distance prevents accidental drag on click)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load board data whenever active tenant changes
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
      // 1. Fetch boards in this tenant
      const boardList = await getBoardsApi(tenant.id, token);
      setBoards(boardList);

      if (boardList.length > 0) {
        const details = await getBoardDetailsApi(tenant.id, boardList[0].id, token);
        setActiveBoard(details);
      } else {
        setActiveBoard(null);
      }

      // 2. Fetch branch members and activity logs
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

  // -------------------------------------------------------------
  // Drag and Drop Handlers
  // -------------------------------------------------------------
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

    // Find source column
    const sourceCol = activeBoard.columns.find((c) =>
      c.tasks?.some((t) => t.id === activeId)
    );
    if (!sourceCol) return;

    // Destination column can be the column container itself or a task inside it
    let destCol = activeBoard.columns.find((c) => c.id === overId);
    if (!destCol) {
      destCol = activeBoard.columns.find((c) =>
        c.tasks?.some((t) => t.id === overId)
      );
    }
    if (!destCol) return;

    // Moving across different columns
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
              return {
                ...col,
                tasks: col.tasks.filter((t) => t.id !== activeId),
              };
            }
            if (col.id === destCol.id) {
              return {
                ...col,
                tasks: newDestTasks,
              };
            }
            return col;
          }),
        };
      });
    } else {
      // Reordering within the SAME column
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

    // Find final destination column
    let destCol = activeBoard.columns.find((col) => col.id === overId);
    if (!destCol) {
      destCol = activeBoard.columns.find((col) =>
        col.tasks?.some((t) => t.id === overId)
      );
    }
    if (!destCol) {
      destCol = activeBoard.columns.find((col) =>
        col.tasks?.some((t) => t.id === activeId)
      );
    }
    if (!destCol) return;

    const targetTasks = destCol.tasks;
    const taskIndex = targetTasks.findIndex((t) => t.id === activeId);
    if (taskIndex === -1) return;

    const task = targetTasks[taskIndex];
    const original = dragStartRef.current;

    // Calculate new position
    const newPosition = calculateNewPosition(targetTasks, taskIndex);

    // Verify whether column or position changed
    const columnChanged = original && original.columnId !== destCol.id;
    const positionChanged = original && Math.abs(original.position - newPosition) > 1;

    if (!columnChanged && !positionChanged) {
      return; // No real change, avoid unnecessary network call
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

      // Update state with newly returned server version and position
      setActiveBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id === destCol.id) {
            return {
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === task.id ? { ...t, ...movedTask } : t
              ),
            };
          }
          return col;
        }),
      }));

      // Refresh activity logs to immediately display the move audit
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
      // Re-synchronize board data with authoritative database state
      await loadTenantData();
    }
  };

  // -------------------------------------------------------------
  // Quick Move Fallback Handler (Dropdown)
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Create Task Handler
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Edit Task Handler
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Delete Task Handler
  // -------------------------------------------------------------
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
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 text-sm">Loading branch Kanban board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Board Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {activeBoard?.name || 'No Boards Found'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              {tenant.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeBoard?.description || 'All tasks are isolated to this tenant. Drag and drop cards to organize.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTenantData()}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Board"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {activeBoard?.columns?.length > 0 && (
            <button
              onClick={() => {
                setNewTaskColumnId(activeBoard.columns[0].id);
                setIsNewTaskOpen(true);
              }}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Error & Conflict Banners */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {conflictError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Optimistic Concurrency Control (OCC) Alert</div>
            <div className="mt-0.5">{conflictError.message}</div>
            <div className="mt-1 font-mono text-[11px] bg-white/70 p-1.5 rounded border border-amber-200">
              Database state was protected from silent overwrite. Latest version has been synced.
            </div>
          </div>
        </div>
      )}

      {/* Interactive Drag-and-Drop Kanban Columns Grid */}
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
              <TaskCardContent
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

      {/* Live Activity Log Stream (Audit Trail) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Tenant Activity Audit Trail</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {activityLogs.length} Events Recorded
          </span>
        </div>

        <div className="space-y-2.5 max-h-[220px] overflow-y-auto text-xs">
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
            <h3 className="font-bold text-slate-900 text-base mb-4">Create New Task Card</h3>
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
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
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
