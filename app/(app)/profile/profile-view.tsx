'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { logout } from '@/app/actions/auth'
import { useAuth } from '@/app/lib/auth-context'
import { updateProfile } from '@/app/actions/profile'
import Badge, { type BadgeVariant } from '@/app/components/ui/badge'
import { initialFromName, timeAgo } from '@/app/lib/format'
import type { Profile, Item } from '@/app/lib/definitions'
import type { UserItemStats } from '@/app/lib/items'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp']

type Tab = 'listings' | 'saved' | 'settings'

const NOTIFICATION_PREFS = [
  { id: 'notify-match', label: 'Email me when a found post matches my lost item' },
  { id: 'notify-messages', label: 'Email me when I receive a new message' },
  { id: 'notify-resolved', label: 'Email me when my listing is marked resolved' },
]

const COLLEGES = [
  'Cowell College',
  'Stevenson College',
  'Crown College',
  'Merrill College',
  'Kresge College',
  'Porter College',
  'Oakes College',
  'Rachel Carson College',
  'Nine College',
]

interface ProfileViewProps {
  profile: Profile | null
  email: string
  stats: UserItemStats
  listings: Item[]
}

/**
 * Renders the signed-in user's profile, stats, and listings.
 * Tab state is local — saved/settings are mock for Sprint 2 and don't persist.
 */
export default function ProfileView({ profile, email, stats, listings }: ProfileViewProps) {
  // Prefer the AuthContext profile so the header reflects edits immediately
  // after refreshProfile(); fall back to the server-provided prop on first paint.
  const { profile: ctxProfile, refreshProfile } = useAuth()
  const liveProfile = ctxProfile ?? profile

  const [activeTab, setActiveTab] = useState<Tab>('listings')
  const [isEditing, setIsEditing] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<{ display_name?: string[]; avatar?: string[] }>()
  const [pending, startTransition] = useTransition()

  // Handle submit via a transition so success/error handling (and the state
  // updates that close the form) live in an event callback, not an effect.
  function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(undefined, formData)
      if (result?.success) {
        toast.success('Profile updated')
        await refreshProfile()
        setIsEditing(false)
        setAvatarFile(null)
        setErrors(undefined)
      } else if (result?.errors) {
        setErrors(result.errors)
      } else if (result?.message) {
        toast.error(result.message)
      }
    })
  }

  const displayName = liveProfile?.display_name ?? email.split('@')[0]
  const initial = initialFromName(displayName)
  const avatarUrl = liveProfile?.avatar_url ?? null
  const memberSince = liveProfile?.created_at
    ? new Date(liveProfile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'recently'

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file && file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be 2 MB or smaller')
      e.target.value = ''
      return
    }
    if (file && !ALLOWED_AVATAR_MIME.includes(file.type)) {
      toast.error('Image must be JPG, PNG, or WebP')
      e.target.value = ''
      return
    }
    setAvatarFile(file)
  }

  const statCards = [
    { label: 'Posts', value: stats.totalPosts.toString() },
    { label: 'Reunited', value: stats.reunited.toString(), accent: true },
    { label: 'Active', value: stats.active.toString() },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      {/* Profile header */}
      <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400 text-3xl font-bold text-zinc-950">
            {initial}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          <p className="text-sm text-zinc-400">{email}</p>
          <p className="mt-1 text-xs text-zinc-600">
            Member since {memberSince}
            {liveProfile?.college ? ` · ${liveProfile.college}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing((v) => !v)}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          {isEditing ? 'Close' : 'Edit profile'}
        </button>
      </div>

      {/* Inline edit form (US 4.5) */}
      {isEditing && (
        <form
          action={handleProfileSubmit}
          className="mb-10 flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="display_name" className="text-sm font-medium text-zinc-300">
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={40}
              defaultValue={liveProfile?.display_name ?? ''}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            />
            {errors?.display_name && (
              <p className="text-xs text-red-400">{errors.display_name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Profile photo</label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-xl font-bold text-zinc-950">
                  {initial}
                </div>
              )}
              <label
                htmlFor="avatar"
                className="cursor-pointer rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                Choose photo
              </label>
            </div>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarSelect}
            />
            {avatarFile && <p className="text-xs text-zinc-500">{avatarFile.name}</p>}
            {errors?.avatar && (
              <p className="text-xs text-red-400">{errors.avatar[0]}</p>
            )}
            <p className="text-xs text-zinc-600">JPG, PNG, or WebP. Max 2 MB.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save profile'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Stats — derived from items table */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border p-5 text-center transition-colors ${
              s.accent
                ? 'border-yellow-400/20 bg-yellow-400/5'
                : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <p className="text-3xl font-bold text-yellow-400">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        {(
          [
            { key: 'listings', label: 'My Listings' },
            { key: 'saved', label: 'Saved' },
            { key: 'settings', label: 'Settings' },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: My Listings */}
      {activeTab === 'listings' && (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">
              My Listings ({listings.length})
            </h2>
          </div>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <span className="text-4xl">📭</span>
              <p className="text-sm text-zinc-400">You haven&apos;t posted anything yet.</p>
              <Link
                href="/create"
                className="mt-1 rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
              >
                Report your first item
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {listings.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-800/50"
                >
                  <span className="text-2xl">{item.emoji ?? '📦'}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/items/${item.id}`}
                      className="truncate font-medium text-white transition-colors hover:text-yellow-400"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-zinc-500">{timeAgo(item.created_at)}</p>
                  </div>
                  <Badge variant={item.type as BadgeVariant}>{item.type}</Badge>
                  <Badge variant={item.status as BadgeVariant}>{item.status}</Badge>
                  <Link
                    href={`/items/${item.id}/edit`}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-white"
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tab: Saved (placeholder — out of scope for Sprint 2) */}
      {activeTab === 'saved' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
          <span className="text-5xl">🔖</span>
          <p className="text-base font-semibold text-white">No saved items yet</p>
          <p className="text-sm text-zinc-500">Bookmark listings to revisit them later</p>
          <div className="mt-2 flex gap-3">
            <Link
              href="/lost"
              className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
            >
              Browse lost items
            </Link>
            <Link
              href="/found"
              className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-white"
            >
              Browse found items
            </Link>
          </div>
        </div>
      )}

      {/* Tab: Settings (UI-only — wiring deferred to a future sprint) */}
      {activeTab === 'settings' && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-1 text-sm font-semibold text-white">Your college</h3>
            <p className="mb-4 text-xs text-zinc-500">Used to show you nearby listings first.</p>
            <select
              defaultValue={profile?.college ?? 'Cowell College'}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            >
              {COLLEGES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-1 text-sm font-semibold text-white">Notifications</h3>
            <p className="mb-4 text-xs text-zinc-500">Choose what triggers an email from us.</p>
            <div className="flex flex-col gap-3">
              {NOTIFICATION_PREFS.map((pref) => (
                <label
                  key={pref.id}
                  htmlFor={pref.id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    id={pref.id}
                    type="checkbox"
                    defaultChecked
                    className="accent-yellow-400"
                  />
                  <span className="text-sm text-zinc-400">{pref.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="self-start rounded-full bg-yellow-400 px-6 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
          >
            Save preferences
          </button>
        </div>
      )}

      {/* Account section */}
      <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="mb-1 text-sm font-semibold text-white">Account</h3>
        <p className="mb-4 text-xs text-zinc-500">Manage your account settings.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            Change password
          </button>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:border-red-500/60 hover:text-red-300"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
