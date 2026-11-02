import React, { useState } from 'react';
import { loginApi } from '../services/api.js';

const DEMO_ACCOUNTS = [
  { name: 'Rahul Sharma', email: 'rahul@apextech.com', role: 'ORG_ADMIN', branch: 'All 5 Branches (Company-Wide)' },
  { name: 'Priya Patel', email: 'priya@apextech.com', role: 'TENANT_ADMIN', branch: 'Hyderabad Engineering Hub' },
  { name: 'Arjun Reddy', email: 'arjun@apextech.com', role: 'MEMBER', branch: 'Hyderabad Engineering Hub' },
  { name: 'Sneha Rao', email: 'sneha@apextech.com', role: 'TENANT_ADMIN', branch: 'Bangalore Cloud Campus' },
  { name: 'Vikram Das', email: 'vikram@apextech.com', role: 'MEMBER', branch: 'Chennai Delivery Center' },
  { name: 'Ananya Verma', email: 'ananya@apextech.com', role: 'TENANT_ADMIN', branch: 'Pune AI & Analytics Lab' },
  { name: 'Rohit Mehta', email: 'rohit@apextech.com', role: 'TENANT_ADMIN', branch: 'Mumbai Fintech Division' },
];

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('priya@apextech.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginApi(email, password);
      localStorage.setItem('auth_token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start py-4">
      {/* Login Form Card */}
      <div className="md:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-7 sm:p-8">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center mb-4 shadow-xs">
            CK
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Apex Global Technologies</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise real-time workspace with multi-tenant branch isolation.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <p className="font-semibold">Authentication Error</p>
            <p className="text-[11px] text-rose-700 mt-0.5">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@apextech.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">Default: Password123!</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-500">
          <p className="font-medium text-slate-700">Branch Security Architecture:</p>
          <p className="mt-1 leading-relaxed text-[11px]">
            Users can only access the branches their role authorizes. Cross-branch data queries and socket rooms are blocked by backend middleware.
          </p>
        </div>
      </div>

      {/* Demo Accounts Quick-Select */}
      <div className="md:col-span-6 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="text-slate-900 font-bold text-sm mb-1 tracking-tight">
            Select Employee Demo Account
          </div>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
            Click any account to prefill credentials and test branch authorization and RBAC roles:
          </p>

          <div className="space-y-2 text-xs max-h-[460px] overflow-y-auto pr-1">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = email === acc.email;
              const roleBadgeColor =
                acc.role === 'ORG_ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : acc.role === 'TENANT_ADMIN'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-700';

              return (
                <div
                  key={acc.email}
                  onClick={() => handleSelectDemo(acc.email)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 text-xs">
                    <span>{acc.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleBadgeColor}`}>
                      {acc.role}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {acc.email} • {acc.branch}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
