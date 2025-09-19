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

// Fetch conversations by product_id
export async function sendMessagetoUserandBot(req, res) {
  const { conversation_id, content, sender_type } = req.body;
  const userid = req.user.sub
  const useremail = req.user.email
  if (!conversation_id || !content) {
    return res.status(400).json({ error: 'Missing conversation_id and content' });
  }

  let sender_id = null
  if (sender_type == "agent") {
    sender_id = userid
  }
  const { data, error } = await supabase
    .from('messages')
    .insert([
      { conversation_id, sender_type, sender_id, content }
    ])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: { ...data[0], user_id: userid, email: useremail }});
}