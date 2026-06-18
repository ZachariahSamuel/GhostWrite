import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export type UserProfile = {
  id: string
  email: string
  full_name: string
  plan: 'free' | 'student' | 'pro' | 'institution'
  credits_used: number
  credits_total: number
  country: string
  groq_key?: string
}
