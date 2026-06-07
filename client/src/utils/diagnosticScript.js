// 🔍 REALTIME DIAGNOSTIC SCRIPT
// Copy and paste this entire script into browser Console and press Enter
// This will run comprehensive tests and show exactly where real-time is breaking

(async () => {
  console.clear()
  console.log('%c🔍 REALTIME DIAGNOSTICS STARTING...', 'color: blue; font-size: 16px; font-weight: bold')
  console.log('')

  // ─── TEST 1: Environment Variables ───────────────────
  console.log('%c TEST 1: Environment Variables', 'color: cyan; font-weight: bold')
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  console.log('VITE_SUPABASE_URL:', url ? '✅ Set' : '❌ Missing')
  console.log('VITE_SUPABASE_ANON_KEY:', key ? '✅ Set' : '❌ Missing')
  
  if (!url || !key) {
    console.log('%c❌ MISSING ENV VARS - STOPPING', 'color: red; font-weight: bold')
    return
  }
  
  // ─── TEST 2: Supabase Client ─────────────────────────
  console.log('\n%c TEST 2: Supabase Client Initialization', 'color: cyan; font-weight: bold')
  try {
    const { supabase } = await import('./lib/supabase.js')
    console.log('Supabase client:', supabase ? '✅ Initialized' : '❌ Failed')
    
    if (!supabase) {
      console.log('%c❌ CLIENT INIT FAILED - STOPPING', 'color: red; font-weight: bold')
      return
    }

    // ─── TEST 3: Database Connection ─────────────────────
    console.log('\n%c TEST 3: Database Query Test', 'color: cyan; font-weight: bold')
    const { data: messages, error: queryError } = await supabase
      .from('messages')
      .select('id, content, created_at')
      .limit(1)
    
    if (queryError) {
      console.log('❌ Query failed:', queryError.message)
      console.log('This usually means RLS policies are blocking SELECT')
    } else {
      console.log('✅ Query successful - found', messages?.length || 0, 'message(s)')
    }

    // ─── TEST 4: Insert Permission Check ──────────────────
    console.log('\n%c TEST 4: Insert Permission Check', 'color: cyan; font-weight: bold')
    console.log('⏳ Checking if INSERT is allowed...')
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        ticket_id: '00000000-0000-0000-0000-000000000000',
        sender_id: '00000000-0000-0000-0000-000000000000',
        sender_role: 'test',
        content: 'test',
        is_internal: false
      })
      .select()
    
    if (insertError) {
      console.log('❌ INSERT blocked:', insertError.message)
      console.log('This is expected with bad UUIDs - it just shows RLS is checking')
    } else {
      console.log('⚠️  INSERT succeeded - your RLS might be too permissive')
    }

    // ─── TEST 5: Realtime Subscription ──────────────────
    console.log('\n%c TEST 5: Realtime Subscription', 'color: cyan; font-weight: bold')
    console.log('⏳ Setting up subscription...')
    
    let subscriptionWorking = false
    let eventReceived = false
    let errorMessage = null

    const channel = supabase
      .channel('diagnostic-test-' + Date.now())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('✅ EVENT RECEIVED:', payload.eventType, payload.new || payload.old)
        eventReceived = true
        subscriptionWorking = true
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
        
        if (status === 'SUBSCRIBED') {
          subscriptionWorking = true
          console.log('✅ SUBSCRIBED successfully!')
        } else if (status === 'CHANNEL_ERROR') {
          errorMessage = 'RLS policies blocking - check permissions'
          console.log('%c❌ CHANNEL_ERROR', 'color: red; font-weight: bold')
        } else if (status === 'TIMED_OUT') {
          errorMessage = 'Connection timeout - Realtime may not be enabled'
          console.log('%c❌ TIMED_OUT', 'color: red; font-weight: bold')
        }
      })

    // ─── TEST 6: Active Channels ───────────────────────
    console.log('\n%c TEST 6: Active Channels', 'color: cyan; font-weight: bold')
    const channels = supabase.getChannels()
    console.log('Total channels:', channels.length)
    channels.forEach((ch, i) => {
      console.log(`  ${i + 1}. ${ch.topic} - state: ${ch.state}`)
    })

    // ─── SUMMARY ────────────────────────────────────────
    console.log('\n%c TEST SUMMARY', 'color: green; font-weight: bold; font-size: 14px')
    console.log('✅ Env vars:', url ? 'Set' : 'Missing')
    console.log('✅ Supabase client:', 'Initialized')
    console.log('✅ Database queries:', queryError ? 'Blocked by RLS' : 'Working')
    console.log('✅ Subscribed:', subscriptionWorking ? 'Yes' : 'No')
    if (errorMessage) {
      console.log('%c⚠️  ERROR:', 'color: orange; font-weight: bold', errorMessage)
    }

    console.log('\n%c MANUAL TEST:', 'color: purple; font-weight: bold')
    console.log('1. Open another browser window with the app')
    console.log('2. Send a message from the other window')
    console.log('3. Watch this console - look for "✅ EVENT RECEIVED"')
    console.log('4. Test will auto-cleanup after 30 seconds')

    // Cleanup after 30 seconds
    setTimeout(() => {
      supabase.removeChannel(channel)
      console.log('\n%c✅ TEST COMPLETE', 'color: green; font-weight: bold')
      console.log('Subscription cleaned up')
      
      if (!eventReceived && subscriptionWorking) {
        console.log('%c📝 NOTE: No events received during test', 'color: orange')
        console.log('This could mean:')
        console.log('1. No messages being inserted')
        console.log('2. Filter syntax incorrect')
        console.log('3. INSERT permissions blocked')
      }
    }, 30000)

  } catch (err) {
    console.error('❌ FATAL ERROR:', err)
  }
})()
