const pool = require('../config/database')

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function mapSeverityToDb(severity) {
  switch (severity) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'high'
    case 'warning':
      return 'medium'
    case 'info':
    default:
      return 'low'
  }
}

function severityRank(severity) {
  switch (severity) {
    case 'critical':
      return 4
    case 'high':
      return 3
    case 'warning':
      return 2
    default:
      return 1
  }
}

function createAlert({
  alert_type,
  severity,
  title,
  message,
  recommendation,
  estimatedMonthlyImpact = 0,
  confidence = 70,
  whyItTriggered = '',
  assumptions = [],
  whatChangesIfWrong = '',
}) {
  return {
    alert_type,
    severity,
    title,
    message,
    recommendation,
    estimatedMonthlyImpact: round2(estimatedMonthlyImpact),
    confidence: round2(confidence),
    whyItTriggered,
    assumptions,
    whatChangesIfWrong,
    impactScore: round2(severityRank(severity) * 25 + Math.min(estimatedMonthlyImpact, 50000) / 1000),
  }
}

async function incomeExpenseInPeriod(userId, start, end) {
  const income = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS total
     FROM transactions
     WHERE user_id=$1 AND type='income' AND date BETWEEN $2 AND $3`,
    [userId, start, end]
  )
  const expenses = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS total
     FROM transactions
     WHERE user_id=$1 AND type='expense' AND date BETWEEN $2 AND $3`,
    [userId, start, end]
  )
  return {
    income: parseFloat(income.rows[0].total) || 0,
    expenses: parseFloat(expenses.rows[0].total) || 0,
  }
}

async function getEmergencyFund(userId) {
  const savingsRes = await pool.query(
    'SELECT COALESCE(SUM(amount),0) AS total FROM savings WHERE user_id=$1',
    [userId]
  )
  const cash = parseFloat(savingsRes.rows[0].total) || 0
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
  const end = now.toISOString().slice(0, 10)
  const { expenses } = await incomeExpenseInPeriod(userId, start, end)
  const avgMonthly = expenses / 3
  const months = avgMonthly > 0 ? cash / avgMonthly : 0
  return { months: round2(months), cash: round2(cash), avgMonthly: round2(avgMonthly) }
}

function mapTypeToBucket(type) {
  const text = (type || '').toLowerCase()
  if (['stock', 'stocks', 'equity', 'mutualfund', 'mutual fund', 'mf', 'crypto', 'cryptocurrency', 'etf'].some((item) => text.includes(item))) return 'equity'
  if (['debt', 'bond', 'bonds', 'fixed income', 'fd'].some((item) => text.includes(item))) return 'debt'
  if (['gold'].some((item) => text.includes(item))) return 'gold'
  if (['cash', 'liquid', 'savings', 'bank'].some((item) => text.includes(item))) return 'liquid'
  return 'equity'
}

async function currentAllocation(userId) {
  const assets = await pool.query('SELECT type, quantity, price FROM assets WHERE user_id=$1', [userId])
  const sums = { equity: 0, debt: 0, gold: 0, liquid: 0 }
  let total = 0

  for (const asset of assets.rows) {
    const quantity = parseFloat(asset.quantity) || 0
    const price = parseFloat(asset.price) || 0
    const value = quantity * price
    sums[mapTypeToBucket(asset.type)] += value
    total += value
  }

  const weights = total > 0
    ? {
        equity: round2((sums.equity / total) * 100),
        debt: round2((sums.debt / total) * 100),
        gold: round2((sums.gold / total) * 100),
        liquid: round2((sums.liquid / total) * 100),
      }
    : { equity: 0, debt: 0, gold: 0, liquid: 0 }

  return { weights, total: round2(total) }
}

async function targetAllocation(userId) {
  const profile = await pool.query('SELECT target_allocation FROM profiles WHERE user_id=$1', [userId])
  if (profile.rows.length && profile.rows[0].target_allocation) {
    const allocation = profile.rows[0].target_allocation
    return {
      equity: allocation.equity || 0,
      debt: allocation.debt || 0,
      gold: allocation.gold || 0,
      liquid: allocation.liquid || 0,
    }
  }

  const latestRisk = await pool.query(
    'SELECT risk_level FROM risk_assessments WHERE user_id=$1 ORDER BY assessment_date DESC LIMIT 1',
    [userId]
  )
  const riskLevel = latestRisk.rows[0]?.risk_level || 'Balanced'
  const defaults = {
    Conservative: { equity: 20, debt: 60, gold: 10, liquid: 10 },
    Balanced: { equity: 50, debt: 30, gold: 10, liquid: 10 },
    Aggressive: { equity: 70, debt: 15, gold: 10, liquid: 5 },
  }
  return defaults[riskLevel] || defaults.Balanced
}

async function getRecentExpenseTransactions(userId, months = 6) {
  const start = new Date()
  start.setMonth(start.getMonth() - months)
  const result = await pool.query(
    `SELECT id, description, category, amount, date
     FROM transactions
     WHERE user_id = $1 AND type='expense' AND date >= $2
     ORDER BY date DESC, id DESC`,
    [userId, start.toISOString().slice(0, 10)]
  )
  return result.rows.map((row) => ({
    ...row,
    amount: parseFloat(row.amount) || 0,
  }))
}

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function classifyRecurringExpense(transaction) {
  const text = normalizeText(transaction.description)
  if (['rent', 'lease', 'mortgage'].some((item) => text.includes(item))) return 'housing'
  if (['emi', 'loan', 'credit card'].some((item) => text.includes(item))) return 'debt'
  if (['netflix', 'spotify', 'prime', 'hotstar', 'youtube', 'subscription', 'membership'].some((item) => text.includes(item))) return 'subscription'
  if (['electric', 'water', 'internet', 'wifi', 'airtel', 'jio', 'bill'].some((item) => text.includes(item))) return 'bill'
  return null
}

function average(values) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

async function detectSpendingSpikeAlert(userId, monthlyIncome) {
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
  const result = await pool.query(
    `SELECT COALESCE(category, 'Other') AS category,
            DATE_TRUNC('month', date) AS month,
            COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
       AND type = 'expense'
       AND date >= $2
     GROUP BY category, month
     ORDER BY month ASC`,
    [userId, previousStart]
  )

  const grouped = new Map()
  for (const row of result.rows) {
    const category = row.category
    if (!grouped.has(category)) grouped.set(category, [])
    grouped.get(category).push({
      month: new Date(row.month).toISOString().slice(0, 7),
      total: parseFloat(row.total) || 0,
    })
  }

  const alerts = []
  for (const [category, items] of grouped.entries()) {
    const current = items.find((item) => item.month === currentMonthStart.slice(0, 7))
    const history = items.filter((item) => item.month !== currentMonthStart.slice(0, 7)).map((item) => item.total)
    if (!current || history.length < 2) continue
    const baseline = average(history)
    if (baseline <= 0) continue
    const increaseRatio = ((current.total - baseline) / baseline) * 100
    if (increaseRatio >= 25) {
      alerts.push(createAlert({
        alert_type: 'category_spike',
        severity: increaseRatio >= 50 ? 'high' : 'warning',
        title: `${category} spending spike`,
        message: `Your ${category} spending is ${Math.round(increaseRatio)}% above its recent baseline.`,
        recommendation: `Trim about ${Math.round(current.total - baseline).toLocaleString('en-IN')} from ${category} next month or rebalance your budget.`,
        estimatedMonthlyImpact: current.total - baseline,
        confidence: history.length >= 3 ? 86 : 74,
        whyItTriggered: `${category} spending is ${Math.round(current.total).toLocaleString('en-IN')} this month versus a recent average of ${Math.round(baseline).toLocaleString('en-IN')}.`,
        assumptions: [
          'Uses the previous 2-3 months as the baseline for this category.',
          'Assumes this month is representative and not a one-off annual payment.',
        ],
        whatChangesIfWrong: monthlyIncome > 0 && current.total < monthlyIncome * 0.05
          ? 'If this was a one-time purchase, this alert can be ignored safely after review.'
          : 'If this category naturally varies month to month, reduce the importance of this alert.',
      }))
    }
  }

  return alerts
}

function groupRecurringExpenses(transactions) {
  const groups = new Map()
  for (const transaction of transactions) {
    const kind = classifyRecurringExpense(transaction)
    if (!kind) continue
    const merchant = normalizeText(transaction.description)
    const key = `${kind}|${merchant}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(transaction)
  }
  return groups
}

async function detectFixedCostPressureAlert(userId, monthlyIncome) {
  if (monthlyIncome <= 0) return null
  const transactions = await getRecentExpenseTransactions(userId, 4)
  const recurringGroups = groupRecurringExpenses(transactions)
  let fixedCosts = 0
  let subscriptionCosts = 0
  let emiCosts = 0
  let housingCosts = 0

  for (const [key, items] of recurringGroups.entries()) {
    if (items.length < 2) continue
    const latestAmount = items[0].amount
    fixedCosts += latestAmount
    if (key.startsWith('subscription|') || key.startsWith('bill|')) subscriptionCosts += latestAmount
    if (key.startsWith('debt|')) emiCosts += latestAmount
    if (key.startsWith('housing|')) housingCosts += latestAmount
  }

  const ratio = monthlyIncome > 0 ? (fixedCosts / monthlyIncome) * 100 : 0
  if (ratio < 55) return null

  return createAlert({
    alert_type: 'fixed_cost_pressure',
    severity: ratio >= 70 ? 'critical' : 'high',
    title: 'Fixed costs are crowding out flexibility',
    message: `Rent, EMI, recurring bills, and subscriptions are using about ${Math.round(ratio)}% of your monthly income.`,
    recommendation: 'Reduce at least one recurring cost or avoid adding new EMI commitments until this ratio falls closer to 50%.',
    estimatedMonthlyImpact: fixedCosts - monthlyIncome * 0.5,
    confidence: 84,
    whyItTriggered: `Estimated fixed costs are ${Math.round(fixedCosts).toLocaleString('en-IN')} per month, including housing ${Math.round(housingCosts).toLocaleString('en-IN')}, EMI/debt ${Math.round(emiCosts).toLocaleString('en-IN')}, and subscriptions/bills ${Math.round(subscriptionCosts).toLocaleString('en-IN')}.`,
    assumptions: [
      'Recurring costs are estimated from the most recent matching expenses over the last 4 months.',
      'Income is based on recent transaction history and may be less reliable if income is irregular.',
    ],
    whatChangesIfWrong: 'If some of these recurring charges are temporary or already canceled, the pressure is overstated and should be lower after cleanup.',
  })
}

async function detectSubscriptionPriceCreepAlert(userId) {
  const transactions = await getRecentExpenseTransactions(userId, 6)
  const recurringGroups = groupRecurringExpenses(transactions)
  const candidates = []

  for (const [key, items] of recurringGroups.entries()) {
    if (!key.startsWith('subscription|') || items.length < 3) continue
    const ordered = items
      .slice()
      .sort((left, right) => new Date(left.date) - new Date(right.date))
    const first = ordered[0].amount
    const latest = ordered[ordered.length - 1].amount
    if (first <= 0 || latest <= first * 1.1) continue
    candidates.push({
      merchant: ordered[ordered.length - 1].description || 'Subscription',
      first,
      latest,
      delta: latest - first,
    })
  }

  if (!candidates.length) return null
  const top = candidates.sort((left, right) => right.delta - left.delta)[0]
  const increaseRatio = ((top.latest - top.first) / top.first) * 100

  return createAlert({
    alert_type: 'subscription_price_creep',
    severity: increaseRatio >= 25 ? 'warning' : 'info',
    title: `${top.merchant} price creep detected`,
    message: `${top.merchant} appears to have increased from ${Math.round(top.first).toLocaleString('en-IN')} to ${Math.round(top.latest).toLocaleString('en-IN')}.`,
    recommendation: 'Review whether this subscription is still worth keeping or if a cheaper plan can replace it.',
    estimatedMonthlyImpact: top.delta,
    confidence: 78,
    whyItTriggered: `The same recurring merchant showed at least 3 charges and the latest charge is ${Math.round(increaseRatio)}% above the earliest one in the recent window.`,
    assumptions: [
      'Charges are grouped by normalized merchant name.',
      'The recurring pattern is assumed to be the same subscription rather than separate purchases.',
    ],
    whatChangesIfWrong: 'If the merchant had add-ons or one-time purchases mixed in, this may not be a true price increase.',
  })
}

async function generateAlerts(userId) {
  const alerts = []
  const now = new Date()
  const start30 = new Date(now)
  start30.setDate(start30.getDate() - 30)
  const monthWindow = await incomeExpenseInPeriod(
    userId,
    start30.toISOString().slice(0, 10),
    now.toISOString().slice(0, 10)
  )

  if (monthWindow.income > 0 && monthWindow.expenses > 0.8 * monthWindow.income) {
    const ratio = Math.round((monthWindow.expenses / monthWindow.income) * 100)
    alerts.push(createAlert({
      alert_type: 'overspending',
      severity: ratio >= 100 ? 'high' : 'warning',
      title: 'Monthly expenses are running hot',
      message: `Expenses are ${ratio}% of income this month.`,
      recommendation: 'Pause discretionary spending until your income-to-expense gap improves.',
      estimatedMonthlyImpact: monthWindow.expenses - monthWindow.income * 0.8,
      confidence: 90,
      whyItTriggered: `Recent income is ${Math.round(monthWindow.income).toLocaleString('en-IN')} and expenses are ${Math.round(monthWindow.expenses).toLocaleString('en-IN')}.`,
      assumptions: [
        'Uses the last 30 days of income and expense data.',
        'Assumes this month is representative of your current run rate.',
      ],
      whatChangesIfWrong: 'If a large annual or one-time expense landed this month, the next month may normalize on its own.',
    }))
  }

  const emergencyFund = await getEmergencyFund(userId)
  if (emergencyFund.months < 1) {
    alerts.push(createAlert({
      alert_type: 'emergency_fund',
      severity: 'critical',
      title: 'Emergency buffer is critically low',
      message: 'Emergency fund is below 1 month of expenses.',
      recommendation: 'Direct new savings to cash reserves before taking on new discretionary goals or debt.',
      estimatedMonthlyImpact: emergencyFund.avgMonthly * 3 - emergencyFund.cash,
      confidence: 93,
      whyItTriggered: `Cash reserves are about ${Math.round(emergencyFund.cash).toLocaleString('en-IN')} against average monthly expenses of ${Math.round(emergencyFund.avgMonthly).toLocaleString('en-IN')}.`,
      assumptions: [
        'Emergency fund is estimated from saved cash balances only.',
        'Average monthly expense uses the last 3 months.',
      ],
      whatChangesIfWrong: 'If you keep cash in external accounts not recorded here, your actual runway may be stronger.',
    }))
  } else if (emergencyFund.months < 3) {
    alerts.push(createAlert({
      alert_type: 'emergency_fund',
      severity: 'warning',
      title: 'Emergency buffer needs work',
      message: 'Emergency fund is below the 3-month minimum target.',
      recommendation: 'Increase automatic cash savings until you reach at least 3 months of expenses.',
      estimatedMonthlyImpact: emergencyFund.avgMonthly * 3 - emergencyFund.cash,
      confidence: 89,
      whyItTriggered: `Current runway is about ${round2(emergencyFund.months)} month(s).`,
      assumptions: [
        'Target runway is 3 months of expenses.',
        'Savings balances in FinanceIQ represent your available cash reserves.',
      ],
      whatChangesIfWrong: 'If you have stable family support or off-platform liquid assets, the urgency can be lower.',
    }))
  }

  const current = await currentAllocation(userId)
  const target = await targetAllocation(userId)
  for (const bucket of ['equity', 'debt', 'gold', 'liquid']) {
    const drift = (current.weights[bucket] || 0) - (target[bucket] || 0)
    if (drift > 10) {
      alerts.push(createAlert({
        alert_type: 'portfolio_overweight',
        severity: drift > 20 ? 'high' : 'warning',
        title: `${bucket} allocation is overweight`,
        message: `Your ${bucket} allocation is about ${Math.round(drift)}% above target.`,
        recommendation: `Rebalance part of your ${bucket} holdings toward your target mix when practical.`,
        estimatedMonthlyImpact: current.total * (drift / 100),
        confidence: 83,
        whyItTriggered: `Current ${bucket} weight is ${round2(current.weights[bucket] || 0)}% versus target ${round2(target[bucket] || 0)}%.`,
        assumptions: [
          'Uses recorded portfolio holdings only.',
          'Target allocation comes from your profile or latest risk assessment.',
        ],
        whatChangesIfWrong: 'If some holdings are missing or stale, the apparent drift may shrink after portfolio cleanup.',
      }))
    }
  }

  const start3 = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10)
  const quarterWindow = await incomeExpenseInPeriod(userId, start3, now.toISOString().slice(0, 10))
  const netMonthly = (quarterWindow.income - quarterWindow.expenses) / 3
  if (netMonthly < 0 && emergencyFund.cash > 0) {
    const monthsToZero = emergencyFund.cash / Math.abs(netMonthly)
    if (monthsToZero <= 6) {
      alerts.push(createAlert({
        alert_type: 'predictive_cash_shortfall',
        severity: monthsToZero <= 3 ? 'critical' : 'warning',
        title: 'Cash shortfall risk ahead',
        message: `At the current burn rate, cash may run out in about ${Math.ceil(monthsToZero)} month(s).`,
        recommendation: 'Reduce expenses now or bring in more income before cash reserves are exhausted.',
        estimatedMonthlyImpact: Math.abs(netMonthly),
        confidence: 88,
        whyItTriggered: `Average monthly net cashflow is negative by about ${Math.round(Math.abs(netMonthly)).toLocaleString('en-IN')}.`,
        assumptions: [
          'Uses the last 3 months as the cashflow baseline.',
          'Assumes no major positive change in income or spending ahead.',
        ],
        whatChangesIfWrong: 'If upcoming income is higher than recent months or large expenses were one-off, the shortfall date moves later.',
      }))
    }
  }

  const spikeAlerts = await detectSpendingSpikeAlert(userId, monthWindow.income)
  alerts.push(...spikeAlerts)

  const fixedCostPressure = await detectFixedCostPressureAlert(userId, monthWindow.income || quarterWindow.income / 3)
  if (fixedCostPressure) alerts.push(fixedCostPressure)

  const subscriptionPriceCreep = await detectSubscriptionPriceCreepAlert(userId)
  if (subscriptionPriceCreep) alerts.push(subscriptionPriceCreep)

  return alerts
    .sort((left, right) => {
      if (right.impactScore !== left.impactScore) return right.impactScore - left.impactScore
      return severityRank(right.severity) - severityRank(left.severity)
    })
    .slice(0, 10)
}

async function persistAlerts(userId, alerts) {
  const today = new Date().toISOString().split('T')[0]
  for (const alert of alerts) {
    const exists = await pool.query(
      `SELECT id
       FROM risk_alerts
       WHERE user_id=$1 AND alert_type=$2 AND DATE(created_at)=$3 AND is_read=false`,
      [userId, alert.alert_type, today]
    )
    if (!exists.rows.length) {
      await pool.query(
        `INSERT INTO risk_alerts (user_id, alert_type, severity, message)
         VALUES ($1,$2,$3,$4)`,
        [userId, alert.alert_type, mapSeverityToDb(alert.severity), alert.message]
      )
    }
  }
}

module.exports = { generateAlerts, persistAlerts }
