// client/src/components/kanban/TaskModal.jsx
// Handles creating and editing tasks with optimistic concurrency version tracking

import React, { useState, useEffect } from 'react';

export default function TaskModal({
  isOpen,
  mode = 'create', // 'create' | 'edit'
  task = null,
  initialColumnId = '',
  columns = [],
  members = [],
  onClose,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    columnId: '',
    priority: 'MEDIUM',
    assignedToId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        columnId: task.columnId || '',
        priority: task.priority || 'MEDIUM',
        assignedToId: task.assignedToId || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        columnId: initialColumnId || columns[0]?.id || '',
        priority: 'MEDIUM',
        assignedToId: '',
      });
    }
  }, [mode, task, initialColumnId, columns, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        expectedVersion: task?.version,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-base tracking-tight">
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </h3>
          {mode === 'edit' && task && (
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
              Current: v{task.version}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Task details and requirements..."
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
                value={formData.columnId}
                onChange={(e) => setFormData((prev) => ({ ...prev, columnId: e.target.value }))}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {columns.map((c) => (
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
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
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
              value={formData.assignedToId}
              onChange={(e) => setFormData((prev) => ({ ...prev, assignedToId: e.target.value }))}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs disabled:opacity-50"
            >
              {submitting
                ? 'Saving...'
                : mode === 'create'
                ? 'Create Task'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
