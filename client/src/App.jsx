import React, { useState, useEffect } from 'react';
import Layout from './components/Layout.jsx';
import Login from './components/Login.jsx';
import SessionView from './components/SessionView.jsx';
import Overview from './components/Overview.jsx';
import { getMeApi } from './services/api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('app');
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
    setActiveTab('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
    setActiveTab('app');
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      onLogout={handleLogout}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-500 text-sm animate-pulse">Checking session...</div>
        </div>
      ) : activeTab === 'overview' ? (
        <Overview />
      ) : user ? (
        <SessionView user={user} token={token} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </Layout>
  );
}
