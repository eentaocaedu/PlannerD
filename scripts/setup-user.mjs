import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser() {
  const email = 'admin@planner.com'
  const password = 'password123'

  console.log(`Attempting to create user: ${email}...`)

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('User already exists.')
    } else {
      console.error('Error creating user:', error.message)
    }
  } else {
    console.log('User created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
  }
}

createUser()
