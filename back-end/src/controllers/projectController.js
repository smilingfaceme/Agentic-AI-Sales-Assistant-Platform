import { createProject, getProjectsByUserId } from '../models/project.js';

export async function createProjectController(req, res) {
  const {name, description } = req.body;
  const user_id = req.user.sub;
  if (!user_id || !name || !description) {
    return res.status(400).json({ error: 'user_id and description are required' });
  }
  const { data, error } = await createProject({ user_id, name, description });
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json({ project: data[0] });
}

export async function getProjectsByUserIdController(req, res) {
  const user_id = req.user.sub;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  const { data, error } = await getProjectsByUserId(user_id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ projects: data });
}
