'use client'

/**
 * Overflow "⋯" menu with a Report action for an item detail page (US 4.6).
 *
 * Rendered only for non-owners. Opens a modal with a reason dropdown and an
 * optional notes field. A second report from the same user is reported back as
 * "already reported" (the DB unique constraint prevents duplicate rows).
 */

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { reportItem } from '@/app/actions/reports'
import { REPORT_REASONS, type ReportReason } from '@/app/lib/definitions'

const MAX_NOTES = 300

export default function ReportMenu({ itemId }: { itemId: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [alreadyReported, setAlreadyReported] = useState(false)
  const [reason, setReason] = useState<ReportReason>('spam')
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()

  function openReportModal() {
    setMenuOpen(false)
    setAlreadyReported(false)
    setModalOpen(true)
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await reportItem({ itemId, reason, notes })
      if ('alreadyReported' in result) {
        setAlreadyReported(true)
        return
      }
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success('Thanks — our team will review this.')
      setModalOpen(false)
      setNotes('')
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="More options"
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-lg text-zinc-400 transition hover:border-zinc-500 hover:text-white"
      >
        ⋯
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={openReportModal}
            className="block w-full px-4 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            🚩 Report
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            {alreadyReported ? (
              <>
                <h3 className="text-lg font-bold text-white">Already reported</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  You&apos;ve already reported this listing. Our team will review it.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mt-6 w-full rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white">Report this listing</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Help keep SlugFound safe. Tell us what&apos;s wrong.
                </p>

                <div className="mt-4 flex flex-col gap-1.5">
                  <label htmlFor="report-reason" className="text-sm font-medium text-zinc-300">
                    Reason
                  </label>
                  <select
                    id="report-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ReportReason)}
                    className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                  <label htmlFor="report-notes" className="text-sm font-medium text-zinc-300">
                    Notes <span className="font-normal text-zinc-600">(optional)</span>
                  </label>
                  <textarea
                    id="report-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={MAX_NOTES}
                    placeholder="Add any details…"
                    className="resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleSubmit}
                    className="flex flex-1 items-center justify-center rounded-full bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-yellow-300 disabled:opacity-50"
                  >
                    {pending ? 'Submitting…' : 'Submit report'}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setModalOpen(false)}
                    className="flex-1 rounded-full border border-zinc-700 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
