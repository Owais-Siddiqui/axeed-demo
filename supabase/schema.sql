-- ============================================================
-- FacilitiesDesk — Full Schema + Seed
-- Run this entire file in the Supabase SQL Editor once.
-- ============================================================

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE customers (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name        TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  phone            TEXT NOT NULL,
  property_ref     TEXT NOT NULL,
  building_name    TEXT NOT NULL,
  floor            TEXT,
  unit_number      TEXT NOT NULL,
  area             TEXT NOT NULL,
  city             TEXT NOT NULL,
  emergency_contact TEXT,
  contract_expiry  DATE NOT NULL,
  preferred_contact TEXT NOT NULL
);

CREATE TABLE workers (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name    TEXT NOT NULL,
  skills       TEXT[] NOT NULL DEFAULT '{}',
  phone        TEXT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  open_tickets INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tickets (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ticket_ref           TEXT NOT NULL UNIQUE,
  customer_email       TEXT NOT NULL REFERENCES customers(email),
  worker_id            TEXT REFERENCES workers(id),
  property             TEXT NOT NULL,
  job_type             TEXT NOT NULL,
  urgency              TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'OPEN',
  ai_summary           TEXT NOT NULL DEFAULT '',
  eta_description      TEXT,
  location_notes       TEXT,
  access_instructions  TEXT,
  reported_via         TEXT NOT NULL,
  resolution_notes     TEXT,
  attachments          JSONB NOT NULL DEFAULT '[]',
  completion_photos    JSONB NOT NULL DEFAULT '[]',
  assigned_at          TIMESTAMPTZ,
  in_progress_at       TIMESTAMPTZ,
  done_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL,
  updated_at           TIMESTAMPTZ NOT NULL
);

CREATE TABLE ticket_events (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor      TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

-- ─── Permissions (no auth — anon full access) ─────────────────────────────────

ALTER TABLE customers     DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers       DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets       DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events DISABLE ROW LEVEL SECURITY;

GRANT ALL ON customers     TO anon;
GRANT ALL ON workers       TO anon;
GRANT ALL ON tickets       TO anon;
GRANT ALL ON ticket_events TO anon;

-- ─── Seed: Customers ─────────────────────────────────────────────────────────

INSERT INTO customers VALUES
  ('c1',  'Ahmed Al Mansoori', 'ahmed.mansoori@email.com',  '+971501234567', 'Villa-12',  'Al Reef Villas',        NULL,        'Villa 12',  'Khalifa City',         'Abu Dhabi', '+971509876543', '2026-12-31', 'whatsapp'),
  ('c2',  'Sara Ibrahim',      'sara.ibrahim@email.com',    '+971502345678', 'Apt-B7',    'The Greens Tower B',    '7th Floor', 'Apt B7',    'Al Barsha',            'Dubai',     NULL,            '2026-04-05', 'email'),
  ('c3',  'Omar Farooq',       'omar.farooq@email.com',     '+971503456789', 'Villa-34',  'Bloom Gardens',         NULL,        'Villa 34',  'Khalifa City',         'Abu Dhabi', '+971508765432', '2027-01-15', 'phone'),
  ('c4',  'Fatima Noor',       'fatima.noor@email.com',     '+971504567890', 'Apt-C3',    'Reva Residences',       '3rd Floor', 'Apt C3',    'Al Reem Island',       'Abu Dhabi', NULL,            '2026-03-28', 'whatsapp'),
  ('c5',  'Rania Hassan',      'rania.hassan@email.com',    '+971505678901', 'Villa-08',  'Mirdif Villas',         NULL,        'Villa 8',   'Mirdif',               'Dubai',     '+971507654321', '2026-09-30', 'email'),
  ('c6',  'Yousef Al Zaabi',   'yousef.zaabi@email.com',    '+971506789012', 'Apt-D11',   'Sharjah Gate Towers',   '11th Floor','Apt D11',   'Sharjah Al Majaz',     'Sharjah',   NULL,            '2026-07-20', 'phone'),
  ('c7',  'Layla Mahmoud',     'layla.mahmoud@email.com',   '+971507890123', 'Villa-21',  'Jumeirah Park Villas',  NULL,        'Villa 21',  'Jumeirah',             'Dubai',     '+971506543210', '2026-04-10', 'whatsapp'),
  ('c8',  'Bilal Qureshi',     'bilal.qureshi@email.com',   '+971508901234', 'Apt-A2',    'Silicon Heights',       '2nd Floor', 'Apt A2',    'Dubai Silicon Oasis',  'Dubai',     NULL,            '2027-03-01', 'email'),
  ('c9',  'Mariam Al Ketbi',   'mariam.ketbi@email.com',    '+971509012345', 'Villa-55',  'Al Nahda Gardens',      NULL,        'Villa 55',  'Al Nahda',             'Sharjah',   '+971505432109', '2026-11-15', 'phone'),
  ('c10', 'Tariq Bin Zayed',   'tariq.binzayed@email.com',  '+971500123456', 'Apt-F6',    'Bloom Heights',         '6th Floor', 'Apt F6',    'Al Reem Island',       'Abu Dhabi', NULL,            '2026-08-22', 'whatsapp');

-- ─── Seed: Workers ───────────────────────────────────────────────────────────

INSERT INTO workers VALUES
  ('w1', 'Khalid Rashid',   ARRAY['plumbing','general'],    '+971501111111', true,  3),
  ('w2', 'Hassan Ali',      ARRAY['electrical','hvac'],     '+971502222222', true,  2),
  ('w3', 'Tariq Saeed',     ARRAY['carpentry','general'],   '+971503333333', true,  1),
  ('w4', 'Mohammed Nasser', ARRAY['hvac','plumbing'],       '+971504444444', false, 0);

-- ─── Seed: Tickets ───────────────────────────────────────────────────────────

INSERT INTO tickets
  (id, ticket_ref, customer_email, worker_id, property, job_type, urgency, status,
   ai_summary, eta_description, location_notes, access_instructions, reported_via,
   resolution_notes, attachments, completion_photos,
   assigned_at, in_progress_at, done_at, created_at, updated_at)
VALUES
(
  't1','TKT-0001','ahmed.mansoori@email.com',NULL,'Villa-12','plumbing','high','OPEN',
  'Burst pipe under kitchen sink causing active water leakage onto floor. Tenant reports water spreading to adjacent cabinet.',
  NULL,
  'Kitchen, under the sink cabinet on the left side',
  'Key with building security. Tenant available after 6pm.',
  'email',NULL,
  '[{"id":"a1","url":"https://placehold.co/600x400/e2e8f0/475569?text=Burst+Pipe","file_type":"image","label":"Burst pipe photo","uploaded_by":"Ahmed Al Mansoori","uploaded_at":"2026-03-11T08:00:00Z"},{"id":"a2","url":"https://placehold.co/600x400/e2e8f0/475569?text=Water+Damage","file_type":"image","label":"Water damage on floor","uploaded_by":"Ahmed Al Mansoori","uploaded_at":"2026-03-11T08:05:00Z"}]',
  '[]',
  NULL,NULL,NULL,
  '2026-03-11T08:00:00Z','2026-03-11T08:00:00Z'
),
(
  't2','TKT-0002','sara.ibrahim@email.com','w2','Apt-B7','electrical','medium','ASSIGNED',
  'Power outage in bedroom and living room. Circuit breaker trips every time lights are switched on in those rooms.',
  'Within 24 hours',
  'Fuse box is in the utility closet near the entrance',
  'Tenant Sara works from home, available any time. Call ahead 30 mins.',
  'email',NULL,
  '[{"id":"a3","url":"https://placehold.co/600x400/e2e8f0/475569?text=Fuse+Box","file_type":"image","label":"Tripped circuit breaker","uploaded_by":"Sara Ibrahim","uploaded_at":"2026-03-13T07:30:00Z"}]',
  '[]',
  '2026-03-13T09:00:00Z',NULL,NULL,
  '2026-03-13T07:30:00Z','2026-03-13T09:00:00Z'
),
(
  't3','TKT-0003','omar.farooq@email.com','w2','Villa-34','hvac','low','IN_PROGRESS',
  'AC unit in master bedroom not cooling effectively. Room temperature stays above 28°C even on full blast. Filter likely blocked.',
  'Today afternoon',
  'Master bedroom, wall-mounted unit above wardrobe',
  'Gate code is 4521. Tenant Omar is home all day.',
  'whatsapp',NULL,
  '[{"id":"a4","url":"https://placehold.co/600x400/e2e8f0/475569?text=AC+Unit","file_type":"image","label":"AC unit master bedroom","uploaded_by":"Omar Farooq","uploaded_at":"2026-03-12T10:00:00Z"}]',
  '[]',
  '2026-03-12T10:30:00Z','2026-03-13T08:00:00Z',NULL,
  '2026-03-12T10:00:00Z','2026-03-13T08:00:00Z'
),
(
  't4','TKT-0004','fatima.noor@email.com','w3','Apt-C3','carpentry','low','COMPLETED',
  'Broken cabinet door hinge in master bedroom wardrobe. Door hanging loose and cannot be closed properly.',
  'Next business day',
  'Master bedroom, rightmost wardrobe door',
  'Tenant Fatima works mornings. Best time is after 1pm.',
  'manual',
  'Replaced both hinges on the wardrobe door. Door closes and locks properly. Tenant confirmed satisfied.',
  '[{"id":"a5","url":"https://placehold.co/600x400/e2e8f0/475569?text=Broken+Hinge","file_type":"image","label":"Broken hinge before repair","uploaded_by":"Fatima Noor","uploaded_at":"2026-03-11T09:00:00Z"}]',
  '[{"id":"a6","url":"https://placehold.co/600x400/94a3b8/ffffff?text=Fixed+Hinge","file_type":"image","label":"Repaired hinge","uploaded_by":"Tariq Saeed","uploaded_at":"2026-03-12T14:00:00Z"}]',
  '2026-03-11T09:15:00Z','2026-03-11T10:00:00Z','2026-03-12T14:00:00Z',
  '2026-03-11T09:00:00Z','2026-03-12T14:00:00Z'
),
(
  't5','TKT-0005','rania.hassan@email.com','w1','Villa-08','plumbing','high','ASSIGNED',
  'Main bathroom drain completely blocked. Water backing up into shower and flooding bathroom floor.',
  'Within 4 hours',
  'Main bathroom, floor drain next to shower',
  'Spare key with neighbour in Villa 9. Tenant Rania reachable on WhatsApp.',
  'whatsapp',NULL,
  '[{"id":"a7","url":"https://placehold.co/600x400/e2e8f0/475569?text=Blocked+Drain","file_type":"image","label":"Blocked drain flooding","uploaded_by":"Rania Hassan","uploaded_at":"2026-03-13T08:45:00Z"}]',
  '[]',
  '2026-03-13T09:30:00Z',NULL,NULL,
  '2026-03-13T08:45:00Z','2026-03-13T09:30:00Z'
),
(
  't6','TKT-0006','yousef.zaabi@email.com',NULL,'Apt-D11','general','medium','OPEN',
  'Front door lock jammed. Tenant unable to lock from outside. Security risk as unit on 11th floor facing main corridor.',
  NULL,
  'Main entrance door, deadbolt mechanism',
  'Building management has master key. Yousef works nights, do not visit before 12pm.',
  'email',NULL,
  '[{"id":"a8","url":"https://placehold.co/600x400/e2e8f0/475569?text=Door+Lock","file_type":"image","label":"Jammed door lock","uploaded_by":"Yousef Al Zaabi","uploaded_at":"2026-03-13T09:15:00Z"}]',
  '[]',
  NULL,NULL,NULL,
  '2026-03-13T09:15:00Z','2026-03-13T09:15:00Z'
),
(
  't7','TKT-0007','layla.mahmoud@email.com','w2','Villa-21','electrical','high','IN_PROGRESS',
  'Exposed wiring found in utility room behind washing machine. Wires frayed and touching wall. Potential fire hazard.',
  'Within 2 hours',
  'Utility room, behind the washing machine on the right wall',
  'Gate is always open. Layla is home. Mark as urgent on arrival.',
  'phone',NULL,
  '[{"id":"a9","url":"https://placehold.co/600x400/fecaca/991b1b?text=Exposed+Wiring","file_type":"image","label":"Exposed frayed wires","uploaded_by":"Layla Mahmoud","uploaded_at":"2026-03-11T07:00:00Z"},{"id":"a10","url":"https://placehold.co/600x400/fecaca/991b1b?text=Fire+Risk+Area","file_type":"image","label":"Area near wiring","uploaded_by":"Layla Mahmoud","uploaded_at":"2026-03-11T07:05:00Z"}]',
  '[]',
  '2026-03-11T07:15:00Z','2026-03-13T08:00:00Z',NULL,
  '2026-03-11T07:00:00Z','2026-03-13T08:00:00Z'
),
(
  't8','TKT-0008','bilal.qureshi@email.com','w2','Apt-A2','hvac','medium','COMPLETED',
  'Heating unit making loud rattling noise during operation. Noise starts 10 minutes after turning on and persists.',
  'Within 24 hours',
  'Living room ceiling unit',
  'Bilal works remotely, home all day. Prefers morning visits.',
  'email',
  'Fan blade was loose causing vibration and rattling. Tightened blade assembly and lubricated motor bearings. Unit now operating quietly.',
  '[{"id":"a11","url":"https://placehold.co/600x400/e2e8f0/475569?text=HVAC+Unit","file_type":"image","label":"Noisy HVAC unit","uploaded_by":"Bilal Qureshi","uploaded_at":"2026-03-10T11:00:00Z"}]',
  '[{"id":"a12","url":"https://placehold.co/600x400/94a3b8/ffffff?text=Fixed+HVAC","file_type":"image","label":"Repaired fan assembly","uploaded_by":"Hassan Ali","uploaded_at":"2026-03-11T13:00:00Z"}]',
  '2026-03-10T11:30:00Z','2026-03-10T15:00:00Z','2026-03-11T13:00:00Z',
  '2026-03-10T11:00:00Z','2026-03-11T13:00:00Z'
),
(
  't9','TKT-0009','mariam.ketbi@email.com',NULL,'Villa-55','carpentry','low','OPEN',
  'Wardrobe sliding door has come off its track in second bedroom. Door cannot be moved and is blocking access to wardrobe.',
  NULL,
  'Second bedroom, built-in wardrobe sliding door',
  'Call Mariam 1 hour before. Property has a dog — knock loudly.',
  'manual',NULL,
  '[{"id":"a13","url":"https://placehold.co/600x400/e2e8f0/475569?text=Wardrobe+Door","file_type":"image","label":"Door off track","uploaded_by":"Mariam Al Ketbi","uploaded_at":"2026-03-12T14:00:00Z"}]',
  '[]',
  NULL,NULL,NULL,
  '2026-03-12T14:00:00Z','2026-03-12T14:00:00Z'
),
(
  't10','TKT-0010','tariq.binzayed@email.com','w1','Apt-F6','plumbing','medium','ASSIGNED',
  'Water heater not producing consistent hot water. Water runs warm for 2 minutes then turns cold. Issue recurring since last month.',
  'Tomorrow morning',
  'Utility cupboard next to bathroom, white tank unit',
  'Tariq is available after 5pm weekdays. Building concierge has spare key.',
  'whatsapp',NULL,
  '[{"id":"a14","url":"https://placehold.co/600x400/e2e8f0/475569?text=Water+Heater","file_type":"image","label":"Water heater unit","uploaded_by":"Tariq Bin Zayed","uploaded_at":"2026-03-12T16:30:00Z"}]',
  '[]',
  '2026-03-13T09:00:00Z',NULL,NULL,
  '2026-03-12T16:30:00Z','2026-03-13T09:00:00Z'
);

-- ─── Seed: Ticket Events ─────────────────────────────────────────────────────

INSERT INTO ticket_events (id, ticket_id, event_type, actor, note, created_at) VALUES
  -- TKT-0001
  ('e1',  't1',  'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: plumbing, Urgency: high.',      '2026-03-11T08:01:00Z'),
  ('e2',  't1',  'NOTE',          'Manager',       'Called tenant. Water shutoff valve closed temporarily to stop leak. Awaiting worker assignment.', '2026-03-11T08:30:00Z'),
  ('e3',  't1',  'NOTE',          'Manager',       'No available plumber today. Escalated for tomorrow morning slot. Tenant informed.', '2026-03-11T17:00:00Z'),
  -- TKT-0002
  ('e4',  't2',  'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: electrical, Urgency: medium.',   '2026-03-13T07:31:00Z'),
  ('e5',  't2',  'ASSIGNED',      'Manager',       'Assigned to Hassan Ali. ETA within 24 hours.',                                '2026-03-13T09:00:00Z'),
  ('e6',  't2',  'NOTE',          'Hassan Ali',    'On my way to site. Estimated arrival in 45 minutes.',                         '2026-03-13T09:15:00Z'),
  ('e7',  't2',  'NOTE',          'Manager',       'Tenant Sara confirmed she is home and ready for technician.',                  '2026-03-13T09:20:00Z'),
  -- TKT-0003
  ('e8',  't3',  'CREATED',       'System (AI)',   'Ticket created from WhatsApp message. Job type: hvac, Urgency: low.',         '2026-03-12T10:01:00Z'),
  ('e9',  't3',  'ASSIGNED',      'Manager',       'Assigned to Hassan Ali. Scheduled for this afternoon.',                       '2026-03-12T10:30:00Z'),
  ('e10', 't3',  'STATUS_CHANGE', 'Hassan Ali',    'Arrived on site. Filter is heavily blocked. Cleaning filter now.',             '2026-03-13T08:00:00Z'),
  ('e11', 't3',  'NOTE',          'Hassan Ali',    'Filter cleaned. Testing cooling performance. Will confirm fix in 30 minutes.', '2026-03-13T08:45:00Z'),
  -- TKT-0004
  ('e12', 't4',  'CREATED',       'Manager',       'Ticket created manually by manager.',                                         '2026-03-11T09:01:00Z'),
  ('e13', 't4',  'ASSIGNED',      'Manager',       'Assigned to Tariq Saeed. Visit scheduled for next morning.',                  '2026-03-11T09:15:00Z'),
  ('e14', 't4',  'NOTE',          'Tariq Saeed',   'Tenant confirmed access for tomorrow at 10am.',                               '2026-03-11T14:00:00Z'),
  ('e15', 't4',  'COMPLETED',     'Tariq Saeed',   'Both hinges replaced. Door operates correctly. Tenant signed off on completion.', '2026-03-12T14:00:00Z'),
  -- TKT-0005
  ('e16', 't5',  'CREATED',       'System (AI)',   'Ticket created from WhatsApp. Job type: plumbing, Urgency: high.',            '2026-03-13T08:46:00Z'),
  ('e17', 't5',  'ASSIGNED',      'Manager',       'Assigned to Khalid Rashid as highest priority. ETA 4 hours.',                 '2026-03-13T09:30:00Z'),
  ('e18', 't5',  'NOTE',          'Khalid Rashid', 'Confirmed with tenant. Heading to site now. Will need drain snake equipment.', '2026-03-13T09:45:00Z'),
  -- TKT-0006
  ('e19', 't6',  'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: general, Urgency: medium.',      '2026-03-13T09:16:00Z'),
  ('e20', 't6',  'NOTE',          'Manager',       'Noted tenant works nights. Scheduling visit for after 12pm tomorrow.',        '2026-03-13T10:00:00Z'),
  ('e21', 't6',  'NOTE',          'Manager',       'Building management informed to ensure master key is available for technician.', '2026-03-13T10:05:00Z'),
  -- TKT-0007
  ('e22', 't7',  'CREATED',       'System (AI)',   'Ticket created from phone call log. Job type: electrical, Urgency: high.',    '2026-03-11T07:01:00Z'),
  ('e23', 't7',  'ASSIGNED',      'Manager',       'Marked critical. Assigned to Hassan Ali immediately.',                        '2026-03-11T07:15:00Z'),
  ('e24', 't7',  'STATUS_CHANGE', 'Hassan Ali',    'On site. Wiring is exposed and dangerous. Isolated the circuit for safety.',   '2026-03-13T08:00:00Z'),
  ('e25', 't7',  'NOTE',          'Hassan Ali',    'Parts needed: new wiring sleeve and junction box. Ordered, arriving tomorrow.', '2026-03-13T09:00:00Z'),
  -- TKT-0008
  ('e26', 't8',  'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: hvac, Urgency: medium.',         '2026-03-10T11:01:00Z'),
  ('e27', 't8',  'ASSIGNED',      'Manager',       'Assigned to Hassan Ali.',                                                     '2026-03-10T11:30:00Z'),
  ('e28', 't8',  'NOTE',          'Hassan Ali',    'Visited site. Fan blade is loose. Need to order replacement part.',            '2026-03-10T15:00:00Z'),
  ('e29', 't8',  'COMPLETED',     'Hassan Ali',    'Fan blade tightened and motor lubricated. Unit running quietly. Job done.',    '2026-03-11T13:00:00Z'),
  -- TKT-0009
  ('e30', 't9',  'CREATED',       'Manager',       'Ticket logged manually after tenant called office.',                          '2026-03-12T14:01:00Z'),
  ('e31', 't9',  'NOTE',          'Manager',       'Tenant unavailable this week until Friday. Scheduled for Fri 13 March AM.',   '2026-03-12T14:30:00Z'),
  ('e32', 't9',  'NOTE',          'Manager',       'Reminded Tariq Saeed to bring sliding door track kit for this job.',          '2026-03-13T08:00:00Z'),
  -- TKT-0010
  ('e33', 't10', 'CREATED',       'System (AI)',   'Ticket created from WhatsApp. Job type: plumbing, Urgency: medium.',          '2026-03-12T16:31:00Z'),
  ('e34', 't10', 'ASSIGNED',      'Manager',       'Assigned to Khalid Rashid. Visit booked for tomorrow morning.',               '2026-03-13T09:00:00Z'),
  ('e35', 't10', 'NOTE',          'Khalid Rashid', 'Tenant confirmed access via building concierge after 5pm. Will check thermostat and heating element.', '2026-03-13T09:30:00Z'),
  ('e36', 't10', 'NOTE',          'Manager',       'This is the second time this unit has had water heater issues. Flag for full replacement review.', '2026-03-13T10:00:00Z');
