'use client'

// Saklar kecil (role="switch") untuk flag boolean di admin. Lebih besar di layar kecil agar mudah disentuh.
export default function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 lg:h-5 lg:w-9 ${
        checked ? 'bg-olive' : 'bg-neutral-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform lg:h-4 lg:w-4 ${
          checked ? 'translate-x-[22px] lg:translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
