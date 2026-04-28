/*
  # Normalize existing lead phone numbers

  1. Changes
    - Backfills phone numbers missing country code (55) and/or 9th digit
    - Handles 3 cases:
      a) 10-digit numbers (DDD + 8 digits): adds 55 + inserts 9 for mobile
      b) 11-digit numbers (DDD + 9 + 8 digits): adds 55 prefix
      c) 12-digit numbers (55 + DDD + 8 digits): inserts 9 for mobile
    - Only modifies numeric phones (not lid: contacts)
    - Uses conflict-safe approach: skips if normalized phone already exists for same user

  2. Important Notes
    - Does NOT delete or drop any data
    - Only updates phone column on leads with short/unnormalized phones
    - Skips updates that would create duplicate (user_id, phone) pairs
*/

-- Case A: 10-digit numbers without country code, mobile (first digit after DDD is 6-9)
-- e.g. 6599605454 -> 5565996054545 (55 + DDD + 9 + subscriber)
UPDATE leads
SET phone = '55' || substring(phone from 1 for 2) || '9' || substring(phone from 3),
    updated_at = now()
WHERE phone ~ '^\d{10}$'
  AND substring(phone from 3 for 1) ~ '[6-9]'
  AND NOT EXISTS (
    SELECT 1 FROM leads l2
    WHERE l2.user_id = leads.user_id
      AND l2.phone = '55' || substring(leads.phone from 1 for 2) || '9' || substring(leads.phone from 3)
      AND l2.id != leads.id
  );

-- Case A2: 10-digit numbers without country code, landline (first digit after DDD is 0-5)
-- e.g. 1133334444 -> 551133334444 (just add 55)
UPDATE leads
SET phone = '55' || phone,
    updated_at = now()
WHERE phone ~ '^\d{10}$'
  AND substring(phone from 3 for 1) ~ '[0-5]'
  AND NOT EXISTS (
    SELECT 1 FROM leads l2
    WHERE l2.user_id = leads.user_id
      AND l2.phone = '55' || leads.phone
      AND l2.id != leads.id
  );

-- Case B: 11-digit numbers without country code (DDD + 9 + 8 digits)
-- e.g. 51998583050 -> 5551998583050
UPDATE leads
SET phone = '55' || phone,
    updated_at = now()
WHERE phone ~ '^\d{11}$'
  AND substring(phone from 3 for 1) ~ '[6-9]'
  AND NOT EXISTS (
    SELECT 1 FROM leads l2
    WHERE l2.user_id = leads.user_id
      AND l2.phone = '55' || leads.phone
      AND l2.id != leads.id
  );

-- Case C: 12-digit numbers with country code but missing 9th digit (55 + DDD + 8 mobile digits)
-- e.g. 559183547174 -> 5591983547174
UPDATE leads
SET phone = '55' || substring(phone from 3 for 2) || '9' || substring(phone from 5),
    updated_at = now()
WHERE phone ~ '^55\d{10}$'
  AND substring(phone from 5 for 1) ~ '[6-9]'
  AND NOT EXISTS (
    SELECT 1 FROM leads l2
    WHERE l2.user_id = leads.user_id
      AND l2.phone = '55' || substring(leads.phone from 3 for 2) || '9' || substring(leads.phone from 5)
      AND l2.id != leads.id
  );
