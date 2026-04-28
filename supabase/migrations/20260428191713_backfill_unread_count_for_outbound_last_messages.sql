/*
  # Backfill unread_count for leads whose last message was outbound

  Fixes leads currently displaying as unread (bold) in the chat list when
  the most recent message was actually sent by the instance owner (either
  via BrainLead or via the phone outside BrainLead). The webhook previously
  preserved unread_count when fromMe=true; we now zero it in that scenario.

  1. Data Updates
    - For each lead, look at the most recent message in `messages` table
    - If the most recent message has direction='out', set unread_count=0
    - Leaves leads with last direction='in' untouched (preserves real unreads)

  2. Notes
    - Read-only on schema. No DDL changes.
    - Idempotent: running again with no inconsistent data is a no-op.
*/

UPDATE leads l
SET unread_count = 0
WHERE l.unread_count > 0
  AND EXISTS (
    SELECT 1
    FROM messages m
    WHERE m.lead_id = l.id
      AND m.created_at = (
        SELECT MAX(m2.created_at) FROM messages m2 WHERE m2.lead_id = l.id
      )
      AND m.direction = 'out'
  );