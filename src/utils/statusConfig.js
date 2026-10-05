// Label, warna, dan urutan untuk tiap status project.
export const STATUS_CONFIG = {
  active: { label: 'Active', bgColor: '#E8EDD5', textColor: '#46541A', barColor: '#5C6E21' },
  review: { label: 'In Review', bgColor: '#EFE6D3', textColor: '#7A6440', barColor: '#B8A58A' },
  hold: { label: 'On Hold', bgColor: '#F6E1E1', textColor: '#9A2F36', barColor: '#BD3D44' },
  done: { label: 'Done', bgColor: '#E4E6E1', textColor: '#1E211D', barColor: '#1E211D' },
}

// Daftar status untuk filter pills & form select (urut tampil).
export const STATUS_ORDER = ['active', 'review', 'hold', 'done']

export const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.active
