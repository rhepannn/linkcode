'use client'

import { useMemo, useState } from 'react'
import { Crown, Plus, Trash2 } from 'lucide-react'
import Avatar from '../../Avatar.jsx'
import { setProjectTeam } from '../../../api/client.js'

// Susunan tim project. PIC utama dipilih MANUAL (bukan ditentukan oleh besar kontribusi).
// Setiap perubahan langsung disimpan (replace seluruh tim) lewat `act`.
export default function TeamTab({ project, members, act }) {
  const [addId, setAddId] = useState('')

  const toPayload = (list) => list.map((t) => ({ memberId: t.memberId, role: t.role, contribution: t.contribution }))
  const save = (list) => act(() => setProjectTeam(project.id, toPayload(list)))

  const inTeam = new Set(project.team.map((t) => t.memberId))
  const available = useMemo(() => members.filter((m) => m.active && !inTeam.has(m.id)), [members, project.team])

  const openFeatures = (memberId) =>
    project.features.filter((f) => f.assigneeId === memberId && f.status !== 'done').length

  const totalContribution = project.team.reduce((s, t) => s + t.contribution, 0)

  const setLead = (memberId) =>
    save(project.team.map((t) => ({ ...t, role: t.memberId === memberId ? 'lead' : 'member' })))
  const clearLead = () => save(project.team.map((t) => ({ ...t, role: 'member' })))
  const setContribution = (memberId, value) =>
    save(project.team.map((t) => (t.memberId === memberId ? { ...t, contribution: Number(value) || 0 } : t)))
  const remove = (memberId) => save(project.team.filter((t) => t.memberId !== memberId))
  const add = async () => {
    if (!addId) return
    const memberId = Number(addId)
    setAddId('')
    await save([...project.team, { memberId, role: 'member', contribution: 0 }])
  }

  const lead = project.team.find((t) => t.role === 'lead')

  return (
    <div>
      <div className="mb-4 rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
        <span className="font-medium text-neutral-900">PIC utama: </span>
        {lead ? lead.name : 'belum dipilih'}. PIC utama ditentukan manual lewat ikon{' '}
        <Crown size={13} className="inline -translate-y-px text-amber-600" /> dan tidak bergantung pada besar kontribusi.
      </div>

      {project.team.length === 0 ? (
        <p className="a-card py-10 text-center text-sm text-neutral-500">Belum ada anggota tim di project ini.</p>
      ) : (
        <>
<div className="a-card hidden overflow-x-auto xl:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Anggota</th>
                <th className="px-4 py-3 font-medium">Peran</th>
                <th className="px-4 py-3 font-medium">Kontribusi</th>
                <th className="px-4 py-3 font-medium">Fitur aktif</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {project.team.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.name} color={t.avatarColor} size={32} ring={false} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-900">
                          {t.name}
                          {t.role === 'lead' && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              <Crown size={11} /> PIC utama
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-500">{t.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.role === 'lead' ? (
                      <button type="button" onClick={clearLead} className="text-xs text-neutral-500 hover:text-neutral-900 hover:underline">
                        Cabut PIC utama
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLead(t.memberId)}
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:border-amber-500 hover:text-amber-800"
                      >
                        <Crown size={12} /> Jadikan PIC utama
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative w-20">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={t.contribution}
                        key={`${t.id}-${t.contribution}`}
                        onBlur={(e) => {
                          const v = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                          if (v !== t.contribution) setContribution(t.memberId, v)
                        }}
                        className="a-input pr-6"
                        aria-label={`Kontribusi ${t.name} (%)`}
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{openFeatures(t.memberId)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(t.memberId)}
                      className="rounded p-2 text-neutral-400 hover:bg-red-50 hover:text-clay"
                      aria-label={`Keluarkan ${t.name} dari project`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                <td className="px-4 py-2" colSpan={2}>Total kontribusi</td>
                <td className={`px-4 py-2 font-medium tabular-nums ${totalContribution === 100 ? 'text-olive-dark' : ''}`} colSpan={3}>
                  {totalContribution}% {totalContribution !== 100 && <span className="font-normal text-neutral-400">(informasi saja)</span>}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
<ul className="space-y-3 xl:hidden">
  {project.team.map((t) => (
    <li key={t.id} className="a-card p-4">
      <div className="flex items-center gap-3">
        <Avatar name={t.name} color={t.avatarColor} size={40} ring={false} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-900">{t.name}</p>
          <p className="truncate text-xs text-neutral-500">{t.title} · {openFeatures(t.memberId)} fitur aktif</p>
        </div>
        {t.role === 'lead' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            <Crown size={11} /> PIC utama
          </span>
        )}
      </div>

      <div className="mt-3 flex items-end gap-3">
        <div className="w-24">
          <label className="a-label" htmlFor={`m-contrib-${t.id}`}>Kontribusi</label>
          <div className="relative">
            <input
              id={`m-contrib-${t.id}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              defaultValue={t.contribution}
              key={`m-${t.id}-${t.contribution}`}
              onBlur={(e) => {
                const v = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                if (v !== t.contribution) setContribution(t.memberId, v)
              }}
              className="a-input pr-6"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
          </div>
        </div>
        {t.role === 'lead' ? (
          <button type="button" onClick={clearLead} className="a-btn-secondary flex-1 text-xs">
            Cabut PIC utama
          </button>
        ) : (
          <button type="button" onClick={() => setLead(t.memberId)} className="a-btn-secondary flex-1 text-xs">
            <Crown size={13} /> Jadikan PIC utama
          </button>
        )}
        <button
          type="button"
          onClick={() => remove(t.memberId)}
          className="a-btn-secondary px-3 text-clay hover:bg-red-50"
          aria-label={`Keluarkan ${t.name} dari project`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  ))}
  <li className="px-1 text-xs text-neutral-500">Total kontribusi: {totalContribution}%</li>
</ul>
</>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={addId} onChange={(e) => setAddId(e.target.value)} className="a-input w-auto min-w-[14rem]" aria-label="Pilih anggota untuk ditambahkan">
          <option value="">Tambah anggota…</option>
          {available.map((m) => (
            <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
          ))}
        </select>
        <button type="button" onClick={add} disabled={!addId} className="a-btn-secondary">
          <Plus size={15} /> Tambahkan
        </button>
        {available.length === 0 && (
          <span className="text-xs text-neutral-500">Semua anggota aktif sudah ada di tim. Tambah orang baru di menu Tim.</span>
        )}
      </div>
    </div>
  )
}
