const jwt = require('jsonwebtoken')
const pool = require('../config/database')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Access token required' })
    }

    // ✅ verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ✅ SUPPORT BOTH id AND userId (prevents future bugs)
    const userId = decoded.id || decoded.userId

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' })
    }

    // ✅ verify user still exists
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' })
    }

    // ✅ attach user to request
    req.user = result.rows[0]

    next()
  } catch (error) {
    console.error('Auth middleware error:', error.message)

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' })
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired' })
    }

    return res.status(500).json({ message: 'Authentication error' })
  }
}

module.exports = { authenticateToken }
