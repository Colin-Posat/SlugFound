'use server'

/**
 * Server actions for editing the signed-in user's profile (US 4.5).
 *
 * Avatars upload to the `avatars` Storage bucket under a folder named after the
 * user's id (matches the RLS policy in migration 0008). The old avatar is
 * removed after a successful update so the bucket doesn't accumulate orphans.
 */

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { storagePathFromPublicUrl } from '@/app/lib/storage'
import {
  UpdateProfileSchema,
  type UpdateProfileFormState,
} from '@/app/lib/profile-schemas'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

export async function updateProfile(
  _state: UpdateProfileFormState,
  formData: FormData,
): Promise<UpdateProfileFormState> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'You must be signed in to edit your profile.' }
  }

  const validated = UpdateProfileSchema.safeParse({
    display_name: formData.get('display_name'),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  // Current avatar (for cleanup after a successful replacement).
  const { data: existing } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  // ── Optional avatar upload ────────────────────────────────────────────────
  const avatar = formData.get('avatar') as File | null
  let nextAvatarUrl: string | undefined

  if (avatar && avatar.size > 0) {
    if (avatar.size > MAX_AVATAR_BYTES) {
      return { errors: { avatar: ['Image must be 2 MB or smaller.'] } }
    }
    if (!ALLOWED_MIME.includes(avatar.type)) {
      return { errors: { avatar: ['Image must be JPG, PNG, or WebP.'] } }
    }

    const ext = avatar.name.split('.').pop() ?? 'bin'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatar, { contentType: avatar.type, upsert: false })

    if (uploadError) {
      return { errors: { avatar: [`Avatar upload failed: ${uploadError.message}`] } }
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    nextAvatarUrl = data.publicUrl
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      display_name: validated.data.display_name,
      ...(nextAvatarUrl !== undefined ? { avatar_url: nextAvatarUrl } : {}),
    })
    .eq('id', user.id)

  if (updateError) {
    return { message: `Could not save profile: ${updateError.message}` }
  }

  // Best-effort cleanup of the previous avatar.
  if (nextAvatarUrl !== undefined && existing?.avatar_url) {
    const oldPath = storagePathFromPublicUrl(existing.avatar_url, 'avatars')
    if (oldPath) {
      await supabase.storage.from('avatars').remove([oldPath])
    }
  }

  // Refresh joins that embed the poster/sender profile so name + avatar update.
  revalidatePath('/profile')
  revalidatePath('/lost')
  revalidatePath('/found')
  revalidatePath('/messages')

  return { success: true }
}

/**
 * Toggle the new-message email notification preference (US 4.4).
 * Returns `{ error }` on failure so the client can revert its optimistic state.
 */
export async function updateEmailNotifications(
  enabled: boolean,
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be signed in.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ email_notifications: enabled })
    .eq('id', user.id)

  if (error) {
    return { error: `Could not update preference: ${error.message}` }
  }

  revalidatePath('/profile')
  return {}
}
