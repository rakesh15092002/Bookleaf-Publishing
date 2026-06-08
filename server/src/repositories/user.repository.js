import supabase from '../config/supabase.js';

const findByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return null;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
};

const create = async (userData) => {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) throw error;
  return data;
};


const findByRole = async (role) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role); // Database mein 'role' column hona chahiye

  if (error) throw error;
  return data;
};

const update = async (id, updateData) => {
  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export default { findByEmail, findById, create, findByRole, update };