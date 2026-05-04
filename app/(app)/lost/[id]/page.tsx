import { notFound, redirect } from 'next/navigation'
import { getItemById } from '@/app/lib/items'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import ItemDetail from '@/app/components/item-detail'

/**
 * Lost item detail page (/lost/[id]).
 *
 * Fetches the item by id with its poster profile joined. If the item is
 * actually a found item (URL mismatch), redirects to the correct route.
 * If no item exists, returns 404.
 */
type PageProps = {
  // Next.js 16: params is a Promise — must be awaited
  params: Promise<{ id: string }>
}

export default async function LostItemPage({ params }: PageProps) {
  const { id } = await params

  const item = await getItemById(id)
  if (!item) notFound()

  // If someone hits /lost/[id] for a found-item id, send them to /found/[id]
  if (item.type !== 'lost') {
    redirect(`/found/${item.id}`)
  }

  // Determine ownership so the detail view can show owner-only actions
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === item.user_id

  return <ItemDetail item={item} isOwner={isOwner} />
}
