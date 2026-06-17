const express = require('express')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

router.use(authenticateToken)

// Recommendations (dynamic, non-persisted list)
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user.id
    const { generateAlerts } = require('../services/alertEngine.service')
    const alerts = await generateAlerts(userId)
    res.json({ recommendations: alerts })
  } catch (e) {
    console.error('Get recommendations error:', e)
    res.status(500).json({ message: 'Failed to compute recommendations' })
  }
})

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const { unreadOnly } = req.query

    let query = 'SELECT * FROM risk_alerts WHERE user_id = $1'
    const params = [userId]

    if (unreadOnly === 'true') {
      query += ' AND is_read = false'
    }

    query += ' ORDER BY created_at DESC LIMIT 50'

    const result = await pool.query(query, params)
    res.json({ alerts: result.rows })
  } catch (error) {
    console.error('Get alerts error:', error)
    res.status(500).json({ message: 'Failed to fetch alerts' })
  }
})

// Mark alert as read
router.patch('/:id/read', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'UPDATE risk_alerts SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Alert not found' })
    }

    res.json({ alert: result.rows[0] })
  } catch (error) {
    console.error('Mark alert read error:', error)
    res.status(500).json({ message: 'Failed to update alert' })
  }
})

// Mark all alerts as read
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.id

    await pool.query(
      'UPDATE risk_alerts SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    )

    res.json({ message: 'All alerts marked as read' })
  } catch (error) {
    console.error('Mark all alerts read error:', error)
    res.status(500).json({ message: 'Failed to update alerts' })
  }
})

// Delete alert
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM risk_alerts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Alert not found' })
    }

    res.json({ message: 'Alert deleted successfully' })
  } catch (error) {
    console.error('Delete alert error:', error)
    res.status(500).json({ message: 'Failed to delete alert' })
  }
})

// Check and generate alerts (called periodically)
router.post('/check', async (req, res) => {
  try {
    const userId = req.user.id
    const { generateAlerts, persistAlerts } = require('../services/alertEngine.service')
    const alerts = await generateAlerts(userId)
    await persistAlerts(userId, alerts)
    res.json({ alerts, count: alerts.length })
  } catch (error) {
    console.error('Check alerts error:', error)
    res.status(500).json({ message: 'Failed to check alerts' })
  }
})

module.exports = router
