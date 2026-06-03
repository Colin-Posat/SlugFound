'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/app/lib/supabase/client'
import type { ChatMessage } from '@/app/lib/definitions'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface MessageComposerProps {
  conversationId: string
  currentUserId: string
  onSend: (message: ChatMessage) => void
}

export default function MessageComposer({
  conversationId,
  currentUserId,
  onSend,
}: MessageComposerProps) {
  const [draft, setDraft] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef(createSupabaseBrowserClient())

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be 10 MB or smaller.')
      e.target.value = ''
      return
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error('Image must be JPG, PNG, WebP, or GIF.')
      e.target.value = ''
      return
    }

    // Revoke previous preview to avoid memory leaks.
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)

    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  function removeImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(null)
    setImagePreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSend() {
    const trimmed = draft.trim()
    // Must have either text or an image.
    if (!trimmed && !imageFile) return

    setUploading(true)

    try {
      let storageUrl: string | undefined

      if (imageFile) {
        const supabase = supabaseRef.current
        const ext = imageFile.name.split('.').pop() ?? 'bin'
        const path = `${currentUserId}/${crypto.randomUUID()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('message-images')
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false })

        if (uploadError) {
          toast.error(`Image upload failed: ${uploadError.message}`)
          return
        }

        const { data } = supabase.storage.from('message-images').getPublicUrl(path)
        storageUrl = data.publicUrl
      }

      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        conversationId,
        senderId: currentUserId,
        body: trimmed,
        imageUrl: storageUrl,
        sentAt: new Date().toISOString(),
      }

      onSend(newMessage)

      // Clear composer state.
      setDraft('')
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
      setImageFile(null)
      setImagePreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !uploading) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = (draft.trim().length > 0 || imageFile !== null) && !uploading

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-line p-4">
      {/* Image preview row */}
      {imagePreviewUrl && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreviewUrl}
            alt="Attachment preview"
            className="h-24 max-w-[180px] rounded-xl border border-line object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            aria-label="Remove image"
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-lost text-[10px] font-bold text-white shadow"
          >
            ×
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Photo attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Attach photo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-base text-muted transition hover:border-gold hover:text-ink disabled:opacity-40"
        >
          📷
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileSelect}
        />

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={uploading}
          className="flex-1 resize-none rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder-muted outline-none focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-60"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-lg font-bold text-on-gold transition hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-gold border-t-transparent" />
          ) : (
            '↑'
          )}
        </button>
      </div>
    </div>
  )
}
