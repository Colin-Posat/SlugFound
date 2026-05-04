import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { getUserItemStats, listUserItems } from '@/app/lib/items'
import type { Profile } from '@/app/lib/definitions'
import ProfileView from './profile-view'

/**
 * Profile page (US 2.6).
 *
 * Server component — fetches the signed-in user's profile, post stats, and
 * listings, then passes them to a client component for rendering with
 * interactive tabs.
 *
 * Middleware blocks unauthenticated access; the redirect below is a defense
 * in depth in case middleware is bypassed.
 */
export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = (profileData as Profile | null) ?? null

  const [stats, listings] = await Promise.all([
    getUserItemStats(user.id),
    listUserItems(user.id, 50),
  ])

  return (
    <ProfileView
      profile={profile}
      email={user.email ?? ''}
      stats={stats}
      listings={listings}
    />
  )
}
