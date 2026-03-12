-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.campaign_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid,
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL
);

ALTER TABLE public.campaign_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own maps" ON public.campaign_maps
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.map_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid,
  map_id uuid REFERENCES public.campaign_maps(id) ON DELETE CASCADE,
  x float NOT NULL,
  y float NOT NULL,
  label text NOT NULL DEFAULT '',
  description text,
  color text DEFAULT '#C49A4A',
  type text DEFAULT 'custom',
  target_id uuid,
  created_at bigint NOT NULL,
  updated_at bigint NOT NULL
);

ALTER TABLE public.map_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pins" ON public.map_pins
  FOR ALL USING (auth.uid() = user_id);
