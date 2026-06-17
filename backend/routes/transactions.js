const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')
const {
  getTransactionIntelligence,
  saveCategorizationFeedback,
} = require('../services/transactionIntelligence.service')

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const { type, limit = 50, offset = 0 } = req.query

    let query = 'SELECT * FROM transactions WHERE user_id = $1'
    const params = [userId]

    if (type && (type === 'income' || type === 'expense')) {
      query += ' AND type = $2 ORDER BY date DESC, created_at DESC LIMIT $3 OFFSET $4'
      params.push(type, parseInt(limit), parseInt(offset))
    } else {
      query += ' ORDER BY date DESC, created_at DESC LIMIT $2 OFFSET $3'
      params.push(parseInt(limit), parseInt(offset))
    }

    const result = await pool.query(query, params)
    res.json({ transactions: result.rows })
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ message: 'Failed to fetch transactions' })
  }
})

// Get transaction by ID
router.get('/:id(\\d+)', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    res.json({ transaction: result.rows[0] })
  } catch (error) {
    console.error('Get transaction error:', error)
    res.status(500).json({ message: 'Failed to fetch transaction' })
  }
})

// Create transaction
router.post('/', [
  body('type').isIn(['income', 'expense']),
  body('amount').isFloat({ min: 0 }),
  body('date').isISO8601().toDate(),
  body('category').optional().trim(),
  body('description').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { type, amount, date, category, description } = req.body
    // Auto-categorize if category not provided
    const autoCategory = !category ? autoCategorize(description || '') : null
    const finalCategory = category || autoCategory

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, date, category, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, amount, date, finalCategory || null, description || null]
    )

    res.status(201).json({ transaction: result.rows[0] })
  } catch (error) {
    console.error('Create transaction error:', error)
    res.status(500).json({ message: 'Failed to create transaction' })
  }
})

// Update transaction
router.put('/:id(\\d+)', [
  body('type').optional().isIn(['income', 'expense']),
  body('amount').optional().isFloat({ min: 0 }),
  body('date').optional().isISO8601().toDate(),
  body('category').optional().trim(),
  body('description').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const userId = req.user.id
    const { id } = req.params
    const updates = req.body

    // Build update query dynamically
    const fields = []
    const values = []
    let paramCount = 1

    if (updates.type) {
      fields.push(`type = $${paramCount++}`)
      values.push(updates.type)
    }
    if (updates.amount !== undefined) {
      fields.push(`amount = $${paramCount++}`)
      values.push(updates.amount)
    }
    if (updates.date) {
      fields.push(`date = $${paramCount++}`)
      values.push(updates.date)
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramCount++}`)
      values.push(updates.category)
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`)
      values.push(updates.description)
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' })
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id, userId)

    const result = await pool.query(
      `UPDATE transactions SET ${fields.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    res.json({ transaction: result.rows[0] })
  } catch (error) {
    console.error('Update transaction error:', error)
    res.status(500).json({ message: 'Failed to update transaction' })
  }
})

// Delete transaction
router.delete('/:id(\\d+)', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    res.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Delete transaction error:', error)
    res.status(500).json({ message: 'Failed to delete transaction' })
  }
})

// Get transaction statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.id
    const { startDate, endDate } = req.query

    let dateFilter = ''
    const params = [userId]

    if (startDate && endDate) {
      dateFilter = ' AND date BETWEEN $2 AND $3'
      params.push(startDate, endDate)
    }

    // Income stats
    const incomeResult = await pool.query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count,
        COALESCE(AVG(amount), 0) as average
       FROM transactions 
       WHERE user_id = $1 AND type = 'income'${dateFilter}`,
      params
    )

    // Expense stats
    const expenseResult = await pool.query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count,
        COALESCE(AVG(amount), 0) as average
       FROM transactions 
       WHERE user_id = $1 AND type = 'expense'${dateFilter}`,
      params
    )

    // Category breakdown
    const categoryParams = [userId]
    let categoryQuery = `SELECT 
        category,
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
       FROM transactions 
       WHERE user_id = $1`
    
    if (startDate && endDate) {
      categoryQuery += ' AND date BETWEEN $2 AND $3'
      categoryParams.push(startDate, endDate)
    }
    
    categoryQuery += ' GROUP BY category, type ORDER BY total DESC'
    
    const categoryResult = await pool.query(categoryQuery, categoryParams)

    res.json({
      income: incomeResult.rows[0],
      expenses: expenseResult.rows[0],
      categories: categoryResult.rows,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Failed to fetch statistics' })
  }
})

// Detect recurring transactions (salary, rent, subscriptions)
router.get('/smart/recurring', async (req, res) => {
  try {
    const userId = req.user.id
    const lookbackDays = parseInt(req.query.days || '180', 10)
    const start = new Date()
    start.setDate(start.getDate() - lookbackDays)

    const q = await pool.query(
      `SELECT id, type, amount, description, date
       FROM transactions
       WHERE user_id=$1 AND date >= $2
       ORDER BY date ASC`,
      [userId, start.toISOString().slice(0,10)]
    )
    const rows = q.rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      date: new Date(r.date)
    }))

    // Group by (type, rounded amount)
    const groups = new Map()
    for (const tr of rows) {
      const key = `${tr.type}|${tr.amount.toFixed(2)}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(tr)
    }

    const candidates = []
    for (const [key, list] of groups.entries()) {
      if (list.length < 3) continue
      list.sort((a,b) => a.date - b.date)
      const intervals = []
      for (let i=1;i<list.length;i++) {
        intervals.push((list[i].date - list[i-1].date) / (1000*60*60*24))
      }
      const avg = intervals.reduce((a,b)=>a+b,0) / intervals.length
      const sd = Math.sqrt(intervals.map(x => (x-avg)**2).reduce((a,b)=>a+b,0)/intervals.length)
      // Monthly if ~30d with tolerance
      if (avg > 25 && avg < 35 && sd < 6) {
        const last = list[list.length-1].date
        const next = new Date(last)
        next.setMonth(next.getMonth()+1)
        candidates.push({
          type: list[0].type,
          amount: list[0].amount,
          descriptionSample: list[0].description || null,
          occurrences: list.length,
          avgIntervalDays: Math.round(avg),
          nextDate: next.toISOString().slice(0,10)
        })
      }
    }

    res.json({ recurring: candidates })
  } catch (error) {
    console.error('Recurring detection error:', error)
    res.status(500).json({ message: 'Failed to detect recurring transactions' })
  }
})

// Monthly spending analytics
router.get('/analytics/spending', async (req, res) => {
  try {
    const userId = req.user.id
    const { startDate, endDate } = req.query

    const start = startDate ? new Date(String(startDate)) : new Date()
    if (!startDate) start.setMonth(start.getMonth()-3)
    const end = endDate ? new Date(String(endDate)) : new Date()

    // Category breakdown (expenses only)
    const cat = await pool.query(
      `SELECT COALESCE(category,'Uncategorized') AS category,
              COALESCE(SUM(amount),0) AS total,
              COUNT(*) AS count
       FROM transactions
       WHERE user_id=$1 AND type='expense' AND date BETWEEN $2 AND $3
       GROUP BY category
       ORDER BY total DESC`,
      [userId, start.toISOString().slice(0,10), end.toISOString().slice(0,10)]
    )

    // Monthly trend (income vs expense)
    const trend = await pool.query(
      `SELECT DATE_TRUNC('month', date) AS month,
              SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
              SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses
       FROM transactions
       WHERE user_id=$1 AND date BETWEEN $2 AND $3
       GROUP BY 1
       ORDER BY 1`,
      [userId, start.toISOString().slice(0,10), end.toISOString().slice(0,10)]
    )

    const totals = await pool.query(
      `SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
              SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses
       FROM transactions
       WHERE user_id=$1 AND date BETWEEN $2 AND $3`,
      [userId, start.toISOString().slice(0,10), end.toISOString().slice(0,10)]
    )

    res.json({
      period: { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) },
      categoryBreakdown: cat.rows.map(r => ({ category: r.category, total: parseFloat(r.total), count: parseInt(r.count,10) })),
      monthlyTrend: trend.rows.map(r => ({ month: new Date(r.month).toISOString().slice(0,7), income: parseFloat(r.income)||0, expenses: parseFloat(r.expenses)||0 })),
      incomeVsExpense: { income: parseFloat(totals.rows[0].income)||0, expenses: parseFloat(totals.rows[0].expenses)||0 }
    })
  } catch (error) {
    console.error('Spending analytics error:', error)
    res.status(500).json({ message: 'Failed to compute spending analytics' })
  }
})

router.get('/smart/intelligence', async (req, res) => {
  try {
    const userId = req.user.id
    const data = await getTransactionIntelligence(userId)
    res.json(data)
  } catch (error) {
    console.error('Transaction intelligence error:', error)
    res.status(500).json({ message: 'Failed to compute transaction intelligence' })
  }
})

router.post(
  '/smart/feedback',
  [
    body('transactionId').isInt({ min: 1 }),
    body('correctedCategory').isString().trim().notEmpty(),
    body('suggestedCategory').optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
      }

      const userId = req.user.id
      const { transactionId, correctedCategory, suggestedCategory } = req.body
      await saveCategorizationFeedback(userId, transactionId, correctedCategory, suggestedCategory)

      await pool.query(
        'UPDATE transactions SET category = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3',
        [correctedCategory, transactionId, userId]
      )

      res.status(201).json({ message: 'Feedback saved successfully' })
    } catch (error) {
      console.error('Transaction feedback error:', error)
      res.status(500).json({ message: 'Failed to save transaction feedback' })
    }
  }
)

function autoCategorize(text) {
  const t = (text || '').toLowerCase()
  const rules = [
    { cat: 'Transport', kw: ['uber','ola','lyft','cab','ride','metro','train','bus','fuel','petrol','gas'] },
    { cat: 'Food & Dining', kw: ['swiggy','zomato','starbucks','mcd','kfc','dominos','pizza','restaurant','food','meal','coffee'] },
    { cat: 'Shopping', kw: ['amazon','flipkart','myntra','shopping','store','mall','retail'] },
    { cat: 'Subscriptions', kw: ['netflix','spotify','prime','hotstar','youtube','subscription','member'] },
    { cat: 'Housing', kw: ['rent','lease','maintenance','hoa','mortgage'] },
    { cat: 'Utilities', kw: ['electric','water','gas','sewer','garbage','internet','wifi','broadband','airtel','jio','vodafone','utility','bill'] },
    { cat: 'Healthcare', kw: ['hospital','pharmacy','doctor','clinic','medicine','medical','insurance'] },
    { cat: 'Travel', kw: ['airlines','flight','hotel','booking','travel','trip'] },
    { cat: 'Education', kw: ['tuition','course','coursera','udemy','school','college','university','exam'] },
    { cat: 'Entertainment', kw: ['movie','cinema','theatre','game','concert'] },
    { cat: 'Income', kw: ['salary','payroll','stipend','bonus','interest','dividend'] },
  ]
  for (const r of rules) {
    if (r.kw.some(k => t.includes(k))) return r.cat
  }
  return 'Other'
}

module.exports = router
