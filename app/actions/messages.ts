'use server'

import { z } from 'zod'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getConversationMessages } from '@/app/lib/conversations'
import type { ChatMessage } from '@/app/lib/definitions'

const FindOrCreateSchema = z.object({
  itemId: z.string().uuid(),
})

export async function findOrCreateConversation(
  itemId: string,
): Promise<{ conversationId: string } | { error: string }> {
  const parsed = FindOrCreateSchema.safeParse({ itemId })
  if (!parsed.success) {
    return { error: 'Invalid item ID.' }
  }

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be signed in to send messages.' }
  }

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, user_id')
    .eq('id', parsed.data.itemId)
    .single()

  if (itemError || !item) {
    return { error: 'Item not found.' }
  }

  if (item.user_id === user.id) {
    return { error: 'You cannot message yourself about your own item.' }
  }

  const [userA, userB] =
    user.id < item.user_id ? [user.id, item.user_id] : [item.user_id, user.id]

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .eq('item_id', parsed.data.itemId)
    .single()

  if (existing) {
    return { conversationId: existing.id }
  }

  const { data: created, error: insertError } = await supabase
    .from('conversations')
    .insert({ user_a: userA, user_b: userB, item_id: parsed.data.itemId })
    .select('id')
    .single()

  if (insertError || !created) {
    return { error: `Could not create conversation: ${insertError?.message ?? 'unknown'}` }
  }

  revalidatePath('/messages')

  return { conversationId: created.id }
}

export async function markConversationRead(
  conversationId: string,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not signed in.' }
  }

  const { data: conv } = await supabase
    .from('conversations')
    .select('user_a, user_b')
    .eq('id', conversationId)
    .single()

  if (!conv) {
    return { error: 'Conversation not found.' }
  }

  const updateCol =
    conv.user_a === user.id ? 'user_a_last_read_at' : 'user_b_last_read_at'

  const { error } = await supabase
    .from('conversations')
    .update({ [updateCol]: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) {
    return { error: `Could not mark as read: ${error.message}` }
  }

  return {}
}

export async function fetchConversationMessages(
  conversationId: string,
): Promise<{ messages?: ChatMessage[]; error?: string }> {
  try {
    const messages = await getConversationMessages(conversationId)
    return { messages }
  } catch (err: any) {
    return { error: err.message || 'Failed to load messages.' }
  }
}

