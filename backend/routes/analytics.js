const express = require('express')
const { body, validationResult } = require('express-validator')
const { authenticateToken } = require('../middleware/auth')
const { createRateLimiter } = require('../middleware/rateLimit')
const { getDashboardAnalytics } = require('../services/analytics.service')
const { getFinancialBriefing } = require('../services/financialBriefing.service')
const { getChatResponse } = require('../services/copilot.service')
const { runScenario } = require('../services/scenarioPlanner.service')
const { planLifeEvent } = require('../services/lifeEventPlanner.service')
const {
  listCopilotMessages,
  saveCopilotExchange,
  clearCopilotMessages,
} = require('../services/copilotHistory.service')

const router = express.Router()
const copilotRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyGenerator: (req) => `${req.user?.id || 'anonymous'}:${req.ip || 'unknown'}:copilot`,
  message: 'FinanceIQ copilot is receiving too many requests. Please wait a minute and try again.',
})

router.use(authenticateToken)

// GET /api/analytics/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id
    const data = await getDashboardAnalytics(userId)
    res.json(data)
  } catch (e) {
    console.error('Analytics dashboard error:', e)
    res.status(500).json({ message: 'Failed to compute analytics' })
  }
})

// GET /api/analytics/cashflow-forecast
router.get('/cashflow-forecast', async (req, res) => {
  try {
    const userId = req.user.id
    const { forecastNext6Months } = require('../services/cashflow.service')
    const data = await forecastNext6Months(userId)
    res.json(data)
  } catch (e) {
    console.error('Cashflow forecast error:', e)
    res.status(500).json({ message: 'Failed to compute cashflow forecast' })
  }
})

router.get('/financial-briefing', async (req, res) => {
  try {
    const userId = req.user.id
    const data = await getFinancialBriefing(userId)
    res.json(data)
  } catch (e) {
    console.error('Financial briefing error:', e)
    res.status(500).json({ message: 'Failed to generate financial briefing' })
  }
})

router.post('/scenario-planner', async (req, res) => {
  try {
    const userId = req.user.id
    const { scenarioType, payload } = req.body || {}
    const result = await runScenario(userId, scenarioType, payload || {})
    res.json(result)
  } catch (e) {
    console.error('Scenario planner error:', e)
    res.status(500).json({ message: 'Failed to run scenario planner' })
  }
})

router.post('/life-event-planner', async (req, res) => {
  try {
    const userId = req.user.id
    const { eventType, payload } = req.body || {}
    const result = await planLifeEvent(userId, eventType, payload || {})
    res.json(result)
  } catch (e) {
    console.error('Life event planner error:', e)
    res.status(500).json({ message: 'Failed to build life event plan' })
  }
})

router.get('/copilot/history', async (req, res) => {
  try {
    const userId = req.user.id
    const messages = await listCopilotMessages(userId)
    res.json({ messages })
  } catch (e) {
    console.error('FinanceIQ copilot history error:', e)
    res.status(500).json({ message: 'Failed to load copilot history' })
  }
})

router.post(
  '/copilot',
  copilotRateLimiter,
  [
    body('question').isString().trim().isLength({ min: 2, max: 500 }),
    body('history').optional().isArray({ max: 12 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
      }

      const userId = req.user.id
      const { question, history = [] } = req.body
      const sanitizedHistory = history
        .filter((item) => item && typeof item.content === 'string' && typeof item.role === 'string')
        .slice(-10)
        .map((item) => ({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: item.content.slice(0, 1000),
        }))

      const response = await getChatResponse(userId, question, sanitizedHistory)
      await saveCopilotExchange(userId, question, response.answer)
      res.json(response)
    } catch (e) {
      console.error('FinanceIQ copilot error:', e)
      res.status(500).json({
        message:
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          e?.message ||
          'Failed to answer copilot question',
      })
    }
  }
)

router.delete('/copilot/history', async (req, res) => {
  try {
    const userId = req.user.id
    await clearCopilotMessages(userId)
    res.json({ message: 'Copilot history cleared' })
  } catch (e) {
    console.error('FinanceIQ clear history error:', e)
    res.status(500).json({ message: 'Failed to clear copilot history' })
  }
})

module.exports = router
