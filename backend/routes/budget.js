const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')
const { getBudgetAutopilot } = require('../services/budgetAutopilot.service')

const router = express.Router()
router.use(authenticateToken)

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(100) NOT NULL,
      amount_monthly DECIMAL(15,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category)
    );
    CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
  `)
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth()+1, 0)
  return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) }
}

// GET /api/budget - list budgets with current month progress
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    await ensureTable()

    const { start, end } = monthRange()

    const budgetsRes = await pool.query(
      'SELECT id, category, amount_monthly FROM budgets WHERE user_id=$1 ORDER BY category',
      [userId]
    )

    // Spend per category
    const spendRes = await pool.query(
      `SELECT COALESCE(category,'Uncategorized') AS category, COALESCE(SUM(amount),0) AS total
       FROM transactions
       WHERE user_id=$1 AND type='expense' AND date BETWEEN $2 AND $3
       GROUP BY category`,
      [userId, start, end]
    )
    const spentMap = {}
    spendRes.rows.forEach(r => spentMap[r.category] = parseFloat(r.total) || 0)

    const list = budgetsRes.rows.map(b => {
      const budget = parseFloat(b.amount_monthly) || 0
      const spent = spentMap[b.category] || 0
      const progress = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0
      const remaining = Math.max(0, Math.round((budget - spent) * 100) / 100)
      const overspending = spent > budget
      return { id: b.id, category: b.category, amountMonthly: budget, spent, remaining, progress, overspending }
    })

    res.json({ period: { start, end }, budgets: list })
  } catch (error) {
    console.error('Get budgets error:', error)
    res.status(500).json({ message: 'Failed to fetch budgets' })
  }
})

router.get('/autopilot', async (req, res) => {
  try {
    const userId = req.user.id
    await ensureTable()
    const data = await getBudgetAutopilot(userId)
    res.json(data)
  } catch (error) {
    console.error('Budget autopilot error:', error)
    res.status(500).json({ message: 'Failed to compute budget autopilot' })
  }
})

// POST /api/budget - create or update a budget for a category
router.post('/', [
  body('category').isString().trim().notEmpty(),
  body('amountMonthly').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { category, amountMonthly } = req.body
    await ensureTable()

    const upsert = await pool.query(
      `INSERT INTO budgets (user_id, category, amount_monthly)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, category)
       DO UPDATE SET amount_monthly = EXCLUDED.amount_monthly, updated_at = CURRENT_TIMESTAMP
       RETURNING id, category, amount_monthly`,
      [userId, category, amountMonthly]
    )

    res.status(201).json({ budget: {
      id: upsert.rows[0].id,
      category: upsert.rows[0].category,
      amountMonthly: parseFloat(upsert.rows[0].amount_monthly)
    }})
  } catch (error) {
    console.error('Create/update budget error:', error)
    res.status(500).json({ message: 'Failed to save budget' })
  }
})

// DELETE /api/budget/:id - remove a budget row
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    await ensureTable()

    const del = await pool.query(
      'DELETE FROM budgets WHERE id=$1 AND user_id=$2 RETURNING id',
      [id, userId]
    )

    if (!del.rows.length) return res.status(404).json({ message: 'Budget not found' })
    res.json({ message: 'Budget deleted' })
  } catch (error) {
    console.error('Delete budget error:', error)
    res.status(500).json({ message: 'Failed to delete budget' })
  }
})

module.exports = router
