import { supabase } from '../utils/supabaseClient.js';

// Fetch conversations by product_id
export async function getConversationsByProductId(req, res) {
  const { project_id } = req.query;
  if (!project_id) {
    return res.status(400).json({ error: 'Missing product_id parameter' });
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('project_id', project_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ conversations: data });
}

// Fetch all unanswered questions
export async function getUnansweredQuestions(req, res) {

  const { data, error } = await supabase
    .rpc('get_last_unanswered_messages')

  if (error) {
    console.error('Error fetching last unanswered messages:', error)
    return []
  }

  return res.status(200).json({ messages: data });
}
