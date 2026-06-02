import Sidebar from '@/app/components/sidebar'
import { UnreadProvider } from '@/app/lib/unread-context'
import { AuthProvider } from '@/app/lib/auth-context'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { getUnreadCounts } from '@/app/lib/conversations'
import type { Profile } from '@/app/lib/definitions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: Profile | null = null
  let initialUnreadCounts: Record<string, number> = {}

  if (user) {
    const [profileResult, unreadResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      getUnreadCounts(user.id),
    ])
    profile = (profileResult.data as Profile | null) ?? null
    initialUnreadCounts = unreadResult
  }

  return (
    <AuthProvider initialUser={user} initialProfile={profile}>
      <UnreadProvider initialUnreadCounts={initialUnreadCounts}>
        <div className="flex min-h-screen bg-paper text-ink">
          <Sidebar />
          <div className="flex flex-1 flex-col min-w-0 pb-20 md:pb-0">{children}</div>
        </div>
      </UnreadProvider>
    </AuthProvider>
  )
}
