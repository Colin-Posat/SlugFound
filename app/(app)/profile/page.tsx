'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import Badge, { type BadgeVariant } from '@/app/components/ui/badge'

type Tab = 'listings' | 'saved' | 'settings'

const userListings = [
  { id: '1', type: 'lost' as const, title: 'AirPods Pro (2nd Gen)', status: 'active' as const, time: '2h ago', emoji: '🎧' },
  { id: '2', type: 'found' as const, title: 'UCSC Hoodie', status: 'resolved' as const, time: '5d ago', emoji: '🐌' },
  { id: '3', type: 'lost' as const, title: 'Student ID Card', status: 'active' as const, time: '1w ago', emoji: '🪪' },
]

const stats = [
  { label: 'Posts', value: '3' },
  { label: 'Resolved', value: '1', accent: true },
  { label: 'Active', value: '2' },
]

const NOTIFICATION_PREFS = [
  { id: 'notify-match', label: 'Email me when a found post matches my lost item' },
  { id: 'notify-messages', label: 'Email me when I receive a new message' },
  { id: 'notify-resolved', label: 'Email me when my listing is marked resolved' },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('listings')

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      {/* Profile header */}
      <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-400 text-3xl font-bold text-zinc-950">
          S
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Sam Slug</h1>
          <p className="text-sm text-zinc-400">slug@ucsc.edu</p>
          <p className="mt-1 text-xs text-zinc-600">Member since April 2025 · Cowell College</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          Edit profile
        </button>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-3 gap-4">
        {stats.map((s) => (
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
        {([
          { key: 'listings', label: 'My Listings' },
          { key: 'saved', label: 'Saved' },
          { key: 'settings', label: 'Settings' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
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
            <h2 className="text-sm font-semibold text-white">My Listings</h2>
          </div>
          <ul className="divide-y divide-zinc-800">
            {userListings.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-800/50"
              >
                <span className="text-2xl">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-xs text-zinc-500">{item.time}</p>
                </div>
                <Badge variant={item.type as BadgeVariant}>{item.type}</Badge>
                <Badge variant={item.status as BadgeVariant}>{item.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab: Saved */}
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

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-1 text-sm font-semibold text-white">Your college</h3>
            <p className="mb-4 text-xs text-zinc-500">Used to show you nearby listings first.</p>
            <select
              defaultValue="Cowell College"
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
            >
              {[
                'Cowell College', 'Stevenson College', 'Crown College', 'Merrill College',
                'Kresge College', 'Porter College', 'Oakes College', 'Rachel Carson College',
                'Nine College',
              ].map((c) => (
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
