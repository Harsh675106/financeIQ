const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

router.use(authenticateToken)

// Get all savings
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const result = await pool.query(
      'SELECT * FROM savings WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    res.json({ savings: result.rows })
  } catch (error) {
    console.error('Get savings error:', error)
    res.status(500).json({ message: 'Failed to fetch savings' })
  }
})

// Get total savings
router.get('/total', async (req, res) => {
  try {
    const userId = req.user.id
    const result = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM savings WHERE user_id = $1',
      [userId]
    )
    res.json({ total: parseFloat(result.rows[0].total) || 0 })
  } catch (error) {
    console.error('Get total savings error:', error)
    res.status(500).json({ message: 'Failed to fetch total savings' })
  }
})

// Get savings by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'SELECT * FROM savings WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Savings entry not found' })
    }

    res.json({ savings: result.rows[0] })
  } catch (error) {
    console.error('Get savings error:', error)
    res.status(500).json({ message: 'Failed to fetch savings' })
  }
})

// Create savings
router.post('/', [
  body('amount').isFloat({ min: 0 }),
  body('account_type').optional().trim(),
  body('description').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { amount, account_type, description } = req.body

    const result = await pool.query(
      `INSERT INTO savings (user_id, amount, account_type, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, amount, account_type || 'Savings Account', description || '']
    )

    res.status(201).json({ savings: result.rows[0] })
  } catch (error) {
    console.error('Create savings error:', error)
    res.status(500).json({ message: 'Failed to create savings' })
  }
})

// Update savings
router.put('/:id', [
  body('amount').optional().isFloat({ min: 0 }),
  body('account_type').optional().trim(),
  body('description').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { id } = req.params
    const { amount, account_type, description } = req.body

    // Check ownership
    const checkResult = await pool.query(
      'SELECT id FROM savings WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Savings entry not found' })
    }

    // Build update query
    const updates = []
    const params = []
    let paramCount = 1

    if (amount !== undefined) {
      updates.push(`amount = $${paramCount++}`)
      params.push(amount)
    }
    if (account_type !== undefined) {
      updates.push(`account_type = $${paramCount++}`)
      params.push(account_type)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      params.push(description)
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    params.push(id, userId)

    const query = `UPDATE savings SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount++} RETURNING *`

    const result = await pool.query(query, params)

    res.json({ savings: result.rows[0] })
  } catch (error) {
    console.error('Update savings error:', error)
    res.status(500).json({ message: 'Failed to update savings' })
  }
})

// Delete savings
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM savings WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Savings entry not found' })
    }

    res.json({ message: 'Savings deleted successfully' })
  } catch (error) {
    console.error('Delete savings error:', error)
    res.status(500).json({ message: 'Failed to delete savings' })
  }
})

module.exports = router
