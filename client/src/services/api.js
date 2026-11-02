// Simple API helper using native fetch
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const loginApi = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
};

export const getMeApi = async (token) => {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch user session');
  }
  return data;
};

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
