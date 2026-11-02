import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.jsx';
import Login from './components/Login.jsx';
import SessionView from './components/SessionView.jsx';
import { getMeApi } from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Restore session from token on initial load
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        try {
          const data = await getMeApi(savedToken);
          setUser(data.user);
          setToken(savedToken);
        } catch (error) {
          console.error('Session expired or invalid:', error);
          localStorage.removeItem('auth_token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[420px] space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <div className="text-slate-500 text-xs font-medium">Loading workspace session...</div>
        </div>
      ) : user ? (
        <SessionView user={user} token={token} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </Layout>
  );
}
