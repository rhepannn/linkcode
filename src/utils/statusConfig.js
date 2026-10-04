// Label, warna, dan urutan untuk tiap status project.
export const STATUS_CONFIG = {
  active: { label: 'Active', bgColor: '#E6F4E6', textColor: '#2E7D32', barColor: '#4A90D9' },
  review: { label: 'In Review', bgColor: '#E3F0FB', textColor: '#1565C0', barColor: '#1E5FA8' },
  hold: { label: 'On Hold', bgColor: '#FFF8E1', textColor: '#F57F17', barColor: '#F9A825' },
  done: { label: 'Done', bgColor: '#E8F5E9', textColor: '#1B5E20', barColor: '#2E7D32' },
}

// Daftar status untuk filter pills & form select (urut tampil).
export const STATUS_ORDER = ['active', 'review', 'hold', 'done']

export const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.active
