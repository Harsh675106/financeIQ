const express = require('express')
const { query, validationResult } = require('express-validator')
const { authenticateToken } = require('../middleware/auth')
const { getMarketSnapshot, searchMarketAsset } = require('../services/marketSnapshot.service')
const { getMacroPulse } = require('../services/macroData.service')
const { getMarketInsights } = require('../services/marketInsights.service')

const router = express.Router()

router.use(authenticateToken)

router.get(
  '/search',
  [query('q').isString().trim().isLength({ min: 1, max: 40 })],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
      }

      const result = await searchMarketAsset(req.query.q)
      res.json(result)
    } catch (error) {
      console.error('Market search error:', error)
      res.status(500).json({ message: 'Failed to search market asset' })
    }
  },
)

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const [snapshot, macro] = await Promise.all([
      getMarketSnapshot(),
      getMacroPulse(),
    ])

    const insights = await getMarketInsights(userId, snapshot, macro)

    res.json({
      generatedAt: new Date().toISOString(),
      snapshot,
      macro,
      insights,
    })
  } catch (error) {
    console.error('Market intelligence error:', error)
    res.status(500).json({ message: 'Failed to load market intelligence' })
  }
})

module.exports = router
