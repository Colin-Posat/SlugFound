import { notFound, redirect } from 'next/navigation'
import { getItemById } from '@/app/lib/items'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import ItemDetail from '@/app/components/item-detail'

/**
 * Found item detail page (/found/[id]).
 *
 * Mirror of /lost/[id]/page.tsx — fetches by id, redirects to /lost/[id]
 * if the item turns out to be a lost listing.
 */
type PageProps = {
  params: Promise<{ id: string }>
}

export default async function FoundItemPage({ params }: PageProps) {
  const { id } = await params

  const item = await getItemById(id)
  if (!item) notFound()

  if (item.type !== 'found') {
    redirect(`/lost/${item.id}`)
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = user?.id === item.user_id

  return <ItemDetail item={item} isOwner={isOwner} />
}
