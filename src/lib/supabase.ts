import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

// Module-level userId cache, updated by authStore on login/logout
let _userId: string | null = null;

export function setUserId(id: string | null) {
  _userId = id;
}

export function getUserId(): string {
  if (!_userId) throw new Error('Not authenticated');
  return _userId;
}
