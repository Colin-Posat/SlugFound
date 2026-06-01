import { redirect } from 'next/navigation'

/**
 * Legacy found-item detail route.
 *
 * Item detail now lives at the canonical /items/[id] route (US 4.1). This page
 * is kept only so existing /found/[id] links and bookmarks keep working — it
 * permanently redirects to the canonical URL.
 */
type PageProps = {
  params: Promise<{ id: string }>
}

export default async function FoundItemRedirect({ params }: PageProps) {
  const { id } = await params
  redirect(`/items/${id}`)
}
