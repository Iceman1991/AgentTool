-- Add timeline_id column so each event belongs to a specific timeline
ALTER TABLE public.timeline_events
  ADD COLUMN IF NOT EXISTS "timelineId" text;
