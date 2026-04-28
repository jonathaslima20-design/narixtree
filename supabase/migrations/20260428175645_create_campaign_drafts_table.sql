/*
  # Create campaign_drafts table

  Stores in-progress campaign creation state so users can navigate
  freely between wizard steps and resume after closing/refreshing.

  1. New Tables
    - `campaign_drafts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique - one active draft per user)
      - `payload` (jsonb, serializable form state)
      - `current_step` (smallint, current wizard step 0-3)
      - `max_step_reached` (smallint, highest step the user has visited)
      - `media_path` (text, storage path of uploaded media so it survives reload)
      - `media_type` (text)
      - `media_filename` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `campaign_drafts`
    - Users can only read/write their own drafts (auth.uid() = user_id)
    - Separate policies for SELECT, INSERT, UPDATE, DELETE

  3. Indexes
    - Unique index on user_id ensures only one active draft per user
*/

CREATE TABLE IF NOT EXISTS campaign_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step smallint NOT NULL DEFAULT 0,
  max_step_reached smallint NOT NULL DEFAULT 0,
  media_path text DEFAULT '',
  media_type text DEFAULT '',
  media_filename text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS campaign_drafts_user_id_uidx
  ON campaign_drafts(user_id);

ALTER TABLE campaign_drafts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_drafts' AND policyname = 'Users can view own draft'
  ) THEN
    CREATE POLICY "Users can view own draft"
      ON campaign_drafts FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_drafts' AND policyname = 'Users can insert own draft'
  ) THEN
    CREATE POLICY "Users can insert own draft"
      ON campaign_drafts FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_drafts' AND policyname = 'Users can update own draft'
  ) THEN
    CREATE POLICY "Users can update own draft"
      ON campaign_drafts FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_drafts' AND policyname = 'Users can delete own draft'
  ) THEN
    CREATE POLICY "Users can delete own draft"
      ON campaign_drafts FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;