import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        `Supabase environment variables missing. ` +
        `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "OK" : "Missing"}, ` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "OK" : "Missing"}`
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
