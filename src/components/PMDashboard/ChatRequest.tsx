import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { ServiceType } from '../../lib/pmDashboard';

// ── Slot / zone helpers ───────────────────────────────────────────────────────
const ZONE_DAYS: Record<number, number[]> = { 1:[1,5], 2:[2,4], 3:[3,6] };
const ZONE_NAMES: Record<number, string> = {
  1:'Zone 1 (Mon & Fri — West Bay)',
  2:'Zone 2 (Tue & Thu — Central CCC)',
  3:'Zone 3 (Wed & Sat — South & East)',
};
const BOOKINGS_KEY = 'haulin-slot-bookings-v1';

function detectZone(address: string): number | null {
  const a = address.toLowerCase();
  if (a.includes('san pablo')||a.includes('richmond')||a.includes('el sobrante')||
      a.includes('pinole')||a.includes('oakland')||a.includes('castro valley')) return 1;
  if (a.includes('concord')||a.includes('walnut creek')||a.includes('martinez')||
      a.includes('pittsburg')) return 2;
  if (a.includes('danville')||a.includes('livermore')||a.includes('fairfield')||
      a.includes('milpitas')) return 3;
  return null;
}

interface SlotOption { value: string; label: string }

function getAvailableSlots(address: string): SlotOption[] {
  const zone = detectZone(address);
  const days = zone ? ZONE_DAYS[zone] : [1,2,3,4,5];
  let bookings: Record<string,{am?:number;pm?:number}> = {};
  try { bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? '{}'); } catch {}
  const today = new Date();
  const slots: SlotOption[] = [];
  let shown = 0;
  for (let i=1; i<=90&&shown<8; i++) {
    const d = new Date(today); d.setDate(today.getDate()+i);
    if (!days.includes(d.getDay())) continue;
    const key = d.toISOString().split('T')[0];
    const b = bookings[key] ?? {};
    const lbl = d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    if ((b.am??0)<1) { slots.push({value:`${key}|am`,label:`${lbl} · 10am–12pm`}); shown++; }
    if ((b.pm??0)<1) { slots.push({value:`${key}|pm`,label:`${lbl} · 1pm–3pm`});   shown++; }
  }
  return slots;
}

function commitSlot(slot: string) {
  try {
    const store = JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? '{}');
    const [date,period] = slot.split('|') as [string,'am'|'pm'];
    if (!store[date]) store[date] = {};
    store[date][period] = (store[date][period]??0)+1;
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(store));
  } catch {}
}

function slotToISO(slot: string): string {
  if (!slot.includes('|')) return slot;
  const [date,period] = slot.split('|');
  return `${date}T${period==='am'?'10:00':'13:00'}:00`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Collected {
  service_type?: string;
  service_label?: string;
  is_quick?: boolean;
  unit_number?: string;
  slot?: string;
  tenant_name?: string;
  tenant_contact?: string;
  tenant_pref?: string;
  notes?: string;
}

interface ClaudeResponse {
  message: string;
  buttons?: { label: string; value: string }[];
  collected?: Collected;
  done?: boolean;
  confirm_summary?: string;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  buttons?: { label: string; value: string }[];
}

interface Props {
  propertyName: string;
  propertyAddress?: string;
  onComplete: (data: {
    serviceType?: ServiceType;
    unitNumber?: string;
    scheduledDate?: string;
    notes?: string;
  }) => void;
  onSkip?: () => void;
}

function uid() { return Date.now().toString() + Math.random().toString(36).slice(2); }

// ── Sub-components ────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mb-1">
        <span className="text-white text-xs font-bold">C</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0,150,300].map(d=>(
            <span key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
              style={{animationDelay:`${d}ms`}} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BotMsg({ content }: { content: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mb-1">
        <span className="text-white text-xs font-bold">C</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[82%]">
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  );
}

function UserMsg({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="bg-blue-600 rounded-2xl rounded-br-sm px-4 py-3 max-w-[82%]">
        <p className="text-sm text-white leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatRequest({ propertyName, propertyAddress = '', onComplete, onSkip }: Props) {
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [history, setHistory]       = useState<{role:string;content:string}[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [collected, setCollected]   = useState<Collected>({});
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const started   = useRef(false);

  // ── Build system prompt with live slot data ──────────────────────────────
  function buildSystemPrompt(): string {
    const zone = detectZone(propertyAddress);
    const zoneName = zone ? ZONE_NAMES[zone] : 'unknown zone';
    const slots = getAvailableSlots(propertyAddress);
    const slotList = slots.length
      ? slots.map(s => `  - ${s.label} (value: ${s.value})`).join('\n')
      : '  - No slots currently available — user should state a preferred date instead';

    return `You are a friendly, efficient booking assistant for Castle Companies property services.
You are helping a property manager or resident manager book a service for: ${propertyName} (${propertyAddress || 'address unknown'}).
This property is in ${zoneName}.

YOUR JOB: Collect the information needed to create a work order. Be warm but concise — this is a busy professional.

SERVICES AVAILABLE:
Quick jobs (≤ 3 hours, book a time slot, billed as one 3-hour job):
  - on_demand_repair: ⚡ On-Demand Repair (unit must be accessible, may have tenant)
  - unit_maintenance: 🔧 Unit Maintenance (plumbing, fixtures, hardware — may have tenant)
  - bulky_item_removal: 📦 Bulky Item Removal (mattress, appliance, cardboard)

Custom quote required (larger scope — collect details, team will follow up):
  - unit_turnout: 🏠 Unit Turnout (full prep for new tenant)
  - property_maintenance: 🏢 Property Maintenance (grounds & common areas)
  - junk_removal: 🗑️ Junk Removal (volume-based, scoped on-site)
  - safety_striping: 🚧 Safety & Striping (trip hazards, repaving, striping)
  - property_clearout: 🧹 Property Clearout (full unit or property cleanout)

AVAILABLE TIME SLOTS for this property:
${slotList}
Each slot is a 3-hour block. Max 2 bookings per day (AM 10am-12pm, PM 1pm-3pm).

WHAT TO COLLECT:
1. Service type (required)
2. Unit number — or "whole property" if it applies to the whole building
3. For quick jobs: which time slot (from the list above). For quote jobs: preferred date.
4. For on_demand_repair or unit_maintenance only: is the unit occupied? If yes, get tenant name and preferred contact method (call/text/email).
5. Any notes (access codes, parking, specific items, scope details) — optional

CONVERSATION FLOW:
- Ask one thing at a time. Don't overwhelm.
- When you have everything, show a clear summary and ask for confirmation.
- After confirmation, set done: true.
- Keep responses short and friendly. No corporate speak.

RESPONSE FORMAT — you MUST always respond with valid JSON only, no other text:
{
  "message": "your message to the user (use \\n for line breaks)",
  "buttons": [{"label": "display text", "value": "machine value"}],  // optional — include when choices make sense
  "collected": {
    "service_type": "on_demand_repair",      // snake_case service ID once known
    "service_label": "⚡ On-Demand Repair",  // human label
    "is_quick": true,                        // true for quick jobs, false for quote
    "unit_number": "4B",                     // omit if whole property
    "slot": "2025-06-02|am",                 // slot value from available list, or ISO date string for quotes
    "tenant_name": "Maria Lopez",            // only for occupied quick jobs
    "tenant_contact": "510-555-0100",        // phone or email
    "tenant_pref": "text",                   // call / text / email
    "notes": "Gate code 1234"
  },
  "done": false,         // set true ONLY after user confirms summary is correct
  "confirm_summary": ""  // filled when showing confirmation summary
}

Rules:
- Only include fields in "collected" that you've actually gathered so far.
- "buttons" should only be present when you want the user to tap a choice rather than type.
- For service selection, always offer buttons grouped as quick vs quote.
- For slot selection, use the slot values from the list above as button values.
- Never make up slots that aren't in the list.
- If no slots are available, ask for a preferred date as free text instead.
- The "message" field is what gets shown in the chat bubble — keep it conversational.`;
  }

  // ── Call Claude API ────────────────────────────────────────────────────────
  async function callClaude(userMessage: string, currentHistory: {role:string;content:string}[]): Promise<ClaudeResponse> {
    const newHistory = [
      ...currentHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: buildSystemPrompt(),
        messages: newHistory,
      }),
    });

    const data = await response.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text ?? '{}';

    // Strip possible markdown fences
    const clean = text.replace(/^```json\s*/,'').replace(/\s*```$/,'').trim();
    const parsed: ClaudeResponse = JSON.parse(clean);
    return parsed;
  }

  // ── Send a message through Claude ─────────────────────────────────────────
  async function send(userText: string, displayText?: string) {
    if (loading) return;
    const shown = displayText ?? userText;

    // Add user bubble
    setMessages(p => [...p, { id: uid(), role: 'user', content: shown }]);
    setInput('');
    setLoading(true);

    try {
      const parsed = await callClaude(userText, history);

      // Update history
      const newHistory = [
        ...history,
        { role: 'user', content: userText },
        { role: 'assistant', content: JSON.stringify(parsed) },
      ];
      setHistory(newHistory);

      // Merge collected data
      if (parsed.collected) {
        setCollected(p => ({ ...p, ...parsed.collected }));
      }

      // Add bot bubble
      setMessages(p => [...p, {
        id: uid(),
        role: 'assistant',
        content: parsed.message,
        buttons: parsed.buttons,
      }]);

      // Handle completion
      if (parsed.done) {
        const final = { ...collected, ...parsed.collected };
        if (final.slot?.includes('|')) commitSlot(final.slot);
        const notesParts = [
          final.notes,
          final.tenant_name ? `Tenant: ${final.tenant_name} — prefers ${final.tenant_pref ?? 'call'} (${final.tenant_contact ?? ''})` : null,
        ].filter(Boolean).join(' | ');

        setTimeout(() => onComplete({
          serviceType: final.service_type as ServiceType,
          unitNumber:  final.unit_number,
          scheduledDate: final.slot ? slotToISO(final.slot) : undefined,
          notes: notesParts || undefined,
        }), 1800);
      }

    } catch (err) {
      console.error('Claude API error:', err);
      setMessages(p => [...p, {
        id: uid(),
        role: 'assistant',
        content: "Sorry, something went wrong. Please try again or use the work order pad instead.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  // ── Kick off on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setLoading(true);

    // Prime Claude with a silent "start" message
    callClaude('START_CONVERSATION', [])
      .then(parsed => {
        setHistory([
          { role: 'user', content: 'START_CONVERSATION' },
          { role: 'assistant', content: JSON.stringify(parsed) },
        ]);
        if (parsed.collected) setCollected(parsed.collected);
        setMessages([{
          id: uid(),
          role: 'assistant',
          content: parsed.message,
          buttons: parsed.buttons,
        }]);
      })
      .catch(() => {
        setMessages([{
          id: uid(),
          role: 'assistant',
          content: `Hi! I'm here to help you book a service for ${propertyName}. What do you need taken care of?`,
        }]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const lastMsg = messages[messages.length - 1];

  return (
    <div className="flex flex-col min-h-[520px] max-h-[640px]">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          return (
            <div key={msg.id} className="space-y-3">
              {msg.role === 'assistant' && <BotMsg content={msg.content} />}
              {msg.role === 'user'      && <UserMsg content={msg.content} />}

              {/* Buttons — only on last assistant message and only if not loading */}
              {msg.role === 'assistant' && isLast && !loading && msg.buttons && msg.buttons.length > 0 && (
                <div className="ml-9 flex flex-col gap-1.5">
                  {msg.buttons.map(btn => (
                    <button
                      key={btn.value}
                      onClick={() => send(btn.value, btn.label)}
                      className="text-left px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-200 px-4 py-3 bg-white">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); send(input.trim()); }}}
            placeholder="Type your reply…"
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => { if (input.trim()) send(input.trim()); }}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition shrink-0"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition mt-2"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
