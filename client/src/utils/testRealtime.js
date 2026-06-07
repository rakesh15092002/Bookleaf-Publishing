// Save this as: client/src/utils/testRealtime.js
// Run from browser console: import { testRealtime } from './utils/testRealtime'; testRealtime()

import { supabase } from '../lib/supabase'

export const testRealtime = async () => {
  console.clear()
  console.log('🧪 Starting Supabase Realtime Test Suite...\n')

  try {
    // Test 1: Check environment variables
    console.log('📋 Test 1: Environment Variables')
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    console.log(`  ✅ VITE_SUPABASE_URL: ${url ? 'Set' : '❌ MISSING'}`)
    console.log(`  ✅ VITE_SUPABASE_ANON_KEY: ${key ? 'Set' : '❌ MISSING'}\n`)

    // Test 2: Check Supabase client
    console.log('📋 Test 2: Supabase Client')
    console.log(`  ✅ Supabase client initialized: ${supabase ? 'Yes' : 'No'}`)
    console.log(`  ✅ Realtime channel: ${supabase.realtime ? 'Available' : '❌ Not available'}\n`)

    // Test 3: Test subscription to messages table
    console.log('📋 Test 3: Subscribe to Messages Table')
    const messagesChannel = supabase
      .channel('test-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('  📨 Event received:', payload)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('  ✅ Successfully subscribed to messages table')
        } else if (status === 'CHANNEL_ERROR') {
          console.log('  ❌ CHANNEL_ERROR - Check RLS policies')
        } else if (status === 'TIMED_OUT') {
          console.log('  ❌ TIMED_OUT - Connection failed')
        } else {
          console.log(`  📡 Status: ${status}`)
        }
      })

    // Wait a bit for subscription
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 4: Fetch current messages to verify query permissions
    console.log('\n📋 Test 4: Fetch Messages (Check Query Permissions)')
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(5)

    if (messagesError) {
      console.log(`  ❌ Error fetching messages: ${messagesError.message}`)
    } else {
      console.log(`  ✅ Fetched ${messages?.length || 0} messages`)
      if (messages?.length > 0) {
        console.log('  Sample message:', messages[0])
      }
    }

    // Test 5: Check RLS policies
    console.log('\n📋 Test 5: RLS Policies')
    const { data: policies, error: policiesError } = await supabase
      .from('messages')
      .select('id')
      .limit(1)

    if (policiesError && policiesError.message.includes('policy')) {
      console.log('  ❌ RLS Policy Error:', policiesError.message)
    } else {
      console.log('  ✅ RLS Policies appear to be correctly configured')
    }

    // Test 6: Test INSERT event (requires valid ticket ID)
    console.log('\n📋 Test 6: Test INSERT Event')
    console.log('  To test: Create a new message from another browser/tab')
    console.log('  Watch this console for "📨 Event received:" output')

    // Cleanup after 30 seconds
    setTimeout(() => {
      supabase.removeChannel(messagesChannel)
      console.log('\n✅ Test completed. Subscription cleaned up.')
    }, 30000)

  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

// For quick testing - export a function to insert a test message
export const insertTestMessage = async (ticketId) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          ticket_id: ticketId,
          sender_id: 'test-' + Date.now(),
          sender_role: 'admin',
          content: `Test message at ${new Date().toLocaleTimeString()}`,
          is_internal: false
        }
      ])
      .select()

    if (error) {
      console.error('❌ Insert error:', error)
    } else {
      console.log('✅ Test message inserted:', data)
    }
  } catch (err) {
    console.error('❌ Insert failed:', err)
  }
}
