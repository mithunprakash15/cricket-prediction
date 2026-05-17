import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fwutqzlabetasoatezhi.supabase.co'
const supabaseAnonKey = 'sb_publishable_WHBQAEObkG3_tNJGLTvm2g_hwN9IAzd'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Copy .env.example to .env and fill in your credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
