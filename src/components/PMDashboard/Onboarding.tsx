import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, ClipboardList, CalendarCheck, BarChart3, CheckCircle } from 'lucide-react';
import { upsertProfile } from '../../lib/pmDashboard';

interface Props {
  userId: string;
  userEmail: string;
  propertyCount?: number;
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: ClipboardList,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Submit work orders fast',
    body: 'Pick a property, add units and services, choose a time slot, and submit — all on one screen. You can log multiple units and properties in a single work order.',
    detail: [
      { emoji: '🔧', text: 'Quick jobs (≤ 3 hrs) book directly into a time slot' },
      { emoji: '📋', text: 'Larger jobs route to a custom quote automatically' },
      { emoji: '👤', text: 'Occupied units let you add tenant contact details' },
    ],
  },
  {
    icon: CalendarCheck,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    title: 'Scheduling by zone',
    body: 'Your properties are grouped into service zones so crews are always nearby. Quick jobs are booked into 3-hour morning or afternoon slots.',
    detail: [
      { emoji: '🔵', text: 'Zone 1 · Mon & Fri — West Bay' },
      { emoji: '🟢', text: 'Zone 2 · Tue & Thu — Central CCC' },
      { emoji: '🟣', text: 'Zone 3 · Wed & Sat — South & East' },
    ],
  },
  {
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
  },
];

export default function Onboarding({ userId, userEmail, propertyCount, onComplete }: Props) {
  const [slide, setSlide] = useState(0);
  const [saving, setSaving] = useState(false);

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];
  const Icon = current.icon;

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
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            {propertyCount
              ? `Your ${propertyCount} propert${propertyCount === 1 ? 'y is' : 'ies are'} ready. Here's how the system works.`
              : "Here's a quick look at how the system works."}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
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
          {/* Icon */}
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
          {slide + 1} of {SLIDES.length}
        </p>
      </div>
    </div>
  );
}
