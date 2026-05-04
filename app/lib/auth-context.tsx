'use client'

/**
 * AuthContext — exposes the current Supabase user + profile to the entire
 * authenticated section of the app (US 2.2).
 *
 * Why we need this:
 *   The Sidebar, Profile page, and any client component that wants to know
 *   "who am I" needs synchronous access to user data. We could call
 *   supabase.auth.getUser() everywhere, but that's a network round trip
 *   on every component mount. Instead, fetch once in the provider, listen for
 *   auth state changes, and expose the result via React Context.
 *
 * Mounted in: app/(app)/layout.tsx — wraps everything authenticated.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from './supabase/client'
import type { Profile } from './definitions'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
  // Initial values from the server so we don't render a flash of "logged out"
  // on first paint. Subsequent updates come from onAuthStateChange.
  initialUser: User | null
  initialProfile: Profile | null
}

export function AuthProvider({ children, initialUser, initialProfile }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [loading, setLoading] = useState(false)

  // useState lazy initializer — create the client once per mount, never recreate
  const [supabase] = useState(() => createSupabaseBrowserClient())

  /**
   * Fetch the profile row for the given user id. Used both inside the auth
   * state listener and when consumers want to force a refresh (e.g. after
   * editing display_name on the Profile page).
   */
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Don't blow up — log and return null. The page will fall back to the
        // user's email until the profile row is reachable.
        console.error('Failed to fetch profile:', error.message)
        return null
      }
      return data as Profile
    },
    [supabase],
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const fresh = await fetchProfile(user.id)
    setProfile(fresh)
  }, [user, fetchProfile])

  useEffect(() => {
    /*
     * Subscribe to Supabase auth state changes. This fires on:
     *   - SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION
     * We re-fetch the profile row whenever the user changes.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (nextUser) {
        setLoading(true)
        const p = await fetchProfile(nextUser.id)
        setProfile(p)
        setLoading(false)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
