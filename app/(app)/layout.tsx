import Sidebar from '@/app/components/sidebar'
import { UnreadProvider } from '@/app/lib/unread-context'
import { AuthProvider } from '@/app/lib/auth-context'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import type { Profile } from '@/app/lib/definitions'

/**
 * Authenticated app layout.
 *
 * - Fetches the current user + profile on the server so AuthProvider can hydrate
 *   without a flash of "logged out" content on first paint.
 * - Wraps everything in AuthProvider (real user data) and UnreadProvider (mock
 *   messaging unread counts — not yet on Supabase).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()

  // Middleware already redirects unauthenticated users away, but we still
  // null-guard here for safety (e.g. while middleware is being changed).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = (data as Profile | null) ?? null
  }

  return (
    <AuthProvider initialUser={user} initialProfile={profile}>
      <UnreadProvider>
        <div className="flex min-h-screen bg-zinc-950 text-white">
          <Sidebar />
          {/* pb-20 reserves space for the fixed mobile tab bar (height ≈ 80px).
              md:pb-0 removes it on desktop where the tab bar is hidden. */}
          <div className="flex flex-1 flex-col min-w-0 pb-20 md:pb-0">{children}</div>
        </div>
      </UnreadProvider>
    </AuthProvider>
  )
}
