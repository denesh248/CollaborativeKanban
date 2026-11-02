import React, { useState, useEffect } from 'react';
import { User, Building2, GitBranch, Shield, LogOut, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { verifyTenantApi, checkAdminRoleApi } from '../services/api.js';

export default function SessionView({ user, token, onLogout }) {
  const [activeTenant, setActiveTenant] = useState(user.tenants?.[0] || null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [adminCheckResult, setAdminCheckResult] = useState(null);
  const [crossTenantTestResult, setCrossTenantTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Automatically verify the active branch whenever it changes
  useEffect(() => {
    if (activeTenant && token) {
      verifyActiveBranch(activeTenant.id);
    }
  }, [activeTenant, token]);

  const verifyActiveBranch = async (tenantId) => {
    setLoading(true);
    setVerificationResult(null);
    setAdminCheckResult(null);
    setCrossTenantTestResult(null);

    const result = await verifyTenantApi(tenantId, token);
    setVerificationResult(result);
    setLoading(false);
  };

  const handleAdminCheck = async () => {
    if (!activeTenant) return;
    const result = await checkAdminRoleApi(activeTenant.id, token);
    setAdminCheckResult(result);
  };

  const handleTestCrossTenant = async () => {
    // Test access with a non-existent or foreign tenant ID
    const foreignTenantId = '00000000-0000-0000-0000-000000000099';
    const result = await verifyTenantApi(foreignTenantId, token);
    setCrossTenantTestResult(result);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* User Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-100">
            {user.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                JWT Authenticated
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-all cursor-pointer self-start sm:self-center"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Organization & Accessible Tenants Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Organization & Tenant Selection */}
        <div className="md:col-span-5 space-y-4">
          {/* Organization Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Assigned Organization</span>
            </div>
            <div className="text-base font-bold text-slate-900">
              {user.organizations?.[0]?.name || 'ABC Technologies'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Parent corporate workspace</div>
          </div>

          {/* Authorized Branch Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <GitBranch className="w-4 h-4 text-emerald-600" />
                <span>Switch Authorized Branch</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {user.tenants?.length || 0} Available
              </span>
            </div>

            {user.tenants && user.tenants.length > 0 ? (
              <div className="space-y-2">
                {user.tenants.map((tenant) => {
                  const isActive = activeTenant?.id === tenant.id;
                  return (
                    <div
                      key={tenant.id}
                      onClick={() => setActiveTenant(tenant)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800">{tenant.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          tenant.role === 'ORG_ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : tenant.role === 'TENANT_ADMIN'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {tenant.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                        ID: {tenant.id}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No specific tenant memberships assigned.</p>
            )}
          </div>
        </div>

        {/* Right Column: Live Backend Verification & Security Checks */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Backend Tenant & RBAC Verification</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                GET /api/tenants/:id/verify
              </span>
            </div>

            {/* Active Branch Status */}
            {activeTenant ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Active Branch Context:</span>
                    <span className="text-xs font-bold text-slate-800">{activeTenant.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Your Role in this Branch:</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {activeTenant.role}
                    </span>
                  </div>
                </div>

                {/* Server Response Card */}
                {verificationResult && (
                  <div className={`p-4 rounded-xl border text-xs ${
                    verificationResult.ok
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold">
                      {verificationResult.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>Server Response: HTTP {verificationResult.status}</span>
                    </div>
                    <pre className="mt-2 p-2 rounded bg-white/80 border border-emerald-200 font-mono text-[11px] overflow-x-auto text-slate-700">
                      {JSON.stringify(verificationResult.data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Interactive Verification Actions */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Test Live Security Rules:</div>

                  {/* 1. Admin Check */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">1. Test RBAC Permission</div>
                      <div className="text-[11px] text-slate-500">Requires ORG_ADMIN or TENANT_ADMIN</div>
                    </div>
                    <button
                      onClick={handleAdminCheck}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      Test Admin Check
                    </button>
                  </div>

                  {adminCheckResult && (
                    <div className={`p-3 rounded-lg border text-xs font-mono ${
                      adminCheckResult.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <strong>HTTP {adminCheckResult.status}:</strong> {adminCheckResult.data.message}
                    </div>
                  )}

                  {/* 2. Cross-Tenant Rejection Test */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">2. Simulate Cross-Tenant Tampering</div>
                      <div className="text-[11px] text-slate-500">Tests access to unauthorized tenant ID</div>
                    </div>
                    <button
                      onClick={handleTestCrossTenant}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      Test Cross-Tenant Block
                    </button>
                  </div>

                  {crossTenantTestResult && (
                    <div className={`p-3 rounded-lg border text-xs font-mono ${
                      crossTenantTestResult.status === 404 || crossTenantTestResult.status === 403
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div className="font-semibold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>Security Rule Active: HTTP {crossTenantTestResult.status}</span>
                      </div>
                      <div className="mt-1">{crossTenantTestResult.data.message}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Select a branch on the left to verify access.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
