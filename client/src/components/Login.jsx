import React, { useState } from 'react';
import { loginApi } from '../services/api.js';

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
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start py-4">
      {/* Login Card */}
      <div className="md:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-7 sm:p-8">
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-base flex items-center justify-center mb-4 shadow-xs">
            CK
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to CollabKanban</h2>
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
          <p className="font-medium text-slate-700">Multi-Organization Security:</p>
          <p className="mt-1 leading-relaxed text-[11px]">
            Logging in restricts data access strictly to your assigned company and branch rooms. Cross-tenant queries are blocked with HTTP 403.
          </p>
        </div>
      </div>

      {/* Demo Accounts Quick-Select (Categorized by Company) */}
      <div className="md:col-span-6 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="text-slate-900 font-bold text-sm mb-1 tracking-tight">
            Quick-Select Demo Accounts
          </div>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
            Click any account to prefill credentials and inspect tenant branch isolation and roles:
          </p>

          <div className="space-y-4 text-xs">
            {/* Organization 1: Apex Global Technologies */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1.5 flex items-center justify-between">
                <span>Apex Global Technologies</span>
                <span className="text-[10px] text-slate-400 font-normal">3 Branches</span>
              </div>
              <div className="space-y-1.5">
                <div
                  onClick={() => handleSelectDemo('rahul@apextech.com')}
                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                    email === 'rahul@apextech.com'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 text-xs">
                    <span>Rahul Sharma</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-700 font-bold">
                      ORG_ADMIN
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">rahul@apextech.com • All Apex Branches</div>
                </div>

                <div
                  onClick={() => handleSelectDemo('priya@apextech.com')}
                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                    email === 'priya@apextech.com'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 text-xs">
                    <span>Priya Patel</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                      TENANT_ADMIN
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">priya@apextech.com • Hyderabad Hub</div>
                </div>

                <div
                  onClick={() => handleSelectDemo('arjun@apextech.com')}
                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                    email === 'arjun@apextech.com'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 text-xs">
                    <span>Arjun Reddy</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-bold">
                      MEMBER
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">arjun@apextech.com • Hyderabad Hub</div>
                </div>

                <div
                  onClick={() => handleSelectDemo('sneha@apextech.com')}
                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                    email === 'sneha@apextech.com'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 text-xs">
                    <span>Sneha Rao</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                      TENANT_ADMIN
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">sneha@apextech.com • Bangalore Lab</div>
                </div>
              </div>
            </div>

            {/* Organization 2: Nexus Cloud Systems */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center justify-between">
                <span>Nexus Cloud Systems</span>
                <span className="text-[10px] text-slate-400 font-normal">2 Branches</span>
              </div>
              <div className="space-y-1.5">
                <div
                  onClick={() => handleSelectDemo('ananya@nexuscloud.io')}
                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                    email === 'ananya@nexuscloud.io'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 text-xs">
                    <span>Ananya Verma</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-700 font-bold">
                      ORG_ADMIN
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">ananya@nexuscloud.io • All Nexus Branches</div>
                </div>

                <div
                  onClick={() => handleSelectDemo('karthik@nexuscloud.io')}
                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                    email === 'karthik@nexuscloud.io'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 text-xs">
                    <span>Karthik Iyer</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      TENANT_ADMIN
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">karthik@nexuscloud.io • Pune AI Lab</div>
                </div>

                <div
                  onClick={() => handleSelectDemo('rohit@nexuscloud.io')}
                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                    email === 'rohit@nexuscloud.io'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-800 text-xs">
                    <span>Rohit Mehta</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-bold">
                      MEMBER
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">rohit@nexuscloud.io • Mumbai Fintech</div>
                </div>
              </div>
            </div>

            {/* Organization 3: Pulse Dynamics Global */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1.5 flex items-center justify-between">
                <span>Pulse Dynamics Global</span>
                <span className="text-[10px] text-slate-400 font-normal">Delhi Operations</span>
              </div>
              <div
                onClick={() => handleSelectDemo('sameer@pulsedynamics.com')}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  email === 'sameer@pulsedynamics.com'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-slate-800 text-xs">
                  <span>Sameer Joshi</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                    TENANT_ADMIN
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">sameer@pulsedynamics.com • Delhi Operations</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
