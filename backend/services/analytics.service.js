const pool = require('../config/database')

function clamp01(x) { return Math.max(0, Math.min(1, x)) }

function round2(n) { return Math.round(n * 100) / 100 }

async function getIncomeExpense(userId, startDate, endDate) {
  const params = [userId]
  let dateFilter = ''
  if (startDate && endDate) {
    dateFilter = ' AND date BETWEEN $2 AND $3'
    params.push(startDate, endDate)
  }
  const income = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='income'${dateFilter}`,
    params
  )
  const expenses = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id=$1 AND type='expense'${dateFilter}`,
    params
  )
  return {
    income: parseFloat(income.rows[0].total) || 0,
    expenses: parseFloat(expenses.rows[0].total) || 0,
  }
}

async function getEmergencyFundMonths(userId) {
  // Cash-like assets: use savings table as proxy
  const savingsRes = await pool.query(
    'SELECT COALESCE(SUM(amount),0) AS total FROM savings WHERE user_id=$1',
    [userId]
  )
  const cash = parseFloat(savingsRes.rows[0].total) || 0

  // Average monthly expenses from last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const { expenses } = await getIncomeExpense(userId, threeMonthsAgo.toISOString().slice(0,10), new Date().toISOString().slice(0,10))
  const avgMonthly = expenses / 3
  const months = avgMonthly > 0 ? cash / avgMonthly : 0
  return { months, cash, avgMonthly }
}

async function getDebtAssets(userId) {
  const debtsRes = await pool.query(
    `SELECT COUNT(*)::int AS record_count, COALESCE(SUM(amount), 0) AS total
     FROM debts
     WHERE user_id=$1`,
    [userId]
  )
  const totalDebt = parseFloat(debtsRes.rows[0].total) || 0
  const debtRecordCount = parseInt(debtsRes.rows[0].record_count, 10) || 0
  // An empty debts table does not prove that the user is debt-free. Keep it
  // separate from an explicit ₹0 debt record so the dashboard can avoid
  // turning missing data into a perfect debt score.
  const debtDataStatus = debtRecordCount === 0
    ? 'unavailable'
    : totalDebt === 0
      ? 'zero'
      : 'available'

  // Assets proxy: savings only for now
  const savingsRes = await pool.query(
    'SELECT COALESCE(SUM(amount),0) AS total FROM savings WHERE user_id=$1',
    [userId]
  )
  const totalAssets = parseFloat(savingsRes.rows[0].total) || 0
  return { totalDebt, totalAssets, debtRecordCount, debtDataStatus }
}

async function getGoalProgress(userId) {
  const goalsRes = await pool.query(
    `SELECT target_amount, current_amount FROM goals WHERE user_id=$1 AND status='active'`,
    [userId]
  )
  const rows = goalsRes.rows
  if (!rows.length) return { avgProgress: 0 }
  const progresses = rows.map(r => {
    const target = parseFloat(r.target_amount) || 0
    const current = parseFloat(r.current_amount) || 0
    return target > 0 ? clamp01(current / target) : 0
  })
  const avgProgress = progresses.reduce((a,b)=>a+b,0) / progresses.length
  return { avgProgress }
}

async function getDiversificationScore(userId) {
  // Use portfolio_allocations percentages to estimate diversification
  const res = await pool.query(
    'SELECT equity_percentage, debt_percentage, gold_percentage, liquid_percentage FROM portfolio_allocations WHERE user_id=$1 ORDER BY recommended_date DESC LIMIT 1',
    [userId]
  )
  if (!res.rows.length) return { score: 0 }
  const r = res.rows[0]
  const weights = ['equity_percentage','debt_percentage','gold_percentage','liquid_percentage']
    .map(k => (r[k] ? parseFloat(r[k]) : 0) / 100)
  const present = weights.filter(w => w > 0)
  if (!present.length) return { score: 0 }
  const hhi = present.reduce((s,w)=> s + w*w, 0)
  // Normalize: max diversification when equal weights -> hhi = 1/n, min when 1 asset -> hhi=1
  const n = present.length
  const minHHI = 1/n
  const maxHHI = 1
  const normalized = clamp01((maxHHI - hhi) / (maxHHI - minHHI))
  return { score: normalized }
}

function calculateDebtImpact(debtRatio, debtDataStatus) {
  if (debtDataStatus === 'unavailable') return null

  // A 0% debt-to-income ratio has no negative debt impact. At 40% or more,
  // debt has the maximum impact, matching the existing debt-risk threshold.
  return clamp01(debtRatio / 0.4)
}

function computeHealthScore({ savingsRate, emergencyMonths, debtImpact, goalProgress, diversificationScore }) {
  // Map raw metrics to 0..1 subscores
  const savingsScore = clamp01(savingsRate) // assume rate already fraction
  const emergencyScore = clamp01(emergencyMonths / 6) // 6+ months ideal
  const goalScore = clamp01(goalProgress)
  const divScore = clamp01(diversificationScore)

  const components = [
    { value: savingsScore, weight: 0.25 },
    { value: emergencyScore, weight: 0.20 },
    { value: goalScore, weight: 0.15 },
    { value: divScore, weight: 0.20 },
  ]

  // Debt impact is a penalty, not a score. When it is unavailable, exclude
  // the debt dimension and reweight the known dimensions instead of assuming
  // the user deserves 100/100 for debt.
  if (debtImpact !== null) {
    components.push({ value: 1 - debtImpact, weight: 0.20 })
  }

  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0)
  const healthScore = totalWeight > 0
    ? (components.reduce((sum, component) => sum + component.value * component.weight, 0) / totalWeight) * 100
    : 0

  return {
    value: Math.round(healthScore),
    breakdown: {
      savingsScore: round2(savingsScore*100),
      emergencyScore: round2(emergencyScore*100),
      debtImpact: debtImpact === null ? null : round2(debtImpact * 100),
      goalScore: round2(goalScore*100),
      diversificationScore: round2(divScore*100)
    }
  }
}

async function getOverspendingInsight(userId) {
  // Compare current month vs previous month by category
  const now = new Date()
  const startThis = new Date(now.getFullYear(), now.getMonth(), 1)
  const startPrev = new Date(now.getFullYear(), now.getMonth()-1, 1)
  const endPrev = new Date(now.getFullYear(), now.getMonth(), 0)

  const q = async (start, end) => {
    const res = await pool.query(
      `SELECT COALESCE(category,'Uncategorized') AS category, COALESCE(SUM(amount),0) AS total
       FROM transactions 
       WHERE user_id=$1 AND type='expense' AND date BETWEEN $2 AND $3
       GROUP BY category`,
      [userId, start.toISOString().slice(0,10), end.toISOString().slice(0,10)]
    )
    const map = {}
    res.rows.forEach(r => map[r.category] = parseFloat(r.total) || 0)
    return map
  }

  const thisMap = await q(startThis, now)
  const prevMap = await q(startPrev, endPrev)

  let best = null
  for (const cat of Object.keys(thisMap)) {
    const cur = thisMap[cat]
    const prev = prevMap[cat] || 0
    if (cur > 0 && cur > prev * 1.2 && cur - prev > 50) {
      const inc = prev > 0 ? Math.round(((cur - prev)/prev) * 100) : 100
      if (!best || inc > best.inc) best = { cat, inc }
    }
  }
  if (best) {
    return { type: 'overspending', severity: 'warning', message: `You are overspending in ${best.cat} (+${best.inc}%) this month.` }
  }
  return null
}

async function getEmergencyInsight(emergencyMonths) {
  if (emergencyMonths < 1) return { type: 'emergency_fund', severity: 'critical', message: 'Emergency fund is insufficient (<1 month). Build at least 3 months of expenses.' }
  if (emergencyMonths < 3) return { type: 'emergency_fund', severity: 'warning', message: 'Emergency fund below recommended 3 months.' }
  return null
}

async function getGoalAccelerationInsights(userId) {
  // Simple linear projection using monthly_contribution; suggest +$200/month impact
  const res = await pool.query(
    `SELECT name, target_amount, current_amount, monthly_contribution FROM goals WHERE user_id=$1 AND status='active'`,
    [userId]
  )
  const insights = []
  for (const g of res.rows) {
    const target = parseFloat(g.target_amount) || 0
    const current = parseFloat(g.current_amount) || 0
    const m = parseFloat(g.monthly_contribution) || 0
    const remaining = Math.max(0, target - current)
    if (remaining <= 0) continue
    const months = m > 0 ? Math.ceil(remaining / m) : null
    const m2 = m + 200
    const months2 = m2 > 0 ? Math.ceil(remaining / m2) : null
    if (months && months2 && months2 < months) {
      const saved = months - months2
      insights.push({ type: 'goal_boost', severity: 'info', message: `You can reach ${g.name} ${saved} month(s) earlier by saving +$200/month.` })
    }
  }
  return insights
}

async function getNetWorth(userId) {
  const { totalDebt, totalAssets } = await getDebtAssets(userId)
  const netWorth = totalAssets - totalDebt

  // Build a 6-month trend using cumulative monthly cashflow approximation
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth()-5, 1)

  const res = await pool.query(
    `SELECT DATE_TRUNC('month', date) AS m, 
            SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS inc,
            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS exp
     FROM transactions
     WHERE user_id=$1 AND date >= $2
     GROUP BY 1 ORDER BY 1`,
    [userId, start.toISOString().slice(0,10)]
  )
  let cumulative = 0
  const trend = []
  const months = []
  for (let i=0;i<6;i++) {
    months.push(new Date(start.getFullYear(), start.getMonth()+i, 1))
  }
  for (const m of months) {
    const row = res.rows.find(r => new Date(r.m).getMonth() === m.getMonth() && new Date(r.m).getFullYear() === m.getFullYear())
    const inc = row ? parseFloat(row.inc)||0 : 0
    const exp = row ? parseFloat(row.exp)||0 : 0
    cumulative += (inc - exp)
    trend.push({ month: m.toISOString().slice(0,7), netWorth: round2(netWorth + cumulative) })
  }
  return { assetsTotal: round2(totalAssets), liabilitiesTotal: round2(totalDebt), current: round2(netWorth), trend }
}

async function getDashboardAnalytics(userId) {
  const now = new Date()
  const start30 = new Date(now)
  start30.setDate(start30.getDate() - 30)

  const { income, expenses } = await getIncomeExpense(userId, start30.toISOString().slice(0,10), now.toISOString().slice(0,10))
  const savings = Math.max(0, income - expenses)
  const savingsRate = income > 0 ? savings / income : 0

  const { months: emergencyMonths } = await getEmergencyFundMonths(userId)
  const { totalDebt, totalAssets, debtRecordCount, debtDataStatus } = await getDebtAssets(userId)
  
  // Check if user has any data
  const hasData = income > 0 || expenses > 0 || debtRecordCount > 0 || totalAssets > 0
  
  // A ratio cannot be calculated without income. Keep that distinct from a
  // confirmed ₹0 balance, whose impact is correctly zero even without income.
  const rawDebtRatio = debtDataStatus === 'unavailable'
    ? null
    : totalDebt === 0
      ? 0
      : income > 0
        ? totalDebt / income
        : null
  const debtImpact = rawDebtRatio === null
    ? null
    : calculateDebtImpact(rawDebtRatio, debtDataStatus)
  const { avgProgress: goalProgress } = await getGoalProgress(userId)
  const { score: diversificationScore } = await getDiversificationScore(userId)

  const health = computeHealthScore({ savingsRate, emergencyMonths, debtImpact, goalProgress, diversificationScore })

  // Insights
  const insights = []
  const over = await getOverspendingInsight(userId)
  if (over) insights.push(over)
  const emerg = await getEmergencyInsight(emergencyMonths)
  if (emerg) insights.push(emerg)
  const goalInsights = await getGoalAccelerationInsights(userId)
  insights.push(...goalInsights)

  const netWorth = await getNetWorth(userId)

  return {
    hasData, // Flag indicating if user has any data
    healthScore: health.value,
    healthBreakdown: health.breakdown,
    period: { start: start30.toISOString().slice(0,10), end: now.toISOString().slice(0,10) },
    totals: { income: round2(income), expenses: round2(expenses), savings: round2(savings) },
    metrics: {
      savingsRate: round2(savingsRate*100),
      expenseRatio: round2((income>0? (expenses/income):1)*100),
      emergencyMonths: round2(emergencyMonths),
      debtRatio: rawDebtRatio === null ? null : round2(rawDebtRatio * 100),
      debtImpact: debtImpact === null ? null : round2(debtImpact * 100),
      goalProgress: round2(goalProgress*100),
      diversification: round2(diversificationScore*100)
    },
    debt: {
      total: round2(totalDebt),
      recordCount: debtRecordCount,
      dataStatus: debtDataStatus,
    },
    insights,
    netWorth,
  }
}

module.exports = { getDashboardAnalytics, calculateDebtImpact, computeHealthScore }
