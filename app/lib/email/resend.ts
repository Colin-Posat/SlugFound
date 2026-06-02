import 'server-only'
import { Resend } from 'resend'

/**
 * Thin wrapper around the Resend SDK (US 4.4). Reads RESEND_API_KEY at call time
 * so the rest of the app can be imported without the key being present.
 */
export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not set')
  }

  // Defaults to Resend's shared test sender so the flow works before a custom
  // domain is verified. Override with EMAIL_FROM once a domain is set up.
  const from = process.env.EMAIL_FROM ?? 'SlugFound <onboarding@resend.dev>'

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({ from, to, subject, html, text })

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`)
  }
}
