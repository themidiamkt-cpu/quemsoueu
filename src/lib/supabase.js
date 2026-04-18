import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (str) => !str || str.includes('your-project-url') || str.includes('your-anon-key');

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
    console.error('Supabase credentials are still placeholders! Update your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
