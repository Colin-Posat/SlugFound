import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getItemById } from '@/app/lib/items'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import ItemDetail from '@/app/components/item-detail'

/**
 * Canonical item detail page (/items/[id]) — US 4.1.
 *
 * The older /lost/[id] and /found/[id] routes now redirect here, so this is the
 * single source of truth for rendering an item. Ownership is resolved server-side
 * so the detail view can show owner-only actions (edit / status / delete).
 */
type PageProps = {
  // Next.js 16: params is a Promise — must be awaited.
  params: Promise<{ id: string }>
}

const META_DESCRIPTION_MAX = 155

/**
 * Dynamic <title>/<meta description> from the item itself (SEO requirement).
 * getItemById is React-cached, so this does not add a second DB round-trip.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const item = await getItemById(id)

  if (!item) {
    return { title: 'Item not found · SlugFound' }
  }

  const typeLabel = item.type === 'lost' ? 'Lost' : 'Found'
  const description =
    item.description.length > META_DESCRIPTION_MAX
      ? `${item.description.slice(0, META_DESCRIPTION_MAX - 1).trimEnd()}…`
      : item.description

  return {
    title: `${item.title} · ${typeLabel} · SlugFound`,
    description,
  }
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params

  const item = await getItemById(id)
  if (!item) notFound()

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === item.user_id

  return <ItemDetail item={item} isOwner={isOwner} />
}
