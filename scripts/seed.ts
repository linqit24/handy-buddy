#!/usr/bin/env ts-node
/**
 * Castle Companies — Supabase seed script
 *
 * Invites all 28 Castle users via magic link, then seeds their
 * profiles and assigned properties.
 *
 * Usage:
 *   npx ts-node seed.ts
 *
 * Required env vars in .env.local:
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   ← NOT the anon key
 *
 * Re-running is safe — existing users are looked up, not re-invited.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ── Admin client (service role) ──────────────────────────────────────────────
const admin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Types ────────────────────────────────────────────────────────────────────
interface Property {
  name: string;
  address: string;
  units: number;
}

interface Person {
  email: string;
  name: string;
  phone: string;
  role: 'property_manager' | 'resident_manager';
  officeHours?: string;
  properties: Property[];
}

// ── Castle Companies data (from PDF) ────────────────────────────────────────
const CASTLE_PEOPLE: Person[] = [

  // ── Property Managers ────────────────────────────────────────────────────

  {
    email: 'gkahlon@castlecompanies.com',
    name: 'Gagan Kahlon',
    phone: '925-808-1101',
    role: 'property_manager',
    properties: [
      { name: 'Muir Park',           address: '1201 Arnold Drive, Martinez, CA 94553',              units: 50 },
      { name: 'Birchwood Apts',      address: '1890 Dover Avenue, Fairfield, CA 94533',             units: 40 },
      { name: 'Courtyard Terrace',   address: '4250-A Appian Way, El Sobrante, CA 94803',           units: 41 },
      { name: 'Rose Garden Apts',    address: '802 Camino Ramon, Danville, CA 94526',               units: 35 },
      { name: 'Cowell Terrace',      address: '1167 St. Matthew Place, Concord, CA 94518',          units: 30 },
      { name: 'San Pablo / Richmond',address: '4017 Garvin Avenue, Richmond, CA 94805',             units: 25 },
      { name: 'Cypress',             address: '2708 El Portal Drive, San Pablo, CA 94806',          units: 20 },
      { name: 'Fuchsia Trails Apts', address: '4251 San Pablo Dam Road, El Sobrante, CA 94803',     units: 30 },
      { name: 'Sun Garden Apts',     address: '4231 San Pablo Dam Road, El Sobrante, CA 94803',     units: 28 },
      { name: 'Greentree Terrace',   address: '3632 Clayton Road, Concord, CA 94521',               units: 35 },
      { name: 'Kona Kai Apts',       address: '3066 Willow Pass Road, Concord, CA 94519',           units: 30 },
      { name: 'Vanguard Townhomes',  address: '4242-4250 San Pablo Dam Road, El Sobrante, CA 94803',units: 25 },
      { name: 'Milpa Village',       address: '271 Red Berry Lane, Milpitas, CA 95035',             units: 40 },
      { name: 'Monterey Club',       address: '1411 Monument Boulevard, Concord, CA 94520',         units: 45 },
    ],
  },

  {
    email: 'bstarczewski@castlecompanies.com',
    name: 'Brett Starczewski',
    phone: '925-719-7139',
    role: 'property_manager',
    properties: [
      { name: 'Pine Terrace Apts',   address: '1500 Pine Street, Concord, CA 94520',               units: 32 },
      { name: 'Sequoia Grove',       address: '950 Podva Road, Danville, CA 94526',                 units: 28 },
      { name: 'Diablo Terrace',      address: '4900-4904 Clayton Road, Concord, CA 94521',          units: 20 },
      { name: 'Grand Parkview',      address: '250 Grand Avenue, Oakland, CA 94610',                units: 24 },
      { name: 'Tiki',                address: '2688 Rollingwood Drive, San Pablo, CA 94806',        units: 18 },
      { name: 'Meadow Rock',         address: '1180 Meadow Lane, Concord, CA 94520',                units: 22 },
      { name: 'Villa Serena',        address: '100 Leland Lane, Pittsburg, CA 94565',               units: 30 },
    ],
  },

  {
    email: 'malcazar@castlecompanies.com',
    name: 'Monica Alcazar',
    phone: '510-616-8777',
    role: 'property_manager',
    properties: [
      { name: 'Arbol Verde',         address: '3998 East Avenue, Livermore, CA 94550',              units: 30 },
      { name: 'Oak Grove Terrace',   address: '706D Oak Grove Road, Concord, CA 94518',             units: 35 },
      { name: 'Casa Linda',          address: '2523 & 2527 Henry Avenue, Pinole, CA 94564',         units: 24 },
      { name: 'Sierra Apts',         address: '4875 Clayton Road, Concord, CA 94521',               units: 20 },
      { name: '57 Tahoe Court',      address: '57 Tahoe Court, Walnut Creek, CA 94596',             units: 10 },
      { name: '58 Tahoe Court',      address: '58 Tahoe Court, Walnut Creek, CA 94596',             units: 10 },
      { name: 'Tamarac Apts',        address: '2016 Sierra Road, Concord, CA 94518',                units: 25 },
      { name: 'Kona',                address: '2645 Church Lane, San Pablo, CA 94806',              units: 22 },
      { name: 'Villa Grove',         address: '2481 Grove Way, Castro Valley, CA 94546',            units: 28 },
    ],
  },

  // ── Resident Managers ────────────────────────────────────────────────────

  {
    email: 'avalivermore@gmail.com',
    name: 'Carleen Lankenau',
    phone: '925-421-9272',
    role: 'resident_manager',
    officeHours: '12PM–4:30PM, Closed Sat & Sun',
    properties: [
      { name: 'Arbol Verde', address: '3998 East Avenue, Livermore, CA 94550', units: 30 },
    ],
  },

  {
    email: 'birchwoodapts1890@gmail.com',
    name: 'Bridget Carr',
    phone: '925-496-1262',
    role: 'resident_manager',
    officeHours: '9AM–5PM Mon–Thu, 9AM–12PM Fri & Sat, Closed Wed & Sun',
    properties: [
      { name: 'Birchwood Apts', address: '1890 Dover Avenue, Fairfield, CA 94533', units: 40 },
    ],
  },

  {
    email: 'sungardenapts4231@gmail.com',
    name: 'Ivan Arroyo',
    phone: '510-566-3690',
    role: 'resident_manager',
    officeHours: '9AM–5PM, Closed Wed & Sun',
    properties: [
      { name: 'Casa Linda',    address: '2523 & 2527 Henry Avenue, Pinole, CA 94564',         units: 24 },
      { name: 'Sun Garden Apts', address: '4231 San Pablo Dam Road, El Sobrante, CA 94803',   units: 28 },
    ],
  },

  {
    email: 'cyt4260@gmail.com',
    name: 'Betty Avalos',
    phone: '510-734-0810',
    role: 'resident_manager',
    officeHours: '9AM–2:30PM, Closed Tue, Wed & Sun',
    properties: [
      { name: 'Courtyard Terrace', address: '4250-A Appian Way, El Sobrante, CA 94803', units: 41 },
    ],
  },

  {
    email: 'cowellterrace104@gmail.com',
    name: 'Laura Cortes',
    phone: '925-548-2619',
    role: 'resident_manager',
    officeHours: '9AM–5PM, Closed Wed & Sun',
    properties: [
      { name: 'Cowell Terrace', address: '1167 St. Matthew Place, Concord, CA 94518', units: 30 },
    ],
  },

  {
    email: 'konaapartments2645@gmail.com',
    name: 'Sandra Bouie',
    phone: '510-334-3540',
    role: 'resident_manager',
    officeHours: '9AM–5PM, Closed Sat & Sun',
    properties: [
      { name: 'Cypress', address: '2708 El Portal Drive, San Pablo, CA 94806',     units: 20 },
      { name: 'Kona',    address: '2645 Church Lane, San Pablo, CA 94806',          units: 22 },
      { name: 'Tiki',    address: '2688 Rollingwood Drive, San Pablo, CA 94806',    units: 18 },
    ],
  },

  {
    email: 'diabloterraceconcord@gmail.com',
    name: 'Matt Hulse',
    phone: '925-719-6390',
    role: 'resident_manager',
    officeHours: '5PM–7PM M/T/Th/F, 9AM–11AM Sat, Closed Wed & Sun',
    properties: [
      { name: 'Diablo Terrace', address: '4900-4904 Clayton Road, Concord, CA 94521', units: 20 },
    ],
  },

  {
    email: 'vanguard.fuchsia@gmail.com',
    name: 'Shiloh Deisler-Hicks',
    phone: '925-719-1718',
    role: 'resident_manager',
    officeHours: '9AM–12PM, Closed Wed & Sun',
    properties: [
      { name: 'Fuchsia Trails Apts', address: '4251 San Pablo Dam Road, El Sobrante, CA 94803',      units: 30 },
      { name: 'Vanguard Townhomes',  address: '4242-4250 San Pablo Dam Road, El Sobrante, CA 94803', units: 25 },
    ],
  },

  {
    email: 'grandparkview250@gmail.com',
    name: 'Jodi Hopkins',
    phone: '510-368-4612',
    role: 'resident_manager',
    officeHours: '10AM–1PM, Closed Wed & Sun',
    properties: [
      { name: 'Grand Parkview', address: '250 Grand Avenue, Oakland, CA 94610', units: 24 },
    ],
  },

  {
    email: 'greentreeterrace@gmail.com',
    name: 'Jose Argueta',
    phone: '925-548-5866',
    role: 'resident_manager',
    officeHours: '9AM–1:30PM, Closed Wed & Sun',
    properties: [
      { name: 'Greentree Terrace', address: '3632 Clayton Road, Concord, CA 94521', units: 35 },
    ],
  },

  {
    email: 'konakai3066@gmail.com',
    name: 'Gracy Garcia',
    phone: '925-549-0601',
    role: 'resident_manager',
    officeHours: '2PM–5PM, Closed Wed & Sun',
    properties: [
      { name: 'Kona Kai Apts', address: '3066 Willow Pass Road, Concord, CA 94519', units: 30 },
    ],
  },

  {
    email: 'meadowrockapartments@gmail.com',
    name: 'Eddy Castro',
    phone: '925-336-4263',
    role: 'resident_manager',
    officeHours: '8AM–10AM, Closed Wed & Sun',
    properties: [
      { name: 'Meadow Rock', address: '1180 Meadow Lane, Concord, CA 94520', units: 22 },
    ],
  },

  {
    email: 'milpavillagetownhomes@gmail.com',
    name: 'Victoria Bradley',
    phone: '408-655-8219',
    role: 'resident_manager',
    officeHours: '3PM–5PM, Closed Wed & Sun',
    properties: [
      { name: 'Milpa Village', address: '271 Red Berry Lane, Milpitas, CA 95035', units: 40 },
    ],
  },

  {
    email: 'montereyclubapartments@yahoo.com',
    name: 'Endira Garcia',
    phone: '925-549-2404',
    role: 'resident_manager',
    officeHours: '9AM–5PM, Closed Sat & Sun',
    properties: [
      { name: 'Monterey Club', address: '1411 Monument Boulevard, Concord, CA 94520', units: 45 },
    ],
  },

  {
    email: 'muirparkcondos96@gmail.com',
    name: 'Angelica Ojeda',
    phone: '925-548-0779',
    role: 'resident_manager',
    officeHours: '9AM–5PM, Closed Wed & Sun',
    properties: [
      { name: 'Muir Park', address: '1201 Arnold Drive, Martinez, CA 94553', units: 50 },
    ],
  },

  {
    email: 'apitzler@castlecompanies.com',
    name: 'A. Pitzler',
    phone: '',
    role: 'resident_manager',
    properties: [
      { name: 'Oak Grove Terrace', address: '706D Oak Grove Road, Concord, CA 94518', units: 35 },
    ],
  },

  {
    email: 'ptcapts1500@gmail.com',
    name: 'Marlen Carrillo',
    phone: '925-487-4402',
    role: 'resident_manager',
    officeHours: '9AM–5PM, Closed Wed & Sun',
    properties: [
      { name: 'Pine Terrace Apts', address: '1500 Pine Street, Concord, CA 94520', units: 32 },
    ],
  },

  {
    email: 'rosegardenapts@castlecompanies.com',
    name: 'Lisa Wood',
    phone: '925-548-7952',
    role: 'resident_manager',
    officeHours: '1PM–4:30PM, Closed Sat & Sun',
    properties: [
      { name: 'Rose Garden Apts', address: '802 Camino Ramon, Danville, CA 94526', units: 35 },
    ],
  },

  {
    email: 'wcm4017@gmail.com',
    name: 'Ana Pineda',
    phone: '510-305-8944',
    role: 'resident_manager',
    officeHours: '9AM–5PM, Closed Sat & Sun',
    properties: [
      { name: 'San Pablo / Richmond', address: '4017 Garvin Avenue, Richmond, CA 94805', units: 25 },
    ],
  },

  {
    email: 'sequoiagrove@castlecompanies.com',
    name: 'Dani Garcia',
    phone: '925-548-8379',
    role: 'resident_manager',
    officeHours: '10AM–1PM, Closed Wed & Sun',
    properties: [
      { name: 'Sequoia Grove', address: '950 Podva Road, Danville, CA 94526', units: 28 },
    ],
  },

  {
    email: 'sierraapts4875@gmail.com',
    name: 'Nelly Garcia',
    phone: '925-549-2384',
    role: 'resident_manager',
    officeHours: '4PM–6PM M–Th, 3PM–5PM Fri, Closed Sat & Sun',
    properties: [
      { name: 'Sierra Apts', address: '4875 Clayton Road, Concord, CA 94521', units: 20 },
    ],
  },

  {
    email: 'tahoectapt@gmail.com',
    name: 'Sharon Katsuleres',
    phone: '925-302-3656',
    role: 'resident_manager',
    officeHours: '10AM–12PM, Closed Sun & Mon',
    properties: [
      { name: '57 Tahoe Court', address: '57 Tahoe Court, Walnut Creek, CA 94596', units: 10 },
      { name: '58 Tahoe Court', address: '58 Tahoe Court, Walnut Creek, CA 94596', units: 10 },
    ],
  },

  {
    email: 'tamaracapartments2016@gmail.com',
    name: 'Cynthia Cooper',
    phone: '925-548-0781',
    role: 'resident_manager',
    officeHours: '9AM–11AM, Closed Wed & Sun',
    properties: [
      { name: 'Tamarac Apts', address: '2016 Sierra Road, Concord, CA 94518', units: 25 },
    ],
  },

  {
    email: 'villagroveapts@gmail.com',
    name: 'Carolina Melgoza',
    phone: '510-507-9544',
    role: 'resident_manager',
    officeHours: '10AM–1PM, Closed Sun & Mon',
    properties: [
      { name: 'Villa Grove', address: '2481 Grove Way, Castro Valley, CA 94546', units: 28 },
    ],
  },

  {
    email: 'villaserena18@gmail.com',
    name: 'Akila Briggs',
    phone: '925-413-6508',
    role: 'resident_manager',
    officeHours: '9AM–5PM, Closed Wed & Sun',
    properties: [
      { name: 'Villa Serena', address: '100 Leland Lane, Pittsburg, CA 94565', units: 30 },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getOrInviteUser(email: string, name: string): Promise<string | null> {
  // 1. Try to invite — returns user ID immediately
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.VITE_APP_URL ?? 'http://localhost:5173'}/dashboard`,
    data: { contact_name: name },
  });

  if (!error && data?.user?.id) return data.user.id;

  // 2. Already registered — look up existing user by listing and filtering
  if (error?.status === 422 || error?.message?.toLowerCase().includes('already')) {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) { console.error('  listUsers error:', listErr.message); return null; }
    const found = list?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (found) { console.log(`  ↩  ${email} already invited — using existing ID`); return found.id; }
  }

  console.error(`  ✗  Could not invite ${email}:`, error?.message);
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  Castle Companies — Seeding users, profiles, and properties\n');

  let invited = 0, skipped = 0, failed = 0;

  for (const person of CASTLE_PEOPLE) {
    console.log(`→  ${person.name} <${person.email}>`);

    const userId = await getOrInviteUser(person.email, person.name);
    if (!userId) { failed++; continue; }

    // Upsert profile
    const { error: profileErr } = await admin.from('pm_profiles').upsert({
      id: userId,
      contact_name: person.name,
      phone: person.phone,
      sms_consent: false,
      onboarding_completed: false,
    }, { onConflict: 'id' });

    if (profileErr) {
      console.error(`   profile error: ${profileErr.message}`);
    }

    // Insert properties (skip duplicates by name + user_id)
    for (const prop of person.properties) {
      // Check if already exists to keep re-runs idempotent
      const { data: existing } = await admin
        .from('pm_properties')
        .select('id')
        .eq('user_id', userId)
        .eq('property_name', prop.name)
        .maybeSingle();

      if (existing) {
        console.log(`   ↩  "${prop.name}" already exists`);
        continue;
      }

      const { error: propErr } = await admin.from('pm_properties').insert({
        user_id: userId,
        property_name: prop.name,
        address: prop.address,
        unit_count: prop.units,
      });

      if (propErr) {
        console.error(`   property error (${prop.name}): ${propErr.message}`);
      } else {
        console.log(`   ✓  "${prop.name}"`);
      }
    }

    invited++;
    console.log('');
  }

  console.log('─'.repeat(50));
  console.log(`✅  Done — ${invited} users seeded, ${skipped} skipped, ${failed} failed`);
  console.log('   Invite emails sent to all new users.\n');
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err);
  process.exit(1);
});
