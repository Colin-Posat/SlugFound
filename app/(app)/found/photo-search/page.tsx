import Link from 'next/link'
import PhotoSearchForm from '@/app/components/photo-search-form'

export default function PhotoSearchPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8">
        <Link
          href="/found"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-white"
        >
          ← Back to found items
        </Link>
        <h1 className="text-3xl font-bold text-white">Find by Photo</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload a photo of your lost item and we&apos;ll find the closest matches.
        </p>
      </div>

      <PhotoSearchForm />
    </div>
  )
}
