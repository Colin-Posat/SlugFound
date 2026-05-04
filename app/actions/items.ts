'use server'

/**
 * Server actions for item CRUD (US 2.4).
 *
 * Used by:
 *   - Create form  → createItem()
 *
 * Image uploads go to the `item-images` Storage bucket under a folder named
 * after the user's id (matches the RLS policy in migration 0003). The public
 * URL is stored on the item row.
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { CreateItemSchema, type CreateItemFormState } from '@/app/lib/item-schemas'

// ─── Constants ─────────────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

// ─── Action ────────────────────────────────────────────────────────────────

export async function createItem(
  _state: CreateItemFormState,
  formData: FormData,
): Promise<CreateItemFormState> {
  const supabase = await createSupabaseServerClient()

  // Auth check — middleware also enforces this, but we double-check so we can
  // fail with a clean error message instead of a blank crash.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'You must be signed in to create a listing.' }
  }

  const validated = CreateItemSchema.safeParse({
    type: formData.get('type'),
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    location: formData.get('location'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  // ── Optional image upload ───────────────────────────────────────────────
  const photo = formData.get('photo') as File | null
  let imageUrl: string | null = null

  if (photo && photo.size > 0) {
    if (photo.size > MAX_IMAGE_BYTES) {
      return { errors: { photo: ['Image must be 5 MB or smaller.'] } }
    }
    if (!ALLOWED_MIME.includes(photo.type)) {
      return { errors: { photo: ['Image must be JPG, PNG, or WebP.'] } }
    }

    // Path format MUST start with the user's id so the storage RLS policy
    // (storage.foldername(name)[1] = auth.uid()::text) accepts the upload.
    const ext = photo.name.split('.').pop() ?? 'bin'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(path, photo, { contentType: photo.type, upsert: false })

    if (uploadError) {
      return { errors: { photo: [`Image upload failed: ${uploadError.message}`] } }
    }

    const { data } = supabase.storage.from('item-images').getPublicUrl(path)
    imageUrl = data.publicUrl
  }

  // ── Insert ───────────────────────────────────────────────────────────────
  // RLS guarantees user_id matches auth.uid(), so we can safely set it client-side.
  const { error: insertError } = await supabase.from('items').insert({
    user_id: user.id,
    type: validated.data.type,
    title: validated.data.title,
    description: validated.data.description,
    category: validated.data.category,
    location: validated.data.location,
    image_url: imageUrl,
  })

  if (insertError) {
    return { message: `Could not save listing: ${insertError.message}` }
  }

  // Refresh the cached lost/found listings so the new item appears immediately
  revalidatePath('/lost')
  revalidatePath('/found')
  revalidatePath('/profile')

  redirect(validated.data.type === 'lost' ? '/lost' : '/found')
}

/**
 * Update the status of an item (active / claimed / resolved).
 * Only the item owner can call this — RLS enforces it server-side.
 *
 * Called from the item detail page when the owner clicks "Mark as resolved"
 * or similar. Returns `{ error }` on failure for the client to show a toast.
 */
export async function updateItemStatus(
  itemId: string,
  status: 'active' | 'claimed' | 'resolved',
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be signed in to update an item.' }
  }

  // RLS verifies user_id = auth.uid() — we don't need to check ownership here
  // because Postgres rejects the update for non-owners.
  const { error } = await supabase
    .from('items')
    .update({ status })
    .eq('id', itemId)

  if (error) {
    return { error: `Could not update status: ${error.message}` }
  }

  revalidatePath('/lost')
  revalidatePath('/found')
  revalidatePath('/profile')
  revalidatePath(`/lost/${itemId}`)
  revalidatePath(`/found/${itemId}`)

  return {}
}
