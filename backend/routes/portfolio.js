const express = require('express')
const axios = require('axios')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')
const { getPortfolioExplainability } = require('../services/portfolioExplainability.service')

const router = express.Router()

router.use(authenticateToken)

function mapTypeToBucket(type) {
  const t = (type || '').toLowerCase()
  if (['stock','stocks','equity','mutualfund','mutual fund','mf','crypto','cryptocurrency','etf'].some(k => t.includes(k))) return 'equity'
  if (['debt','bond','bonds','fixed income','fd'].some(k => t.includes(k))) return 'debt'
  if (['gold'].some(k => t.includes(k))) return 'gold'
  if (['cash','liquid','savings','bank'].some(k => t.includes(k))) return 'liquid'
  return 'equity'
}

function defaultTargetFromRisk(riskLevel) {
  const map = {
    Conservative: { equity: 20, debt: 60, gold: 10, liquid: 10 },
    Balanced: { equity: 50, debt: 30, gold: 10, liquid: 10 },
    Aggressive: { equity: 70, debt: 15, gold: 10, liquid: 5 },
  }
  return map[riskLevel] || map.Balanced
}

function computeRiskScore(weights) {
  // Simple weighted volatility model; map to 0..100 risk score
  const vol = { equity: 0.18, debt: 0.05, gold: 0.12, liquid: 0.01 }
  const w = { equity: (weights.equity||0)/100, debt: (weights.debt||0)/100, gold: (weights.gold||0)/100, liquid: (weights.liquid||0)/100 }
  const pvar = (w.equity*vol.equity)**2 + (w.debt*vol.debt)**2 + (w.gold*vol.gold)**2 + (w.liquid*vol.liquid)**2
  const pvol = Math.sqrt(pvar)
  const maxVol = 0.20 // cap ~20%
  const score = Math.max(0, Math.min(100, Math.round((pvol / maxVol) * 100)))
  const level = score < 35 ? 'Conservative' : score < 65 ? 'Balanced' : 'Aggressive'
  return { score, level, annualVolatility: Math.round(pvol*10000)/100 }
}

async function getCurrentAllocation(userId, pool) {
  const assets = await pool.query('SELECT type, quantity, price FROM assets WHERE user_id=$1', [userId])
  const sums = { equity: 0, debt: 0, gold: 0, liquid: 0 }
  let total = 0
  for (const a of assets.rows) {
    const qty = parseFloat(a.quantity)||0
    const price = parseFloat(a.price)||0
    const val = qty * price
    const bucket = mapTypeToBucket(a.type)
    sums[bucket] += val
    total += val
  }
  const pct = total > 0 ? {
    equity: Math.round((sums.equity/total)*10000)/100,
    debt: Math.round((sums.debt/total)*10000)/100,
    gold: Math.round((sums.gold/total)*10000)/100,
    liquid: Math.round((sums.liquid/total)*10000)/100,
  } : { equity: 0, debt: 0, gold: 0, liquid: 0 }
  return { totals: { ...sums, total: Math.round(total*100)/100 }, weights: pct }
}

async function getTargetAllocation(userId, pool) {
  // Try profiles.target_allocation; else fallback to latest risk_assessments risk_level
  const p = await pool.query('SELECT target_allocation FROM profiles WHERE user_id=$1', [userId])
  if (p.rows.length && p.rows[0].target_allocation) {
    const ta = p.rows[0].target_allocation
    return { equity: ta.equity||0, debt: ta.debt||0, gold: ta.gold||0, liquid: ta.liquid||0 }
  }
  const r = await pool.query('SELECT risk_level FROM risk_assessments WHERE user_id=$1 ORDER BY assessment_date DESC LIMIT 1', [userId])
  const riskLevel = r.rows[0]?.risk_level || 'Balanced'
  return defaultTargetFromRisk(riskLevel)
}

function computeRebalance(current, target, totalValue, band=5) {
  const drift = {
    equity: Math.round((current.equity - target.equity)*100)/100,
    debt: Math.round((current.debt - target.debt)*100)/100,
    gold: Math.round((current.gold - target.gold)*100)/100,
    liquid: Math.round((current.liquid - target.liquid)*100)/100,
  }
  const suggestions = []
  const over = Object.keys(drift).filter(k => drift[k] > band).sort((a,b)=>drift[b]-drift[a])
  const under = Object.keys(drift).filter(k => drift[k] < -band).sort((a,b)=>drift[a]-drift[b])
  let remainingSell = 0
  for (const k of over) {
    const sellPct = drift[k] - band
    const sellAmt = Math.round((sellPct/100)*totalValue*100)/100
    suggestions.push({ action: 'sell', bucket: k, amount: sellAmt })
    remainingSell += sellAmt
  }
  for (const k of under) {
    const buyPct = (-drift[k]) - band
    if (buyPct <= 0) continue
    let buyAmt = Math.round((buyPct/100)*totalValue*100)/100
    const used = Math.min(buyAmt, remainingSell)
    suggestions.push({ action: 'buy', bucket: k, amount: used })
    remainingSell -= used
  }
  return { drift, suggestions }
}

// New: return current holdings with totals
router.get('/holdings', async (req, res) => {
  try {
    const userId = req.user.id
    const r = await pool.query('SELECT * FROM assets WHERE user_id=$1 ORDER BY created_at DESC', [userId])
    const items = r.rows.map(x => ({ ...x, quantity: parseFloat(x.quantity), price: parseFloat(x.price), value: Math.round(parseFloat(x.quantity)*parseFloat(x.price)*100)/100 }))
    const total = items.reduce((s,x)=> s + (x.value||0), 0)
    res.json({ holdings: items, total })
  } catch (e) {
    console.error('Get holdings error:', e)
    res.status(500).json({ message: 'Failed to fetch holdings' })
  }
})

// New: live portfolio analysis (allocation, risk score, rebalancing suggestions)
router.get('/analysis', async (req, res) => {
  try {
    const userId = req.user.id
    const current = await getCurrentAllocation(userId, pool)
    const target = await getTargetAllocation(userId, pool)
    const risk = computeRiskScore(current.weights)
    const rebalance = computeRebalance(current.weights, target, current.totals.total)
    const explainability = await getPortfolioExplainability(userId)
    res.json({ currentAllocation: current.weights, totalValue: current.totals.total, targetAllocation: target, risk, rebalance, explainability })
  } catch (e) {
    console.error('Portfolio analysis error:', e)
    res.status(500).json({ message: 'Failed to analyze portfolio' })
  }
})

router.get('/explainability', async (req, res) => {
  try {
    const userId = req.user.id
    const result = await getPortfolioExplainability(userId)
    res.json(result)
  } catch (error) {
    console.error('Portfolio explainability error:', error)
    res.status(500).json({ message: 'Failed to explain portfolio' })
  }
})

// Get portfolio allocation recommendation - returns ACTUAL current allocation + target + risk
router.get('/allocation', async (req, res) => {
  try {
    const userId = req.user.id

    // Get current and target allocations with risk score
    const current = await getCurrentAllocation(userId, pool)
    const target = await getTargetAllocation(userId, pool)
    const risk = computeRiskScore(current.weights)

    res.json({
      currentAllocation: current.weights,
      targetAllocation: target,
      totalValue: current.totals.total,
      riskLevel: risk.level,
      riskScore: risk.score,
      volatility: risk.annualVolatility,
      recommendation: getRecommendationText(risk.level),
    })
  } catch (error) {
    console.error('Get allocation error:', error)
    res.status(500).json({ message: 'Failed to get portfolio allocation' })
  }
})

// Run Monte Carlo simulation
router.post('/simulation', async (req, res) => {
  try {
    const userId = req.user.id
    const { initialAmount, monthlyContribution, years, expectedReturn, volatility } = req.body

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000'

    try {
      const mlResponse = await axios.post(`${mlServiceUrl}/api/monte-carlo`, {
        initial_amount: initialAmount || 10000,
        monthly_contribution: monthlyContribution || 500,
        years: years || 10,
        expected_return: expectedReturn || 0.08,
        volatility: volatility || 0.15,
      })

      // Save simulation result
      await pool.query(
        `INSERT INTO simulation_results 
         (user_id, simulation_type, initial_amount, worst_case, best_case, median, mean, parameters)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          'monte_carlo',
          initialAmount || 10000,
          mlResponse.data.worstCase,
          mlResponse.data.bestCase,
          mlResponse.data.median,
          mlResponse.data.mean,
          JSON.stringify({ monthlyContribution, years, expectedReturn, volatility }),
        ]
      )

      res.json(mlResponse.data)
    } catch (mlError) {
      console.warn('ML service unavailable, using fallback')
      const fallbackResult = calculateMonteCarloFallback(
        initialAmount || 10000,
        monthlyContribution || 500,
        years || 10,
        expectedReturn || 0.08,
        volatility || 0.15
      )
      res.json(fallbackResult)
    }
  } catch (error) {
    console.error('Simulation error:', error)
    res.status(500).json({ message: 'Failed to run simulation' })
  }
})

// Get simulation history
router.get('/simulations', async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT * FROM simulation_results 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    )

    res.json({ simulations: result.rows })
  } catch (error) {
    console.error('Get simulations error:', error)
    res.status(500).json({ message: 'Failed to fetch simulations' })
  }
})

// Helper functions
function getPortfolioAllocation(riskLevel) {
  const allocations = {
    Conservative: {
      equity: 20,
      debt: 60,
      gold: 10,
      liquid: 10,
    },
    Balanced: {
      equity: 50,
      debt: 30,
      gold: 10,
      liquid: 10,
    },
    Aggressive: {
      equity: 70,
      debt: 15,
      gold: 10,
      liquid: 5,
    },
  }

  return allocations[riskLevel] || allocations.Balanced
}

function getRecommendationText(riskLevel) {
  const texts = {
    Conservative: 'Focus on capital preservation with stable returns. Suitable for near-term goals.',
    Balanced: 'Balanced approach between growth and stability. Good for medium-term goals.',
    Aggressive: 'Focus on long-term growth. Suitable for long-term goals and higher risk tolerance.',
  }

  return texts[riskLevel] || texts.Balanced
}

function calculateMonteCarloFallback(initialAmount, monthlyContribution, years, expectedReturn, volatility) {
  // Simple fallback calculation
  const months = years * 12
  const monthlyReturn = expectedReturn / 12
  const monthlyVolatility = volatility / Math.sqrt(12)

  let amount = initialAmount
  const scenarios = []

  for (let i = 0; i < 1000; i++) {
    let scenarioAmount = initialAmount
    for (let month = 0; month < months; month++) {
      const randomReturn = monthlyReturn + (Math.random() - 0.5) * monthlyVolatility * 2
      scenarioAmount = scenarioAmount * (1 + randomReturn) + monthlyContribution
    }
    scenarios.push(scenarioAmount)
  }

  scenarios.sort((a, b) => a - b)

  return {
    initialAmount,
    monthlyContribution,
    years,
    simulations: 1000,
    worstCase: Math.round(scenarios[50]),
    bestCase: Math.round(scenarios[950]),
    median: Math.round(scenarios[500]),
    mean: Math.round(scenarios.reduce((a, b) => a + b, 0) / scenarios.length),
    stdDev: Math.round(calculateStdDev(scenarios)),
  }
}

function calculateStdDev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map(value => Math.pow(value - mean, 2))
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}

module.exports = router
