const pool = require("../config/database");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function getBaseline(userId) {
  const cashResult = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM savings WHERE user_id = $1",
    [userId],
  );
  const debtResult = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM debts WHERE user_id = $1",
    [userId],
  );
  const incomeExpenseResult = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
     FROM transactions
     WHERE user_id = $1
       AND date >= $2`,
    [userId, new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().slice(0, 10)],
  );

  const income = (parseFloat(incomeExpenseResult.rows[0]?.income) || 0) / 3;
  const expenses = (parseFloat(incomeExpenseResult.rows[0]?.expenses) || 0) / 3;
  const cash = parseFloat(cashResult.rows[0]?.total) || 0;
  const debt = parseFloat(debtResult.rows[0]?.total) || 0;

  return { income, expenses, cash, debt };
}

async function runScenario(userId, scenarioType, payload = {}) {
  const baseline = await getBaseline(userId);
  const months = Number.parseInt(payload.months || "6", 10);

  let adjustedIncome = baseline.income;
  let adjustedExpenses = baseline.expenses;
  let oneTimeCashImpact = 0;
  let portfolioShock = 0;

  switch (scenarioType) {
    case "job_loss":
      adjustedIncome = baseline.income * 0.25;
      break;
    case "rent_increase":
      adjustedExpenses = baseline.expenses + Number(payload.monthlyIncrease || 0);
      break;
    case "bonus":
      oneTimeCashImpact = Number(payload.amount || 0);
      break;
    case "loan_prepayment":
      oneTimeCashImpact = -Math.abs(Number(payload.amount || 0));
      break;
    case "house_purchase":
      oneTimeCashImpact = -Math.abs(Number(payload.downPayment || 0));
      adjustedExpenses += Number(payload.monthlyHousingCost || 0);
      break;
    case "market_crash":
      portfolioShock = -Math.abs(Number(payload.percentDrop || 20)) / 100;
      break;
    case "new_child":
      adjustedExpenses += Number(payload.monthlyIncrease || 15000);
      break;
    default:
      break;
  }

  let projectedCash = baseline.cash + oneTimeCashImpact;
  const timeline = [];
  for (let month = 1; month <= months; month += 1) {
    projectedCash += adjustedIncome - adjustedExpenses;
    timeline.push({
      month,
      projectedCash: round2(projectedCash),
    });
  }

  return {
    scenarioType,
    baseline: {
      monthlyIncome: round2(baseline.income),
      monthlyExpenses: round2(baseline.expenses),
      cash: round2(baseline.cash),
      debt: round2(baseline.debt),
    },
    projected: {
      monthlyIncome: round2(adjustedIncome),
      monthlyExpenses: round2(adjustedExpenses),
      finalCash: round2(projectedCash),
      oneTimeCashImpact: round2(oneTimeCashImpact),
      portfolioShockPercent: round2(portfolioShock * 100),
    },
    timeline,
    explanation:
      adjustedIncome - adjustedExpenses >= 0
        ? "This scenario remains cashflow-positive based on current assumptions."
        : "This scenario turns cashflow negative and would require spending cuts, more income, or a stronger cash buffer.",
    assumptions: [
      "Uses the last 3 months as the baseline.",
      "Assumes income and expenses stay constant during the scenario window.",
      "Portfolio shock is informational and not yet connected to live market data.",
    ],
  };
}

module.exports = { runScenario };
