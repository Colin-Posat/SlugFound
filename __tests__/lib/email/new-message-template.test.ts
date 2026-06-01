import {
  buildPreview,
  renderNewMessageEmail,
  MESSAGE_PREVIEW_MAX,
} from '@/app/lib/email/new-message-template'

describe('buildPreview', () => {
  it('returns short bodies unchanged (trimmed)', () => {
    expect(buildPreview('  Hello there  ')).toBe('Hello there')
  })

  it('truncates long bodies to the max length with an ellipsis', () => {
    const long = 'a'.repeat(200)
    const preview = buildPreview(long)
    expect(preview.length).toBeLessThanOrEqual(MESSAGE_PREVIEW_MAX)
    expect(preview.endsWith('…')).toBe(true)
  })
})

describe('renderNewMessageEmail', () => {
  const base = {
    senderName: 'Sammy Slug',
    itemTitle: 'Blue Hydro Flask',
    messagePreview: 'Is this still available?',
    conversationUrl: 'https://app.test/messages?c=conv-1',
    unsubscribeUrl: 'https://app.test/api/notifications/unsubscribe?token=abc',
  }

  it('includes sender, item, preview, and both links in the HTML', () => {
    const { html, subject } = renderNewMessageEmail(base)
    expect(subject).toContain('Sammy Slug')
    expect(html).toContain('Sammy Slug')
    expect(html).toContain('Blue Hydro Flask')
    expect(html).toContain('Is this still available?')
    expect(html).toContain(base.conversationUrl)
    expect(html).toContain(base.unsubscribeUrl)
  })

  it('produces a plain-text alternative with the reply link', () => {
    const { text } = renderNewMessageEmail(base)
    expect(text).toContain('Blue Hydro Flask')
    expect(text).toContain(base.conversationUrl)
  })

  it('escapes HTML in user-provided fields to prevent injection', () => {
    const { html } = renderNewMessageEmail({
      ...base,
      senderName: '<script>alert(1)</script>',
    })
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
