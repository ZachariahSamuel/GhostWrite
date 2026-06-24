import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const PLAN_LIMITS = {
  free:        500,
  student:     20000,
  pro:         999999,
  institution: 999999,
}

export type CreditCheck = {
  ok: boolean
  userId: string
  plan: string
  used: number
  total: number
  response: NextResponse | null
}

export async function checkCredits(wordsNeeded: number = 0): Promise<CreditCheck> {
  const cookieStore = cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name)                { return cookieStore.get(name)?.value },
        set(name, value, options){ try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove(name, options)    { try { cookieStore.set({ name, value:'', ...options }) } catch {} },
      },
    }
  )

  const { data: { user }, error: authErr } = await sb.auth.getUser()
  if (authErr || !user) {
    return {
      ok: false, userId: '', plan: '', used: 0, total: 0,
      response: NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }
  }

  const { data: profile, error: profileErr } = await sb
    .from('profiles')
    .select('plan, credits_used, credits_total')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile) {
    // Profile may not exist yet — allow with free limits
    return { ok: true, userId: user.id, plan: 'free', used: 0, total: PLAN_LIMITS.free, response: null }
  }

  const total = profile.credits_total ?? PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free
  const used  = profile.credits_used ?? 0

  if (used + wordsNeeded > total) {
    const remaining = Math.max(0, total - used)
    return {
      ok: false, userId: user.id, plan: profile.plan, used, total,
      response: NextResponse.json({
        error: `Credit limit reached. You have ${remaining} credits remaining this month.`,
        remaining,
        plan: profile.plan,
        upgrade: true,
      }, { status: 402 })
    }
  }

  return { ok: true, userId: user.id, plan: profile.plan, used, total, response: null }
}

export async function consumeCredits(userId: string, words: number) {
  const cookieStore = cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name)                { return cookieStore.get(name)?.value },
        set(name, value, options){ try { cookieStore.set({ name, value:'', ...options }) } catch {} },
        remove(name, options)    { try { cookieStore.set({ name, value:'', ...options }) } catch {} },
      },
    }
  )
  await sb.rpc('increment_usage', {
    p_user_id: userId,
    p_tool:    'humanizer',
    p_words:   words,
  })
}
