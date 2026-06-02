import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/app/lib/supabase/admin'
import { sendEmail } from '@/app/lib/email/resend'
import { renderNewMessageEmail, buildPreview } from '@/app/lib/email/new-message-template'

/**
 * New-message email notification webhook (US 4.4).
 *
 * Called by a Supabase Database Webhook on INSERT into public.messages. Resolves
 * the recipient, honours their opt-out, enforces a per-conversation rate limit,
 * and sends a branded email via Resend.
 *
 * Returns 200 even when it deliberately skips (opted out / rate limited) so the
 * webhook does not retry. Only transient failures return 5xx.
 */

const RATE_LIMIT_MINUTES = 10

const WebhookSchema = z.object({
  type: z.string(),
  table: z.string(),
  record: z.object({
    id: z.string(),
    conversation_id: z.string(),
    sender_id: z.string(),
    body: z.string(),
    created_at: z.string(),
  }),
})

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export async function POST(request: NextRequest) {
  // Fail closed: require the shared secret header to match.
  const secret = process.env.NOTIFY_WEBHOOK_SECRET
  if (!secret || request.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: z.infer<typeof WebhookSchema>
  try {
    payload = WebhookSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const msg = payload.record
  const supabase = createSupabaseAdminClient()

  // Conversation → the other participant is the recipient.
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('user_a, user_b, item_id')
    .eq('id', msg.conversation_id)
    .single()
  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const recipientId =
    conversation.user_a === msg.sender_id ? conversation.user_b : conversation.user_a

  const { data: recipient, error: recipError } = await supabase
    .from('profiles')
    .select('email, email_notifications, unsubscribe_token')
    .eq('id', recipientId)
    .single()
  if (recipError || !recipient) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
  }
  if (!recipient.email_notifications) {
    return NextResponse.json({ skipped: 'opted_out' })
  }

  // Rate limit: one email per (conversation, recipient) per window.
  const { data: logRow } = await supabase
    .from('notification_log')
    .select('last_notified_at')
    .eq('conversation_id', msg.conversation_id)
    .eq('recipient_id', recipientId)
    .single()
  if (logRow) {
    const elapsedMs = Date.now() - new Date(logRow.last_notified_at).getTime()
    if (elapsedMs < RATE_LIMIT_MINUTES * 60_000) {
      return NextResponse.json({ skipped: 'rate_limited' })
    }
  }

  const [{ data: sender }, { data: item }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', msg.sender_id).single(),
    supabase.from('items').select('title').eq('id', conversation.item_id).single(),
  ])

  const { subject, html, text } = renderNewMessageEmail({
    senderName: sender?.display_name ?? 'A SlugFound user',
    itemTitle: item?.title ?? 'an item',
    messagePreview: buildPreview(msg.body),
    conversationUrl: `${appUrl()}/messages?c=${msg.conversation_id}`,
    unsubscribeUrl: `${appUrl()}/api/notifications/unsubscribe?token=${recipient.unsubscribe_token}`,
  })

  try {
    await sendEmail({ to: recipient.email, subject, html, text })
  } catch (err) {
    console.error('[notifications/new-message] send failed:', err)
    return NextResponse.json({ error: 'Email send failed' }, { status: 502 })
  }

  await supabase.from('notification_log').upsert(
    {
      conversation_id: msg.conversation_id,
      recipient_id: recipientId,
      last_notified_at: new Date().toISOString(),
    },
    { onConflict: 'conversation_id,recipient_id' },
  )

  return NextResponse.json({ sent: true })
}
