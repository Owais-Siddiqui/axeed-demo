-- ============================================================
-- FacilitiesDesk — Full Schema + Seed
-- Safe to re-run: uses IF NOT EXISTS + TRUNCATE before inserts.
-- ============================================================

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_accounts (
  id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email     TEXT NOT NULL UNIQUE,
  password  TEXT NOT NULL,
  role      TEXT NOT NULL,       -- 'admin' | 'customer' | 'worker'
  linked_id TEXT                 -- customer id or worker id (NULL for admin)
);

CREATE TABLE IF NOT EXISTS customers (
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

CREATE TABLE IF NOT EXISTS workers (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name    TEXT NOT NULL,
  skills       TEXT[] NOT NULL DEFAULT '{}',
  phone        TEXT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  open_tickets INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tickets (
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

CREATE TABLE IF NOT EXISTS ticket_events (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor      TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

-- ─── Permissions (no auth — anon full access) ─────────────────────────────────

ALTER TABLE user_accounts  DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers     DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers       DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets       DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events DISABLE ROW LEVEL SECURITY;

GRANT ALL ON user_accounts  TO anon;
GRANT ALL ON customers     TO anon;
GRANT ALL ON workers       TO anon;
GRANT ALL ON tickets       TO anon;
GRANT ALL ON ticket_events TO anon;

-- ─── Clear existing seed data (safe to re-run) ───────────────────────────────

TRUNCATE ticket_events, tickets, workers, customers, user_accounts CASCADE;

-- ─── Seed: User Accounts ─────────────────────────────────────────────────────

INSERT INTO user_accounts (id, email, password, role, linked_id) VALUES
  ('ua0',  'admin@facilitiesdesk.com',  'admin123',    'admin',    NULL),
  -- Customers (linked to customer ids c1–c10)
  ('ua1',  'ahmed.mansoori@email.com',  'ahmed123',    'customer', 'c1'),
  ('ua2',  'sara.ibrahim@email.com',    'sara123',     'customer', 'c2'),
  ('ua3',  'omar.farooq@email.com',     'omar123',     'customer', 'c3'),
  ('ua4',  'fatima.noor@email.com',     'fatima123',   'customer', 'c4'),
  ('ua5',  'rania.hassan@email.com',    'rania123',    'customer', 'c5'),
  ('ua6',  'yousef.zaabi@email.com',    'yousef123',   'customer', 'c6'),
  ('ua7',  'layla.mahmoud@email.com',   'layla123',    'customer', 'c7'),
  ('ua8',  'bilal.qureshi@email.com',   'bilal123',    'customer', 'c8'),
  ('ua9',  'mariam.ketbi@email.com',    'mariam123',   'customer', 'c9'),
  ('ua10', 'tariq.binzayed@email.com',  'tariq123',    'customer', 'c10'),
  -- Workers (linked to worker ids w1–w4)
  ('ua11', 'khalid@facilitiesdesk.com',   'khalid123',   'worker',   'w1'),
  ('ua12', 'hassan@facilitiesdesk.com',   'hassan123',   'worker',   'w2'),
  ('ua13', 'tariqw@facilitiesdesk.com',   'tariqw123',   'worker',   'w3'),
  ('ua14', 'mohammed@facilitiesdesk.com', 'mohammed123', 'worker',   'w4');

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
  ('w2', 'Hassan Ali',      ARRAY['electrical','hvac'],     '+971502222222', true,  5),
  ('w3', 'Tariq Saeed',     ARRAY['carpentry','general'],   '+971503333333', true,  1),
  ('w4', 'Mohammed Nasser', ARRAY['hvac','plumbing'],       '+971504444444', false, 0);

-- ─── Seed: Tickets ───────────────────────────────────────────────────────────

INSERT INTO tickets
  (id, ticket_ref, customer_email, worker_id, property, job_type, urgency, status,
   ai_summary, eta_description, location_notes, access_instructions, reported_via,
   resolution_notes, attachments, completion_photos,
   assigned_at, in_progress_at, done_at, created_at, updated_at)
VALUES

-- TKT-0001 | OPEN | high | plumbing | 5 days old → OVERDUE
(
  't1','TKT-0001','ahmed.mansoori@email.com',NULL,'Villa-12','plumbing','high','OPEN',
  'Burst pipe under kitchen sink causing active water leakage onto floor. Tenant reports water spreading to adjacent cabinet.',
  NULL,
  'Kitchen, under the sink cabinet on the left side',
  'Key with building security. Tenant available after 6pm.',
  'email',NULL,
  '[{"id":"a1","url":"https://placehold.co/600x400/fecaca/991b1b?text=Burst+Pipe","file_type":"image","label":"Burst pipe photo","uploaded_by":"Ahmed Al Mansoori","uploaded_at":"2026-03-11T08:00:00Z"},{"id":"a2","url":"https://placehold.co/600x400/fecaca/991b1b?text=Water+Damage","file_type":"image","label":"Water damage on floor","uploaded_by":"Ahmed Al Mansoori","uploaded_at":"2026-03-11T08:05:00Z"}]',
  '[]',
  NULL,NULL,NULL,
  '2026-03-11T08:00:00Z','2026-03-11T08:00:00Z'
),

-- TKT-0002 | ASSIGNED | medium | electrical
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

-- TKT-0003 | IN_PROGRESS | low | hvac
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

-- TKT-0004 | COMPLETED | low | carpentry
(
  't4','TKT-0004','fatima.noor@email.com','w3','Apt-C3','carpentry','low','COMPLETED',
  'Broken cabinet door hinge in master bedroom wardrobe. Door hanging loose and cannot be closed properly.',
  'Next business day',
  'Master bedroom, rightmost wardrobe door',
  'Tenant Fatima works mornings. Best time is after 1pm.',
  'manual',
  'Replaced both hinges on the wardrobe door. Door closes and locks properly. Tenant confirmed satisfied.',
  '[{"id":"a5","url":"https://placehold.co/600x400/e2e8f0/475569?text=Broken+Hinge","file_type":"image","label":"Broken hinge before repair","uploaded_by":"Fatima Noor","uploaded_at":"2026-03-11T09:00:00Z"}]',
  '[{"id":"a6","url":"https://placehold.co/600x400/86efac/166534?text=Fixed+Hinge","file_type":"image","label":"Repaired hinge after replacement","uploaded_by":"Tariq Saeed","uploaded_at":"2026-03-12T14:00:00Z"}]',
  '2026-03-11T09:15:00Z','2026-03-11T10:00:00Z','2026-03-12T14:00:00Z',
  '2026-03-11T09:00:00Z','2026-03-12T14:00:00Z'
),

-- TKT-0005 | ASSIGNED | high | plumbing
(
  't5','TKT-0005','rania.hassan@email.com','w1','Villa-08','plumbing','high','ASSIGNED',
  'Main bathroom drain completely blocked. Water backing up into shower and flooding bathroom floor.',
  'Within 4 hours',
  'Main bathroom, floor drain next to shower',
  'Spare key with neighbour in Villa 9. Tenant Rania reachable on WhatsApp.',
  'whatsapp',NULL,
  '[{"id":"a7","url":"https://placehold.co/600x400/fecaca/991b1b?text=Blocked+Drain","file_type":"image","label":"Blocked drain flooding","uploaded_by":"Rania Hassan","uploaded_at":"2026-03-13T08:45:00Z"}]',
  '[]',
  '2026-03-13T09:30:00Z',NULL,NULL,
  '2026-03-13T08:45:00Z','2026-03-13T09:30:00Z'
),

-- TKT-0006 | OPEN | medium | general | 3 days old → OVERDUE
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

-- TKT-0007 | IN_PROGRESS | high | electrical | fire hazard
(
  't7','TKT-0007','layla.mahmoud@email.com','w2','Villa-21','electrical','high','IN_PROGRESS',
  'Exposed wiring found in utility room behind washing machine. Wires frayed and touching wall. Potential fire hazard.',
  'Within 2 hours',
  'Utility room, behind the washing machine on the right wall',
  'Gate is always open. Layla is home. Mark as urgent on arrival.',
  'phone',NULL,
  '[{"id":"a9","url":"https://placehold.co/600x400/fecaca/991b1b?text=Exposed+Wiring","file_type":"image","label":"Exposed frayed wires","uploaded_by":"Layla Mahmoud","uploaded_at":"2026-03-11T07:00:00Z"},{"id":"a10","url":"https://placehold.co/600x400/fecaca/991b1b?text=Fire+Risk+Area","file_type":"image","label":"Scorched wall area near wiring","uploaded_by":"Layla Mahmoud","uploaded_at":"2026-03-11T07:05:00Z"}]',
  '[]',
  '2026-03-11T07:15:00Z','2026-03-13T08:00:00Z',NULL,
  '2026-03-11T07:00:00Z','2026-03-13T08:00:00Z'
),

-- TKT-0008 | COMPLETED | medium | hvac
(
  't8','TKT-0008','bilal.qureshi@email.com','w2','Apt-A2','hvac','medium','COMPLETED',
  'Heating unit making loud rattling noise during operation. Noise starts 10 minutes after turning on and persists.',
  'Within 24 hours',
  'Living room ceiling unit',
  'Bilal works remotely, home all day. Prefers morning visits.',
  'email',
  'Fan blade was loose causing vibration and rattling. Tightened blade assembly and lubricated motor bearings. Unit now operating quietly.',
  '[{"id":"a11","url":"https://placehold.co/600x400/e2e8f0/475569?text=HVAC+Unit","file_type":"image","label":"Noisy HVAC unit","uploaded_by":"Bilal Qureshi","uploaded_at":"2026-03-10T11:00:00Z"}]',
  '[{"id":"a12","url":"https://placehold.co/600x400/86efac/166534?text=Fixed+HVAC","file_type":"image","label":"Repaired fan assembly","uploaded_by":"Hassan Ali","uploaded_at":"2026-03-11T13:00:00Z"}]',
  '2026-03-10T11:30:00Z','2026-03-10T15:00:00Z','2026-03-11T13:00:00Z',
  '2026-03-10T11:00:00Z','2026-03-11T13:00:00Z'
),

-- TKT-0009 | OPEN | low | carpentry | 4 days old → OVERDUE
(
  't9','TKT-0009','mariam.ketbi@email.com',NULL,'Villa-55','carpentry','low','OPEN',
  'Wardrobe sliding door has come off its track in second bedroom. Door cannot be moved and is blocking access to wardrobe.',
  NULL,
  'Second bedroom, built-in wardrobe sliding door',
  'Call Mariam 1 hour before. Property has a dog — knock loudly.',
  'manual',NULL,
  '[{"id":"a13","url":"https://placehold.co/600x400/e2e8f0/475569?text=Wardrobe+Door","file_type":"image","label":"Sliding door off track","uploaded_by":"Mariam Al Ketbi","uploaded_at":"2026-03-12T14:00:00Z"}]',
  '[]',
  NULL,NULL,NULL,
  '2026-03-12T14:00:00Z','2026-03-12T14:00:00Z'
),

-- TKT-0010 | ASSIGNED | medium | plumbing
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
),

-- TKT-0011 | COMPLETED | low | general | 2 weeks ago
(
  't11','TKT-0011','ahmed.mansoori@email.com','w3','Villa-12','general','low','COMPLETED',
  'Window seal in living room cracked along the bottom edge, causing noticeable draft and minor water seepage during heavy rain.',
  'Within 2 business days',
  'Living room, large sliding window facing garden',
  'Ahmed available weekends and evenings. Gate always unlocked during daytime.',
  'whatsapp',
  'Removed old cracked seal and applied new EPDM weatherstrip along full window perimeter. Water-tested with hose — no leakage. Tenant satisfied.',
  '[{"id":"a15","url":"https://placehold.co/600x400/e2e8f0/475569?text=Cracked+Seal","file_type":"image","label":"Cracked window seal","uploaded_by":"Ahmed Al Mansoori","uploaded_at":"2026-02-28T09:00:00Z"}]',
  '[{"id":"a16","url":"https://placehold.co/600x400/86efac/166534?text=New+Seal+Applied","file_type":"image","label":"New weatherstrip installed","uploaded_by":"Tariq Saeed","uploaded_at":"2026-03-01T14:00:00Z"}]',
  '2026-02-28T10:00:00Z','2026-03-01T09:00:00Z','2026-03-01T14:00:00Z',
  '2026-02-28T09:00:00Z','2026-03-01T14:00:00Z'
),

-- TKT-0012 | OPEN | high | plumbing | yesterday
(
  't12','TKT-0012','sara.ibrahim@email.com',NULL,'Apt-B7','plumbing','high','OPEN',
  'Kitchen tap dripping heavily and cannot be turned off. Drip rate has increased over 24 hours. Tenant concerned about water bill and potential cabinet damage.',
  NULL,
  'Kitchen, main sink tap — both hot and cold sides dripping',
  'Sara is home all day. Prefers technician to call before arriving. Apartment on 7th floor, use elevator B.',
  'email',NULL,
  '[{"id":"a17","url":"https://placehold.co/600x400/fecaca/991b1b?text=Dripping+Tap","file_type":"image","label":"Heavy drip from kitchen tap","uploaded_by":"Sara Ibrahim","uploaded_at":"2026-03-15T14:00:00Z"}]',
  '[]',
  NULL,NULL,NULL,
  '2026-03-15T14:00:00Z','2026-03-15T14:00:00Z'
),

-- TKT-0013 | COMPLETED | medium | carpentry | 3 weeks ago
(
  't13','TKT-0013','omar.farooq@email.com','w3','Villa-34','carpentry','medium','COMPLETED',
  'Two kitchen cabinet doors warped and severely misaligned due to humidity. Doors will not close fully and gap allows pests to enter.',
  'Within 3 days',
  'Kitchen, upper cabinet row — second and fourth doors from the left',
  'Gate code is 4521. Omar works from home and is usually available.',
  'phone',
  'Planed down swollen door edges and readjusted all hinges. Applied wood sealant to prevent future warping. Both doors closing and latching correctly.',
  '[{"id":"a18","url":"https://placehold.co/600x400/e2e8f0/475569?text=Warped+Doors","file_type":"image","label":"Warped cabinet doors","uploaded_by":"Omar Farooq","uploaded_at":"2026-02-20T11:00:00Z"}]',
  '[{"id":"a19","url":"https://placehold.co/600x400/86efac/166534?text=Doors+Fixed","file_type":"image","label":"Cabinet doors after repair","uploaded_by":"Tariq Saeed","uploaded_at":"2026-02-22T15:00:00Z"}]',
  '2026-02-21T09:00:00Z','2026-02-22T09:00:00Z','2026-02-22T15:00:00Z',
  '2026-02-20T11:00:00Z','2026-02-22T15:00:00Z'
),

-- TKT-0014 | IN_PROGRESS | low | electrical
(
  't14','TKT-0014','fatima.noor@email.com','w2','Apt-C3','electrical','low','IN_PROGRESS',
  'Single wall socket in study room not working. Tenant confirms other sockets in the room work fine. Possibly a tripped internal RCCD or loose connection.',
  'Today afternoon',
  'Study room, double socket on the east wall behind the desk',
  'Fatima available after 1pm. Building entrance requires intercom buzz — call +971504567890 on arrival.',
  'whatsapp',NULL,
  '[{"id":"a20","url":"https://placehold.co/600x400/e2e8f0/475569?text=Dead+Socket","file_type":"image","label":"Non-functional wall socket","uploaded_by":"Fatima Noor","uploaded_at":"2026-03-14T10:00:00Z"}]',
  '[]',
  '2026-03-14T11:00:00Z','2026-03-15T10:00:00Z',NULL,
  '2026-03-14T10:00:00Z','2026-03-15T10:00:00Z'
),

-- TKT-0015 | IN_PROGRESS | high | hvac | total AC failure
(
  't15','TKT-0015','rania.hassan@email.com','w2','Villa-08','hvac','high','IN_PROGRESS',
  'Total AC failure across all three bedroom units simultaneously. No airflow or cooling. External compressor unit making grinding noise before shutting off. Home is currently unlivable in heat.',
  'Same day',
  'All bedroom units — master, second, and third bedrooms. External compressor unit on roof terrace.',
  'Spare key with neighbour Villa 9. Rania also available on site. Mark as urgent — tenant has infant child.',
  'phone',NULL,
  '[{"id":"a21","url":"https://placehold.co/600x400/fecaca/991b1b?text=AC+Failure","file_type":"image","label":"All AC units offline","uploaded_by":"Rania Hassan","uploaded_at":"2026-03-15T07:00:00Z"},{"id":"a22","url":"https://placehold.co/600x400/fecaca/991b1b?text=Compressor+Unit","file_type":"image","label":"Grinding compressor on roof","uploaded_by":"Rania Hassan","uploaded_at":"2026-03-15T07:10:00Z"}]',
  '[]',
  '2026-03-15T08:00:00Z','2026-03-15T11:00:00Z',NULL,
  '2026-03-15T07:00:00Z','2026-03-15T11:00:00Z'
),

-- TKT-0016 | COMPLETED | low | carpentry | last week
(
  't16','TKT-0016','yousef.zaabi@email.com','w3','Apt-D11','carpentry','low','COMPLETED',
  'Bathroom vanity cabinet shelf bracket snapped under weight. Shelf has collapsed inside the cabinet, contents damaged.',
  'Within 2 days',
  'Master bathroom, vanity cabinet — middle shelf bracket on left side',
  'Building management holds master key. Yousef works nights, visit must be after 12pm.',
  'whatsapp',
  'Removed broken bracket and installed heavy-duty replacement pair. Shelf re-levelled and load-tested. Tenant confirmed all contents returned and cabinet in good order.',
  '[{"id":"a23","url":"https://placehold.co/600x400/e2e8f0/475569?text=Broken+Bracket","file_type":"image","label":"Snapped shelf bracket","uploaded_by":"Yousef Al Zaabi","uploaded_at":"2026-03-05T13:00:00Z"}]',
  '[{"id":"a24","url":"https://placehold.co/600x400/86efac/166534?text=New+Brackets","file_type":"image","label":"New brackets installed","uploaded_by":"Tariq Saeed","uploaded_at":"2026-03-06T12:00:00Z"}]',
  '2026-03-06T09:00:00Z','2026-03-06T10:00:00Z','2026-03-06T12:00:00Z',
  '2026-03-05T13:00:00Z','2026-03-06T12:00:00Z'
),

-- TKT-0017 | ASSIGNED | medium | plumbing
(
  't17','TKT-0017','layla.mahmoud@email.com','w1','Villa-21','plumbing','medium','ASSIGNED',
  'Kitchen sink draining very slowly — full sink takes over 15 minutes to empty. Likely grease and debris buildup in drain pipe.',
  'Tomorrow morning',
  'Kitchen, sink drain — under the sink U-bend may also need clearing',
  'Gate always open. Layla is home most mornings. Afternoon visits require a call ahead.',
  'whatsapp',NULL,
  '[{"id":"a25","url":"https://placehold.co/600x400/e2e8f0/475569?text=Slow+Drain","file_type":"image","label":"Slow kitchen drain","uploaded_by":"Layla Mahmoud","uploaded_at":"2026-03-14T16:00:00Z"}]',
  '[]',
  '2026-03-15T09:00:00Z',NULL,NULL,
  '2026-03-14T16:00:00Z','2026-03-15T09:00:00Z'
),

-- TKT-0018 | OPEN | high | electrical | OVERDUE (>24 hrs, no worker)
(
  't18','TKT-0018','bilal.qureshi@email.com',NULL,'Apt-A2','electrical','high','OPEN',
  'Visible sparks emitting from master bedroom wall socket when devices are plugged in. Strong burnt plastic smell. Possible short circuit or overloaded circuit. Safety hazard — tenant has switched off main breaker.',
  NULL,
  'Master bedroom, double socket on wall opposite the bed',
  'Bilal is home all day. Main breaker is currently OFF — restore with care. Apartment 2nd floor, Silicon Heights lobby.',
  'phone',NULL,
  '[{"id":"a26","url":"https://placehold.co/600x400/fecaca/991b1b?text=Sparking+Socket","file_type":"image","label":"Sparking socket with burn marks","uploaded_by":"Bilal Qureshi","uploaded_at":"2026-03-14T22:00:00Z"},{"id":"a27","url":"https://placehold.co/600x400/fecaca/991b1b?text=Burnt+Smell+Area","file_type":"image","label":"Scorched socket surround","uploaded_by":"Bilal Qureshi","uploaded_at":"2026-03-14T22:05:00Z"}]',
  '[]',
  NULL,NULL,NULL,
  '2026-03-14T22:00:00Z','2026-03-14T22:00:00Z'
),

-- TKT-0019 | ASSIGNED | low | general
(
  't19','TKT-0019','mariam.ketbi@email.com','w3','Villa-55','general','low','ASSIGNED',
  'Long diagonal crack on exterior wall near garage entrance. Approximately 1.2 metres in length. Cosmetic at present but requires structural assessment before next rainy season.',
  'This week',
  'Exterior wall, left side of garage entrance — visible from driveway',
  'Call Mariam 1 hour before arrival. Dog will be secured indoors. Driveway access available.',
  'email',NULL,
  '[{"id":"a28","url":"https://placehold.co/600x400/e2e8f0/475569?text=Wall+Crack","file_type":"image","label":"Exterior wall crack near garage","uploaded_by":"Mariam Al Ketbi","uploaded_at":"2026-03-13T15:00:00Z"}]',
  '[]',
  '2026-03-14T09:00:00Z',NULL,NULL,
  '2026-03-13T15:00:00Z','2026-03-14T09:00:00Z'
),

-- TKT-0020 | COMPLETED | medium | hvac | last week
(
  't20','TKT-0020','tariq.binzayed@email.com','w2','Apt-F6','hvac','medium','COMPLETED',
  'AC unit in guest bedroom not responding to remote control. Unit powers on manually from wall switch but temperature and mode cannot be adjusted remotely.',
  'Within 2 days',
  'Guest bedroom, wall-mounted split unit above window',
  'Tariq available after 5pm weekdays. Building concierge has spare key for daytime access.',
  'email',
  'Diagnosed faulty infrared sensor board on the indoor unit. Replaced sensor PCB with OEM part. Remote control fully functional across all modes. Tested cooling, fan, and timer functions.',
  '[{"id":"a29","url":"https://placehold.co/600x400/e2e8f0/475569?text=AC+Remote+Issue","file_type":"image","label":"AC unit not responding to remote","uploaded_by":"Tariq Bin Zayed","uploaded_at":"2026-03-08T14:00:00Z"}]',
  '[{"id":"a30","url":"https://placehold.co/600x400/86efac/166534?text=Remote+Working","file_type":"image","label":"AC responding to remote after repair","uploaded_by":"Hassan Ali","uploaded_at":"2026-03-09T13:00:00Z"}]',
  '2026-03-09T09:00:00Z','2026-03-09T10:00:00Z','2026-03-09T13:00:00Z',
  '2026-03-08T14:00:00Z','2026-03-09T13:00:00Z'
);

-- ─── Seed: Ticket Events ─────────────────────────────────────────────────────

INSERT INTO ticket_events (id, ticket_id, event_type, actor, note, created_at) VALUES

  -- TKT-0001 (OPEN, overdue)
  ('e1',  't1',  'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: plumbing, Urgency: high.',                            '2026-03-11T08:01:00Z'),
  ('e2',  't1',  'NOTE',          'Manager',       'Called tenant. Water shutoff valve closed temporarily to stop leak. Awaiting worker assignment.',   '2026-03-11T08:30:00Z'),
  ('e3',  't1',  'NOTE',          'Manager',       'No available plumber today. Escalated for tomorrow morning slot. Tenant informed.',                 '2026-03-11T17:00:00Z'),
  ('e4',  't1',  'NOTE',          'Manager',       'Still unassigned — Khalid is at capacity. Checking if Mohammed can be reactivated for this job.',   '2026-03-13T09:00:00Z'),

  -- TKT-0002 (ASSIGNED)
  ('e5',  't2',  'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: electrical, Urgency: medium.',                         '2026-03-13T07:31:00Z'),
  ('e6',  't2',  'ASSIGNED',      'Manager',       'Assigned to Hassan Ali. ETA within 24 hours.',                                                     '2026-03-13T09:00:00Z'),
  ('e7',  't2',  'NOTE',          'Hassan Ali',    'On my way to site. Estimated arrival in 45 minutes.',                                               '2026-03-13T09:15:00Z'),
  ('e8',  't2',  'NOTE',          'Manager',       'Tenant Sara confirmed she is home and ready for technician.',                                       '2026-03-13T09:20:00Z'),

  -- TKT-0003 (IN_PROGRESS)
  ('e9',  't3',  'CREATED',       'System (AI)',   'Ticket created from WhatsApp message. Job type: hvac, Urgency: low.',                              '2026-03-12T10:01:00Z'),
  ('e10', 't3',  'ASSIGNED',      'Manager',       'Assigned to Hassan Ali. Scheduled for this afternoon.',                                            '2026-03-12T10:30:00Z'),
  ('e11', 't3',  'STATUS_CHANGE', 'Hassan Ali',    'Arrived on site. Filter is heavily blocked with dust. Cleaning filter now.',                        '2026-03-13T08:00:00Z'),
  ('e12', 't3',  'NOTE',          'Hassan Ali',    'Filter cleaned and reinstalled. Testing cooling performance. Will confirm fix in 30 minutes.',      '2026-03-13T08:45:00Z'),

  -- TKT-0004 (COMPLETED)
  ('e13', 't4',  'CREATED',       'Manager',       'Ticket created manually by manager after tenant called office.',                                    '2026-03-11T09:01:00Z'),
  ('e14', 't4',  'ASSIGNED',      'Manager',       'Assigned to Tariq Saeed. Visit scheduled for next morning.',                                       '2026-03-11T09:15:00Z'),
  ('e15', 't4',  'NOTE',          'Tariq Saeed',   'Tenant confirmed access for tomorrow at 10am.',                                                    '2026-03-11T14:00:00Z'),
  ('e16', 't4',  'STATUS_CHANGE', 'Tariq Saeed',   'On site. Both hinges cracked — replacing full set.',                                               '2026-03-12T10:00:00Z'),
  ('e17', 't4',  'COMPLETED',     'Tariq Saeed',   'Both hinges replaced. Door operates correctly. Tenant signed off on completion.',                   '2026-03-12T14:00:00Z'),

  -- TKT-0005 (ASSIGNED)
  ('e18', 't5',  'CREATED',       'System (AI)',   'Ticket created from WhatsApp. Job type: plumbing, Urgency: high.',                                 '2026-03-13T08:46:00Z'),
  ('e19', 't5',  'ASSIGNED',      'Manager',       'Assigned to Khalid Rashid as highest priority. ETA 4 hours.',                                      '2026-03-13T09:30:00Z'),
  ('e20', 't5',  'NOTE',          'Khalid Rashid', 'Confirmed with tenant. Heading to site now. Will need drain snake equipment.',                      '2026-03-13T09:45:00Z'),

  -- TKT-0006 (OPEN, overdue)
  ('e21', 't6',  'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: general, Urgency: medium.',                           '2026-03-13T09:16:00Z'),
  ('e22', 't6',  'NOTE',          'Manager',       'Noted tenant works nights. Scheduling visit for after 12pm tomorrow.',                              '2026-03-13T10:00:00Z'),
  ('e23', 't6',  'NOTE',          'Manager',       'Building management informed to ensure master key available for technician.',                       '2026-03-13T10:05:00Z'),
  ('e24', 't6',  'NOTE',          'Manager',       'Still unassigned. Tariq is on other jobs. Will prioritise tomorrow.',                               '2026-03-15T09:00:00Z'),

  -- TKT-0007 (IN_PROGRESS, fire hazard)
  ('e25', 't7',  'CREATED',       'System (AI)',   'Ticket created from phone call log. Job type: electrical, Urgency: high.',                         '2026-03-11T07:01:00Z'),
  ('e26', 't7',  'ASSIGNED',      'Manager',       'Marked critical. Assigned to Hassan Ali immediately.',                                              '2026-03-11T07:15:00Z'),
  ('e27', 't7',  'STATUS_CHANGE', 'Hassan Ali',    'On site. Wiring is exposed and dangerous. Isolated the circuit for safety.',                        '2026-03-13T08:00:00Z'),
  ('e28', 't7',  'NOTE',          'Hassan Ali',    'Parts ordered: new wiring sleeve and junction box. Arriving tomorrow. Tenant advised not to use utility room.', '2026-03-13T09:00:00Z'),
  ('e29', 't7',  'NOTE',          'Manager',       'Parts confirmed delivered to site. Hassan returning tomorrow to complete fix.',                     '2026-03-15T14:00:00Z'),

  -- TKT-0008 (COMPLETED)
  ('e30', 't8',  'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: hvac, Urgency: medium.',                              '2026-03-10T11:01:00Z'),
  ('e31', 't8',  'ASSIGNED',      'Manager',       'Assigned to Hassan Ali.',                                                                          '2026-03-10T11:30:00Z'),
  ('e32', 't8',  'STATUS_CHANGE', 'Hassan Ali',    'Visited site. Fan blade is loose. Need to order replacement part.',                                 '2026-03-10T15:00:00Z'),
  ('e33', 't8',  'COMPLETED',     'Hassan Ali',    'Fan blade tightened and motor lubricated. Unit running quietly. Job done.',                         '2026-03-11T13:00:00Z'),

  -- TKT-0009 (OPEN, overdue)
  ('e34', 't9',  'CREATED',       'Manager',       'Ticket logged manually after tenant called office.',                                                '2026-03-12T14:01:00Z'),
  ('e35', 't9',  'NOTE',          'Manager',       'Tenant unavailable until Friday. Scheduled for Friday 13 March AM.',                               '2026-03-12T14:30:00Z'),
  ('e36', 't9',  'NOTE',          'Manager',       'Tariq could not attend Friday — rescheduled to early next week. Tenant notified.',                  '2026-03-13T17:00:00Z'),

  -- TKT-0010 (ASSIGNED)
  ('e37', 't10', 'CREATED',       'System (AI)',   'Ticket created from WhatsApp. Job type: plumbing, Urgency: medium.',                               '2026-03-12T16:31:00Z'),
  ('e38', 't10', 'ASSIGNED',      'Manager',       'Assigned to Khalid Rashid. Visit booked for tomorrow morning.',                                     '2026-03-13T09:00:00Z'),
  ('e39', 't10', 'NOTE',          'Khalid Rashid', 'Tenant confirmed access via building concierge after 5pm. Will check thermostat and heating element.', '2026-03-13T09:30:00Z'),
  ('e40', 't10', 'NOTE',          'Manager',       'Second reported water heater issue for this unit. Flag for full replacement review after this job.', '2026-03-13T10:00:00Z'),

  -- TKT-0011 (COMPLETED, 2 weeks ago)
  ('e41', 't11', 'CREATED',       'System (AI)',   'Ticket created from WhatsApp message. Job type: general, Urgency: low.',                           '2026-02-28T09:01:00Z'),
  ('e42', 't11', 'ASSIGNED',      'Manager',       'Assigned to Tariq Saeed. Non-urgent — scheduled for next available slot.',                         '2026-02-28T10:00:00Z'),
  ('e43', 't11', 'STATUS_CHANGE', 'Tariq Saeed',   'On site. Seal is cracked along full bottom edge. Will replace with EPDM strip.',                   '2026-03-01T09:00:00Z'),
  ('e44', 't11', 'COMPLETED',     'Tariq Saeed',   'New weatherstrip applied. Hose-tested with no leakage detected. Tenant confirmed satisfied.',      '2026-03-01T14:00:00Z'),

  -- TKT-0012 (OPEN, yesterday)
  ('e45', 't12', 'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: plumbing, Urgency: high.',                            '2026-03-15T14:01:00Z'),
  ('e46', 't12', 'NOTE',          'Manager',       'Reviewed ticket. Khalid currently at capacity. Will assign first thing tomorrow morning.',          '2026-03-15T14:30:00Z'),

  -- TKT-0013 (COMPLETED, 3 weeks ago)
  ('e47', 't13', 'CREATED',       'System (AI)',   'Ticket created from phone call. Job type: carpentry, Urgency: medium.',                            '2026-02-20T11:01:00Z'),
  ('e48', 't13', 'ASSIGNED',      'Manager',       'Assigned to Tariq Saeed. Scheduled for Friday visit.',                                             '2026-02-21T09:00:00Z'),
  ('e49', 't13', 'STATUS_CHANGE', 'Tariq Saeed',   'Arrived on site. Both doors heavily swollen. Will plane and re-hang today.',                        '2026-02-22T09:00:00Z'),
  ('e50', 't13', 'COMPLETED',     'Tariq Saeed',   'Doors planed, hinges adjusted, sealant applied. All cabinet doors closing correctly. Job done.',    '2026-02-22T15:00:00Z'),

  -- TKT-0014 (IN_PROGRESS)
  ('e51', 't14', 'CREATED',       'System (AI)',   'Ticket created from WhatsApp. Job type: electrical, Urgency: low.',                                '2026-03-14T10:01:00Z'),
  ('e52', 't14', 'ASSIGNED',      'Manager',       'Assigned to Hassan Ali. Non-urgent — slotted into tomorrow morning round.',                        '2026-03-14T11:00:00Z'),
  ('e53', 't14', 'STATUS_CHANGE', 'Hassan Ali',    'On site. Socket has internal RCCD tripped. Checking for underlying cause before resetting.',        '2026-03-15T10:00:00Z'),

  -- TKT-0015 (IN_PROGRESS, urgent)
  ('e54', 't15', 'CREATED',       'System (AI)',   'Ticket created from inbound phone call. Job type: hvac, Urgency: high.',                           '2026-03-15T07:01:00Z'),
  ('e55', 't15', 'ASSIGNED',      'Manager',       'Critical — all AC units failed. Assigned to Hassan Ali. Override his schedule for this.',           '2026-03-15T08:00:00Z'),
  ('e56', 't15', 'STATUS_CHANGE', 'Hassan Ali',    'On site. External compressor capacitor has failed, taking down all indoor units. Part ordered.',    '2026-03-15T11:00:00Z'),
  ('e57', 't15', 'NOTE',          'Hassan Ali',    'Tenant has moved to in-laws temporarily. Part arriving tomorrow. Will complete repair first thing.', '2026-03-15T13:00:00Z'),

  -- TKT-0016 (COMPLETED, last week)
  ('e58', 't16', 'CREATED',       'System (AI)',   'Ticket created from WhatsApp. Job type: carpentry, Urgency: low.',                                 '2026-03-05T13:01:00Z'),
  ('e59', 't16', 'ASSIGNED',      'Manager',       'Assigned to Tariq Saeed. Scheduled for tomorrow afternoon.',                                       '2026-03-06T09:00:00Z'),
  ('e60', 't16', 'STATUS_CHANGE', 'Tariq Saeed',   'On site. Old bracket snapped clean — replacing with heavy-duty pair.',                              '2026-03-06T10:00:00Z'),
  ('e61', 't16', 'COMPLETED',     'Tariq Saeed',   'New brackets installed and load-tested. Shelf stable. Tenant confirmed contents restored.',         '2026-03-06T12:00:00Z'),

  -- TKT-0017 (ASSIGNED)
  ('e62', 't17', 'CREATED',       'System (AI)',   'Ticket created from WhatsApp. Job type: plumbing, Urgency: medium.',                               '2026-03-14T16:01:00Z'),
  ('e63', 't17', 'ASSIGNED',      'Manager',       'Assigned to Khalid Rashid. Scheduled for tomorrow morning.',                                       '2026-03-15T09:00:00Z'),
  ('e64', 't17', 'NOTE',          'Khalid Rashid', 'Confirmed with tenant. Will bring drain snake and chemical cleaner.',                               '2026-03-15T09:15:00Z'),

  -- TKT-0018 (OPEN, OVERDUE, high urgency)
  ('e65', 't18', 'CREATED',       'System (AI)',   'Ticket created from inbound phone call. Job type: electrical, Urgency: high.',                     '2026-03-14T22:01:00Z'),
  ('e66', 't18', 'NOTE',          'Manager',       'Reviewed overnight. Hassan and Khalid both at capacity. Assigning to Mohammed (reactivating) or escalating externally.', '2026-03-15T08:00:00Z'),
  ('e67', 't18', 'NOTE',          'Manager',       'Still unresolved. Bilal has shut off main breaker — apartment without power. Escalating to emergency contractor.', '2026-03-16T09:00:00Z'),

  -- TKT-0019 (ASSIGNED)
  ('e68', 't19', 'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: general, Urgency: low.',                              '2026-03-13T15:01:00Z'),
  ('e69', 't19', 'ASSIGNED',      'Manager',       'Assigned to Tariq Saeed for structural assessment this week.',                                      '2026-03-14T09:00:00Z'),
  ('e70', 't19', 'NOTE',          'Tariq Saeed',   'Reviewed photos. Looks cosmetic but will inspect in person to confirm no structural risk.',         '2026-03-14T09:30:00Z'),

  -- TKT-0020 (COMPLETED, last week)
  ('e71', 't20', 'CREATED',       'System (AI)',   'Ticket created from inbound email. Job type: hvac, Urgency: medium.',                              '2026-03-08T14:01:00Z'),
  ('e72', 't20', 'ASSIGNED',      'Manager',       'Assigned to Hassan Ali. Scheduled for tomorrow morning.',                                           '2026-03-09T09:00:00Z'),
  ('e73', 't20', 'STATUS_CHANGE', 'Hassan Ali',    'On site. IR sensor board on indoor unit is faulty. Replacing with OEM part.',                       '2026-03-09T10:00:00Z'),
  ('e74', 't20', 'COMPLETED',     'Hassan Ali',    'Sensor PCB replaced. Remote control working across all modes — cooling, fan, timer. Job done.',     '2026-03-09T13:00:00Z');
