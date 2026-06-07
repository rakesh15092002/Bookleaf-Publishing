import supabase from '../config/supabase.js';

const create = async (messageData) => {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findByTicketId = async (ticketId, isAdmin = false) => {
  let query = supabase
    .from('messages')
    .select(`
      *,
      users!messages_sender_id_fkey(name, role)
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  // Author cannot see internal messages
  if (!isAdmin) {
    query = query.eq('is_internal', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export default { create, findByTicketId };