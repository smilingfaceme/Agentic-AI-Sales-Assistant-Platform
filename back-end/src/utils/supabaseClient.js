import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL   || 'Your Supabase Url';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'You Supabase Key';
console.log(SUPABASE_URL) 
console.log(SUPABASE_KEY)
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
