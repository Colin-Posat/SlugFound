import { MOCK_CONVERSATIONS } from '@/app/lib/mock-messages'
import MessagesView from '@/app/components/messages/messages-view'

type PageProps = {
  // In Next.js 16, searchParams is a Promise — it must be awaited.
  // See DOCS.md § "Next.js 16 breaking changes" for details.
  searchParams: Promise<{ c?: string }>
}

export default async function MessagesPage({ searchParams }: PageProps) {
  // `c` is the active conversation ID: /messages?c=conv-1
  // When no `c` param is present, activeId is null and the empty thread
  // placeholder is shown (desktop) or the conversation list fills the screen (mobile).
  const { c: activeId = null } = await searchParams

  return (
    <MessagesView
      conversations={MOCK_CONVERSATIONS}
      activeId={activeId ?? null}
    />
  )
}
