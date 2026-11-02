import React, { useState } from 'react';
import { LogIn, Lock, Mail, Shield, Building, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPlaceholder() {
  const [email, setEmail] = useState('rahul@abctech.com');
  const [password, setPassword] = useState('Password123!');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
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
            Access your branch Kanban board and collaborate in real-time.
          </p>
        </div>

        {submitted && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Phase 1 Placeholder</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Authentication logic will be activated in Phase 2 using the seeded JWT and bcrypt endpoints.
              </p>
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
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to Workspace</span>
          </button>
        </form>
      </div>

      {/* Demo Credentials & Role Helper Card */}
      <div className="md:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-3">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Seeded Demo Credentials</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Phase 1 seed script populates 5 accounts across 3 branches. Click any account to prefill the login fields:
          </p>

          <div className="space-y-2 text-xs">
            {/* Rahul */}
            <div
              onClick={() => { setEmail('rahul@abctech.com'); setPassword('Password123!'); }}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Rahul Sharma</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold">
                  Org Admin
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">rahul@abctech.com • Org-wide Access</div>
            </div>

            {/* Priya */}
            <div
              onClick={() => { setEmail('priya@abctech.com'); setPassword('Password123!'); }}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Priya Patel</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-semibold">
                  Tenant Admin
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">priya@abctech.com • Hyderabad Branch</div>
            </div>

            {/* Arjun */}
            <div
              onClick={() => { setEmail('arjun@abctech.com'); setPassword('Password123!'); }}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Arjun Reddy</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                  Member
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">arjun@abctech.com • Hyderabad Branch</div>
            </div>

            {/* Sneha */}
            <div
              onClick={() => { setEmail('sneha@abctech.com'); setPassword('Password123!'); }}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Sneha Rao</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-semibold">
                  Tenant Admin
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">sneha@abctech.com • Bangalore Branch</div>
            </div>

            {/* Vikram */}
            <div
              onClick={() => { setEmail('vikram@abctech.com'); setPassword('Password123!'); }}
              className="p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span>Vikram Das</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                  Member
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">vikram@abctech.com • Chennai Branch</div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Tenant Isolation Note:</strong> Users in Hyderabad cannot view boards or tasks in Bangalore or Chennai.
          </p>
        </div>
      </div>
    </div>
  );
}
