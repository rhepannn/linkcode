import { useRef, useState } from 'react'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { uploadMedia } from '../../api/client.js'

// Batas & jenis per kind (selaras dengan backend/lib/storage.js; server tetap memvalidasi ulang).
const KINDS = {
  thumbnail: { accept: 'image/jpeg,image/png,image/webp', maxMB: 8, label: 'JPG, PNG, atau WebP · maks 8 MB' },
  preview: { accept: 'image/jpeg,image/png,image/webp', maxMB: 12, label: 'JPG, PNG, atau WebP · maks 12 MB' },
  video: { accept: 'video/webm,video/mp4', maxMB: 25, label: 'WebM atau MP4 · maks 25 MB' },
}

// Satu kolom media: input URL/path + tombol unggah ke Storage + pratinjau.
export default function MediaField({ id, label, kind, value, onChange, slug, onUploaded, placeholder }) {
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null) // null = tidak sedang mengunggah
  const [error, setError] = useState('')
  const spec = KINDS[kind]
  const isVideo = kind === 'video'

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // izinkan memilih berkas yang sama lagi
    if (!file) return
    setError('')
    if (file.size > spec.maxMB * 1024 * 1024) return setError(`Ukuran melebihi ${spec.maxMB} MB.`)
    if (!spec.accept.split(',').includes(file.type)) return setError(`Jenis berkas tidak didukung (${spec.label}).`)

    setProgress(0)
    try {
      const { url } = await uploadMedia({ file, slug, kind, onProgress: setProgress })
      onUploaded?.(url)
      onChange(url)
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengunggah. Coba lagi.')
    } finally {
      setProgress(null)
    }
  }

  const uploading = progress !== null
  const noSlug = !slug

  return (
    <div>
      <label className="a-label" htmlFor={id}>{label}</label>
      <div className="flex gap-2">
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="a-input font-mono lg:text-xs" placeholder={placeholder} />
        <input ref={inputRef} type="file" accept={spec.accept} onChange={pick} className="sr-only" tabIndex={-1} aria-hidden="true" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || noSlug}
          title={noSlug ? 'Isi judul/slug terlebih dahulu' : `Unggah ${label.toLowerCase()}`}
          className="a-btn-secondary shrink-0"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          <span className="hidden sm:inline">{uploading ? `${progress}%` : 'Unggah'}</span>
        </button>
        {value && !uploading && (
          <button type="button" onClick={() => onChange('')} className="a-btn-secondary shrink-0 px-3 text-neutral-500" aria-label={`Kosongkan ${label}`}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {uploading && (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-olive transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
      {!error && !uploading && <p className="mt-1 text-xs text-neutral-400">{spec.label}</p>}

      {value &&
        (isVideo ? (
          <video src={value} preload="metadata" muted controls className="mt-2 h-28 w-auto max-w-full rounded border border-neutral-200 bg-neutral-100" />
        ) : (
          <img
            src={value}
            alt={`Pratinjau ${label}`}
            className="mt-2 h-24 w-auto max-w-full rounded border border-neutral-200 object-cover object-top"
            onError={(e) => (e.currentTarget.style.display = 'none')}
            onLoad={(e) => (e.currentTarget.style.display = '')}
          />
        ))}
    </div>
  )
}
