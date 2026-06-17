const { getDashboardAnalytics } = require('./analytics.service')
const { forecastNext6Months } = require('./cashflow.service')
const { getDebtOptimization } = require('./debtOptimizer.service')
const { getUserGoalProjections } = require('./goalProjection.service')

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function currency(value) {
  return Math.round(value || 0).toLocaleString('en-IN')
}

function monthsBetween(today, targetDate) {
  const target = new Date(targetDate)
  const monthDiff = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth())
  return Math.max(1, monthDiff + (target.getDate() >= today.getDate() ? 0 : -1))
}

function estimateCurrentCash(forecast) {
  const firstMonth = forecast.forecast?.[0]
  if (!firstMonth) return 0
  return round2(firstMonth.projectedBalance - (forecast.baseline.monthlyIncome - forecast.baseline.monthlyExpense))
}

function normalizeEventType(eventType) {
  const allowed = ['car_purchase', 'higher_studies', 'wedding', 'layoff_recovery']
  return allowed.includes(eventType) ? eventType : 'car_purchase'
}

function defaultPayload(eventType) {
  switch (eventType) {
    case 'higher_studies':
      return { targetAmount: 800000, targetDate: new Date(new Date().getFullYear() + 2, 5, 1).toISOString().slice(0, 10) }
    case 'wedding':
      return { targetAmount: 1200000, targetDate: new Date(new Date().getFullYear() + 1, 11, 1).toISOString().slice(0, 10) }
    case 'layoff_recovery':
      return { targetAmount: 0, targetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 9, 1).toISOString().slice(0, 10), emergencyMonthsGoal: 6 }
    case 'car_purchase':
    default:
      return { targetAmount: 500000, targetDate: new Date(new Date().getFullYear() + 1, 5, 1).toISOString().slice(0, 10) }
  }
}

function eventLabel(eventType) {
  switch (eventType) {
    case 'higher_studies':
      return 'Higher studies'
    case 'wedding':
      return 'Wedding'
    case 'layoff_recovery':
      return 'Emergency fund rebuild after layoff'
    default:
      return 'Car purchase'
  }
}

function buildTradeoffs(eventType, affordabilityGap, debtPlan, weakGoals) {
  const tradeoffs = []
  if (affordabilityGap > 0) {
    tradeoffs.push(`Increase event savings by about ${currency(affordabilityGap)} per month or push the timeline out.`)
  }
  if (debtPlan?.hasDebts) {
    tradeoffs.push('Balancing this event with debt payoff will slow one of the two unless income rises.')
  }
  if (weakGoals > 0) {
    tradeoffs.push(`You already have ${weakGoals} at-risk goal(s), so this event may compete with existing priorities.`)
  }
  if (eventType === 'layoff_recovery') {
    tradeoffs.push('Rebuilding stability may mean pausing discretionary goals until cash reserves recover.')
  }
  return tradeoffs
}

async function planLifeEvent(userId, eventTypeInput, payload = {}) {
  const eventType = normalizeEventType(eventTypeInput)
  const defaults = defaultPayload(eventType)
  const eventPayload = {
    ...defaults,
    ...payload,
  }

  const [dashboard, forecast, debtPlan, goalProjections] = await Promise.all([
    getDashboardAnalytics(userId),
    forecastNext6Months(userId),
    getDebtOptimization(userId),
    getUserGoalProjections(userId),
  ])

  const today = new Date()
  const monthlyIncome = forecast.baseline.monthlyIncome || 0
  const monthlyExpense = forecast.baseline.monthlyExpense || 0
  const monthlySurplus = round2(monthlyIncome - monthlyExpense)
  const currentCash = estimateCurrentCash(forecast)
  const emergencyMonthsGoal = Number(eventPayload.emergencyMonthsGoal || 6)
  const emergencyReserveTarget = round2(monthlyExpense * emergencyMonthsGoal)
  const monthsToEvent = monthsBetween(today, eventPayload.targetDate)
  const targetAmount =
    eventType === 'layoff_recovery'
      ? round2(Math.max(0, emergencyReserveTarget - currentCash))
      : round2(Number(eventPayload.targetAmount || 0))

  const usableCashToday =
    eventType === 'layoff_recovery'
      ? 0
      : round2(Math.max(0, currentCash - monthlyExpense * 3))

  const amountLeftToFund = round2(Math.max(0, targetAmount - usableCashToday))
  const requiredMonthly = monthsToEvent > 0 ? round2(amountLeftToFund / monthsToEvent) : amountLeftToFund
  const comfortableMonthly = round2(Math.max(0, monthlySurplus * 0.7))
  const successProbability =
    requiredMonthly <= 0
      ? 100
      : Math.max(5, Math.min(100, Math.round((comfortableMonthly / requiredMonthly) * 100)))
  const monthlyGap = round2(Math.max(0, requiredMonthly - comfortableMonthly))
  const weakGoals = goalProjections.filter((item) => item.projection.successProbability < 70).length

  const recommendations = []
  if (monthlyGap > 0) {
    recommendations.push(`You likely need about ${currency(monthlyGap)} more monthly capacity to hit this plan safely.`)
  } else {
    recommendations.push(`Current cashflow suggests this plan is workable if you save around ${currency(requiredMonthly)} per month.`)
  }
  if (usableCashToday > 0 && eventType !== 'layoff_recovery') {
    recommendations.push(`You could use about ${currency(usableCashToday)} from current cash without cutting below a 3-month emergency buffer.`)
  }
  if (debtPlan?.hasDebts && debtPlan.monthlyPaymentBudget > 0) {
    recommendations.push(`Your debt plan already needs about ${currency(debtPlan.monthlyPaymentBudget)} per month, so event funding should be coordinated with payoff priorities.`)
  }
  if (eventType === 'layoff_recovery') {
    recommendations.push('Focus on restoring 6 months of expenses in liquid savings before expanding long-term goals.')
  }

  const milestones = [
    {
      label: 'Immediate setup',
      detail: eventType === 'layoff_recovery'
        ? `Protect essentials and aim to rebuild at least ${currency(monthlyExpense * 3)} as a minimum buffer first.`
        : `Set up an automatic monthly transfer of about ${currency(requiredMonthly)} toward ${eventLabel(eventType).toLowerCase()}.`,
    },
    {
      label: 'Midpoint check',
      detail: `By month ${Math.max(1, Math.ceil(monthsToEvent / 2))}, you should have roughly ${currency(targetAmount * 0.5)} allocated to stay on track.`,
    },
    {
      label: 'Pre-event review',
      detail: 'Review debt pressure, existing goals, and emergency runway before locking the final spend.',
    },
  ]

  const summary =
    eventType === 'layoff_recovery'
      ? `FinanceIQ estimates you need ${currency(targetAmount)} to rebuild a ${emergencyMonthsGoal}-month emergency reserve.`
      : `FinanceIQ estimates ${currency(targetAmount)} is needed for ${eventLabel(eventType).toLowerCase()} by ${eventPayload.targetDate}.`

  return {
    eventType,
    eventLabel: eventLabel(eventType),
    summary,
    targetDate: eventPayload.targetDate,
    targetAmount,
    monthlyIncome: round2(monthlyIncome),
    monthlyExpense: round2(monthlyExpense),
    monthlySurplus,
    currentCash,
    usableCashToday,
    requiredMonthly,
    comfortableMonthly,
    monthlyGap,
    successProbability,
    recommendations,
    milestones,
    tradeoffs: buildTradeoffs(eventType, monthlyGap, debtPlan, weakGoals),
    assumptions: [
      'Uses current FinanceIQ cashflow and savings as the baseline.',
      'Keeps a minimum 3-month emergency reserve unless the event is layoff recovery.',
      'Does not assume a major income jump unless you add that change manually elsewhere.',
    ],
    whatChangesIfWrong: monthlyGap > 0
      ? 'If your income rises, debts fall faster, or you lower the event budget, the plan becomes much easier.'
      : 'If expenses rise or existing goals need more funding, the recommended monthly saving target should be increased.',
    confidence: dashboard.hasData ? (goalProjections.length >= 1 ? 84 : 72) : 48,
  }
}

module.exports = { planLifeEvent }
