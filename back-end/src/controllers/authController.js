
import { supabase } from '../utils/supabaseClient.js';

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name and email, password required.' });
  }
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { display_name: name } // goes into user_metadata
    }
  })
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  res.status(201).json({ message: 'User registered successfully.', user: data.user });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required.' });
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ message: error.message });
  }
  res.json({ token: data.session?.access_token, user: data.user });
};
