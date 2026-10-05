import { ImageResponse } from 'next/og'

// Gambar pratinjau tautan bawaan (WhatsApp, LinkedIn, Slack, dll.) untuk halaman tanpa gambar sendiri.
export const alt = 'LinkCode — Software Development Studio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#F3EEE6',
          color: '#1E211D',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 6, color: '#5C6E21', textTransform: 'uppercase' }}>
          Software Development Studio
        </div>
        <div style={{ display: 'flex', fontSize: 120, marginTop: 28, lineHeight: 1.05 }}>
          Link<span style={{ color: '#5C6E21', fontStyle: 'italic' }}>Code</span>
        </div>
        <div style={{ display: 'flex', fontSize: 40, marginTop: 36, color: '#5C6157', maxWidth: 900 }}>
          Karya yang sudah kami bangun, dan progress project yang bisa kamu pantau.
        </div>
      </div>
    ),
    { ...size },
  )
}
