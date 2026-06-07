import supabase from '../config/supabase.js';

const create = async (noteData) => {
  const { data, error } = await supabase
    .from('notes')
    .insert(noteData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findByTicketId = async (ticketId) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*, users(name)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export default { create, findByTicketId };