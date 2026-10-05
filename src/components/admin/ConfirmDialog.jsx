'use client'

import { useEffect } from 'react'

// Dialog konfirmasi untuk aksi destruktif.
export default function ConfirmDialog({ title, children, confirmLabel = 'Hapus', busy = false, error = '', onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div role="dialog" aria-modal="true" aria-label={title} className="a-card w-full max-w-sm p-6 shadow-xl">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="mt-2 text-sm leading-relaxed text-neutral-600">{children}</div>
        {error && (
          <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="a-btn-secondary" disabled={busy}>
            Batal
          </button>
          <button type="button" onClick={onConfirm} className="a-btn-danger" disabled={busy}>
            {busy ? 'Memproses…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
