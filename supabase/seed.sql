-- ============================================================================
-- SlugFound — Seed data (US 2.3)
--
-- Populates the database with a demo user and 12 sample items spanning all
-- categories and a mix of lost/found, so the listings pages have content
-- during development.
--
-- HOW TO RUN
-- 1. First sign up a demo user via the app (e.g. demo@ucsc.edu / Password1!)
-- 2. Look up the user's UUID in Supabase Studio: Auth → Users
-- 3. Replace the DEMO_USER_ID placeholder below with that UUID
-- 4. Paste the modified script into the Supabase SQL editor and run
-- ============================================================================

-- Replace this with the actual UUID of the demo user before running:
--   set local "slugfound.demo_user_id" = 'paste-uuid-here';
-- Or use a CTE pattern (cleaner for repeatable seeding):

with demo_user as (
  select id from public.profiles where email = 'demo@ucsc.edu' limit 1
)
insert into public.items (user_id, type, title, description, category, location, status, emoji)
select demo_user.id, t.type::public.item_type, t.title, t.description, t.category, t.location,
       t.status::public.item_status, t.emoji
from demo_user, (values
  -- Lost items ---------------------------------------------------------------
  ('lost',  'AirPods Pro (2nd Gen)',     'Left my AirPods Pro on a desk in the quiet section on the 3rd floor. White case, small scratch on the lid.', 'Electronics',     'McHenry Library',                'active',   '🎧'),
  ('lost',  'Blue North Face Jacket',    'Navy blue North Face fleece, size medium. Left it on a chair during dinner. Has initials on the inside tag.',  'Clothing',        'Stevenson Dining Hall',          'active',   '🧥'),
  ('lost',  'Student ID Card',           'Lost my UCSC student ID near the bus stop. Name: Jordan Kim, Class of 2026.',                                   'ID/Cards',        'Cowell / Stevenson Bus Stop',    'active',   '🪪'),
  ('lost',  'MacBook 65W Charger',       'USB-C 65W charger with a teal cable clip. Left it plugged into the wall by the window seats in Rm 155.',        'Electronics',     'Baskin Engineering',             'active',   '🔌'),
  ('lost',  'Hydro Flask (32oz)',        'Black 32oz Hydro Flask with a Golden Gate Bridge and a banana slug sticker.',                                   'Water Bottle',    'Kresge College',                 'active',   '🫙'),
  ('lost',  'Prescription Glasses',      'Round black-frame glasses in a brown faux-leather case. Desperately need them back.',                           'Personal Items',  'Oakes College',                  'resolved', '👓'),
  ('lost',  'Honda Car Keys',            'Honda key fob with a red lanyard and a mini rubber duck keychain. Two keys on the ring.',                       'Keys',            'Quarry Plaza',                   'active',   '🔑'),

  -- Found items --------------------------------------------------------------
  ('found', 'iPhone 14 (Black)',         'Found an iPhone 14 in a black case on a table in the dining hall after dinner. Screen has a small crack.',     'Electronics',     'Crown College',                  'active',   '📱'),
  ('found', 'UCSC Banana Slug Hoodie',   'Gray UCSC hoodie, size large, found on a bench. Has a small yellow banana slug graphic on the chest.',          'Clothing',        'Cowell College',                 'active',   '🐌'),
  ('found', 'Brown Leather Wallet',      'Brown bifold wallet found near the vending machines. Cards inside — handing them over unopened.',               'Personal Items',  'Baskin Engineering',             'active',   '👛'),
  ('found', 'Keychain with 3 Keys',      'Keys with a green carabiner clip and a small photo keychain. Left at the Quarry info desk.',                    'Keys',            'Quarry Plaza',                   'active',   '🗝️'),
  ('found', 'Biology 101 Textbook',      '"Campbell Biology" 12th edition found on a study table. Name "A. Patel" written inside front cover.',           'Books',           'Science & Engineering Library',  'claimed',  '📖')
) as t(type, title, description, category, location, status, emoji);
