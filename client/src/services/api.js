const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
export const loginApi = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
};

export const getMeApi = async (token) => {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch user session');
  return data;
};

// -------------------------------------------------------------
// Tenant Verification & RBAC
// -------------------------------------------------------------
export const verifyTenantApi = async (tenantId, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
};

export const checkAdminRoleApi = async (tenantId, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/admin-check`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
};

// -------------------------------------------------------------
// Boards
// -------------------------------------------------------------
export const getBoardsApi = async (tenantId, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/boards`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch boards');
  return data.boards;
};

export const getBoardDetailsApi = async (tenantId, boardId, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/boards/${boardId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch board details');
  return data.board;
};

export const createBoardApi = async (tenantId, boardData, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(boardData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create board');
  return data.board;
};

// -------------------------------------------------------------
// Tasks
// -------------------------------------------------------------
export const createTaskApi = async (tenantId, boardId, taskData, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/boards/${boardId}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create task');
  return data.task;
};

export const updateTaskApi = async (tenantId, taskId, taskData, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });
  const data = await res.json();
  if (res.status === 409) {
    const error = new Error(data.message);
    error.status = 409;
    error.currentTask = data.currentTask;
    throw error;
  }
  if (!res.ok) throw new Error(data.message || 'Failed to update task');
  return data.task;
};

export const moveTaskApi = async (tenantId, taskId, moveData, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/tasks/${taskId}/move`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(moveData),
  });
  const data = await res.json();
  if (res.status === 409) {
    const error = new Error(data.message);
    error.status = 409;
    error.currentTask = data.currentTask;
    throw error;
  }
  if (!res.ok) throw new Error(data.message || 'Failed to move task');
  return data.task;
};

export const deleteTaskApi = async (tenantId, taskId, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete task');
  return data;
};

// -------------------------------------------------------------
// Activity Logs & Members
// -------------------------------------------------------------
export const getActivityLogsApi = async (tenantId, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/activity-logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch activity logs');
  return data.logs;
};

export const getBranchMembersApi = async (tenantId, token) => {
  const res = await fetch(`${API_BASE}/tenants/${tenantId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch branch members');
  return data.members;
};
