import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { listConversations, getConversationMessages } from '@/app/lib/conversations'
import MessagesView from '@/app/components/messages/messages-view'

type PageProps = {
  searchParams: Promise<{ c?: string }>
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const { c: activeId = null } = await searchParams

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const conversations = await listConversations(user.id)

  const initialMessages: Record<string, readonly import('@/app/lib/definitions').ChatMessage[]> = {}
  if (activeId) {
    const msgs = await getConversationMessages(activeId)
    initialMessages[activeId] = msgs
  }

  return (
    <MessagesView
      conversations={conversations}
      activeId={activeId ?? null}
      currentUserId={user.id}
      initialMessages={initialMessages}
    />
  )
}
