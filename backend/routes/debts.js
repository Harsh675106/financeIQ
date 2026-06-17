const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

router.use(authenticateToken)

// Get all debts
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const result = await pool.query(
      'SELECT * FROM debts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    res.json({ debts: result.rows })
  } catch (error) {
    console.error('Get debts error:', error)
    res.status(500).json({ message: 'Failed to fetch debts' })
  }
})

// Get total debt
router.get('/total', async (req, res) => {
  try {
    const userId = req.user.id
    const result = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM debts WHERE user_id = $1',
      [userId]
    )
    res.json({ total: parseFloat(result.rows[0].total) || 0 })
  } catch (error) {
    console.error('Get total debt error:', error)
    res.status(500).json({ message: 'Failed to fetch total debt' })
  }
})

router.get('/optimizer/plan', async (req, res) => {
  try {
    const userId = req.user.id
    const { getDebtOptimization } = require('../services/debtOptimizer.service')
    const plan = await getDebtOptimization(userId)
    res.json(plan)
  } catch (error) {
    console.error('Debt optimizer error:', error)
    res.status(500).json({ message: 'Failed to generate debt payoff plan' })
  }
})

// Get debt by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'SELECT * FROM debts WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Debt entry not found' })
    }

    res.json({ debt: result.rows[0] })
  } catch (error) {
    console.error('Get debt error:', error)
    res.status(500).json({ message: 'Failed to fetch debt' })
  }
})

// Create debt
router.post('/', [
  body('amount').isFloat({ min: 0 }),
  body('interest_rate').optional().isFloat({ min: 0, max: 100 }),
  body('debt_type').optional().trim(),
  body('description').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { amount, interest_rate, debt_type, description } = req.body

    const result = await pool.query(
      `INSERT INTO debts (user_id, amount, interest_rate, debt_type, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, amount, interest_rate || 0, debt_type || 'Loan', description || '']
    )

    res.status(201).json({ debt: result.rows[0] })
  } catch (error) {
    console.error('Create debt error:', error)
    res.status(500).json({ message: 'Failed to create debt' })
  }
})

// Update debt
router.put('/:id', [
  body('amount').optional().isFloat({ min: 0 }),
  body('interest_rate').optional().isFloat({ min: 0, max: 100 }),
  body('debt_type').optional().trim(),
  body('description').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { id } = req.params
    const { amount, interest_rate, debt_type, description } = req.body

    // Check ownership
    const checkResult = await pool.query(
      'SELECT id FROM debts WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Debt entry not found' })
    }

    // Build update query
    const updates = []
    const params = []
    let paramCount = 1

    if (amount !== undefined) {
      updates.push(`amount = $${paramCount++}`)
      params.push(amount)
    }
    if (interest_rate !== undefined) {
      updates.push(`interest_rate = $${paramCount++}`)
      params.push(interest_rate)
    }
    if (debt_type !== undefined) {
      updates.push(`debt_type = $${paramCount++}`)
      params.push(debt_type)
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

    const query = `UPDATE debts SET ${updates.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount++} RETURNING *`

    const result = await pool.query(query, params)

    res.json({ debt: result.rows[0] })
  } catch (error) {
    console.error('Update debt error:', error)
    res.status(500).json({ message: 'Failed to update debt' })
  }
})

// Delete debt
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Debt entry not found' })
    }

    res.json({ message: 'Debt deleted successfully' })
  } catch (error) {
    console.error('Delete debt error:', error)
    res.status(500).json({ message: 'Failed to delete debt' })
  }
})

module.exports = router
