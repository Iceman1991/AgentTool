-- Run this in your Supabase SQL editor to add icon and size to map_pins
ALTER TABLE public.map_pins
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'map-pin',
  ADD COLUMN IF NOT EXISTS size text DEFAULT 'md';
