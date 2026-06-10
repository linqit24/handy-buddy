import React, { useMemo, useState } from 'react';
import { ArrowRight, ArrowLeft, ClipboardList, CalendarCheck, BarChart3, CircleCheck as CheckCircle } from 'lucide-react';
import { PMProperty, upsertProfile } from '../../lib/pmDashboard';

interface Props {
  userId: string;
  userEmail: string;
  properties: PMProperty[];
  onComplete: () => void;
}

// ── Zone detection (mirrors PropertiesList / ChatRequest) ─────────────────────
const ZONE_META: Record<1 | 2 | 3, { emoji: string; label: string; days: string; area: string; dot: string; badge: string }> = {
  1: { emoji: '🔵', label: 'Zone 1', days: 'Mon & Fri', area: 'West Bay',     dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  2: { emoji: '🟢', label: 'Zone 2', days: 'Tue & Thu', area: 'Central CCC', dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  3: { emoji: '🟣', label: 'Zone 3', days: 'Wed & Sat', area: 'South & East', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
};

function detectZone(address: string): 1 | 2 | 3 | null {
  const a = address.toLowerCase();
  if (a.includes('san pablo') || a.includes('richmond') || a.includes('el sobrante') ||
      a.includes('pinole') || a.includes('oakland') || a.includes('castro valley')) return 1;
  if (a.includes('concord') || a.includes('walnut creek') || a.includes('martinez') ||
      a.includes('pittsburg')) return 2;
  if (a.includes('danville') || a.includes('livermore') || a.includes('fairfield') ||
      a.includes('milpitas')) return 3;
  return null;
}

function getActiveZones(properties: PMProperty[]): (1 | 2 | 3)[] {
  const seen = new Set<1 | 2 | 3>();
  properties.forEach(p => {
    const z = detectZone(p.address ?? '');
    if (z) seen.add(z);
  });
  return ([1, 2, 3] as const).filter(z => seen.has(z));
}

// ── Slides ────────────────────────────────────────────────────────────────────
interface Slide {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  detail: { emoji: string; text: string }[];
}

function buildSlides(properties: PMProperty[]): Slide[] {
  const count = properties.length;
  const activeZones = getActiveZones(properties);
  const zoneCount = activeZones.length;

  // Slide 1 — work orders (tailored to property count)
  const slide1: Slide = {
    icon: ClipboardList,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Submit work orders fast',
    body: count > 0
      ? `Pick one of your ${count} propert${count === 1 ? 'y' : 'ies'}, describe what's needed, and choose a time slot — all through a quick chat. Done in under a minute.`
      : 'Pick a property, describe what\'s needed, and choose a time slot — all through a quick chat. Done in under a minute.',
    detail: [
      { emoji: '🔧', text: 'Quick jobs (≤ 3 hrs) book directly into a time slot' },
      { emoji: '📋', text: 'Larger jobs route to a custom quote automatically' },
      { emoji: '👤', text: 'Occupied units let you add tenant contact details' },
    ],
  };

  // Slide 2 — scheduling, showing only the user's zones
  const schedulingBody = (() => {
    if (zoneCount === 0) {
      return 'Properties are grouped into service zones so crews stay nearby. Quick jobs fit into 3-hour AM or PM slots.';
    }
    if (zoneCount === 1) {
      const z = ZONE_META[activeZones[0]];
      return `Your propert${count === 1 ? 'y is' : 'ies are'} in ${z.label} (${z.area}), served on ${z.days}. Crews book into 3-hour AM (10am–12pm) or PM (1pm–3pm) slots.`;
    }
    return `Your properties span ${zoneCount} service zones so crews are always nearby. Each zone runs on its own schedule with AM (10am–12pm) and PM (1pm–3pm) slots.`;
  })();

  const zoneDetail = activeZones.length > 0
    ? activeZones.map(z => ({ emoji: ZONE_META[z].emoji, text: `${ZONE_META[z].label} · ${ZONE_META[z].days} — ${ZONE_META[z].area}` }))
    : ([1, 2, 3] as const).map(z => ({ emoji: ZONE_META[z].emoji, text: `${ZONE_META[z].label} · ${ZONE_META[z].days} — ${ZONE_META[z].area}` }));

  const slide2: Slide = {
    icon: CalendarCheck,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    title: zoneCount === 1
      ? `Your zone: ${ZONE_META[activeZones[0]].label} · ${ZONE_META[activeZones[0]].days}`
      : 'Scheduling by zone',
    body: schedulingBody,
    detail: zoneDetail,
  };

  // Slide 3 — tracking (always generic)
  const slide3: Slide = {
    icon: BarChart3,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Track every request',
    body: 'Every submission appears in your Requests tab with real-time status. Cancel anything still pending or scheduled with one tap.',
    detail: [
      { emoji: '🟡', text: 'Pending — received, awaiting confirmation' },
      { emoji: '🔵', text: 'Scheduled — slot confirmed, crew assigned' },
      { emoji: '🟢', text: 'Completed — work done and closed out' },
    ],
  };

  return [slide1, slide2, slide3];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Onboarding({ userId, userEmail, properties, onComplete }: Props) {
  const [slide, setSlide] = useState(0);
  const [saving, setSaving] = useState(false);

  const slides = useMemo(() => buildSlides(properties), [properties]);
  const isLast = slide === slides.length - 1;
  const current = slides[slide];
  const Icon = current.icon;

  const propertyCount = properties.length;
  const displayName = userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  async function handleFinish() {
    setSaving(true);
    await upsertProfile(userId, { onboarding_completed: true });
    onComplete();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-5 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white text-[10px] font-black">C</span>
            </div>
            <span className="text-sm font-bold text-slate-800">Castle Companies Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {displayName} 👋</h1>
          <p className="text-slate-500 text-sm mt-1.5">
            {propertyCount > 0
              ? `Your ${propertyCount} propert${propertyCount === 1 ? 'y is' : 'ies are'} ready. Here's how the system works.`
              : "Here's a quick look at how the system works."}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === slide ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Slide card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          <div className={`w-12 h-12 rounded-2xl ${current.iconBg} flex items-center justify-center mb-5`}>
            <Icon size={22} className={current.iconColor} />
          </div>

          <h2 className="text-lg font-bold text-slate-900 mb-2">{current.title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-5">{current.body}</p>

          <div className="space-y-2.5">
            {current.detail.map((d, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                <span className="text-base leading-none mt-0.5">{d.emoji}</span>
                <span className="text-xs text-slate-600 leading-relaxed">{d.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-5">
          {slide > 0 && (
            <button
              onClick={() => setSlide(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <button
            onClick={isLast ? handleFinish : () => setSlide(s => s + 1)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-full py-3.5 text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving
              ? 'Getting you set up…'
              : isLast
              ? <><CheckCircle size={15} /> Open my dashboard</>
              : <>Next <ArrowRight size={14} /></>}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          {slide + 1} of {slides.length}
        </p>
      </div>
    </div>
  );
}
