import 'server-only'
import { createSupabaseServerClient } from './supabase/server'
import { initialFromName } from './format'
import type {
  Conversation,
  ChatMessage,
  MessageUser,
  ConversationRow,
  MessageRow,
  Item,
  Profile,
  ItemType,
} from './definitions'

// ─── Mapping helpers ────────────────────────────────────────────────────────

export function toChatMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body ?? '',
    imageUrl: row.image_url ?? undefined,
    sentAt: row.created_at,
  }
}

export function toConversation(
  row: ConversationRow,
  currentUserId: string,
  otherProfile: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'college'>,
  item: Pick<Item, 'id' | 'title' | 'emoji' | 'type'>,
  lastMessage: { body: string; created_at: string } | null,
  unreadCount: number,
): Conversation {
  const otherUser: MessageUser = {
    id: otherProfile.id,
    name: otherProfile.display_name,
    initial: initialFromName(otherProfile.display_name),
    avatarUrl: otherProfile.avatar_url ?? undefined,
    college: otherProfile.college ?? undefined,
  }

  return {
    id: row.id,
    otherUser,
    itemId: item.id,
    itemTitle: item.title,
    itemEmoji: item.emoji ?? '📦',
    itemType: item.type as ItemType,
    lastMessagePreview: lastMessage?.body ?? '',
    lastMessageAt: lastMessage?.created_at ?? row.created_at,
    unreadCount,
  }
}

// ─── Queries ────────────────────────────────────────────────────────────────

type ConversationJoinRow = ConversationRow & {
  item: Pick<Item, 'id' | 'title' | 'emoji' | 'type'>
  profile_a: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'college'>
  profile_b: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'college'>
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const supabase = await createSupabaseServerClient()

  const { data: rows, error } = await supabase
    .from('conversations')
    .select(
      `*, item:items(id, title, emoji, type),
       profile_a:profiles!conversations_user_a_fkey(id, display_name, avatar_url, college),
       profile_b:profiles!conversations_user_b_fkey(id, display_name, avatar_url, college)`,
    )
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[conversations.listConversations] failed:', error.message)
    return []
  }

  const conversationRows = (rows ?? []) as unknown as ConversationJoinRow[]

  const results = await Promise.all(
    conversationRows.map(async (row) => {
      const isUserA = row.user_a === userId
      const otherProfile = isUserA ? row.profile_b : row.profile_a
      const myLastReadAt = isUserA ? row.user_a_last_read_at : row.user_b_last_read_at

      const [lastMsgResult, unreadResult] = await Promise.all([
        supabase
          .from('messages')
          .select('body, created_at')
          .eq('conversation_id', row.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', row.id)
          .neq('sender_id', userId)
          .gt('created_at', myLastReadAt),
      ])

      const lastMessage = lastMsgResult.data as { body: string; created_at: string } | null
      const unreadCount = unreadResult.count ?? 0

      return toConversation(row, userId, otherProfile, row.item, lastMessage, unreadCount)
    }),
  )

  return results
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[conversations.getConversationMessages] failed:', error.message)
    return []
  }

  return ((data ?? []) as MessageRow[]).map(toChatMessage)
}

export async function getUnreadCounts(userId: string): Promise<Record<string, number>> {
  const supabase = await createSupabaseServerClient()

  const { data: rows, error } = await supabase
    .from('conversations')
    .select('id, user_a, user_b, user_a_last_read_at, user_b_last_read_at')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)

  if (error) {
    console.error('[conversations.getUnreadCounts] failed:', error.message)
    return {}
  }

  const counts: Record<string, number> = {}

  await Promise.all(
    ((rows ?? []) as ConversationRow[]).map(async (row) => {
      const isUserA = row.user_a === userId
      const myLastReadAt = isUserA ? row.user_a_last_read_at : row.user_b_last_read_at

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', row.id)
        .neq('sender_id', userId)
        .gt('created_at', myLastReadAt)

      counts[row.id] = count ?? 0
    }),
  )

  return counts
}
