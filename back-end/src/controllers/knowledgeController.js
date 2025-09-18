import { supabase } from '../utils/supabaseClient.js';

// Fetch all files by project_id
export async function getFileListByProjectId(req, res) {
  const { project_id } = req.query;
  const { data, error } = await supabase
    .storage
    .from('knowledges')
    .list(`${project_id}`, {
      limit: 100,
      offset: 0,
    })
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ knowledges: data });
}


export async function uploadFileByProjectId(req, res) {
  const { project_id } = req.query;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  
  if (!project_id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }
  
  const fileName = `${file.originalname}`;
  
  const { data, error } = await supabase
    .storage
    .from('knowledges')
    .upload(`${project_id}/${fileName}`, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ 
    message: 'File uploaded successfully',
    data: data 
  });
}
