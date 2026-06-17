const pool = require("../config/database");
const { getDashboardAnalytics } = require("./analytics.service");
const { forecastNext6Months } = require("./cashflow.service");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildPriority({ title, detail, impact, confidence, metric, direction }) {
  return { title, detail, impact, confidence, metric, direction };
}

async function getRecurringSubscriptions(userId) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const result = await pool.query(
    `SELECT COALESCE(category, 'Other') AS category,
            COALESCE(description, 'Recurring expense') AS description,
            amount,
            date
     FROM transactions
     WHERE user_id = $1
       AND type = 'expense'
       AND date >= $2
     ORDER BY date ASC`,
    [userId, sixMonthsAgo.toISOString().slice(0, 10)],
  );

  const groups = new Map();
  for (const row of result.rows) {
    const amount = parseFloat(row.amount) || 0;
    const key = `${row.category}|${row.description}|${amount.toFixed(2)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push({ ...row, amount, date: new Date(row.date) });
  }

  const recurring = [];
  for (const [, items] of groups) {
    if (items.length < 3) {
      continue;
    }

    const intervals = [];
    for (let index = 1; index < items.length; index += 1) {
      const gapDays = (items[index].date - items[index - 1].date) / (1000 * 60 * 60 * 24);
      intervals.push(gapDays);
    }

    const averageGap = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    if (averageGap >= 25 && averageGap <= 35) {
      recurring.push({
        category: items[0].category,
        description: items[0].description,
        amount: items[0].amount,
        occurrences: items.length,
      });
    }
  }

  return recurring.sort((a, b) => b.amount - a.amount).slice(0, 5);
}

async function getBudgetPressure(userId) {
  const start = new Date();
  const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);

  const budgets = await pool.query(
    `SELECT category, amount_monthly
     FROM budgets
     WHERE user_id = $1`,
    [userId],
  );

  if (!budgets.rows.length) {
    return [];
  }

  const spending = await pool.query(
    `SELECT COALESCE(category, 'Uncategorized') AS category,
            COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE user_id = $1
       AND type = 'expense'
       AND date BETWEEN $2 AND $3
     GROUP BY category`,
    [userId, monthStart.toISOString().slice(0, 10), start.toISOString().slice(0, 10)],
  );

  const spendMap = new Map(
    spending.rows.map((row) => [row.category, parseFloat(row.total) || 0]),
  );

  return budgets.rows
    .map((row) => {
      const budget = parseFloat(row.amount_monthly) || 0;
      const spent = spendMap.get(row.category) || 0;
      const ratio = budget > 0 ? spent / budget : 0;
      return {
        category: row.category,
        budget: round2(budget),
        spent: round2(spent),
        ratio: round2(ratio * 100),
      };
    })
    .filter((item) => item.ratio >= 80)
    .sort((a, b) => b.ratio - a.ratio);
}

async function getFinancialBriefing(userId) {
  const dashboard = await getDashboardAnalytics(userId);
  const forecast = await forecastNext6Months(userId);
  const recurringSubscriptions = await getRecurringSubscriptions(userId);
  const budgetPressure = await getBudgetPressure(userId);

  const priorities = [];
  const metrics = dashboard.metrics;
  const totals = dashboard.totals;

  if (metrics.emergencyMonths < 3) {
    priorities.push(
      buildPriority({
        title: "Rebuild your emergency buffer",
        detail: `Current runway is ${metrics.emergencyMonths} month(s). Growing this to 3-6 months should be your first stability move.`,
        impact: "high",
        confidence: 0.91,
        metric: "Emergency runway",
        direction: "increase",
      }),
    );
  }

  if (metrics.savingsRate < 15) {
    priorities.push(
      buildPriority({
        title: "Improve monthly savings rate",
        detail: `You are saving ${metrics.savingsRate}% of recent income. FinanceIQ should target at least 15-20% for healthier cash resilience.`,
        impact: "high",
        confidence: 0.88,
        metric: "Savings rate",
        direction: "increase",
      }),
    );
  }

  if (metrics.debtRatio > 30) {
    priorities.push(
      buildPriority({
        title: "Reduce debt pressure",
        detail: `Debt load is ${metrics.debtRatio}% of recent income. Paying down high-interest balances should materially improve health score and stress risk.`,
        impact: "high",
        confidence: 0.86,
        metric: "Debt ratio",
        direction: "decrease",
      }),
    );
  }

  const forecastLowPoint = forecast.forecast.reduce(
    (lowest, month) =>
      month.projectedBalance < lowest.projectedBalance ? month : lowest,
    forecast.forecast[0] || { projectedBalance: 0, month: null },
  );

  if (forecastLowPoint.month && forecastLowPoint.projectedBalance < 0) {
    priorities.push(
      buildPriority({
        title: "Upcoming cash shortfall detected",
        detail: `Your current trend projects a negative balance by ${forecastLowPoint.month}. Tighten expenses or raise contributions before that month.`,
        impact: "critical",
        confidence: 0.79,
        metric: "Projected balance",
        direction: "increase",
      }),
    );
  }

  for (const item of budgetPressure.slice(0, 2)) {
    priorities.push(
      buildPriority({
        title: `Watch ${item.category} spending`,
        detail: `You have already used ${item.ratio}% of this month's ${item.category} budget (${item.spent} / ${item.budget}).`,
        impact: item.ratio >= 100 ? "high" : "medium",
        confidence: 0.82,
        metric: `${item.category} budget`,
        direction: "decrease",
      }),
    );
  }

  const opportunities = [];
  if (recurringSubscriptions.length) {
    const recurringMonthlyCost = recurringSubscriptions.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    opportunities.push({
      title: "Recurring expense cleanup",
      detail: `Detected ${recurringSubscriptions.length} likely recurring expenses totaling about ${round2(recurringMonthlyCost)} per month.`,
      estimatedMonthlyImpact: round2(recurringMonthlyCost * 0.15),
    });
  }

  if (totals.savings > 0) {
    opportunities.push({
      title: "Goal acceleration",
      detail: "Positive monthly savings means you can auto-route surplus into active goals or emergency reserves.",
      estimatedMonthlyImpact: round2(totals.savings * 0.25),
    });
  }

  const summary = dashboard.hasData
    ? `Health score is ${dashboard.healthScore}/100. Recent cashflow is ${totals.savings >= 0 ? "positive" : "negative"} at ${round2(
        totals.savings,
      )}, and FinanceIQ sees ${priorities.length} priority area(s) to improve next.`
    : "Add transactions, savings, debts, and goals to unlock your personalized FinanceIQ briefing.";

  return {
    generatedAt: new Date().toISOString(),
    summary,
    priorities: priorities.slice(0, 5),
    opportunities,
    recurringSubscriptions,
    forecast,
  };
}

module.exports = { getFinancialBriefing };
