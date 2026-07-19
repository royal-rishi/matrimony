import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars:', { supabaseUrl, supabaseAnonKey })
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const email = `test_${Date.now()}@google.com`
  console.log('Testing signup with email:', email)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'Password123!',
    options: {
      data: {
        first_name: 'Test',
        last_name: 'User',
        gender: 'male',
        date_of_birth: '1995-05-15',
        religion: 'Hindu',
        mobile_number: '9876543210',
      }
    }
  })

  if (error) {
    console.error('Supabase Auth error:', error.message, error)
  } else {
    console.log('Signup successful:', data)
  }
}

run()
