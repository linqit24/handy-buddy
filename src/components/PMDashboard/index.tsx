import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Building2, Plus, LogOut, Menu, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import {
  PMProperty, PMServiceRequest,
  getProperties, getServiceRequests, getProfile,
} from '../../lib/pmDashboard';

import DashboardHome from './DashboardHome';
import NewRequest from './NewRequest';
import RequestsList from './RequestsList';
import PropertiesList from './PropertiesList';
import Onboarding from './Onboarding';

interface Props {
  user: User;
}

const NAV_ITEMS = [
  { label: 'Overview',    path: '/dashboard',            icon: LayoutDashboard },
  { label: 'Requests',    path: '/dashboard/requests',   icon: ClipboardList },
  { label: 'Properties',  path: '/dashboard/properties', icon: Building2 },
];

export default function PMDashboard({ user }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties]     = useState<PMProperty[]>([]);
  const [requests, setRequests]         = useState<PMServiceRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [onboarded, setOnboarded]       = useState<boolean | null>(null);
  const [userName, setUserName]         = useState<string | undefined>();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [props, reqs, profile] = await Promise.all([
      getProperties(user.id),
      getServiceRequests(user.id),
      getProfile(user.id),
    ]);
    setProperties(props);
    setRequests(reqs);
    setOnboarded(profile?.onboarding_completed === true);
    // Use stored contact name if available, fall back to email prefix
    setUserName(profile?.contact_name || undefined);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  function handleOnboardingComplete() {
    setOnboarded(true);
    refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!onboarded) {
    return (
      <Onboarding
        userId={user.id}
        userEmail={user.email ?? ''}
        properties={properties}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  const displayName = userName || user.email?.split('@')[0] || '';

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-black">C</span>
            </div>
            <span className="text-base font-bold text-slate-900">Castle Portal</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 pl-8">Powered by HaulinBuddy</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <button
            onClick={() => navigate('/dashboard/new-request')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
          >
            <Plus size={17} /> New Request
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition"
          >
            <LogOut size={17} /> Sign out
          </button>
          {/* User identity pill */}
          <div className="px-3 pt-3 pb-1 border-t border-slate-100 mt-2">
            <p className="text-xs font-medium text-slate-700 truncate">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white text-[9px] font-black">C</span>
          </div>
          <span className="text-sm font-bold text-slate-900">Castle Portal</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(v => !v)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-16 px-4">
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
              <button
                key={path}
                onClick={() => { navigate(path); setMobileNavOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Icon size={17} /> {label}
              </button>
            ))}
            <button
              onClick={() => { navigate('/dashboard/new-request'); setMobileNavOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50"
            >
              <Plus size={17} /> New Request
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              <LogOut size={17} /> Sign out
            </button>
          </nav>
          <div className="absolute bottom-8 left-4 right-4 px-4 py-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-700">{displayName}</p>
            <p className="text-[11px] text-slate-400">{user.email}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 mt-14 md:mt-0">
          <Routes>
            <Route
              index
              element={
                <DashboardHome
                  requests={requests}
                  properties={properties}
                  userName={userName}
                />
              }
            />
            <Route
              path="new-request"
              element={<NewRequest userId={user.id} properties={properties} />}
            />
            <Route
              path="requests"
              element={<RequestsList requests={requests} onRefresh={refresh} />}
            />
            <Route
              path="properties"
              element={<PropertiesList properties={properties} />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
