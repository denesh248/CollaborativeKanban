// client/src/services/api.js
// Clean and straightforward API client for the Kanban application

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to handle fetch calls, JSON parsing, and OCC 409 errors
async function request(path, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  // Handle Optimistic Concurrency Control (OCC) conflict
  if (res.status === 409) {
    const error = new Error(data.message || 'Concurrent modification conflict');
    error.status = 409;
    error.currentTask = data.currentTask;
    throw error;
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
export const loginApi = (email, password) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getMeApi = (token) => request('/auth/me', {}, token);

// -------------------------------------------------------------
// Boards
// -------------------------------------------------------------
export const getBoardsApi = async (tenantId, token) => {
  const data = await request(`/tenants/${tenantId}/boards`, {}, token);
  return data.boards;
};

export const getBoardDetailsApi = async (tenantId, boardId, token) => {
  const data = await request(`/tenants/${tenantId}/boards/${boardId}`, {}, token);
  return data.board;
};

export const createBoardApi = async (tenantId, boardData, token) => {
  const data = await request(`/tenants/${tenantId}/boards`, {
    method: 'POST',
    body: JSON.stringify(boardData),
  }, token);
  return data.board;
};

// -------------------------------------------------------------
// Tasks
// -------------------------------------------------------------
export const createTaskApi = async (tenantId, boardId, taskData, token) => {
  const data = await request(`/tenants/${tenantId}/boards/${boardId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData),
  }, token);
  return data;
};

export const updateTaskApi = async (tenantId, taskId, taskData, token) => {
  const data = await request(`/tenants/${tenantId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  }, token);
  return data;
};

export const moveTaskApi = async (tenantId, taskId, moveData, token) => {
  const data = await request(`/tenants/${tenantId}/tasks/${taskId}/move`, {
    method: 'PATCH',
    body: JSON.stringify(moveData),
  }, token);
  return data;
};

export const deleteTaskApi = (tenantId, taskId, token) =>
  request(`/tenants/${tenantId}/tasks/${taskId}`, { method: 'DELETE' }, token);

// -------------------------------------------------------------
// Activity Logs & Members
// -------------------------------------------------------------
export const getActivityLogsApi = async (tenantId, token) => {
  const data = await request(`/tenants/${tenantId}/activity-logs`, {}, token);
  return data.logs;
};

export const getBranchMembersApi = async (tenantId, token) => {
  const data = await request(`/tenants/${tenantId}/members`, {}, token);
  return data.members;
};
