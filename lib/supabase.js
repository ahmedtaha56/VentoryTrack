import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://kyuvalroqvzazxtynans.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dXZhbHJvcXZ6YXp4dHluYW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjgxMjUsImV4cCI6MjA4MzYwNDEyNX0.-wQqmtprlkCRJbm-08GC47TTqDeSsxsnAuLnmDnVhfg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

