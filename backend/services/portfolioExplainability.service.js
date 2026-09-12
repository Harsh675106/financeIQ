const pool = require("../config/database");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function mapTypeToBucket(type, category = 'assets') {
  const text = (type || '').toLowerCase()
  if (['stock', 'stocks', 'equity', 'mutualfund', 'mutual fund', 'mf', 'crypto', 'cryptocurrency', 'etf', 'share'].some((item) => text.includes(item))) return 'equity'
  if (['debt', 'bond', 'bonds', 'fixed income', 'fd', 'fixed deposit', 'ppf', 'provident', 'nsc', 'rd', 'recurring deposit'].some((item) => text.includes(item))) return 'debt'
  if (['gold', 'silver', 'bullion', 'sgb', 'commodity', 'commodities'].some((item) => text.includes(item))) return 'gold'
  if (['cash', 'liquid', 'savings', 'saving', 'emergency', 'bank', 'wallet', 'current', 'checking', 'deposit', 'high-yield'].some((item) => text.includes(item))) return 'liquid'
  return category === 'savings' ? 'liquid' : 'equity'
}

async function getPortfolioExplainability(userId) {
  const [assets, savings, debtsRes, goals] = await Promise.all([
    pool.query('SELECT type, quantity, price FROM assets WHERE user_id = $1', [userId]),
    pool.query('SELECT amount, account_type, description FROM savings WHERE user_id = $1', [userId]),
    pool.query('SELECT COALESCE(SUM(amount), 0) AS total_debt FROM debts WHERE user_id = $1', [userId]),
    pool.query(
      "SELECT name, target_date FROM goals WHERE user_id = $1 AND status = 'active' ORDER BY target_date ASC NULLS LAST LIMIT 3",
      [userId]
    ),
  ])

  const buckets = { equity: 0, debt: 0, gold: 0, liquid: 0 }
  let total = 0

  for (const row of assets.rows) {
    const value = (parseFloat(row.quantity) || 0) * (parseFloat(row.price) || 0)
    const bucket = mapTypeToBucket(row.type, 'assets')
    buckets[bucket] += value
    total += value
  }

  for (const row of savings.rows) {
    const value = parseFloat(row.amount) || 0
    const bucket = mapTypeToBucket(row.account_type || row.description, 'savings')
    buckets[bucket] += value
    total += value
  }

  const totalDebt = parseFloat(debtsRes.rows[0]?.total_debt) || 0

  const weights = total > 0
    ? Object.fromEntries(Object.entries(buckets).map(([key, value]) => [key, round2((value / total) * 100)]))
    : { equity: 0, debt: 0, gold: 0, liquid: 0 }

  const explanations = []

  // High leverage / debt-to-portfolio risk
  if (totalDebt > 0 && total > 0 && (totalDebt / total) > 0.8) {
    explanations.push({
      type: 'leverage_risk',
      severity: 'high',
      title: 'High Debt Leverage vs Assets',
      explanation: `Your total debt liabilities (₹${round2(totalDebt).toLocaleString('en-IN')}) are significant relative to your investment/savings capital (₹${round2(total).toLocaleString('en-IN')}). Prioritize accelerating high-rate debt reduction.`,
      confidence: 90,
      assumptions: ['Comprehensive debt liabilities compared against asset portfolio.'],
    })
  }

  if (weights.equity > 75) {
    explanations.push({
      type: 'concentration_risk',
      severity: 'high',
      title: 'High Equity Concentration',
      explanation: `About ${weights.equity}% of your portfolio sits in equity-like assets, so a market drawdown could hit your near-term capital hard.`,
      confidence: 88,
      assumptions: ['All stock, mutual fund, ETF, and crypto assets are grouped as equity.'],
    })
  }

  if (weights.gold > 50) {
    explanations.push({
      type: 'gold_concentration',
      severity: 'medium',
      title: 'Heavy Gold Allocation',
      explanation: `Gold comprises ${weights.gold}% of your portfolio. While providing an inflation buffer, balancing with equity index funds can enhance long-term compounding.`,
      confidence: 85,
      assumptions: ['Gold is non-dividend producing and best balanced with equity and fixed income.'],
    })
  }

  if (weights.liquid < 10) {
    explanations.push({
      type: 'liquidity_risk',
      severity: 'medium',
      title: 'Low Liquid Reserve',
      explanation: `Only ${weights.liquid}% of your portfolio is in immediate liquid cash, which may be tight for emergency buffers.`,
      confidence: 81,
      assumptions: ['Liquid savings includes bank accounts and emergency funds.'],
    })
  }

  if (goals.rows.some((goal) => goal.target_date && new Date(goal.target_date) < new Date(new Date().setFullYear(new Date().getFullYear() + 3))) && weights.equity > 60) {
    explanations.push({
      type: 'goal_mismatch',
      severity: 'high',
      title: 'Goal Horizon Mismatch',
      explanation: 'You have at least one shorter-term goal within 3 years, but your portfolio still leans aggressively toward high-volatility growth assets.',
      confidence: 79,
      assumptions: ['Goals within 3 years should generally not depend heavily on high-volatility assets.'],
    })
  }

  const stressTests = [
    { scenario: 'Recession', estimatedImpactPercent: round2(-(weights.equity * 0.28 + weights.debt * 0.05) / 100) },
    { scenario: 'High inflation', estimatedImpactPercent: round2(-(weights.debt * 0.12 + weights.liquid * 0.04) / 100 + (weights.gold * 0.08) / 100) },
    { scenario: 'Rate cuts', estimatedImpactPercent: round2((weights.debt * 0.05 + weights.equity * 0.04) / 100) },
    { scenario: 'Market crash', estimatedImpactPercent: round2(-(weights.equity * 0.35 + (weights.gold > 0 ? -weights.gold * 0.05 : 0)) / 100) },
  ].map((item) => ({
    ...item,
    projectedPortfolioValue: round2(total * (1 + item.estimatedImpactPercent)),
  }))

  return {
    totalValue: round2(total),
    weights,
    explanations,
    stressTests,
  }
}

module.exports = { getPortfolioExplainability }
