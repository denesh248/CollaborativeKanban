// client/src/components/kanban/KanbanBoard.jsx
// Main Kanban Board orchestrator component connecting drag-and-drop, real-time sync, and UI modules

import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners } from '@dnd-kit/core';

import {
  getBoardsApi,
  getBoardDetailsApi,
  createTaskApi,
  updateTaskApi,
  moveTaskApi,
  deleteTaskApi,
  getActivityLogsApi,
  getBranchMembersApi,
} from '../../services/api.js';

import { useSocket } from '../../hooks/useSocket.js';
import { useKanbanDrag } from '../../hooks/useKanbanDrag.js';

import KanbanHeader from './KanbanHeader.jsx';
import KanbanColumn from './KanbanColumn.jsx';
import KanbanDragOverlay from './DragOverlay.jsx';
import TaskModal from './TaskModal.jsx';
import ActivityFeed from './ActivityFeed.jsx';

export default function KanbanBoard({ tenant, token, user }) {
  const [activeBoard, setActiveBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    task: null,
    initialColumnId: '',
  });

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
  const handleSocketEvent = (event, payload) => {
    if (event === 'task:created') {
      const { task } = payload;
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
    } else if (event === 'task:updated') {
      const { task } = payload;
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
    } else if (event === 'task:moved') {
      const { task, fromColumnId, toColumnId, newPosition } = payload;
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
    } else if (event === 'task:deleted') {
      const { taskId } = payload;
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
    } else if (event === 'activity:new') {
      const { log } = payload;
      if (log) {
        setActivityLogs((prev) => (prev.some((l) => l.id === log.id) ? prev : [log, ...prev]));
      }
    }
  };

  const { socketConnected, onlineUsers } = useSocket({
    tenantId: tenant?.id,
    token,
    user,
    onEvent: handleSocketEvent,
    onReconnect: () => loadBranchData(false),
  });

  // 3. Drag and Drop with Optimistic Concurrency Control
  const handleMoveCommit = async ({ task, destinationColumnId, newPosition, expectedVersion }) => {
    setConflictError(null);

    try {
      const res = await moveTaskApi(
        tenant.id,
        task.id,
        { destinationColumnId, newPosition, expectedVersion },
        token
      );
      const movedTask = res.task || res;

      // In-place version update without full page reload
      setActiveBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === destinationColumnId
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

  const {
    sensors,
    activeDragTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useKanbanDrag({
    columns: activeBoard?.columns || [],
    onColumnsChange: (newColumns) => {
      setActiveBoard((prev) => (prev ? { ...prev, columns: newColumns } : prev));
    },
    onMoveCommit: handleMoveCommit,
  });

  // 4. Accessible Quick Move Dropdown
  const handleQuickMoveTask = async (task, destColumnId) => {
    if (task.columnId === destColumnId) return;
    setConflictError(null);

    try {
      const res = await moveTaskApi(
        tenant.id,
        task.id,
        { destinationColumnId: destColumnId, newPosition: 1000, expectedVersion: task.version },
        token
      );
      const movedTask = res.task || res;

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
          message: 'Conflict (HTTP 409): Task was modified concurrently by another user.',
          currentTask: err.currentTask,
        });
        loadBranchData(false);
      } else {
        setError(err.message || 'Error moving task');
      }
    }
  };

  // 5. Modal & Task CRUD Handlers
  const openCreateModal = (columnId) => {
    setModalState({
      isOpen: true,
      mode: 'create',
      task: null,
      initialColumnId: columnId || activeBoard?.columns?.[0]?.id || '',
    });
  };

  const openEditModal = (task) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      task,
      initialColumnId: task.columnId,
    });
  };

  const handleModalSubmit = async (formData) => {
    setConflictError(null);

    try {
      if (modalState.mode === 'create') {
        const res = await createTaskApi(tenant.id, activeBoard.id, formData, token);
        if (res?.task) {
          setActiveBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((col) =>
              col.id === res.task.columnId
                ? { ...col, tasks: [...(col.tasks || []), res.task] }
                : col
            ),
          }));
        }
      } else {
        const res = await updateTaskApi(
          tenant.id,
          modalState.task.id,
          formData,
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
      throw err;
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
      <KanbanHeader
        boardName={activeBoard?.name}
        tenantName={tenant?.name}
        socketConnected={socketConnected}
        onlineUsers={onlineUsers}
        onRefresh={() => loadBranchData(false)}
        onNewTask={() => openCreateModal(activeBoard?.columns?.[0]?.id)}
        hasColumns={Boolean(activeBoard?.columns?.length)}
      />

      {/* Error & OCC Conflict Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>
            <strong>Error: </strong> {error}
          </span>
          <button onClick={() => setError(null)} className="text-rose-600 font-bold ml-2">
            ✕
          </button>
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

      {/* Interactive Drag-and-Drop Columns Grid */}
      {activeBoard?.columns && activeBoard.columns.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {activeBoard.columns.map((column) => (
              <KanbanColumn
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

          <KanbanDragOverlay
            activeDragTask={activeDragTask}
            columns={activeBoard.columns}
          />
        </DndContext>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No boards available for this branch.
        </div>
      )}

      {/* Real-Time Activity Audit Trail */}
      <ActivityFeed activityLogs={activityLogs} />

      {/* Unified Task Modal */}
      <TaskModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        task={modalState.task}
        initialColumnId={modalState.initialColumnId}
        columns={activeBoard?.columns || []}
        members={members}
        onClose={() => setModalState({ isOpen: false, mode: 'create', task: null, initialColumnId: '' })}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
