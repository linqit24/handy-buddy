import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { PMProperty } from '../../lib/pmDashboard';

// Props — no userId or onRefresh needed; properties are managed by Castle
interface Props {
  properties: PMProperty[];
}

// ── Zone detection from address string ───────────────────────────────────────
// Zone 1 Mon/Fri  — West Bay
// Zone 2 Tue/Thu  — Central Contra Costa
// Zone 3 Wed/Sat  — South & East
function detectZone(address: string): 1 | 2 | 3 | null {
  const a = address.toLowerCase();
  if (
    a.includes('san pablo') || a.includes('richmond') ||
    a.includes('el sobrante') || a.includes('pinole') ||
    a.includes('oakland') || a.includes('castro valley')
  ) return 1;
  if (
    a.includes('concord') || a.includes('walnut creek') ||
    a.includes('martinez') || a.includes('pittsburg')
  ) return 2;
  if (
    a.includes('danville') || a.includes('livermore') ||
    a.includes('fairfield') || a.includes('milpitas')
  ) return 3;
  return null;
}

const ZONE_CONFIG: Record<number, { label: string; days: string; badge: string; dot: string }> = {
  1: { label: 'Zone 1', days: 'Mon & Fri',  badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  2: { label: 'Zone 2', days: 'Tue & Thu',  badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  3: { label: 'Zone 3', days: 'Wed & Sat',  badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
};

function ZoneBadge({ zone }: { zone: 1 | 2 | 3 }) {
  const cfg = ZONE_CONFIG[zone];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label} · {cfg.days}
    </span>
  );
}

// Group properties by zone for display
function groupByZone(props: PMProperty[]) {
  const groups: Record<string, { zone: 1 | 2 | 3 | null; props: PMProperty[] }> = {
    '1': { zone: 1, props: [] },
    '2': { zone: 2, props: [] },
    '3': { zone: 3, props: [] },
    'none': { zone: null, props: [] },
  };
  props.forEach(p => {
    const z = detectZone(p.address ?? '');
    const key = z ? String(z) : 'none';
    groups[key].props.push(p);
  });
  return groups;
}

export default function PropertiesList({ properties }: Props) {
  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <Building2 size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No properties assigned yet.</p>
          <p className="text-slate-300 text-xs mt-1">Contact your Castle Companies administrator.</p>
        </div>
      </div>
    );
  }

  const groups = groupByZone(properties);
  const orderedZones: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} assigned to your account
        </p>
      </div>

      {/* Zone legend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {orderedZones.map(z => {
          const cfg = ZONE_CONFIG[z];
          const count = groups[String(z)].props.length;
          return (
            <div key={z} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700">{cfg.label} · {cfg.days}</p>
                <p className="text-[11px] text-slate-400">{count} propert{count === 1 ? 'y' : 'ies'} · 2 slots/day · AM & PM</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Properties grouped by zone */}
      {orderedZones.map(z => {
        const { props } = groups[String(z)];
        if (props.length === 0) return null;
        const cfg = ZONE_CONFIG[z];
        return (
          <div key={z}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {cfg.label} · {cfg.days}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
              {props.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{p.property_name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-slate-300 shrink-0" />
                      <p className="text-xs text-slate-400 truncate">{p.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400">
                      {p.unit_count} unit{p.unit_count !== 1 ? 's' : ''}
                    </span>
                    <ZoneBadge zone={z} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Unzoned fallback */}
      {groups['none'].props.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Other</p>
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {groups['none'].props.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{p.property_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{p.address}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {p.unit_count} unit{p.unit_count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-slate-400 text-center pb-2">
        Properties are managed by Castle Companies. Contact your administrator to make changes.
      </p>
    </div>
  );
}
