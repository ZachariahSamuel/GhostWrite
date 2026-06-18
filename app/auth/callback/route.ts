import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard/humanizer'
  const error = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // Handle Supabase error redirects (e.g. expired confirmation link)
  if (error) {
    console.error('[Auth Callback] Error:', error, errorDesc)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDesc || error)}`
    )
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
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

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Successful auth — redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[Auth Callback] Exchange error:', exchangeError.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // No code — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
