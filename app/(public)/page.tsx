import Link from 'next/link'

const features = [
  {
    step: '01',
    emoji: '📍',
    title: 'Campus-wide coverage',
    desc: 'Every college, library, dining hall, and bus stop on the UCSC campus — all in one place.',
  },
  {
    step: '02',
    emoji: '📷',
    title: 'Photo uploads',
    desc: 'Attach a photo to your listing so owners can identify their item instantly.',
  },
  {
    step: '03',
    emoji: '🔔',
    title: 'Instant matching',
    desc: 'Get notified the moment a found post matches your lost item description.',
  },
]

const previewItems = [
  { emoji: '🎧', label: 'AirPods Pro', sub: 'McHenry Library · 2h ago', type: 'lost' },
  { emoji: '📱', label: 'iPhone 14', sub: 'Crown Dining · 1d ago', type: 'found' },
  { emoji: '🧥', label: 'North Face Jacket', sub: 'Stevenson · 1d ago', type: 'lost' },
  { emoji: '👛', label: 'Brown Wallet', sub: 'Baskin Eng. · 2d ago', type: 'found' },
  { emoji: '🔑', label: 'Honda Keys', sub: 'Quarry Plaza · 6h ago', type: 'lost' },
  { emoji: '📚', label: 'Bio Textbook', sub: 'S&E Library · 1w ago', type: 'found' },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-32 text-center">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[800px] rounded-full bg-yellow-400/8 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-yellow-400">
            🐌 UC Santa Cruz Lost &amp; Found
          </span>

          <h1 className="max-w-xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Lost something on
            <br />
            <span className="text-yellow-400">Slug territory?</span>
          </h1>

          <p className="max-w-sm text-base leading-relaxed text-zinc-400">
            SlugFound helps UCSC students report, browse, and recover lost items
            across all of campus — fast.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="rounded-full bg-yellow-400 px-7 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-zinc-700 px-7 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-1 text-xs text-zinc-600">
            Requires a <span className="text-zinc-400">@ucsc.edu</span> email address
          </p>
        </div>
      </section>

      {/* ── Gated preview ── */}
      <section className="relative px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-xl font-semibold text-white">
            Browse hundreds of listings across campus
          </h2>

          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {previewItems.map((item) => (
                <div
                  key={item.label}
                  className="flex cursor-default select-none items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
                    {item.emoji}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${
                        item.type === 'lost'
                          ? 'border-red-500/20 bg-red-500/10 text-red-400'
                          : 'border-green-500/20 bg-green-500/10 text-green-400'
                      }`}
                    >
                      {item.type}
                    </span>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {item.label}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-zinc-950/70 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-8 py-6 text-center shadow-2xl">
                <span className="text-3xl">🔒</span>
                <p className="text-base font-semibold text-white">
                  Sign in to view listings
                </p>
                <p className="max-w-xs text-sm text-zinc-400">
                  Create a free account with your UCSC email to browse and post.
                </p>
                <div className="mt-1 flex gap-2">
                  <Link
                    href="/signup"
                    className="rounded-full bg-yellow-400 px-5 py-2 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:text-white"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-zinc-800 bg-zinc-900/30 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-white">
            Built for Slugs, by Slugs
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-800/60"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="text-3xl">{f.emoji}</span>
                  <span className="text-2xl font-black text-yellow-400/20 group-hover:text-yellow-400/30 transition-colors">
                    {f.step}
                  </span>
                </div>
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-4 py-24 text-center">
        <div className="mx-auto max-w-md">
          <p className="text-4xl">🐌</p>
          <h2 className="mt-4 text-3xl font-extrabold text-white">
            Ready to find your stuff?
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Join thousands of UCSC students already using SlugFound.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex rounded-full bg-yellow-400 px-8 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300"
          >
            Create a free account
          </Link>

          <blockquote className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-left">
            <p className="text-sm leading-relaxed text-zinc-400">
              &ldquo;Got my AirPods back in under 2 hours. Honestly shocked it worked — whoever
              built this is a legend.&rdquo;
            </p>
            <footer className="mt-2 text-xs text-zinc-600">
              — Porter College, Fall 2025
            </footer>
          </blockquote>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-zinc-600">
            <span>✓ <span className="text-zinc-400">48 items</span> recovered this semester</span>
            <span>✓ <span className="text-zinc-400">Free</span> for all @ucsc.edu students</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-6 text-center text-xs text-zinc-700">
        <span className="font-semibold text-yellow-400">SlugFound</span> · UC Santa Cruz ·
        CMPS 115 — Team SlugFound
      </footer>
    </div>
  )
}
