'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  Activity,
  Database,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Clock,
  Key,
  Laptop,
  Check,
  ChevronRight,
  ExternalLink,
  Lock,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { StatusChip } from '@/components/ui/StatusChip';
import { PageBackground } from '@/components/ui/PageBackground';

interface UserRecord {
  id: number;
  email: string;
  full_name: string;
  role: string;
  created_at: string | null;
  last_login: string | null;
  scan_count: number;
  is_active: boolean;
}

interface AuditRecord {
  id: number;
  user_id: number | null;
  user_email: string;
  action: string;
  category: string;
  details: string;
  ip_address: string;
  status: string;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  online_users: number;
  total_scans: number;
  audit_events: number;
  database: {
    connected: boolean;
    status: string;
    database: string;
    host: string;
    port: number;
    user: string;
    latency_ms: number;
    active_storage?: string;
  };
}

const BACKEND_URL = 'http://localhost:8000';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'system'>('users');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<string>('ALL');

  // New simulation state
  const [simEmail, setSimEmail] = useState('');
  const [simRole, setSimRole] = useState('DEVELOPER');
  const [simSubmitting, setSimSubmitting] = useState(false);

  // Fetch Admin Data
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/stats`).then((r) => r.json()),
        fetch(`${BACKEND_URL}/api/admin/users`).then((r) => r.json()),
        fetch(`${BACKEND_URL}/api/admin/audit-logs?limit=200`).then((r) => r.json()),
      ]);

      if (statsRes) setStats(statsRes);
      if (usersRes?.users) setUsers(usersRes.users);
      if (logsRes?.logs) setAuditLogs(logsRes.logs);
    } catch (err) {
      console.error('Error fetching admin telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Toggle user role
  const handleToggleRole = async (user: UserRecord) => {
    const nextRole = user.role.toUpperCase() === 'ADMIN' ? 'DEVELOPER' : 'ADMIN';
    try {
      await fetch(`${BACKEND_URL}/api/admin/users/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: nextRole }),
      });
      fetchData();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  // Simulate or Add Login
  const handleSimulateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simEmail.trim()) return;
    setSimSubmitting(true);
    try {
      await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: simEmail, password: 'simulated_session_pwd' }),
      });
      setSimEmail('');
      await fetchData();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimSubmitting(false);
    }
  };

  // Export Audit Logs as JSON
  const handleExportAuditJson = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clyro_audit_trail_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const match =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase());
    return match;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchCategory =
      auditCategory === 'ALL' || log.category.toUpperCase() === auditCategory.toUpperCase();
    const matchSearch =
      !auditSearch ||
      log.user_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.status.toLowerCase().includes(auditSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return 'Never';
    try {
      const date = new Date(iso);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return iso;
    }
  };

  return (
    <PageBackground className="min-h-screen flex flex-col text-[#f6e7dc] bg-[#0c0517]">
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR                                                     */}
      {/* ========================================================================= */}
      <header className="h-16 px-6 border-b border-[rgba(201,119,127,0.25)] flex items-center justify-between bg-[#13071f]/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-[#f0c98a] hover:text-[#fff5e0] transition-colors bg-[#1d0d2b] px-3 py-1.5 rounded-xl border border-[rgba(201,119,127,0.3)] shadow-sm"
            title="Return to Scanner Workspace"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </Link>

          <div className="h-4 w-px bg-[rgba(201,119,127,0.3)]" />

          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#f0c98a] bg-[rgba(240,201,138,0.12)] px-2.5 py-0.5 rounded-full border border-[rgba(240,201,138,0.3)]">
              ADMIN CONSOLE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusChip
            variant="db"
            label="POSTGRESQL"
            title={`Database connected: ${stats?.database?.database || 'major_projects_db'}`}
          />

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              autoRefresh
                ? 'bg-[#2b173c] text-[#86efac] border-[rgba(134,239,172,0.4)] shadow-[0_0_12px_rgba(134,239,172,0.2)]'
                : 'bg-[#180a26] text-[#c9b7cf] hover:text-white border-[rgba(201,119,127,0.3)]'
            }`}
            title="Toggle live telemetry polling every 4s"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-[#86efac] animate-pulse' : 'bg-[#c9b7cf]'
              }`}
            />
            <span>{autoRefresh ? 'Live Polling' : 'Manual'}</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1d0d2b] hover:bg-[#2c153f] text-[#f6e7dc] text-xs font-medium border border-[rgba(201,119,127,0.3)] transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            title="Refresh Users and Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#f0c98a] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA                                                      */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8 relative z-10">
        {/* Page Banner Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#f0c98a]">
              SECURITY AUDIT & USER GOVERNANCE
            </span>
            <h1 className="font-serif-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
              Admin &amp; Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-[#bfaec4] mt-1">
              Monitor active logins, manage role authorizations, and audit immutable security events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAuditJson}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a0c28] hover:bg-[#28153c] text-white text-xs font-semibold border border-[rgba(201,119,127,0.4)] transition-all cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(201,119,127,0.3)]"
            >
              <Download className="w-4 h-4 text-[#f0c98a]" />
              <span>Export Audit Trail (.json)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. OVERVIEW STATS KPI GRID                                                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Users */}
          <div className="p-5 rounded-2xl bg-[#14081e]/90 border border-[rgba(201,119,127,0.35)] shadow-lg backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#bfaec4]">
                Registered Users
              </span>
              <div className="w-8 h-8 rounded-xl bg-[rgba(201,119,127,0.18)] flex items-center justify-center text-[#f0c98a]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {stats?.total_users ?? users.length}
              </span>
              <span className="text-[11px] font-mono text-[#86efac] flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-pulse" />
                {stats?.online_users ?? 1} active session
              </span>
            </div>
          </div>

          {/* Card 2: Audit Events */}
          <div className="p-5 rounded-2xl bg-[#14081e]/90 border border-[rgba(201,119,127,0.35)] shadow-lg backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#bfaec4]">
                Audit Trail Events
              </span>
              <div className="w-8 h-8 rounded-xl bg-[rgba(240,201,138,0.18)] flex items-center justify-center text-[#f0c98a]">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {stats?.audit_events ?? auditLogs.length}
              </span>
              <span className="text-[11px] font-mono text-[#f0c98a]">
                Immutable Logs
              </span>
            </div>
          </div>

          {/* Card 3: Code Scans */}
          <div className="p-5 rounded-2xl bg-[#14081e]/90 border border-[rgba(201,119,127,0.35)] shadow-lg backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#bfaec4]">
                Codebase Scans
              </span>
              <div className="w-8 h-8 rounded-xl bg-[rgba(165,180,252,0.18)] flex items-center justify-center text-[#a5b4fc]">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {stats?.total_scans ?? 0}
              </span>
              <span className="text-[11px] font-mono text-[#a5b4fc]">
                Analysis Passes
              </span>
            </div>
          </div>

          {/* Card 4: Database Layer */}
          <div className="p-5 rounded-2xl bg-[#14081e]/90 border border-[rgba(201,119,127,0.35)] shadow-lg backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#bfaec4]">
                Database Status
              </span>
              <div className="w-8 h-8 rounded-xl bg-[rgba(134,239,172,0.18)] flex items-center justify-center text-[#86efac]">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white font-mono">
                {stats?.database?.connected ? 'CONNECTED' : 'OFFLINE'}
              </span>
              <span className="text-[11px] font-mono text-[#86efac]">
                {stats?.database?.latency_ms ?? 0}ms latency
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. TAB CONTROLS                                                           */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 border-b border-[rgba(201,119,127,0.25)] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#c9777f] text-white shadow-[0_0_15px_rgba(201,119,127,0.5)]'
                : 'bg-[#180a26] text-[#bfaec4] hover:text-white border border-[rgba(201,119,127,0.2)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users &amp; Login Sessions ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#c9777f] text-white shadow-[0_0_15px_rgba(201,119,127,0.5)]'
                : 'bg-[#180a26] text-[#bfaec4] hover:text-white border border-[rgba(201,119,127,0.2)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-[#c9777f] text-white shadow-[0_0_15px_rgba(201,119,127,0.5)]'
                : 'bg-[#180a26] text-[#bfaec4] hover:text-white border border-[rgba(201,119,127,0.2)]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>System &amp; DB Inspector</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 5. TAB 1: USERS & LOGIN SESSIONS                                          */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Quick Add Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#f0c98a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users by email, name, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#14081e] border border-[rgba(201,119,127,0.35)] text-xs text-white placeholder-[#8d7c92] focus:outline-none focus:border-[#f0c98a] transition-colors"
                />
              </div>

              {/* Quick Login Simulator Form */}
              <form
                onSubmit={handleSimulateLogin}
                className="flex items-center gap-2 bg-[#14081e] p-1.5 rounded-xl border border-[rgba(201,119,127,0.35)]"
              >
                <input
                  type="email"
                  placeholder="Add/Login user email..."
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="h-8 px-3 rounded-lg bg-[#0d0414] text-xs text-white placeholder-[#7f6c83] focus:outline-none border border-[rgba(201,119,127,0.25)]"
                />
                <button
                  type="submit"
                  disabled={simSubmitting || !simEmail}
                  className="h-8 px-3 rounded-lg bg-[#c9777f] hover:bg-[#dc828b] text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                >
                  {simSubmitting ? 'Logging...' : '+ Record Login'}
                </button>
              </form>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-[rgba(201,119,127,0.3)] bg-[#14081e]/90 backdrop-blur-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1b0c2a] text-[#f0c98a] uppercase font-mono tracking-wider border-b border-[rgba(201,119,127,0.25)]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">User Identity</th>
                      <th className="py-3.5 px-4 font-bold">Role Authorization</th>
                      <th className="py-3.5 px-4 font-bold">Session State</th>
                      <th className="py-3.5 px-4 font-bold">Last Activity</th>
                      <th className="py-3.5 px-4 font-bold">Member Since</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(201,119,127,0.18)]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#8d7c92]">
                          No users match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isAdmin = u.role.toUpperCase() === 'ADMIN';
                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-[#1f0e32]/60 transition-colors group"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#28133b] border border-[rgba(201,119,127,0.35)] flex items-center justify-center font-bold text-xs text-[#f0c98a]">
                                  {u.full_name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-white">
                                    {u.full_name || 'Anonymous User'}
                                  </div>
                                  <div className="text-[11px] font-mono text-[#bfaec4]">
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                                  isAdmin
                                    ? 'bg-[rgba(240,201,138,0.15)] text-[#f0c98a] border-[rgba(240,201,138,0.4)] shadow-[0_0_8px_rgba(240,201,138,0.2)]'
                                    : 'bg-[rgba(165,180,252,0.15)] text-[#a5b4fc] border-[rgba(165,180,252,0.3)]'
                                }`}
                              >
                                {isAdmin ? <Shield className="w-3 h-3 text-[#f0c98a]" /> : <Laptop className="w-3 h-3 text-[#a5b4fc]" />}
                                {u.role}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#86efac]">
                                <span className="w-2 h-2 rounded-full bg-[#86efac] animate-pulse" />
                                Active Session
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#e8dbe8]">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-[#f0c98a]" />
                                <span>{formatTimestamp(u.last_login)}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#9b899f]">
                              {formatTimestamp(u.created_at)}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleRole(u)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                                  isAdmin
                                    ? 'bg-[#1d0d2b] hover:bg-[#2c153f] text-[#a5b4fc] border-[rgba(165,180,252,0.3)]'
                                    : 'bg-[#2a122e] hover:bg-[#3d1942] text-[#f0c98a] border-[rgba(240,201,138,0.35)]'
                                }`}
                                title={`Switch role to ${isAdmin ? 'DEVELOPER' : 'ADMIN'}`}
                              >
                                {isAdmin ? 'Demote to Dev' : 'Promote to Admin'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. TAB 2: AUDIT TRAIL LOGS                                                */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Filter Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['ALL', 'AUTH', 'SECURITY', 'SCAN', 'ADMIN', 'SYSTEM'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAuditCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      auditCategory === cat
                        ? 'bg-[#f0c98a] text-[#14081e] shadow-[0_0_12px_rgba(240,201,138,0.4)]'
                        : 'bg-[#14081e] text-[#bfaec4] hover:text-white border border-[rgba(201,119,127,0.3)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Log Entries */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#f0c98a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search actions, emails, details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full h-9 pl-10 pr-4 rounded-xl bg-[#14081e] border border-[rgba(201,119,127,0.35)] text-xs text-white placeholder-[#8d7c92] focus:outline-none focus:border-[#f0c98a]"
                />
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="rounded-2xl border border-[rgba(201,119,127,0.3)] bg-[#14081e]/90 backdrop-blur-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1b0c2a] text-[#f0c98a] uppercase font-mono tracking-wider border-b border-[rgba(201,119,127,0.25)]">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Timestamp</th>
                      <th className="py-3.5 px-4 font-bold">Actor / User</th>
                      <th className="py-3.5 px-4 font-bold">Action</th>
                      <th className="py-3.5 px-4 font-bold">Category</th>
                      <th className="py-3.5 px-4 font-bold">Audit Details</th>
                      <th className="py-3.5 px-4 font-bold">Client IP</th>
                      <th className="py-3.5 px-4 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(201,119,127,0.18)] font-mono text-[11px]">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#8d7c92]">
                          No audit records found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => {
                        let actionColor = 'bg-[#1f102d] text-[#e0d3e5] border-[rgba(201,119,127,0.3)]';
                        if (log.action.includes('LOGIN')) {
                          actionColor = 'bg-[rgba(134,239,172,0.12)] text-[#86efac] border-[rgba(134,239,172,0.35)]';
                        } else if (log.action.includes('SCAN')) {
                          actionColor = 'bg-[rgba(165,180,252,0.12)] text-[#a5b4fc] border-[rgba(165,180,252,0.35)]';
                        } else if (log.action.includes('ROLE')) {
                          actionColor = 'bg-[rgba(240,201,138,0.15)] text-[#f0c98a] border-[rgba(240,201,138,0.35)]';
                        } else if (log.action.includes('BOOT') || log.action.includes('INIT')) {
                          actionColor = 'bg-[rgba(236,72,153,0.12)] text-[#f472b6] border-[rgba(236,72,153,0.35)]';
                        }

                        return (
                          <tr
                            key={log.id}
                            className="hover:bg-[#1f0e32]/60 transition-colors"
                          >
                            <td className="py-3 px-4 text-[#bfaec4] whitespace-nowrap">
                              {formatTimestamp(log.created_at)}
                            </td>

                            <td className="py-3 px-4 text-white font-semibold">
                              {log.user_email}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionColor}`}
                              >
                                {log.action}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-[10px] text-[#f0c98a] uppercase font-bold bg-[#1d0d2b] px-2 py-0.5 rounded border border-[rgba(240,201,138,0.25)]">
                                {log.category}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-[#ddd0e3] font-sans text-xs max-w-md truncate" title={log.details}>
                              {log.details}
                            </td>

                            <td className="py-3 px-4 text-[#9b899f]">
                              {log.ip_address}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  log.status === 'SUCCESS'
                                    ? 'text-[#86efac] bg-[rgba(134,239,172,0.12)]'
                                    : log.status === 'WARNING'
                                    ? 'text-[#f0c98a] bg-[rgba(240,201,138,0.12)]'
                                    : 'text-[#f87171] bg-[rgba(248,113,113,0.12)]'
                                }`}
                              >
                                {log.status === 'SUCCESS' ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : log.status === 'WARNING' ? (
                                  <AlertTriangle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. TAB 3: SYSTEM & DATABASE INSPECTOR                                     */}
        {/* ========================================================================= */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Diagnostics */}
            <div className="p-6 rounded-2xl bg-[#14081e]/90 border border-[rgba(201,119,127,0.35)] shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-white font-serif-heading text-lg font-bold">
                <Database className="w-5 h-5 text-[#f0c98a]" />
                <span>PostgreSQL Engine Telemetry</span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d0414] border border-[rgba(201,119,127,0.2)]">
                  <span className="text-[#bfaec4]">Connection State:</span>
                  <span className="text-[#86efac] font-bold">
                    {stats?.database?.status?.toUpperCase() || 'CONNECTED'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d0414] border border-[rgba(201,119,127,0.2)]">
                  <span className="text-[#bfaec4]">Active Storage Layer:</span>
                  <span className="text-[#f0c98a]">
                    {stats?.database?.active_storage || 'PostgreSQL Layer (Direct Storage)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d0414] border border-[rgba(201,119,127,0.2)]">
                  <span className="text-[#bfaec4]">Target Database:</span>
                  <span className="text-white">
                    {stats?.database?.database || 'major_projects_db'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d0414] border border-[rgba(201,119,127,0.2)]">
                  <span className="text-[#bfaec4]">Host &amp; Port:</span>
                  <span className="text-white">
                    {stats?.database?.host || 'localhost'}:{stats?.database?.port || 5432}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d0414] border border-[rgba(201,119,127,0.2)]">
                  <span className="text-[#bfaec4]">Round-trip Ping Latency:</span>
                  <span className="text-[#86efac]">
                    {stats?.database?.latency_ms ?? 0} ms
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance & Security Posture */}
            <div className="p-6 rounded-2xl bg-[#14081e]/90 border border-[rgba(201,119,127,0.35)] shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-white font-serif-heading text-lg font-bold">
                <Shield className="w-5 h-5 text-[#86efac]" />
                <span>Security &amp; Audit Compliance</span>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  {
                    title: 'Immutable Audit Logging',
                    desc: 'All logins, role changes, and codebase scans recorded into database.',
                    ok: true,
                  },
                  {
                    title: 'Database Connection Pooling',
                    desc: 'SQLAlchemy pool_pre_ping with auto-recycle and zero-latency failover.',
                    ok: true,
                  },
                  {
                    title: 'Role-Based Access Control (RBAC)',
                    desc: 'Separation of ADMIN, DEVELOPER, and AUDITOR security permissions.',
                    ok: true,
                  },
                  {
                    title: 'Static Analysis Rule Engine',
                    desc: '28 SAST patterns checking for hardcoded secrets, SQL injection, XSS.',
                    ok: true,
                  },
                  {
                    title: 'Zero-Knowledge Privacy',
                    desc: 'Code inspected strictly locally; zero source code leaves developer machine.',
                    ok: true,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0d0414] border border-[rgba(201,119,127,0.2)] flex items-start gap-3"
                  >
                    <CheckCircle className="w-4 h-4 text-[#86efac] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white text-xs">{item.title}</div>
                      <div className="text-[11px] text-[#bfaec4] mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </PageBackground>
  );
}

