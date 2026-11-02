import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  GitBranch,
  Shield,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  KanbanSquare,
} from 'lucide-react';
import { verifyTenantApi, checkAdminRoleApi } from '../services/api.js';
import KanbanBoard from './KanbanBoard.jsx';

export default function SessionView({ user, token, onLogout }) {
  const [activeTenant, setActiveTenant] = useState(user.tenants?.[0] || null);
  const [viewTab, setViewTab] = useState('board'); // 'board' | 'security'
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* User Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-100">
            {user.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user.fullName}</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                JWT Authenticated
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="font-mono">{user.email}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                {user.organizations?.[0]?.name || 'ABC Technologies'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-all cursor-pointer self-start sm:self-center"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Branch Selector & Tab Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Branch Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            <GitBranch className="w-4 h-4 text-emerald-600" />
            <span>Branch:</span>
          </div>

          {user.tenants && user.tenants.length > 0 ? (
            user.tenants.map((tenant) => {
              const isActive = activeTenant?.id === tenant.id;
              return (
                <button
                  key={tenant.id}
                  onClick={() => setActiveTenant(tenant)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{tenant.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      isActive
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tenant.role}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-400 italic">No assigned branches</span>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => setViewTab('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewTab === 'board'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KanbanSquare className="w-4 h-4" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setViewTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewTab === 'security'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & RBAC</span>
          </button>
        </div>
      </div>

      {/* Main View Area: Either Kanban Board or Security Verification */}
      {viewTab === 'board' ? (
        activeTenant ? (
          <KanbanBoard tenant={activeTenant} token={token} user={user} />
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            Please select an authorized branch above to open the Kanban board.
          </div>
        )
      ) : (
        /* Security & RBAC Verification View */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Organization & Tenant Metadata */}
          <div className="md:col-span-5 space-y-4">
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

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <GitBranch className="w-4 h-4 text-emerald-600" />
                  <span>Authorized Branches</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {user.tenants?.length || 0} Available
                </span>
              </div>

              <div className="space-y-2">
                {user.tenants?.map((tenant) => {
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
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tenant.role === 'ORG_ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : tenant.role === 'TENANT_ADMIN'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
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
            </div>
          </div>

          {/* Right Column: Live Security Rules Verification */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">Backend Isolation & RBAC Rules</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                  GET /api/tenants/:id/verify
                </span>
              </div>

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
                    <div
                      className={`p-4 rounded-xl border text-xs ${
                        verificationResult.ok
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}
                    >
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
                      <div
                        className={`p-3 rounded-lg border text-xs font-mono ${
                          adminCheckResult.ok
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
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
                      <div
                        className={`p-3 rounded-lg border text-xs font-mono ${
                          crossTenantTestResult.status === 404 || crossTenantTestResult.status === 403
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
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
                <p className="text-xs text-slate-500">Select a branch above to verify access.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
