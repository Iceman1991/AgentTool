-- Add color column to timeline_events
ALTER TABLE public.timeline_events
  ADD COLUMN IF NOT EXISTS color text;
