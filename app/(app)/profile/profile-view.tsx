'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { logout } from '@/app/actions/auth'
import { useAuth } from '@/app/lib/auth-context'
import { updateProfile, updateEmailNotifications } from '@/app/actions/profile'
import Badge, { type BadgeVariant } from '@/app/components/ui/badge'
import ThemeToggle from '@/app/components/theme-toggle'
import { initialFromName, timeAgo } from '@/app/lib/format'
import type { Profile, Item } from '@/app/lib/definitions'
import type { UserItemStats } from '@/app/lib/items'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp']

type Tab = 'listings' | 'saved' | 'settings'

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
  const [emailNotifications, setEmailNotifications] = useState(
    liveProfile?.email_notifications ?? true,
  )

  function handleToggleEmailNotifications() {
    const next = !emailNotifications
    setEmailNotifications(next) // optimistic
    startTransition(async () => {
      const result = await updateEmailNotifications(next)
      if (result.error) {
        setEmailNotifications(!next) // revert on failure
        toast.error(result.error)
      } else {
        toast.success(next ? 'Email notifications on' : 'Email notifications off')
      }
    })
  }

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
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold text-3xl font-bold text-on-gold">
            {initial}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-ink">{displayName}</h1>
          <p className="text-sm text-muted">{email}</p>
          <p className="mt-1 text-xs text-muted">
            Member since {memberSince}
            {liveProfile?.college ? ` · ${liveProfile.college}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className="rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-gold hover:text-ink"
          >
            {isEditing ? 'Close' : 'Edit profile'}
          </button>
        </div>
      </div>

      {/* Inline edit form (US 4.5) */}
      {isEditing && (
        <form
          action={handleProfileSubmit}
          className="mb-10 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="display_name" className="text-sm font-medium text-ink-soft">
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={40}
              defaultValue={liveProfile?.display_name ?? ''}
              className="rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder-muted outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            />
            {errors?.display_name && (
              <p className="text-xs text-lost">{errors.display_name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-soft">Profile photo</label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-xl font-bold text-on-gold">
                  {initial}
                </div>
              )}
              <label
                htmlFor="avatar"
                className="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-sm text-ink-soft transition hover:border-gold hover:text-ink"
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
            {avatarFile && <p className="text-xs text-muted">{avatarFile.name}</p>}
            {errors?.avatar && (
              <p className="text-xs text-lost">{errors.avatar[0]}</p>
            )}
            <p className="text-xs text-muted">JPG, PNG, or WebP. Max 2 MB.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-on-gold transition hover:bg-gold-bright disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save profile'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-muted transition hover:border-gold hover:text-ink"
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
                ? 'border-gold/40 bg-gold-soft'
                : 'border-line bg-surface'
            }`}
          >
            <p className="text-3xl font-bold text-gold-ink">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-xl border border-line bg-surface p-1">
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
                ? 'bg-surface-2 text-ink'
                : 'text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: My Listings */}
      {activeTab === 'listings' && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">
              My Listings ({listings.length})
            </h2>
          </div>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <span className="text-4xl">📭</span>
              <p className="text-sm text-muted">You haven&apos;t posted anything yet.</p>
              <Link
                href="/create"
                className="mt-1 rounded-full bg-gold px-4 py-2 text-sm font-bold text-on-gold transition hover:bg-gold-bright"
              >
                Report your first item
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {listings.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
                >
                  <span className="text-2xl">{item.emoji ?? '📦'}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/items/${item.id}`}
                      className="truncate font-medium text-ink transition-colors hover:text-gold-ink"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted">{timeAgo(item.created_at)}</p>
                  </div>
                  <Badge variant={item.type as BadgeVariant}>{item.type}</Badge>
                  <Badge variant={item.status as BadgeVariant}>{item.status}</Badge>
                  <Link
                    href={`/items/${item.id}/edit`}
                    className="rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-muted transition hover:border-gold hover:text-ink"
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
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-20 text-center">
          <span className="text-5xl">🔖</span>
          <p className="text-base font-semibold text-ink">No saved items yet</p>
          <p className="text-sm text-muted">Bookmark listings to revisit them later</p>
          <div className="mt-2 flex gap-3">
            <Link
              href="/lost"
              className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-on-gold transition hover:bg-gold-bright"
            >
              Browse lost items
            </Link>
            <Link
              href="/found"
              className="rounded-full border border-line-strong px-5 py-2 text-sm font-medium text-muted transition hover:border-gold hover:text-ink"
            >
              Browse found items
            </Link>
          </div>
        </div>
      )}

      {/* Tab: Settings (UI-only — wiring deferred to a future sprint) */}
      {activeTab === 'settings' && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-1 text-sm font-semibold text-ink">Your college</h3>
            <p className="mb-4 text-xs text-muted">Used to show you nearby listings first.</p>
            <select
              defaultValue={profile?.college ?? 'Cowell College'}
              className="rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm text-ink-soft outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            >
              {COLLEGES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6">
            <h3 className="mb-1 text-sm font-semibold text-ink">Notification preferences</h3>
            <p className="mb-4 text-xs text-muted">Manage the emails SlugFound sends you.</p>
            <label
              htmlFor="email-notifications"
              className="flex cursor-pointer items-center gap-3"
            >
              <input
                id="email-notifications"
                type="checkbox"
                checked={emailNotifications}
                onChange={handleToggleEmailNotifications}
                className="accent-gold"
              />
              <span className="text-sm text-muted">
                Email me when I receive a new message
              </span>
            </label>
            <p className="mt-3 text-xs text-muted">Changes save automatically.</p>
          </div>
        </div>
      )}

      {/* Account section */}
      <div className="mt-10 rounded-2xl border border-line bg-surface p-6">
        <h3 className="mb-1 text-sm font-semibold text-ink">Account</h3>
        <p className="mb-4 text-xs text-muted">Manage your account settings.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-line-strong px-4 py-2 text-sm text-muted transition hover:border-gold hover:text-ink"
          >
            Change password
          </button>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-lost/30 px-4 py-2 text-sm text-lost transition hover:border-lost/60 hover:text-lost"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
