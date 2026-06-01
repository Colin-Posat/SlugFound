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
import { storagePathFromPublicUrl } from '@/app/lib/storage'
import {
  CreateItemSchema,
  UpdateItemSchema,
  type CreateItemFormState,
  type UpdateItemFormState,
} from '@/app/lib/item-schemas'

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
    lat: formData.get('lat'),
    lng: formData.get('lng'),
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
    lat: validated.data.lat ?? null,
    lng: validated.data.lng ?? null,
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
  revalidatePath(`/items/${itemId}`)

  return {}
}

/**
 * Update an existing item (US 4.2).
 *
 * Bound to the item id via `updateItem.bind(null, itemId)` so it works with
 * useActionState. Ownership is enforced by RLS *and* re-checked here so we can
 * return a clean message. When a new photo is uploaded, the old Storage object
 * is removed after the row update succeeds (best-effort).
 */
export async function updateItem(
  itemId: string,
  _state: UpdateItemFormState,
  formData: FormData,
): Promise<UpdateItemFormState> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'You must be signed in to edit a listing.' }
  }

  const validated = UpdateItemSchema.safeParse({
    type: formData.get('type'),
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    location: formData.get('location'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  // Load the current row so we have the old image to swap out, and to fail
  // cleanly if the listing is missing or not ours.
  const { data: existing, error: fetchError } = await supabase
    .from('items')
    .select('image_url, user_id')
    .eq('id', itemId)
    .single()

  if (fetchError || !existing) {
    return { message: 'Listing not found.' }
  }
  if (existing.user_id !== user.id) {
    return { message: 'You can only edit your own listings.' }
  }

  // ── Optional photo replacement ──────────────────────────────────────────
  // `undefined` => keep current image; a string => replace it.
  const photo = formData.get('photo') as File | null
  let nextImageUrl: string | undefined

  if (photo && photo.size > 0) {
    if (photo.size > MAX_IMAGE_BYTES) {
      return { errors: { photo: ['Image must be 5 MB or smaller.'] } }
    }
    if (!ALLOWED_MIME.includes(photo.type)) {
      return { errors: { photo: ['Image must be JPG, PNG, or WebP.'] } }
    }

    const ext = photo.name.split('.').pop() ?? 'bin'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(path, photo, { contentType: photo.type, upsert: false })

    if (uploadError) {
      return { errors: { photo: [`Image upload failed: ${uploadError.message}`] } }
    }

    const { data } = supabase.storage.from('item-images').getPublicUrl(path)
    nextImageUrl = data.publicUrl
  }

  const { error: updateError } = await supabase
    .from('items')
    .update({
      type: validated.data.type,
      title: validated.data.title,
      description: validated.data.description,
      category: validated.data.category,
      location: validated.data.location,
      lat: validated.data.lat ?? null,
      lng: validated.data.lng ?? null,
      ...(nextImageUrl !== undefined ? { image_url: nextImageUrl } : {}),
    })
    .eq('id', itemId)

  if (updateError) {
    return { message: `Could not save changes: ${updateError.message}` }
  }

  // Remove the previous image now that the new URL is persisted. Best-effort —
  // a failed cleanup shouldn't block the edit.
  if (nextImageUrl !== undefined && existing.image_url) {
    const oldPath = storagePathFromPublicUrl(existing.image_url)
    if (oldPath) {
      await supabase.storage.from('item-images').remove([oldPath])
    }
  }

  revalidatePath(`/items/${itemId}`)
  revalidatePath('/lost')
  revalidatePath('/found')
  revalidatePath('/profile')

  redirect(`/items/${itemId}`)
}

/**
 * Delete an item and its Storage image (US 4.2).
 *
 * Returns `{ error }` on failure so the client can show a toast; navigation
 * after a successful delete is handled client-side. RLS restricts deletes to
 * the owner; we re-check here for a clean message.
 */
export async function deleteItem(itemId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be signed in to delete a listing.' }
  }

  const { data: existing } = await supabase
    .from('items')
    .select('image_url, user_id')
    .eq('id', itemId)
    .single()

  if (!existing) {
    return { error: 'Listing not found.' }
  }
  if (existing.user_id !== user.id) {
    return { error: 'You can only delete your own listings.' }
  }

  const { error } = await supabase.from('items').delete().eq('id', itemId)
  if (error) {
    return { error: `Could not delete listing: ${error.message}` }
  }

  if (existing.image_url) {
    const path = storagePathFromPublicUrl(existing.image_url)
    if (path) {
      await supabase.storage.from('item-images').remove([path])
    }
  }

  revalidatePath('/lost')
  revalidatePath('/found')
  revalidatePath('/profile')

  return {}
}
