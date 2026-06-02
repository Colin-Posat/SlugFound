import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getItemById } from '@/app/lib/items'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import EditForm from './edit-form'

/**
 * Edit item page (/items/[id]/edit) — US 4.2.
 *
 * Owner-only. Non-owners hitting this URL directly get a 403 message, never the
 * form. A missing item id renders the segment's not-found page.
 */
type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditItemPage({ params }: PageProps) {
  const { id } = await params

  const item = await getItemById(id)
  if (!item) notFound()

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 403 guard — direct URL access by a non-owner shows a message, not the form.
  if (!user || user.id !== item.user_id) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <span className="text-6xl">🔒</span>
        <h1 className="text-2xl font-bold text-ink">403 — Not your listing</h1>
        <p className="max-w-sm text-sm text-muted">
          You can only edit listings that you posted.
        </p>
        <Link
          href={`/items/${id}`}
          className="mt-2 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-on-gold transition hover:bg-gold-bright"
        >
          Back to listing
        </Link>
      </div>
    )
  }

  return <EditForm item={item} />
}
