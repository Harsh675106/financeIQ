const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

router.use(authenticateToken)

// Get all goals
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const { status } = req.query

    let query = 'SELECT * FROM goals WHERE user_id = $1'
    const params = [userId]

    if (status) {
      query += ' AND status = $2'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC'

    const result = await pool.query(query, params)
    res.json({ goals: result.rows })
  } catch (error) {
    console.error('Get goals error:', error)
    res.status(500).json({ message: 'Failed to fetch goals' })
  }
})

// Get goal by ID
router.get('/:id(\\d+)', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Goal not found' })
    }

    res.json({ goal: result.rows[0] })
  } catch (error) {
    console.error('Get goal error:', error)
    res.status(500).json({ message: 'Failed to fetch goal' })
  }
})

// Create goal
router.post('/', [
  body('name').trim().notEmpty(),
  body('target_amount').isFloat({ min: 0 }),
  body('target_date').optional().isISO8601().toDate(),
  body('monthly_contribution').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { name, target_amount, target_date, monthly_contribution } = req.body

    const result = await pool.query(
      `INSERT INTO goals (user_id, name, target_amount, target_date, monthly_contribution, current_amount)
       VALUES ($1, $2, $3, $4, $5, 0)
       RETURNING *`,
      [userId, name, target_amount, target_date || null, monthly_contribution || 0]
    )

    res.status(201).json({ goal: result.rows[0] })
  } catch (error) {
    console.error('Create goal error:', error)
    res.status(500).json({ message: 'Failed to create goal' })
  }
})

// Update goal
router.put('/:id(\\d+)', [
  body('name').optional().trim().notEmpty(),
  body('target_amount').optional().isFloat({ min: 0 }),
  body('target_date').optional().isISO8601().toDate(),
  body('monthly_contribution').optional().isFloat({ min: 0 }),
  body('current_amount').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'completed', 'paused']),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { id } = req.params
    const updates = req.body

    const fields = []
    const values = []
    let paramCount = 1

    Object.keys(updates).forEach(key => {
      if (['name', 'target_amount', 'target_date', 'monthly_contribution', 'current_amount', 'status'].includes(key)) {
        fields.push(`${key} = $${paramCount++}`)
        values.push(updates[key])
      }
    })

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id, userId)

    const result = await pool.query(
      `UPDATE goals SET ${fields.join(', ')}
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      [...values]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Goal not found' })
    }

    res.json({ goal: result.rows[0] })
  } catch (error) {
    console.error('Update goal error:', error)
    res.status(500).json({ message: 'Failed to update goal' })
  }
})

// Delete goal
router.delete('/:id(\\d+)', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Goal not found' })
    }

    res.json({ message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Delete goal error:', error)
    res.status(500).json({ message: 'Failed to delete goal' })
  }
})

// Calculate goal progress
router.get('/:id(\\d+)/progress', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Goal not found' })
    }

    const goal = result.rows[0]
    const progress = (goal.current_amount / goal.target_amount) * 100
    const remaining = goal.target_amount - goal.current_amount
    const monthsRemaining = goal.target_date 
      ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30))
      : null
    const requiredMonthly = monthsRemaining && monthsRemaining > 0
      ? remaining / monthsRemaining
      : null

    res.json({
      progress: Math.min(100, Math.max(0, progress)),
      remaining,
      monthsRemaining,
      requiredMonthly,
      goal,
    })
  } catch (error) {
    console.error('Get goal progress error:', error)
    res.status(500).json({ message: 'Failed to calculate progress' })
  }
})

// Projections: completion date, feasibility score
router.get('/projections/all', async (req, res) => {
  try {
    const userId = req.user.id
    const expectedReturn = req.query.expectedReturn ? parseFloat(String(req.query.expectedReturn)) : 0.08
    const inflation = req.query.inflation ? parseFloat(String(req.query.inflation)) : 0.03
    const { getUserGoalProjections } = require('../services/goalProjection.service')
    const result = await getUserGoalProjections(userId, { expectedReturn, inflation })
    res.json({ projections: result })
  } catch (e) {
    console.error('Goal projections error:', e)
    res.status(500).json({ message: 'Failed to compute projections' })
  }
})

// Add contribution to goal
router.post('/:id(\\d+)/contribute', [
  body('amount').isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { id } = req.params
    const { amount } = req.body

    // Get current goal
    const goalResult = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (goalResult.rows.length === 0) {
      return res.status(404).json({ message: 'Goal not found' })
    }

    const goal = goalResult.rows[0]
    const newAmount = Math.min(
      parseFloat(goal.current_amount) + parseFloat(amount),
      parseFloat(goal.target_amount)
    )

    // Update goal with new amount
    const result = await pool.query(
      `UPDATE goals SET current_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newAmount, id]
    )

    res.json({ goal: result.rows[0], added: parseFloat(amount) })
  } catch (error) {
    console.error('Contribute to goal error:', error)
    res.status(500).json({ message: 'Failed to contribute to goal' })
  }
})

module.exports = router
