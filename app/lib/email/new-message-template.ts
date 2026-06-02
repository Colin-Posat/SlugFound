/**
 * Branded "new message" email template (US 4.4).
 *
 * Pure function — takes already-resolved values and returns subject/html/text.
 * User-provided fields are HTML-escaped to prevent injection into the email.
 */

export const MESSAGE_PREVIEW_MAX = 120

/** Trim a message body to a short preview (≤ max chars, ellipsised). */
export function buildPreview(body: string, max = MESSAGE_PREVIEW_MAX): string {
  const trimmed = body.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

export interface NewMessageEmailData {
  senderName: string
  itemTitle: string
  messagePreview: string
  conversationUrl: string
  unsubscribeUrl: string
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export function renderNewMessageEmail(data: NewMessageEmailData): RenderedEmail {
  const sender = escapeHtml(data.senderName)
  const item = escapeHtml(data.itemTitle)
  const preview = escapeHtml(data.messagePreview)
  const { conversationUrl, unsubscribeUrl } = data

  const subject = `New message from ${data.senderName} on SlugFound`

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#09090b;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;">
    <div style="max-width:480px;margin:0 auto;padding:24px;">
      <div style="padding:16px 0;font-size:20px;font-weight:700;">
        <span style="color:#facc15;">Slug</span><span style="color:#ffffff;">Found</span>
      </div>
      <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px;">
        <p style="margin:0 0 4px;font-size:14px;color:#a1a1aa;">New message from</p>
        <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#ffffff;">${sender}</p>
        <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#71717a;">About</p>
        <p style="margin:0 0 16px;font-size:14px;color:#e4e4e7;">${item}</p>
        <blockquote style="margin:0 0 24px;padding:12px 16px;background:#09090b;border-left:3px solid #facc15;border-radius:8px;font-size:14px;color:#d4d4d8;">${preview}</blockquote>
        <a href="${conversationUrl}" style="display:block;text-align:center;background:#facc15;color:#09090b;font-weight:700;font-size:14px;text-decoration:none;padding:12px 20px;border-radius:9999px;">Reply in App</a>
      </div>
      <p style="margin:20px 0 0;font-size:11px;color:#52525b;text-align:center;">
        You're receiving this because you have email notifications on.<br/>
        <a href="${unsubscribeUrl}" style="color:#71717a;">Unsubscribe from message emails</a>
      </p>
    </div>
  </body>
</html>`

  const text = [
    `New message from ${data.senderName} on SlugFound`,
    ``,
    `About: ${data.itemTitle}`,
    `"${data.messagePreview}"`,
    ``,
    `Reply in app: ${conversationUrl}`,
    ``,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n')

  return { subject, html, text }
}
