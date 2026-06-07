import supabase from '../config/supabase.js';

const findByAuthorId = async (authorId) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
};

const findAll = async () => {
  const { data, error } = await supabase
    .from('books')
    .select('*, users(name, email)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export default { findByAuthorId, findById, findAll };