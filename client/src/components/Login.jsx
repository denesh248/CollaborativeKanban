import React, { useState } from 'react';
import { LogIn, Lock, Mail, Shield, AlertCircle, Loader2 } from 'lucide-react';
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
      // Store token in localStorage
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
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Login Card */}
      <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
          <p className="text-sm text-slate-500 mt-1">
            Log in to test tenant authorization, JWT authentication, and RBAC roles.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Failed</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@abctech.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <span className="text-xs text-indigo-600 font-medium">Default: Password123!</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In with JWT</span>
            )}
          </button>
        </form>
      </div>

      {/* Demo Credentials Helper */}
      <div className="md:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-3">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Select Demo Account</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Click any account to prefill credentials and test different RBAC roles and tenant access:
          </p>

          <div className="space-y-2 text-xs">
            {/* Rahul */}
            <div
              onClick={() => handleSelectDemo('rahul@abctech.com')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                email === 'rahul@abctech.com'
                  ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Rahul Sharma</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold">
                  ORG_ADMIN
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">rahul@abctech.com • All Branches</div>
            </div>

            {/* Priya */}
            <div
              onClick={() => handleSelectDemo('priya@abctech.com')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                email === 'priya@abctech.com'
                  ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Priya Patel</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-semibold">
                  TENANT_ADMIN
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">priya@abctech.com • Hyderabad Branch</div>
            </div>

            {/* Arjun */}
            <div
              onClick={() => handleSelectDemo('arjun@abctech.com')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                email === 'arjun@abctech.com'
                  ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Arjun Reddy</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                  MEMBER
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">arjun@abctech.com • Hyderabad Branch</div>
            </div>

            {/* Sneha */}
            <div
              onClick={() => handleSelectDemo('sneha@abctech.com')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                email === 'sneha@abctech.com'
                  ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Sneha Rao</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-semibold">
                  TENANT_ADMIN
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">sneha@abctech.com • Bangalore Branch</div>
            </div>

            {/* Vikram */}
            <div
              onClick={() => handleSelectDemo('vikram@abctech.com')}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                email === 'vikram@abctech.com'
                  ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Vikram Das</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                  MEMBER
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">vikram@abctech.com • Chennai Branch</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p>
            <strong>Phase 2 Feature:</strong> Authentication generates a secure 7-day JWT verified on every protected request.
          </p>
        </div>
      </div>
    </div>
  );
}
