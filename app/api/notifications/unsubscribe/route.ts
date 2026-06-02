import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/app/lib/supabase/admin'

/**
 * One-click unsubscribe (US 4.4).
 *
 * Linked from the email footer: GET ?token=<unsubscribe_token> flips the
 * recipient's email_notifications to false. Uses the service role so it works
 * without a logged-in session (the token is the capability).
 */

const TokenSchema = z.string().uuid()

function htmlPage(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>` +
      `<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#09090b;color:#e4e4e7;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;">` +
      `<div style="text-align:center;max-width:420px;padding:24px;">` +
      `<div style="font-size:22px;font-weight:700;margin-bottom:12px;"><span style="color:#facc15;">Slug</span><span style="color:#fff;">Found</span></div>` +
      `<h2 style="margin:0 0 8px;">${title}</h2><p style="color:#a1a1aa;">${body}</p></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  const parsed = TokenSchema.safeParse(token)
  if (!parsed.success) {
    return htmlPage('Invalid link', 'This unsubscribe link is not valid.')
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ email_notifications: false })
    .eq('unsubscribe_token', parsed.data)

  if (error) {
    return htmlPage('Something went wrong', 'Please try again later.')
  }

  return htmlPage(
    'Unsubscribed',
    'You will no longer receive email notifications for new messages. You can re-enable them anytime in your account settings.',
  )
}
