import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle, Calendar, Building2, Plus } from 'lucide-react';
import {
  PMServiceRequest, PMProperty,
  SERVICE_LABELS, STATUS_COLORS, STATUS_LABELS, RequestStatus,
} from '../../lib/pmDashboard';

interface Props {
  requests: PMServiceRequest[];
  properties: PMProperty[];
  userName?: string;
}

// Quick-access service tiles — maps to the New Request work order pad.
// The `type` query param is informational; NewRequest reads it to pre-select
// a service if you wire that up, or ignores it safely if not.
const QUICK_ACTIONS = [
  { label: '⚡ On-Demand Repair',    type: 'on_demand_repair' },
  { label: '🔧 Unit Maintenance',    type: 'unit_maintenance' },
  { label: '📦 Bulky Item Removal',  type: 'bulky_item_removal' },
  { label: '🏠 Unit Turnout',        type: 'unit_turnout' },
  { label: '🗑️ Junk Removal',        type: 'junk_removal' },
  { label: '🧹 Property Clearout',   type: 'property_clearout' },
];

export default function DashboardHome({ requests, properties, userName }: Props) {
  const navigate = useNavigate();

  const pending   = requests.filter(r => r.status === 'pending').length;
  const scheduled = requests.filter(r => r.status === 'scheduled').length;
  const completed = requests.filter(r => r.status === 'completed').length;
  const recent    = requests.slice(0, 5);

  const greeting = userName
    ? `Good to see you, ${userName.split(' ')[0]} 👋`
    : 'Good to see you 👋';

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Castle Companies · Property Services Portal</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/new-request')}
          className="shrink-0 flex items-center gap-2 bg-blue-600 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition"
        >
          <Plus size={15} /> New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending',    value: pending,            icon: Clock,        color: 'text-amber-600 bg-amber-50' },
          { label: 'Scheduled', value: scheduled,           icon: Calendar,     color: 'text-blue-600 bg-blue-50' },
          { label: 'Completed', value: completed,           icon: CheckCircle,  color: 'text-green-600 bg-green-50' },
          { label: 'Properties',value: properties.length,   icon: Building2,    color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ label, type }) => (
            <button
              key={type}
              onClick={() => navigate(`/dashboard/new-request?type=${type}`)}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition group text-left"
            >
              <span>{label}</span>
              <ArrowRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent requests</p>
          <button
            onClick={() => navigate('/dashboard/requests')}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            View all
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm">No requests yet.</p>
            <button
              onClick={() => navigate('/dashboard/new-request')}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              Submit your first work order <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {recent.map(req => {
              const slotLabel = formatSlot(req.scheduled_date);
              return (
                <div key={req.id} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {SERVICE_LABELS[req.service_type]}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {req.pm_properties?.property_name ?? 'No property'}
                      {req.unit_number ? ` · Unit ${req.unit_number}` : ''}
                      {slotLabel ? ` · ${slotLabel}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[req.status as RequestStatus]}`}>
                    {STATUS_LABELS[req.status as RequestStatus]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Parse "2025-06-02T10:00:00" → "Mon Jun 2 · 10am–12pm"
function formatSlot(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const h = d.getHours();
    if (h === 10) return `${day} · 10am–12pm`;
    if (h === 13) return `${day} · 1pm–3pm`;
    return day;
  } catch {
    return null;
  }
}
