import { supabase } from '../utils/supabaseClient.js';

// Fetch all messages by conversation_id
export async function getChatHistoryByConversationId(req, res) {
  const { conversation_id } = req.query;
  if (!conversation_id) {
    return res.status(400).json({ error: 'Missing conversation_id parameter' });
  }

  const { data, error } = await supabase
    .from('messages_with_users')
    .select('*')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ messages: data });
}