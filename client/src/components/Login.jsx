import React, { useState } from 'react';
import { loginApi } from '../services/api.js';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('priya@abctech.com');
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
      setError(err.message || 'Login failed. Please check credentials or ensure backend is running.');
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
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start py-4">
      {/* Login Card */}
      <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-7 sm:p-8">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center mb-4 shadow-xs">
            CK
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to CollabKanban</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your branch workspace, live board updates, and team collaboration.
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
              placeholder="name@abctech.com"
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
      </div>

      {/* Demo Accounts Quick-Select */}
      <div className="md:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="text-slate-900 font-bold text-sm mb-1 tracking-tight">
            Quick-Select Demo Accounts
          </div>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
            Click any account to prefill credentials and inspect tenant branch isolation and roles:
          </p>

          <div className="space-y-2 text-xs">
            {/* Rahul */}
            <div
              onClick={() => handleSelectDemo('rahul@abctech.com')}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                email === 'rahul@abctech.com'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Rahul Sharma</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-700 font-bold">
                  ORG_ADMIN
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">rahul@abctech.com • All Branches</div>
            </div>

            {/* Priya */}
            <div
              onClick={() => handleSelectDemo('priya@abctech.com')}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                email === 'priya@abctech.com'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Priya Patel</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                  TENANT_ADMIN
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">priya@abctech.com • Hyderabad</div>
            </div>

            {/* Arjun */}
            <div
              onClick={() => handleSelectDemo('arjun@abctech.com')}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                email === 'arjun@abctech.com'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Arjun Reddy</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-bold">
                  MEMBER
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">arjun@abctech.com • Hyderabad</div>
            </div>

            {/* Sneha */}
            <div
              onClick={() => handleSelectDemo('sneha@abctech.com')}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                email === 'sneha@abctech.com'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Sneha Rao</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                  TENANT_ADMIN
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">sneha@abctech.com • Bangalore</div>
            </div>

            {/* Vikram */}
            <div
              onClick={() => handleSelectDemo('vikram@abctech.com')}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                email === 'vikram@abctech.com'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Vikram Das</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-bold">
                  MEMBER
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">vikram@abctech.com • Chennai</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
