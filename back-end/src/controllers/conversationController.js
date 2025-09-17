import { supabase } from '../utils/supabaseClient.js';

// Fetch conversations by product_id
export async function getConversationsByProductId(req, res) {
  const { product_id } = req.query;
  if (!product_id) {
    return res.status(400).json({ error: 'Missing product_id parameter' });
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('project_id', product_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ conversations: data });
}
