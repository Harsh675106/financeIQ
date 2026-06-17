const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()
router.use(authenticateToken)

// Auto-create required tables (assets, liabilities, profiles)
async function ensureWealthTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL, -- Stock, MutualFund, Crypto, Gold, Cash, Debt
      symbol VARCHAR(50),
      quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
      price DECIMAL(20,8) NOT NULL DEFAULT 0,
      purchase_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);

    CREATE TABLE IF NOT EXISTS liabilities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL, -- Loan, CreditCard, Mortgage, Other
      amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      rate DECIMAL(7,4),
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON liabilities(user_id);

    CREATE TABLE IF NOT EXISTS profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      age INTEGER,
      retirement_age INTEGER,
      dependents INTEGER,
      income_stability VARCHAR(20), -- low/medium/high
      risk_quiz_score INTEGER,
      target_allocation JSONB, -- {equity:%, debt:%, gold:%, liquid:%}
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
  `)
}

function handleValidation(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    return false
  }
  return true
}

// =============== Assets ===============
router.get('/assets', async (req, res) => {
  try {
    await ensureWealthTables()
    const userId = req.user.id
    const r = await pool.query('SELECT * FROM assets WHERE user_id=$1 ORDER BY created_at DESC', [userId])
    res.json({ assets: r.rows })
  } catch (e) {
    console.error('Get assets error:', e)
    res.status(500).json({ message: 'Failed to fetch assets' })
  }
})

router.post('/assets', [
  body('type').notEmpty().withMessage('Asset type is required').isString().trim(),
  body('quantity').notEmpty().withMessage('Quantity is required'),
  body('price').notEmpty().withMessage('Price is required'),
  body('symbol').optional().trim(),
  body('purchase_date').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    await ensureWealthTables()
    const userId = req.user.id
    const { type, symbol, quantity, price, purchase_date } = req.body
    
    // Parse and validate numbers
    const qty = parseFloat(quantity)
    const prc = parseFloat(price)
    
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: 'Quantity must be a valid number >= 0' })
    }
    if (isNaN(prc) || prc < 0) {
      return res.status(400).json({ message: 'Price must be a valid number >= 0' })
    }
    
    const r = await pool.query(
      `INSERT INTO assets (user_id, type, symbol, quantity, price, purchase_date)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [userId, type, symbol || null, qty, prc, purchase_date || null]
    )
    res.status(201).json({ asset: r.rows[0] })
  } catch (e) {
    console.error('Create asset error:', e)
    res.status(500).json({ message: e.message || 'Failed to create asset' })
  }
})

router.put('/assets/:id', [
  body('type').optional().isString().trim(),
  body('symbol').optional().trim(),
  body('quantity').optional(),
  body('price').optional(),
  body('purchase_date').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    await ensureWealthTables()
    const userId = req.user.id
    const { id } = req.params
    const updates = req.body

    const fields = []
    const values = []
    let i = 1
    
    if (updates.type !== undefined && updates.type !== '') {
      fields.push(`type = $${i++}`)
      values.push(updates.type)
    }
    if (updates.symbol !== undefined && updates.symbol !== '') {
      fields.push(`symbol = $${i++}`)
      values.push(updates.symbol)
    }
    if (updates.quantity !== undefined && updates.quantity !== '') {
      const qty = parseFloat(updates.quantity)
      if (isNaN(qty) || qty < 0) {
        return res.status(400).json({ message: 'Quantity must be a valid number >= 0' })
      }
      fields.push(`quantity = $${i++}`)
      values.push(qty)
    }
    if (updates.price !== undefined && updates.price !== '') {
      const prc = parseFloat(updates.price)
      if (isNaN(prc) || prc < 0) {
        return res.status(400).json({ message: 'Price must be a valid number >= 0' })
      }
      fields.push(`price = $${i++}`)
      values.push(prc)
    }
    if (updates.purchase_date !== undefined && updates.purchase_date !== '') {
      fields.push(`purchase_date = $${i++}`)
      values.push(updates.purchase_date)
    }

    if (!fields.length) {
      return res.status(400).json({ message: 'No fields to update' })
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id, userId)

    const r = await pool.query(
      `UPDATE assets SET ${fields.join(', ')} WHERE id=$${i++} AND user_id=$${i++} RETURNING *`,
      values
    )
    if (!r.rows.length) {
      return res.status(404).json({ message: 'Asset not found' })
    }
    res.json({ asset: r.rows[0] })
  } catch (e) {
    console.error('Update asset error:', e)
    res.status(500).json({ message: e.message || 'Failed to update asset' })
  }
})

router.delete('/assets/:id', async (req, res) => {
  try {
    await ensureWealthTables()
    const userId = req.user.id
    const { id } = req.params
    const r = await pool.query('DELETE FROM assets WHERE id=$1 AND user_id=$2 RETURNING id', [id, userId])
    if (!r.rows.length) return res.status(404).json({ message: 'Asset not found' })
    res.json({ message: 'Asset deleted' })
  } catch (e) {
    console.error('Delete asset error:', e)
    res.status(500).json({ message: 'Failed to delete asset' })
  }
})

// =============== Liabilities ===============
router.get('/liabilities', async (req, res) => {
  try {
    await ensureWealthTables()
    const userId = req.user.id
    const r = await pool.query('SELECT * FROM liabilities WHERE user_id=$1 ORDER BY created_at DESC', [userId])
    res.json({ liabilities: r.rows })
  } catch (e) {
    console.error('Get liabilities error:', e)
    res.status(500).json({ message: 'Failed to fetch liabilities' })
  }
})

router.post('/liabilities', [
  body('type').notEmpty().withMessage('Liability type is required').isString().trim(),
  body('amount').notEmpty().withMessage('Amount is required'),
  body('rate').optional(),
  body('due_date').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    await ensureWealthTables()
    const userId = req.user.id
    const { type, amount, rate, due_date } = req.body
    
    // Parse and validate amount
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 0) {
      return res.status(400).json({ message: 'Amount must be a valid number >= 0' })
    }
    
    // Parse rate if provided
    let parsedRate = null
    if (rate !== undefined && rate !== null && rate !== '') {
      parsedRate = parseFloat(rate)
      if (isNaN(parsedRate) || parsedRate < 0) {
        return res.status(400).json({ message: 'Interest rate must be a valid number >= 0' })
      }
    }
    
    const r = await pool.query(
      `INSERT INTO liabilities (user_id, type, amount, rate, due_date)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [userId, type, amt, parsedRate, due_date || null]
    )
    res.status(201).json({ liability: r.rows[0] })
  } catch (e) {
    console.error('Create liability error:', e)
    res.status(500).json({ message: e.message || 'Failed to create liability' })
  }
})

router.put('/liabilities/:id', [
  body('type').optional().isString().trim(),
  body('amount').optional(),
  body('rate').optional(),
  body('due_date').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    await ensureWealthTables()
    const userId = req.user.id
    const { id } = req.params
    const updates = req.body

    const fields = []
    const values = []
    let i = 1
    
    if (updates.type !== undefined && updates.type !== '') {
      fields.push(`type = $${i++}`)
      values.push(updates.type)
    }
    if (updates.amount !== undefined && updates.amount !== '') {
      const amt = parseFloat(updates.amount)
      if (isNaN(amt) || amt < 0) {
        return res.status(400).json({ message: 'Amount must be a valid number >= 0' })
      }
      fields.push(`amount = $${i++}`)
      values.push(amt)
    }
    if (updates.rate !== undefined && updates.rate !== '') {
      const rt = parseFloat(updates.rate)
      if (isNaN(rt) || rt < 0) {
        return res.status(400).json({ message: 'Rate must be a valid number >= 0' })
      }
      fields.push(`rate = $${i++}`)
      values.push(rt)
    }
    if (updates.due_date !== undefined && updates.due_date !== '') {
      fields.push(`due_date = $${i++}`)
      values.push(updates.due_date)
    }
    
    if (!fields.length) {
      return res.status(400).json({ message: 'No fields to update' })
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id, userId)

    const r = await pool.query(
      `UPDATE liabilities SET ${fields.join(', ')} WHERE id=$${i++} AND user_id=$${i++} RETURNING *`,
      values
    )
    if (!r.rows.length) {
      return res.status(404).json({ message: 'Liability not found' })
    }
    res.json({ liability: r.rows[0] })
  } catch (e) {
    console.error('Update liability error:', e)
    res.status(500).json({ message: e.message || 'Failed to update liability' })
  }
})

router.delete('/liabilities/:id', async (req, res) => {
  try {
    await ensureWealthTables()
    const userId = req.user.id
    const { id } = req.params
    const r = await pool.query('DELETE FROM liabilities WHERE id=$1 AND user_id=$2 RETURNING id', [id, userId])
    if (!r.rows.length) return res.status(404).json({ message: 'Liability not found' })
    res.json({ message: 'Liability deleted' })
  } catch (e) {
    console.error('Delete liability error:', e)
    res.status(500).json({ message: 'Failed to delete liability' })
  }
})

// =============== Profiles ===============
router.get('/profiles/me', async (req, res) => {
  try {
    await ensureWealthTables()
    const userId = req.user.id
    const r = await pool.query('SELECT * FROM profiles WHERE user_id=$1', [userId])
    if (!r.rows.length) return res.json({ profile: null })
    res.json({ profile: r.rows[0] })
  } catch (e) {
    console.error('Get profile error:', e)
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

router.put('/profiles/me', [
  body('age').optional().isInt({ min: 0 }),
  body('retirement_age').optional().isInt({ min: 0 }),
  body('dependents').optional().isInt({ min: 0 }),
  body('income_stability').optional().isString().trim(),
  body('risk_quiz_score').optional().isInt({ min: 0, max: 100 }),
  body('target_allocation').optional(),
], async (req, res) => {
  try {
    if (!handleValidation(req, res)) return

    await ensureWealthTables()
    const userId = req.user.id

    // allowed editable fields
    const allowedFields = [
      'age',
      'retirement_age',
      'dependents',
      'income_stability',
      'risk_quiz_score',
      'target_allocation'
    ]

    // check existing profile
    const existing = await pool.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [userId]
    )

    let r

    // ================= UPDATE =================
    if (existing.rows.length) {

      const updateFields = []
      const values = []
      let i = 1

      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updateFields.push(`${key} = $${i++}`)
          values.push(req.body[key])
        }
      }

      if (!updateFields.length) {
        return res.status(400).json({ message: 'No fields to update' })
      }

      // auto timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP')

      values.push(userId)

      r = await pool.query(
        `UPDATE profiles
         SET ${updateFields.join(', ')}
         WHERE user_id = $${i}
         RETURNING *`,
        values
      )

    } 
    // ================= INSERT =================
    else {

      const insertCols = ['user_id']
      const insertValues = [userId]
      const placeholders = ['$1']
      let idx = 2

      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          insertCols.push(key)
          insertValues.push(req.body[key])
          placeholders.push(`$${idx++}`)
        }
      }

      r = await pool.query(
        `INSERT INTO profiles (${insertCols.join(', ')})
         VALUES (${placeholders.join(', ')})
         RETURNING *`,
        insertValues
      )
    }

    res.json({ profile: r.rows[0] })

  } catch (e) {
    console.error('Upsert profile error:', e)
    res.status(500).json({ message: 'Failed to save profile' })
  }
})


module.exports = router
