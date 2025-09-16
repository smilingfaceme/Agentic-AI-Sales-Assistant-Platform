// Project model functions for Supabase
import { supabase } from '../utils/supabaseClient.js';

export async function createProject({ user_id, name, description }) {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      { user_id, name, description }
    ])
    .select();

  return { data, error };
}

export async function getProjectsByUserId(user_id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user_id);
  return { data, error };
}
