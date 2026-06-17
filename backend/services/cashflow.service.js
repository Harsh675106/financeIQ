const pool = require('../config/database')

async function getMonthlyTotals(userId, start, end) {
  const res = await pool.query(
    `SELECT DATE_TRUNC('month', date) AS m,
            SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS inc,
            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS exp
     FROM transactions
     WHERE user_id=$1 AND date BETWEEN $2 AND $3
     GROUP BY 1 ORDER BY 1`,
    [userId, start, end]
  )
  return res.rows.map(r => ({ month: new Date(r.m), income: parseFloat(r.inc)||0, expense: parseFloat(r.exp)||0 }))
}

async function detectRecurring(userId, lookbackMonths=12) {
  const start = new Date()
  start.setMonth(start.getMonth()-lookbackMonths)
  const q = await pool.query(
    `SELECT type, amount, description, date FROM transactions WHERE user_id=$1 AND date >= $2 ORDER BY date ASC`,
    [userId, start.toISOString().slice(0,10)]
  )
  const rows = q.rows.map(r => ({ ...r, amount: parseFloat(r.amount), date: new Date(r.date) }))
  const groups = new Map()
  for (const tr of rows) {
    const key = `${tr.type}|${tr.amount.toFixed(2)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(tr)
  }
  const rec = []
  for (const [k, list] of groups.entries()) {
    if (list.length < 3) continue
    list.sort((a,b)=>a.date-b.date)
    const intervals = []
    for (let i=1;i<list.length;i++) intervals.push((list[i].date-list[i-1].date)/(1000*60*60*24))
    const avg = intervals.reduce((a,b)=>a+b,0)/intervals.length
    const sd = Math.sqrt(intervals.map(x => (x-avg)**2).reduce((a,b)=>a+b,0)/intervals.length)
    if (avg>25 && avg<35 && sd<6) rec.push({ type: list[0].type, amount: list[0].amount })
  }
  return rec
}

async function forecastNext6Months(userId) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth()-12, 1)
  const hist = await getMonthlyTotals(userId, start.toISOString().slice(0,10), now.toISOString().slice(0,10))
  const recurring = await detectRecurring(userId)

  const monthlyRecurringIncome = recurring.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0)
  const monthlyRecurringExpense = recurring.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0)

  const histLen = hist.length
  const avgInc = histLen ? hist.reduce((s,x)=>s+x.income,0)/histLen : 0
  const avgExp = histLen ? hist.reduce((s,x)=>s+x.expense,0)/histLen : 0

  const baselineInc = Math.max(avgInc, monthlyRecurringIncome)
  const baselineExp = Math.max(avgExp, monthlyRecurringExpense)

  // Current cash balance proxy: savings sum
  const savingsRes = await pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM savings WHERE user_id=$1', [userId])
  let balance = parseFloat(savingsRes.rows[0].total)||0

  const forecast = []
  for (let i=1;i<=6;i++) {
    const inc = baselineInc
    const exp = baselineExp
    balance += (inc - exp)
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1)
    forecast.push({ month: d.toISOString().slice(0,7), income: Math.round(inc*100)/100, expense: Math.round(exp*100)/100, projectedBalance: Math.round(balance*100)/100 })
  }

  return { baseline: { monthlyIncome: Math.round(baselineInc*100)/100, monthlyExpense: Math.round(baselineExp*100)/100 }, forecast }
}

module.exports = { forecastNext6Months }
