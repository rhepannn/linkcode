import jwt from 'jsonwebtoken'

// Verify JWT dari header `Authorization: Bearer <token>`.
// Reject (401) jika header tidak ada, token invalid, atau expired.
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token tidak ditemukan.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = payload // { id, username }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' })
  }
}
