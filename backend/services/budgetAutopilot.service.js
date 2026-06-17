const pool = require("../config/database");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function getBudgetAutopilot(userId) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const expensesResult = await pool.query(
    `SELECT COALESCE(category, 'Other') AS category,
            DATE_TRUNC('month', date) AS month,
            COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
       AND type = 'expense'
       AND date >= $2
     GROUP BY category, month
     ORDER BY month ASC`,
    [userId, start.toISOString().slice(0, 10)],
  );

  const incomeResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
       AND type = 'income'
       AND date >= $2`,
    [userId, start.toISOString().slice(0, 10)],
  );

  const categoryMap = new Map();
  for (const row of expensesResult.rows) {
    const category = row.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category).push(parseFloat(row.total) || 0);
  }

  const recommendations = [...categoryMap.entries()]
    .map(([category, totals]) => {
      const average = totals.reduce((sum, value) => sum + value, 0) / totals.length;
      const autopilotBudget = average * 1.05;
      const latestSpend = totals[totals.length - 1] || 0;
      return {
        category,
        autopilotBudget: round2(autopilotBudget),
        averageSpend: round2(average),
        latestSpend: round2(latestSpend),
        confidence: totals.length >= 3 ? 84 : 65,
        recommendation:
          latestSpend > autopilotBudget
            ? `Spending is running above your adaptive target for ${category}. Consider trimming by ${round2(latestSpend - autopilotBudget)} next month.`
            : `Your ${category} budget is stable. Current adaptive target is ${round2(autopilotBudget)}.`,
      };
    })
    .sort((left, right) => right.latestSpend - left.latestSpend);

  const totalIncome = parseFloat(incomeResult.rows[0]?.total) || 0;
  const currentMonthStart = startOfMonth(now);
  const spentThisMonthResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
       AND type = 'expense'
       AND date BETWEEN $2 AND $3`,
    [userId, currentMonthStart.toISOString().slice(0, 10), now.toISOString().slice(0, 10)],
  );
  const spentThisMonth = parseFloat(spentThisMonthResult.rows[0]?.total) || 0;
  const daysPassed = Math.max(1, now.getDate());
  const daysRemaining = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - daysPassed);
  const monthlySafeSpend = Math.max(0, totalIncome / 3 - spentThisMonth);
  const weeklySafeToSpend = round2((monthlySafeSpend / daysRemaining) * 7);

  return {
    weeklySafeToSpend,
    monthlySafeSpend: round2(monthlySafeSpend),
    confidence: recommendations.length >= 3 ? 81 : 62,
    recommendations: recommendations.slice(0, 8),
    assumptions: [
      "Uses the last 3 months of expense behavior.",
      "Assumes current income pattern is stable.",
      "Does not yet include connected bank account bills automatically.",
    ],
  };
}

module.exports = { getBudgetAutopilot };
