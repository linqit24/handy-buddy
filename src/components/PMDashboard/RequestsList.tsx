import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Clock } from 'lucide-react';
import {
  PMServiceRequest, SERVICE_LABELS, STATUS_COLORS,
  STATUS_LABELS, RequestStatus, cancelServiceRequest,
} from '../../lib/pmDashboard';

interface Props {
  requests: PMServiceRequest[];
  onRefresh: () => void;
}

const ALL_STATUSES: RequestStatus[] = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];

// Parse ISO datetime → human-readable slot label
// "2025-06-02T10:00:00" → "Mon Jun 2 · 10am–12pm"
// "2025-06-02T13:00:00" → "Mon Jun 2 · 1pm–3pm"
function formatScheduled(iso: string | null | undefined): { date: string; slot: string | null } | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const h = d.getHours();
    const slot = h === 10 ? '10am–12pm' : h === 13 ? '1pm–3pm' : null;
    return { date, slot };
  } catch {
    return null;
  }
}

// Quick badge for ≤3hr jobs vs quote
const QUICK_TYPES = new Set(['on_demand_repair', 'unit_maintenance', 'bulky_item_removal']);

function ServiceBadge({ type }: { type: string }) {
  if (QUICK_TYPES.has(type)) {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
        ≤ 3 hrs
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
      Quote
    </span>
  );
}

export default function RequestsList({ requests, onRefresh }: Props) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  async function handleCancel(id: string) {
    setCancelling(id);
    await cancelServiceRequest(id);
    onRefresh();
    setCancelling(null);
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All requests</h1>
          <p className="text-sm text-slate-400 mt-0.5">{requests.length} total</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/new-request')}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 transition"
        >
          <Plus size={15} /> New
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
            filter === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          All ({requests.length})
        </button>
        {ALL_STATUSES.map(s => {
          const count = requests.filter(r => r.status === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
                filter === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-slate-400 text-sm">No requests found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {filtered.map(req => {
            const scheduled = formatScheduled(req.scheduled_date);
            const canCancel = req.status === 'pending' || req.status === 'scheduled';

            return (
              <div key={req.id} className="flex items-start justify-between px-5 py-4 gap-4">
                <div className="flex-1 min-w-0">

                  {/* Service + type badge + status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">
                      {SERVICE_LABELS[req.service_type]}
                    </p>
                    <ServiceBadge type={req.service_type} />
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[req.status as RequestStatus]}`}>
                      {STATUS_LABELS[req.status as RequestStatus]}
                    </span>
                  </div>

                  {/* Property + unit */}
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {req.pm_properties?.property_name ?? 'No property'}
                    {req.unit_number ? ` · Unit ${req.unit_number}` : ''}
                  </p>

                  {/* Scheduled slot */}
                  {scheduled && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={10} className="text-slate-300 shrink-0" />
                      <p className="text-xs text-slate-500">
                        {scheduled.date}
                        {scheduled.slot && <span className="text-slate-400"> · {scheduled.slot}</span>}
                      </p>
                    </div>
                  )}

                  {/* Notes snippet */}
                  {req.notes && (
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-sm">{req.notes}</p>
                  )}

                  {/* Created date */}
                  <p className="text-[11px] text-slate-300 mt-1.5">
                    Submitted {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Cancel */}
                {canCancel && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={cancelling === req.id}
                    className="text-xs text-slate-400 hover:text-red-500 transition flex items-center gap-1 shrink-0 mt-0.5"
                  >
                    <X size={13} />
                    {cancelling === req.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
