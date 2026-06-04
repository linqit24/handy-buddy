import { supabase } from './supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RequestStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type ServiceType =
  | 'on_demand_repair'
  | 'unit_maintenance'
  | 'bulky_item_removal'
  | 'unit_turnout'
  | 'property_maintenance'
  | 'junk_removal'
  | 'safety_striping'
  | 'property_clearout';

export interface PMProfile {
  id: string;
  contact_name?: string | null;
  phone?: string | null;
  role?: string | null;
  company_id?: string | null;
  onboarding_completed?: boolean | null;
}

export interface PMProperty {
  id: string;
  property_name: string;
  address: string;
  unit_count: number;
  company_id?: string | null;
  zone_number?: number | null;
}

export interface PMServiceRequest {
  id: string;
  user_id: string;
  property_id: string | null;
  unit_number: string | null;
  service_type: ServiceType;
  status: string;
  scheduled_date: string | null;
  notes: string | null;
  created_at: string;
  pm_properties?: { property_name: string } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const SERVICE_LABELS: Record<string, string> = {
  on_demand_repair:    '⚡ On-Demand Repair',
  unit_maintenance:    '🔧 Unit Maintenance',
  bulky_item_removal:  '📦 Bulky Item Removal',
  unit_turnout:        '🏠 Unit Turnout',
  property_maintenance:'🏢 Property Maintenance',
  junk_removal:        '🗑️ Junk Removal',
  safety_striping:     '🚧 Safety & Striping',
  property_clearout:   '🧹 Property Clearout',
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending:     'Pending',
  scheduled:   'Scheduled',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  pending:     'bg-amber-50 text-amber-700 border-amber-200',
  scheduled:   'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-violet-50 text-violet-700 border-violet-200',
  completed:   'bg-green-50 text-green-700 border-green-200',
  cancelled:   'bg-slate-50 text-slate-500 border-slate-200',
};

// ── Database helpers ──────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<PMProfile | null> {
  const { data } = await supabase
    .from('pm_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertProfile(userId: string, updates: Partial<PMProfile>): Promise<void> {
  await supabase
    .from('pm_profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });
}

export async function getProperties(userId: string): Promise<PMProperty[]> {
  const { data } = await supabase
    .from('pm_properties')
    .select('*, pm_property_assignments!inner(user_id)')
    .eq('pm_property_assignments.user_id', userId)
    .order('property_name');
  return (data ?? []).map(({ pm_property_assignments: _a, ...p }) => p as PMProperty);
}

export async function getServiceRequests(userId: string): Promise<PMServiceRequest[]> {
  const { data } = await supabase
    .from('pm_service_requests')
    .select('*, pm_properties(property_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as PMServiceRequest[];
}

export async function createServiceRequest(
  userId: string,
  fields: {
    property_id: string;
    unit_number: string | null;
    service_type: ServiceType;
    status: string;
    scheduled_date: string | null;
    notes: string | null;
  }
): Promise<void> {
  await supabase.from('pm_service_requests').insert({
    user_id: userId,
    ...fields,
  });
}

export async function cancelServiceRequest(id: string): Promise<void> {
  await supabase
    .from('pm_service_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);
}
