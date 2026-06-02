'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import ItemCard from '@/app/components/item-card'
import Badge from '@/app/components/ui/badge'
import type { PhotoSearchResult, MatchStrength } from '@/app/api/photo-search/route'

type Status = 'idle' | 'loading' | 'done' | 'error'

const MATCH_VARIANT: Record<MatchStrength, 'match-high' | 'match-medium' | 'match-low'> = {
  High: 'match-high',
  Medium: 'match-medium',
  Low: 'match-low',
}

export default function PhotoSearchForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<PhotoSearchResult[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    setStatus('idle')
    setResults([])
    setErrorMsg('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setStatus('loading')
    setResults([])
    setErrorMsg('')

    const fd = new FormData()
    fd.append('photo', file)

    try {
      const res = await fetch('/api/photo-search', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setResults(data.items ?? [])
      setStatus('done')
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setResults([])
    setErrorMsg('')
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      {/* Upload form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <label
          htmlFor="photo-upload"
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line-strong bg-surface p-10 text-center transition hover:border-gold hover:bg-surface-2"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Selected photo"
              className="mx-auto max-h-48 rounded-xl object-contain"
            />
          ) : (
            <>
              <span className="text-5xl">📷</span>
              <p className="text-sm font-medium text-ink-soft">
                Click to upload a photo of your lost item
              </p>
              <p className="text-xs text-muted">JPG, PNG, or WebP · max 5 MB</p>
            </>
          )}
          <input
            id="photo-upload"
            ref={fileRef}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {preview && (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex-1 rounded-full bg-gold py-2.5 text-sm font-semibold text-on-gold transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? 'Analyzing image…' : 'Search by Photo'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-line-strong px-4 py-2.5 text-sm text-ink-soft transition hover:border-gold hover:text-ink"
            >
              Clear
            </button>
          </div>
        )}
      </form>

      {/* Loading spinner */}
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-muted">Analyzing your photo with AI…</p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="rounded-xl border border-lost/25 bg-lost-soft px-5 py-4 text-sm text-lost">
          {errorMsg}
        </div>
      )}

      {/* Results */}
      {status === 'done' && (
        <>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong py-20 text-center">
              <span className="text-5xl">🔍</span>
              <p className="font-display text-lg font-semibold text-ink">No matching items found</p>
              <p className="text-sm text-muted">
                Try a clearer photo or browse all found items below
              </p>
              <Link
                href="/found"
                className="mt-2 rounded-full border border-line-strong px-4 py-2 text-sm text-ink-soft transition hover:border-gold hover:text-ink"
              >
                Browse all found items
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-4 font-mono text-xs text-muted">
                {results.length} matching item{results.length !== 1 ? 's' : ''} found · ranked by
                similarity
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {results.map((item) => (
                  <div key={item.id} className="relative">
                    <ItemCard item={item} />
                    <span className="pointer-events-none absolute right-3 top-3">
                      <Badge variant={MATCH_VARIANT[item.matchStrength]}>
                        {item.matchStrength}
                      </Badge>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
