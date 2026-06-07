// scripts/createAdmin.js
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function createAdmin() {
  console.log('👑 Creating admin user...')

  const passwordHash = await bcrypt.hash('admin@123', 10)

  const { data, error } = await supabase
    .from('users')
    .upsert({
      email:         'admin@bookleaf.com',
      password_hash: passwordHash,
      role:          'admin',
      name:          'BookLeaf Admin',
      author_id:     null,
    }, { onConflict: 'email' })
    .select()

  if (error) {
    console.error('❌ Admin creation failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Admin created!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Email:    admin@bookleaf.com')
  console.log('Password: admin@123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  process.exit(0)
}

createAdmin().catch(err => {
  console.error('❌ Failed:', err)
  process.exit(1)
})