-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPABASE REALTIME SETUP FOR BOOKLEAF
-- Run these commands in your Supabase SQL Editor to enable realtime updates
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- 1. ENABLE REALTIME FOR MESSAGES TABLE
-- ───────────────────────────────────────────────────────────────────────────────

-- Ensure messages table uses FULL replica identity for realtime
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Add messages to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ───────────────────────────────────────────────────────────────────────────────
-- 2. ENABLE REALTIME FOR TICKETS TABLE  
-- ───────────────────────────────────────────────────────────────────────────────

-- Ensure tickets table uses FULL replica identity for realtime
ALTER TABLE tickets REPLICA IDENTITY FULL;

-- Add tickets to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- ───────────────────────────────────────────────────────────────────────────────
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON MESSAGES
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "allow_select_messages" ON messages;
DROP POLICY IF EXISTS "allow_insert_messages" ON messages;
DROP POLICY IF EXISTS "allow_update_messages" ON messages;

-- Policy: Anyone can SELECT messages (for viewing)
CREATE POLICY "allow_select_messages" ON messages
  FOR SELECT USING (true);

-- Policy: Users can INSERT their own messages
CREATE POLICY "allow_insert_messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

-- Policy: Users can UPDATE their own messages
CREATE POLICY "allow_update_messages" ON messages
  FOR UPDATE USING (auth.uid()::text = sender_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- 4. ENABLE ROW LEVEL SECURITY (RLS) ON TICKETS
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "allow_select_tickets" ON tickets;
DROP POLICY IF EXISTS "allow_insert_tickets" ON tickets;
DROP POLICY IF EXISTS "allow_update_tickets" ON tickets;

-- Policy: Anyone can SELECT tickets
CREATE POLICY "allow_select_tickets" ON tickets
  FOR SELECT USING (true);

-- Policy: Authors can INSERT tickets
CREATE POLICY "allow_insert_tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid()::text = author_id);

-- Policy: Admins and authors can UPDATE tickets
CREATE POLICY "allow_update_tickets" ON tickets
  FOR UPDATE USING (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- 5. VERIFY REALTIME IS ENABLED (Run this to check)
-- ───────────────────────────────────────────────────────────────────────────────

-- This query should show messages and tickets in the publication
SELECT * FROM pg_publication_rel 
WHERE pubname = 'supabase_realtime' 
ORDER BY relname;

-- Output should include:
-- public | messages
-- public | tickets

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE! Your Supabase is now configured for realtime updates.
-- ═══════════════════════════════════════════════════════════════════════════════
