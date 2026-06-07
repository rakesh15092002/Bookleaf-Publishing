import supabase from '../config/supabase.js';

const create = async (ticketData) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticketData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findById = async (id) => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      books(
        title,
        isbn,
        status,
        total_copies_sold,
        royalty_pending,
        available_on
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.log('findById error:', error.message);
    return null;
  }
  return data;
};

const findByAuthorId = async (authorId, filters = {}) => {
  let query = supabase
    .from('tickets')
    .select('*, books(title, isbn)')
    .eq('author_id', authorId)  // AUTH001 — business id
    .order('created_at', { ascending: false });

  if (filters.status)   query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('ai_priority', filters.priority);
  if (filters.category) query = query.eq('ai_category', filters.category);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const findAll = async (filters = {}) => {
  let query = supabase
    .from('tickets')
    .select(`
      *,
      books(title, isbn),
      users!tickets_author_id_fkey(name, email)
    `)
    .order('created_at', { ascending: false });

  if (filters.status)   query = query.eq('status', filters.status);
  if (filters.priority) query = query.eq('ai_priority', filters.priority);
  if (filters.category) query = query.eq('ai_category', filters.category);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const update = async (id, updateData) => {
  const { data, error } = await supabase
    .from('tickets')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export default { create, findById, findByAuthorId, findAll, update };