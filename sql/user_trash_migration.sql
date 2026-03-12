-- Run this in your Supabase SQL editor (Settings → SQL Editor)
-- Creates the user_trash table for the Admin soft-delete feature

CREATE TABLE IF NOT EXISTS public.user_trash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  email text,
  created_at_original text,
  deleted_at bigint NOT NULL,
  deleted_by_id text
);

-- This table is only accessed via service role key (admin API),
-- so we disable RLS (or allow no direct user access).
ALTER TABLE public.user_trash ENABLE ROW LEVEL SECURITY;

-- No user-facing policies — only the service role (admin.js) can access this table.
