import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

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

export default function KanbanBoard({ tenant, token, user }) {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conflictError, setConflictError] = useState(null);

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
        // Load details of the first board
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
  // Create Task
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
  // Move Task (Kanban Column Transition)
  // -------------------------------------------------------------
  const handleMoveTask = async (task, destColumnId) => {
    if (task.columnId === destColumnId) return;
    setConflictError(null);

    try {
      await moveTaskApi(
        tenant.id,
        task.id,
        {
          destinationColumnId: destColumnId,
          newPosition: 1000,
          expectedVersion: task.version, // Send OCC expectedVersion
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
  // Edit Task
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
          expectedVersion: editingTask.version, // OCC concurrency version
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
  // Delete Task
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
            {activeBoard?.description || 'All tasks are isolated to this tenant.'}
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

      {/* Kanban Board Columns Grid */}
      {activeBoard?.columns ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {activeBoard.columns.map((column) => (
            <div
              key={column.id}
              className="bg-slate-100/80 rounded-2xl border border-slate-200/80 p-4 flex flex-col max-h-[750px]"
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
                  onClick={() => {
                    setNewTaskColumnId(column.id);
                    setIsNewTaskOpen(true);
                  }}
                  className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                  title={`Add task to ${column.name}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task Cards List */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {column.tasks?.length > 0 ? (
                  column.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all space-y-3 group"
                    >
                      {/* Priority & Version Badges */}
                      <div className="flex items-center justify-between">
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

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Move Dropdown */}
                      <div className="pt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Move:</span>
                        <select
                          value={column.id}
                          onChange={(e) => handleMoveTask(task, e.target.value)}
                          className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none"
                        >
                          {activeBoard.columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 italic border-2 border-dashed border-slate-200 rounded-xl">
                    No tasks in this lane
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
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
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
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
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
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
