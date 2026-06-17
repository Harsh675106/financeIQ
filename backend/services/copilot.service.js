const axios = require("axios");
const pool = require("../config/database");
const { getDashboardAnalytics } = require("./analytics.service");
const { forecastNext6Months } = require("./cashflow.service");
const { getFinancialBriefing } = require("./financialBriefing.service");
const { getDebtOptimization } = require("./debtOptimizer.service");
const { getUserGoalProjections } = require("./goalProjection.service");
const { runScenario } = require("./scenarioPlanner.service");
const { searchMarketAsset } = require("./marketSnapshot.service");

function normalizeQuestion(question) {
  return (question || "").trim().toLowerCase();
}

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function currency(value) {
  return Math.round(value || 0).toLocaleString("en-IN");
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function safeIdPart(value) {
  return String(value || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function formatSignedPercent(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return `${value > 0 ? "+" : ""}${round2(value)}%`;
}

function createCitation(id, type, label, detail, extras = {}) {
  return {
    id,
    type,
    label,
    detail,
    ...extras,
  };
}

async function getRecentTransactions(userId, limit = 8) {
  const result = await pool.query(
    `SELECT id, date, type, amount, category, description
     FROM transactions
     WHERE user_id = $1
     ORDER BY date DESC, id DESC
     LIMIT $2`,
    [userId, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    date: row.date,
    type: row.type,
    amount: parseFloat(row.amount) || 0,
    category: row.category || "Uncategorized",
    description: row.description || (row.type === "income" ? "Income" : "Expense"),
  }));
}

async function getBudgetRows(userId) {
  const result = await pool.query(
    `SELECT category, amount_monthly
     FROM budgets
     WHERE user_id = $1
     ORDER BY amount_monthly DESC, category ASC`,
    [userId],
  );

  return result.rows.map((row) => ({
    category: row.category || "Uncategorized",
    amountMonthly: parseFloat(row.amount_monthly) || 0,
  }));
}

async function getSavingsRows(userId) {
  const result = await pool.query(
    `SELECT id, amount, account_type, description
     FROM savings
     WHERE user_id = $1
     ORDER BY amount DESC, id DESC
     LIMIT 8`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.account_type || row.description || "Savings",
    amount: parseFloat(row.amount) || 0,
  }));
}

function mapAssetTypeToBucket(type) {
  const normalized = String(type || "").toLowerCase();
  if (["stock", "stocks", "equity", "mutualfund", "mutual fund", "mf", "crypto", "cryptocurrency", "etf"].some((item) => normalized.includes(item))) {
    return "equity";
  }
  if (["debt", "bond", "bonds", "fixed income", "fd"].some((item) => normalized.includes(item))) {
    return "debt";
  }
  if (normalized.includes("gold")) {
    return "gold";
  }
  if (["cash", "liquid", "savings", "bank"].some((item) => normalized.includes(item))) {
    return "liquid";
  }
  return "equity";
}

function computePortfolioRisk(weights) {
  const vol = { equity: 0.18, debt: 0.05, gold: 0.12, liquid: 0.01 };
  const w = {
    equity: (weights.equity || 0) / 100,
    debt: (weights.debt || 0) / 100,
    gold: (weights.gold || 0) / 100,
    liquid: (weights.liquid || 0) / 100,
  };
  const portfolioVariance =
    (w.equity * vol.equity) ** 2 +
    (w.debt * vol.debt) ** 2 +
    (w.gold * vol.gold) ** 2 +
    (w.liquid * vol.liquid) ** 2;
  const annualVolatility = Math.sqrt(portfolioVariance);
  const score = Math.max(0, Math.min(100, Math.round((annualVolatility / 0.2) * 100)));
  const level = score < 35 ? "Conservative" : score < 65 ? "Balanced" : "Aggressive";

  return {
    score,
    level,
    annualVolatility: round2(annualVolatility * 100),
  };
}

async function getPortfolioSnapshot(userId) {
  const [assetResult, profileResult, riskAssessmentResult] = await Promise.all([
    pool.query(
      `SELECT id, type, symbol, quantity, price
       FROM assets
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC`,
      [userId],
    ),
    pool.query(
      `SELECT target_allocation
       FROM profiles
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    ).catch(() => ({ rows: [] })),
    pool.query(
      `SELECT risk_level
       FROM risk_assessments
       WHERE user_id = $1
       ORDER BY assessment_date DESC
       LIMIT 1`,
      [userId],
    ).catch(() => ({ rows: [] })),
  ]);

  const sums = { equity: 0, debt: 0, gold: 0, liquid: 0 };
  const holdings = assetResult.rows.map((row) => {
    const quantity = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.price) || 0;
    const value = round2(quantity * price);
    const bucket = mapAssetTypeToBucket(row.type);
    sums[bucket] += value;

    return {
      id: row.id,
      name: row.symbol || row.type || "Holding",
      type: row.type || "Asset",
      quantity,
      price,
      value,
      bucket,
    };
  });

  const totalValue = round2(Object.values(sums).reduce((sum, value) => sum + value, 0));
  const currentAllocation =
    totalValue > 0
      ? {
          equity: round2((sums.equity / totalValue) * 100),
          debt: round2((sums.debt / totalValue) * 100),
          gold: round2((sums.gold / totalValue) * 100),
          liquid: round2((sums.liquid / totalValue) * 100),
        }
      : { equity: 0, debt: 0, gold: 0, liquid: 0 };

  const targetAllocation = profileResult.rows[0]?.target_allocation || null;
  const risk = computePortfolioRisk(currentAllocation);

  return {
    hasPortfolio: totalValue > 0,
    totalValue,
    currentAllocation,
    targetAllocation,
    risk: {
      ...risk,
      latestRecordedRiskLevel: riskAssessmentResult.rows[0]?.risk_level || null,
    },
    holdings: holdings.slice(0, 8),
  };
}

async function getRiskProfile(userId, dashboard, portfolio) {
  const savingsRate = round2(dashboard.metrics?.savingsRate || 0);
  const emergencyMonths = round2(dashboard.metrics?.emergencyMonths || 0);
  const debtRatio = round2(dashboard.metrics?.debtRatio || 0);
  const portfolioRiskLevel = portfolio.risk?.level || "Balanced";

  let cashflowRisk = "Moderate";
  if (savingsRate < 10 || emergencyMonths < 1 || debtRatio > 50) {
    cashflowRisk = "High";
  } else if (savingsRate >= 20 && emergencyMonths >= 3 && debtRatio < 25) {
    cashflowRisk = "Low";
  }

  return {
    cashflowRisk,
    emergencyMonths,
    debtRatio,
    portfolioRiskLevel,
    portfolioRiskScore: portfolio.risk?.score || 0,
  };
}

function looksLikeFinanceQuestion(question) {
  const normalized = normalizeQuestion(question);
  return containsAny(normalized, [
    "money",
    "finance",
    "financial",
    "budget",
    "spending",
    "expense",
    "income",
    "cash",
    "cashflow",
    "save",
    "saving",
    "debt",
    "loan",
    "credit",
    "goal",
    "retirement",
    "invest",
    "portfolio",
    "risk",
    "stock",
    "gold",
    "silver",
    "mutual fund",
    "sip",
    "net worth",
    "asset",
    "emi",
    "interest",
    "inflation",
    "tax",
    "market",
    "forex",
    "bitcoin",
    "crypto",
  ]);
}

function extractMarketQuery(question) {
  const normalized = normalizeQuestion(question);
  const assetPatterns = [
    { key: "gold", label: "Gold" },
    { key: "silver", label: "Silver" },
    { key: "bitcoin", label: "Bitcoin" },
    { key: "btc", label: "BTC/USD" },
    { key: "usd/inr", label: "USD/INR" },
    { key: "dollar", label: "USD/INR" },
    { key: "s&p 500", label: "SPY" },
    { key: "spy", label: "SPY" },
    { key: "nasdaq", label: "QQQ" },
    { key: "qqq", label: "QQQ" },
    { key: "oil", label: "Oil" },
  ];

  const asksForMarketData = containsAny(normalized, [
    "price",
    "rate",
    "quote",
    "value",
    "today",
    "now",
    "current",
    "market",
    "invest",
    "buy",
    "sell",
  ]);

  if (!asksForMarketData) {
    return null;
  }

  const matched = assetPatterns.find((item) => normalized.includes(item.key));
  return matched?.label || null;
}

function estimateStartingCashBalance(forecast) {
  const firstMonth = forecast.forecast?.[0];
  if (!firstMonth) {
    return 0;
  }

  return round2(
    firstMonth.projectedBalance - (forecast.baseline.monthlyIncome - forecast.baseline.monthlyExpense),
  );
}

function computeMonthlyPayment(principal, annualRatePercent, months) {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = Math.max(0, annualRatePercent) / 100 / 12;
  if (monthlyRate === 0) {
    return principal / months;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return principal * monthlyRate * factor / (factor - 1);
}

function extractAmounts(question) {
  const normalized = normalizeQuestion(question);
  const regex = /(?:rs\.?|inr|\$)?\s*(\d+(?:,\d{2,3})*(?:\.\d+)?)\s*(k|l|lac|lakh|cr|crore)?/gi;
  const matches = [];
  let match = regex.exec(normalized);

  while (match) {
    const baseAmount = parseFloat(match[1].replace(/,/g, ""));
    if (Number.isFinite(baseAmount) && baseAmount > 0) {
      const suffix = (match[2] || "").toLowerCase();
      const multiplier =
        suffix === "k"
          ? 1_000
          : suffix === "l" || suffix === "lac" || suffix === "lakh"
            ? 100_000
            : suffix === "cr" || suffix === "crore"
              ? 10_000_000
              : 1;

      matches.push({
        raw: match[0],
        amount: round2(baseAmount * multiplier),
        index: match.index,
      });
    }
    match = regex.exec(normalized);
  }

  return matches;
}

function parsePurchaseIntent(question) {
  const normalized = normalizeQuestion(question);
  const amounts = extractAmounts(question);
  if (!amounts.length) {
    return null;
  }

  const assetType =
    normalized.includes("car") || normalized.includes("vehicle")
      ? "car"
      : normalized.includes("house") || normalized.includes("home")
        ? "house"
        : normalized.includes("phone") || normalized.includes("mobile")
          ? "phone"
          : normalized.includes("bike")
            ? "bike"
            : "purchase";

  return {
    amount: amounts[0].amount,
    assetType,
  };
}

function parseScenarioIntent(question) {
  const normalized = normalizeQuestion(question);
  const amounts = extractAmounts(question);
  const scenarioAmount = amounts[1]?.amount || 0;

  if (containsAny(normalized, ["job loss", "lose my job", "laid off", "layoff", "unemployed"])) {
    return {
      scenarioType: "job_loss",
      payload: { months: 6 },
      label: "job loss",
    };
  }

  if (containsAny(normalized, ["rent increase", "rent goes up", "rent up", "rent rises"])) {
    return {
      scenarioType: "rent_increase",
      payload: { monthlyIncrease: scenarioAmount || 10000, months: 6 },
      label: "rent increase",
    };
  }

  if (containsAny(normalized, ["bonus", "annual bonus", "joining bonus"])) {
    return {
      scenarioType: "bonus",
      payload: { amount: scenarioAmount || 50000, months: 6 },
      label: "bonus",
    };
  }

  if (containsAny(normalized, ["new child", "baby", "new baby"])) {
    return {
      scenarioType: "new_child",
      payload: { monthlyIncrease: scenarioAmount || 15000, months: 6 },
      label: "new child",
    };
  }

  if (containsAny(normalized, ["market crash", "market drops", "portfolio crash", "stocks crash"])) {
    return {
      scenarioType: "market_crash",
      payload: { percentDrop: scenarioAmount || 20, months: 6 },
      label: "market crash",
    };
  }

  return null;
}

function buildAffordabilitySnapshot(dashboard, forecast, debtPlan, goalProjections) {
  const monthlyIncome = forecast.baseline.monthlyIncome || 0;
  const monthlyExpense = forecast.baseline.monthlyExpense || 0;
  const monthlySurplus = round2(monthlyIncome - monthlyExpense);
  const currentCash = estimateStartingCashBalance(forecast);
  const emergencyTarget = round2(monthlyExpense * 3);
  const cashAvailableAfterBuffer = round2(Math.max(0, currentCash - emergencyTarget));
  const existingDebtMinimums = round2(
    (debtPlan.debts || []).reduce((sum, debt) => sum + (debt.minimumPayment || 0), 0),
  );
  const atRiskGoals = goalProjections.filter((item) => item.projection.successProbability < 70).length;
  const maxComfortableEmi = round2(Math.max(0, monthlySurplus * 0.4));

  return {
    monthlyIncome: round2(monthlyIncome),
    monthlyExpense: round2(monthlyExpense),
    monthlySurplus,
    currentCash,
    emergencyTarget,
    cashAvailableAfterBuffer,
    existingDebtMinimums,
    maxComfortableEmi,
    atRiskGoals,
  };
}

function buildAffordabilityDynamicCitation(analysis) {
  return createCitation(
    `affordability.${analysis.assetType}.${Math.round(analysis.purchaseAmount)}`,
    "forecast",
    `${analysis.assetType} affordability scenario`,
    `Assumes ${analysis.downPaymentPercent}% down (${currency(analysis.downPayment)}), financing ${currency(
      analysis.loanPrincipal,
    )} over ${analysis.loanTermMonths} months at ${analysis.interestRate}% APR, with EMI about ${currency(
      analysis.monthlyPayment,
    )}.`,
    {
      amount: analysis.purchaseAmount,
    },
  );
}

function buildScenarioDynamicCitation(scenarioIntent, scenarioResult) {
  return createCitation(
    `scenario.${scenarioIntent.scenarioType}`,
    "forecast",
    `Scenario: ${scenarioIntent.label}`,
    `${scenarioIntent.label} changes monthly income to ${currency(
      scenarioResult.projected.monthlyIncome,
    )}, monthly expenses to ${currency(
      scenarioResult.projected.monthlyExpenses,
    )}, and projected final cash to ${currency(scenarioResult.projected.finalCash)} over 6 months.`,
    {
      amount: scenarioResult.projected.finalCash,
    },
  );
}

function evaluateAffordability(purchaseIntent, affordability) {
  const interestRate = purchaseIntent.assetType === "car" ? 10 : 11;
  const loanTermMonths = purchaseIntent.assetType === "house" ? 240 : 60;
  const downPaymentPercent = purchaseIntent.assetType === "house" ? 20 : 20;
  const downPayment = round2(purchaseIntent.amount * (downPaymentPercent / 100));
  const loanPrincipal = round2(Math.max(0, purchaseIntent.amount - downPayment));
  const monthlyPayment = round2(computeMonthlyPayment(loanPrincipal, interestRate, loanTermMonths));
  const postPurchaseCash = round2(affordability.currentCash - downPayment);
  const postPurchaseBufferMonths =
    affordability.monthlyExpense > 0 ? round2(postPurchaseCash / affordability.monthlyExpense) : 0;
  const postPurchaseMonthlyHeadroom = round2(affordability.monthlySurplus - monthlyPayment);
  const cashBufferSafe = postPurchaseCash >= affordability.emergencyTarget;
  const emiSafe = monthlyPayment <= affordability.maxComfortableEmi && postPurchaseMonthlyHeadroom >= 0;

  let status = "not_affordable";
  let verdict = `This ${purchaseIntent.assetType} purchase looks risky right now.`;
  let recommendation = `Wait until you can keep at least 3 months of expenses in cash after the down payment and still handle the EMI comfortably.`;

  if (cashBufferSafe && emiSafe) {
    status = "affordable";
    verdict = `This ${purchaseIntent.assetType} looks affordable on your current numbers.`;
    recommendation = `You appear able to fund the down payment and carry the EMI while keeping your emergency buffer intact.`;
  } else if ((cashBufferSafe && postPurchaseMonthlyHeadroom >= 0) || (emiSafe && postPurchaseBufferMonths >= 2)) {
    status = "stretch";
    verdict = `This ${purchaseIntent.assetType} is possible, but it would stretch your finances.`;
    recommendation = `A higher down payment, cheaper option, or a slower purchase timeline would make this safer.`;
  }

  return {
    assetType: purchaseIntent.assetType,
    purchaseAmount: purchaseIntent.amount,
    interestRate,
    loanTermMonths,
    downPaymentPercent,
    downPayment,
    loanPrincipal,
    monthlyPayment,
    postPurchaseCash,
    postPurchaseBufferMonths,
    postPurchaseMonthlyHeadroom,
    status,
    verdict,
    recommendation,
  };
}

function applyScenarioToAffordability(affordability, scenarioResult) {
  const monthlyIncome = round2(scenarioResult.projected.monthlyIncome);
  const monthlyExpense = round2(scenarioResult.projected.monthlyExpenses);
  const currentCash = round2(scenarioResult.baseline.cash + scenarioResult.projected.oneTimeCashImpact);
  const monthlySurplus = round2(monthlyIncome - monthlyExpense);
  const emergencyTarget = round2(monthlyExpense * 3);

  return {
    ...affordability,
    monthlyIncome,
    monthlyExpense,
    currentCash,
    monthlySurplus,
    emergencyTarget,
    cashAvailableAfterBuffer: round2(Math.max(0, currentCash - emergencyTarget)),
    maxComfortableEmi: round2(Math.max(0, monthlySurplus * 0.4)),
  };
}

function buildContextSnapshot(
  dashboard,
  forecast,
  briefing,
  debtPlan,
  goalProjections,
  citationCatalog,
  affordability,
  budgets,
  transactions,
  savings,
  portfolio,
  riskProfile,
  liveMarketContext,
) {
  return {
    dashboard: {
      healthScore: dashboard.healthScore,
      totals: dashboard.totals,
      metrics: dashboard.metrics,
      insights: dashboard.insights,
      netWorth: dashboard.netWorth,
    },
    forecast,
    briefing: {
      summary: briefing.summary,
      priorities: briefing.priorities,
      opportunities: briefing.opportunities,
      recurringSubscriptions: briefing.recurringSubscriptions,
    },
    savings,
    budgets,
    recentTransactions: transactions,
    debtPlan,
    goalProjections,
    portfolio,
    riskProfile,
    liveMarketContext,
    citationCatalog,
    affordability,
  };
}

function buildCitationCatalog(
  dashboard,
  forecast,
  briefing,
  debtPlan,
  goalProjections,
  budgets,
  transactions,
  savings,
  portfolio,
  riskProfile,
) {
  const catalog = new Map();

  const add = (citation) => {
    if (citation && citation.id && !catalog.has(citation.id)) {
      catalog.set(citation.id, citation);
    }
  };

  add(
    createCitation(
      "metric.health-score",
      "metric",
      "Financial health score",
      `${dashboard.healthScore}/100 overall health score based on cashflow, debt, savings, and resilience.`,
      { amount: dashboard.healthScore },
    ),
  );
  add(
    createCitation(
      "forecast.baseline-income",
      "forecast",
      "Baseline monthly income",
      `Estimated recurring monthly income is ${currency(forecast.baseline.monthlyIncome)}.`,
      { amount: forecast.baseline.monthlyIncome },
    ),
  );
  add(
    createCitation(
      "forecast.baseline-expense",
      "forecast",
      "Baseline monthly expense",
      `Estimated recurring monthly expenses are ${currency(forecast.baseline.monthlyExpense)}.`,
      { amount: forecast.baseline.monthlyExpense },
    ),
  );

  const lowestMonth = forecast.forecast.reduce(
    (lowest, item) =>
      item.projectedBalance < lowest.projectedBalance ? item : lowest,
    forecast.forecast[0] || { month: "n/a", projectedBalance: 0 },
  );

  add(
    createCitation(
      "forecast.lowest-month",
      "forecast",
      `Lowest projected month: ${lowestMonth.month}`,
      `Projected balance reaches ${currency(lowestMonth.projectedBalance)} in ${lowestMonth.month}.`,
      { amount: lowestMonth.projectedBalance, date: lowestMonth.month },
    ),
  );

  if (briefing.priorities[0]) {
    add(
      createCitation(
        "briefing.top-priority",
        "metric",
        briefing.priorities[0].title,
        briefing.priorities[0].detail,
      ),
    );
  }

  for (const budget of budgets.slice(0, 6)) {
    add(
      createCitation(
        `budget.${safeIdPart(budget.category)}`,
        "budget",
        `${budget.category} budget`,
        `Monthly budget is ${currency(budget.amountMonthly)} for ${budget.category}.`,
        { amount: budget.amountMonthly },
      ),
    );
  }

  for (const subscription of briefing.recurringSubscriptions.slice(0, 5)) {
    add(
      createCitation(
        `subscription.${safeIdPart(subscription.description)}`,
        "transaction",
        subscription.description,
        `Likely recurring ${subscription.category} expense around ${currency(subscription.amount)} per month across ${subscription.occurrences} occurrences.`,
        { amount: subscription.amount },
      ),
    );
  }

  for (const transaction of transactions) {
    add(
      createCitation(
        `transaction.${transaction.id}`,
        "transaction",
        transaction.description,
        `${transaction.type} of ${currency(transaction.amount)} in ${transaction.category} on ${transaction.date}.`,
        { amount: transaction.amount, date: transaction.date },
      ),
    );
  }

  for (const savingsItem of savings) {
    add(
      createCitation(
        `savings.item.${savingsItem.id}`,
        "savings",
        savingsItem.name,
        `Savings balance is ${currency(savingsItem.amount)} in ${savingsItem.name}.`,
        { amount: savingsItem.amount },
      ),
    );
  }

  if (debtPlan.recommendedStrategy) {
    add(
      createCitation(
        `debt.strategy.${debtPlan.recommendedStrategy.strategy}`,
        "debt",
        `${debtPlan.recommendedStrategy.label} payoff plan`,
        `${debtPlan.recommendedStrategy.label} is recommended with a monthly payoff budget of ${currency(
          debtPlan.monthlyPaymentBudget,
        )}.`,
        { amount: debtPlan.monthlyPaymentBudget },
      ),
    );
  }

  for (const debt of debtPlan.debts || []) {
    add(
      createCitation(
        `debt.item.${debt.id}`,
        "debt",
        debt.description || debt.debtType,
        `${debt.debtType} balance is ${currency(debt.balance)} at ${debt.annualRate}% interest with minimum payment ${currency(
          debt.minimumPayment,
        )}.`,
        { amount: debt.balance },
      ),
    );
  }

  for (const goalItem of goalProjections) {
    add(
      createCitation(
        `goal.item.${goalItem.goal.id}`,
        "goal",
        goalItem.goal.name,
        `Current amount is ${currency(goalItem.goal.current_amount)} against target ${currency(
          goalItem.goal.target_amount,
        )}. Success probability is ${goalItem.projection.successProbability}%.`,
        {
          amount: goalItem.goal.current_amount,
          date: goalItem.goal.target_date,
        },
      ),
    );
  }

  add(
    createCitation(
      "risk.profile",
      "risk",
      "Overall risk profile",
      `Cashflow risk is ${riskProfile.cashflowRisk}, portfolio risk level is ${riskProfile.portfolioRiskLevel}, debt ratio is ${riskProfile.debtRatio}%, and emergency runway is ${riskProfile.emergencyMonths} month(s).`,
      { amount: riskProfile.portfolioRiskScore },
    ),
  );

  if (portfolio.hasPortfolio) {
    add(
      createCitation(
        "portfolio.total-value",
        "portfolio",
        "Portfolio value",
        `Total tracked portfolio value is ${currency(portfolio.totalValue)}.`,
        { amount: portfolio.totalValue },
      ),
    );
    add(
      createCitation(
        "portfolio.allocation",
        "portfolio",
        "Current allocation",
        `Current allocation is equity ${portfolio.currentAllocation.equity}%, debt ${portfolio.currentAllocation.debt}%, gold ${portfolio.currentAllocation.gold}%, and liquid ${portfolio.currentAllocation.liquid}%.`,
      ),
    );
  }

  return {
    catalog: Array.from(catalog.values()),
    map: catalog,
    lowestMonth,
  };
}

function citationsById(citationMap, ids) {
  return ids.map((id) => citationMap.get(id)).filter(Boolean);
}

function buildAssistantMeta({
  style = "interactive",
  usedFinanceData = false,
  usedGeneralKnowledge = false,
  needsMoreData = false,
  missingData = [],
} = {}) {
  return {
    style,
    usedFinanceData,
    usedGeneralKnowledge,
    needsMoreData,
    missingData,
  };
}

async function answerCashflowQuestion(dashboard, forecast, citationMap, transactions, briefing) {
  const lowestMonth = forecast.forecast.reduce(
    (lowest, item) =>
      item.projectedBalance < lowest.projectedBalance ? item : lowest,
    forecast.forecast[0] || { month: "n/a", projectedBalance: 0 },
  );
  const salaryTransaction = transactions.find((item) => item.type === "income");
  const recurringBill = briefing.recurringSubscriptions[0];
  const citationIds = ["forecast.baseline-income", "forecast.baseline-expense", "forecast.lowest-month"];

  if (salaryTransaction) {
    citationIds.push(`transaction.${salaryTransaction.id}`);
  }
  if (recurringBill) {
    citationIds.push(`subscription.${safeIdPart(recurringBill.description)}`);
  }

  return {
    answer: `Here is the money picture from your FinanceIQ data: monthly income is about ${currency(
      forecast.baseline.monthlyIncome,
    )}, monthly expenses are about ${currency(
      forecast.baseline.monthlyExpense,
    )}, and recent savings total ${currency(
      dashboard.totals.savings,
    )}. Your weakest point in the next 6 months is ${lowestMonth.month}, where projected balance dips to ${currency(
      lowestMonth.projectedBalance,
    )}. If you want, I can turn this into a simple action plan for spending cuts, buffer-building, or cashflow stability.`,
    citations: citationsById(citationMap, citationIds),
    followUps: [
      "Build me a monthly savings plan from this data.",
      "Will I run out of cash soon?",
      "Which expense should I cut first?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: false,
    }),
  };
}

async function answerDebtQuestion(debtPlan, citationMap) {
  if (!debtPlan.hasDebts) {
    return {
      answer: "You do not have any debts recorded yet, so there is no payoff strategy to optimize.",
      citations: [],
      followUps: ["Should I add my loan balances?", "How do avalanche and snowball differ?"],
      assistantMeta: buildAssistantMeta({
        usedFinanceData: false,
        usedGeneralKnowledge: true,
        needsMoreData: true,
        missingData: ["loan balances", "interest rates", "minimum payments"],
      }),
    };
  }

  const recommended = debtPlan.recommendedStrategy;
  const topDebts = (debtPlan.debts || []).slice(0, 2).map((debt) => `debt.item.${debt.id}`);
  return {
    answer: `${debtPlan.summary} With your current estimated monthly payoff budget of ${currency(
      debtPlan.monthlyPaymentBudget,
    )}, the ${recommended.label} plan should get you debt-free in ${
      recommended.monthsToDebtFree === null ? "a long horizon" : `${recommended.monthsToDebtFree} months`
    }.`,
    citations: citationsById(citationMap, [`debt.strategy.${recommended.strategy}`, ...topDebts]),
    followUps: [
      "Which debt should I pay first?",
      "Can I become debt-free faster?",
      "How much extra should I pay every month?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: true,
    }),
  };
}

async function answerGoalQuestion(goalProjections, citationMap) {
  if (!goalProjections.length) {
    return {
      answer: "You do not have any active goals recorded yet, so I cannot estimate success probability.",
      citations: [],
      followUps: ["Should I create a financial goal?", "How much should I save each month?"],
      assistantMeta: buildAssistantMeta({
        usedFinanceData: false,
        usedGeneralKnowledge: true,
        needsMoreData: true,
        missingData: ["goal name", "target amount", "target date", "current savings"],
      }),
    };
  }

  const weakestGoal = goalProjections
    .slice()
    .sort((left, right) => left.projection.successProbability - right.projection.successProbability)[0];

  return {
    answer: `Your most at-risk goal right now is ${weakestGoal.goal.name} with a ${weakestGoal.projection.successProbability}% success probability. Projected value by the target date is ${currency(
      weakestGoal.projection.projectedValueAtTargetDate,
    )}, and the estimated shortfall is ${currency(
      weakestGoal.projection.projectedShortfall,
    )}. ${weakestGoal.projection.recommendation}`,
    citations: citationsById(citationMap, [`goal.item.${weakestGoal.goal.id}`]),
    followUps: [
      "Which goal is strongest right now?",
      "How much more should I save for my goals?",
      "How do I improve this goal's success chance?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: true,
    }),
  };
}

async function answerSavingsQuestion(dashboard, forecast, savings, goals, citationMap) {
  const totalSavings = round2(
    savings.reduce((sum, item) => sum + (item.amount || 0), 0),
  );
  const emergencyMonths = round2(dashboard.metrics?.emergencyMonths || 0);
  const monthlySurplus = round2((forecast.baseline?.monthlyIncome || 0) - (forecast.baseline?.monthlyExpense || 0));
  const topGoal = goals[0];
  const savingsCitations = savings.slice(0, 3).map((item) => `savings.item.${item.id}`);

  return {
    answer: totalSavings > 0
      ? `You currently have about ${currency(totalSavings)} in savings across tracked accounts. That covers roughly ${emergencyMonths} month(s) of expenses, and your current monthly surplus is about ${currency(monthlySurplus)}. ${emergencyMonths < 3 ? "I’d prioritize building emergency reserves first." : "Your cash buffer is in a healthier place, so surplus can be split between reserves and goals."} ${topGoal ? `Your nearest active goal is ${topGoal.goal.name}, so we can route part of savings there as well.` : ""}`.trim()
      : "You do not have tracked savings balances yet, so I cannot judge cash reserves. Add savings accounts or balances and I can build an emergency-fund and allocation plan.",
    citations: citationsById(
      citationMap,
      totalSavings > 0
        ? ["forecast.baseline-income", "forecast.baseline-expense", ...savingsCitations]
        : [],
    ),
    followUps: [
      "How much should stay in emergency savings?",
      "How should I split savings across goals and investing?",
      "Make me a monthly savings plan.",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: totalSavings > 0,
      usedGeneralKnowledge: true,
      needsMoreData: totalSavings <= 0,
      missingData: totalSavings <= 0 ? ["savings balances"] : [],
    }),
  };
}

async function answerTransactionQuestion(transactions, budgets, citationMap) {
  if (!transactions.length) {
    return {
      answer: "You do not have recent transactions recorded yet, so I cannot analyze spending patterns or category behavior.",
      citations: [],
      followUps: [
        "What transactions should I add first?",
        "How do I build a spending dashboard?",
      ],
      assistantMeta: buildAssistantMeta({
        usedFinanceData: false,
        usedGeneralKnowledge: true,
        needsMoreData: true,
        missingData: ["recent transactions"],
      }),
    };
  }

  const topExpense = transactions
    .filter((item) => item.type === "expense")
    .sort((left, right) => right.amount - left.amount)[0];
  const topBudget = budgets[0];
  const citationIds = transactions.slice(0, 3).map((item) => `transaction.${item.id}`);
  if (topBudget) {
    citationIds.push(`budget.${safeIdPart(topBudget.category)}`);
  }

  return {
    answer: `I can work directly from your transaction trail. ${topExpense ? `Your largest recent tracked expense is ${topExpense.description} for ${currency(topExpense.amount)} in ${topExpense.category}.` : "I have recent transaction data available."} ${topBudget ? `Your biggest budget bucket is ${topBudget.category} at ${currency(topBudget.amountMonthly)} per month.` : ""} If you want, I can turn this into a spending dashboard summary, category review, or cost-cut plan.`,
    citations: citationsById(citationMap, citationIds),
    followUps: [
      "Summarize my spending dashboard.",
      "Which categories look too high?",
      "Find recurring expenses I should review.",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: false,
    }),
  };
}

async function answerPortfolioQuestion(portfolio, riskProfile, citationMap, liveMarketContext) {
  if (!portfolio.hasPortfolio) {
    return {
      answer: "You do not have tracked portfolio holdings yet, so I cannot assess allocation or investing risk from your personal data.",
      citations: [],
      followUps: [
        "What holdings should I add first?",
        "How do I set a target allocation?",
      ],
      assistantMeta: buildAssistantMeta({
        usedFinanceData: false,
        usedGeneralKnowledge: true,
        needsMoreData: true,
        missingData: ["portfolio holdings", "asset values"],
      }),
    };
  }

  const goldNote =
    liveMarketContext?.result && portfolio.currentAllocation.gold > 0
      ? `Gold is ${portfolio.currentAllocation.gold}% of your tracked allocation, and the latest market price I found is about ${currency(liveMarketContext.result.priceInInr || liveMarketContext.result.price)} ${liveMarketContext.result.displayCurrency || liveMarketContext.result.rawCurrency || ""}.`
      : "";

  return {
    answer: `Your tracked portfolio is about ${currency(portfolio.totalValue)}. Current allocation is ${portfolio.currentAllocation.equity}% equity, ${portfolio.currentAllocation.debt}% debt, ${portfolio.currentAllocation.gold}% gold, and ${portfolio.currentAllocation.liquid}% liquid assets. Based on that mix, portfolio risk looks ${riskProfile.portfolioRiskLevel.toLowerCase()} with a risk score of ${riskProfile.portfolioRiskScore}/100. ${goldNote}`.trim(),
    citations: citationsById(citationMap, ["portfolio.total-value", "portfolio.allocation", "risk.profile"]),
    followUps: [
      "Is my allocation too risky?",
      "How should I rebalance this portfolio?",
      "How much gold should I hold?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: true,
    }),
  };
}

async function answerRiskQuestion(dashboard, riskProfile, portfolio, citationMap) {
  return {
    answer: `Your money risk picture is mixed across two layers: cashflow risk is ${riskProfile.cashflowRisk.toLowerCase()} and portfolio risk is ${riskProfile.portfolioRiskLevel.toLowerCase()}. Emergency runway is ${riskProfile.emergencyMonths} month(s), debt ratio is ${riskProfile.debtRatio}%, and your overall health score is ${dashboard.healthScore}/100. ${riskProfile.cashflowRisk === "High" ? "I would fix liquidity and debt pressure before taking more investment risk." : "That gives you a more stable base for goal funding and investing decisions."}`,
    citations: citationsById(citationMap, ["risk.profile", "metric.health-score"]),
    followUps: [
      "Why is my risk high?",
      "How do I reduce financial risk?",
      "Should I change my portfolio allocation?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: true,
    }),
  };
}

async function answerLiveMarketQuestion(question, liveMarketContext, portfolio, citationMap) {
  const normalized = normalizeQuestion(question);
  if (!containsAny(normalized, ["price", "rate", "today", "now", "current"])) {
    return null;
  }

  if (!liveMarketContext) {
    return null;
  }

  if (!liveMarketContext.result) {
    return {
      answer:
        liveMarketContext.reason === "missing_twelve_data_key"
          ? "Live market pricing is not configured right now, so I cannot fetch the current finance market price from the API."
          : "I could not fetch a live market price for that finance query right now.",
      citations: citationsById(citationMap, portfolio.hasPortfolio ? ["portfolio.allocation"] : []),
      followUps: [
        "Try a different asset symbol.",
        "Ask how this affects my portfolio or goals.",
      ],
      assistantMeta: buildAssistantMeta({
        usedFinanceData: portfolio.hasPortfolio,
        usedGeneralKnowledge: false,
        needsMoreData: false,
      }),
    };
  }

  const asset = liveMarketContext.result;
  const portfolioTieIn =
    asset.label.toLowerCase().includes("gold") && portfolio.currentAllocation.gold > 0
      ? `Gold is already ${portfolio.currentAllocation.gold}% of your tracked portfolio, so this price matters directly to your allocation.`
      : portfolio.hasPortfolio
        ? `I can also relate this asset to your tracked portfolio and risk mix if you want.`
        : "If you add holdings, I can connect live prices directly to your personal finances.";
  const changeLine = asset.change1D !== null ? ` Daily move is ${formatSignedPercent(asset.change1D)}.` : "";

  return {
    answer: `${asset.label} is currently around ${currency(asset.priceInInr || asset.price)} ${asset.displayCurrency || asset.rawCurrency || ""}.${changeLine} ${portfolioTieIn}`.trim(),
    citations: citationsById(citationMap, portfolio.hasPortfolio ? ["portfolio.allocation"] : []),
    followUps: [
      `How does ${asset.label} fit into my portfolio?`,
      `Should I increase or reduce ${asset.label} exposure?`,
      "How does this affect my goals and risk?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: portfolio.hasPortfolio,
      usedGeneralKnowledge: true,
    }),
  };
}

async function answerHealthQuestion(dashboard, briefing, citationMap) {
  const priority = briefing.priorities[0];
  return {
    answer: priority
      ? `Your financial health score is ${dashboard.healthScore}/100. The biggest issue I’d focus on first is "${priority.title}". ${priority.detail} If you want, I can break that into a step-by-step fix plan using your current numbers.`
      : `Your financial health score is ${dashboard.healthScore}/100, and there are no major warning priorities right now. If you want, I can still help you improve resilience, investing discipline, or monthly savings.`,
    citations: citationsById(citationMap, ["metric.health-score", "briefing.top-priority"]),
    followUps: [
      "Why is my health score low?",
      "What should I fix first?",
      "Make me a 30-day improvement plan.",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: true,
    }),
  };
}

async function answerAffordabilityQuestion(
  userId,
  question,
  dashboard,
  forecast,
  debtPlan,
  goalProjections,
  briefing,
  citationMap,
) {
  const purchaseIntent = parsePurchaseIntent(question);
  if (!purchaseIntent) {
    return answerCashflowQuestion(dashboard, forecast, citationMap, [], briefing);
  }

  const baseAffordability = buildAffordabilitySnapshot(dashboard, forecast, debtPlan, goalProjections);
  const scenarioIntent = parseScenarioIntent(question);
  const scenarioResult = scenarioIntent
    ? await runScenario(userId, scenarioIntent.scenarioType, scenarioIntent.payload)
    : null;
  const affordability = scenarioResult
    ? applyScenarioToAffordability(baseAffordability, scenarioResult)
    : baseAffordability;
  const analysis = evaluateAffordability(purchaseIntent, affordability);
  const dynamicCitation = buildAffordabilityDynamicCitation(analysis);
  const citationIds = [
    "forecast.baseline-income",
    "forecast.baseline-expense",
    "forecast.lowest-month",
    "metric.health-score",
  ];

  if (debtPlan.recommendedStrategy) {
    citationIds.push(`debt.strategy.${debtPlan.recommendedStrategy.strategy}`);
  }
  if (briefing.priorities[0]) {
    citationIds.push("briefing.top-priority");
  }
  if (goalProjections.length) {
    const weakestGoal = goalProjections
      .slice()
      .sort((left, right) => left.projection.successProbability - right.projection.successProbability)[0];
    citationIds.push(`goal.item.${weakestGoal.goal.id}`);
  }

  const affordabilitySummary =
    analysis.status === "affordable"
      ? `${analysis.verdict} A ${analysis.downPaymentPercent}% down payment would be about ${currency(
          analysis.downPayment,
        )}, and the estimated EMI is ${currency(analysis.monthlyPayment)} for ${analysis.loanTermMonths} months.`
      : `${analysis.verdict} A ${analysis.downPaymentPercent}% down payment would be about ${currency(
          analysis.downPayment,
        )}, the estimated EMI is ${currency(analysis.monthlyPayment)}, and monthly headroom after that would be ${currency(
          analysis.postPurchaseMonthlyHeadroom,
        )}.`;

  const bufferLine =
    analysis.postPurchaseCash >= 0
      ? `You would still have about ${currency(analysis.postPurchaseCash)} in cash after the down payment, which is ${analysis.postPurchaseBufferMonths} month(s) of expenses.`
      : `The down payment would push cash below zero by about ${currency(Math.abs(analysis.postPurchaseCash))}.`;
  const scenarioLine = scenarioResult
    ? `Under the ${scenarioIntent.label} scenario, monthly income would be ${currency(
        scenarioResult.projected.monthlyIncome,
      )} and monthly expenses would be ${currency(scenarioResult.projected.monthlyExpenses)}.`
    : "";

  return {
    answer: `${affordabilitySummary} ${scenarioLine} ${bufferLine} ${analysis.recommendation}`.trim(),
    citations: [
      ...citationsById(citationMap, citationIds.slice(0, 5)),
      dynamicCitation,
      ...(scenarioResult ? [buildScenarioDynamicCitation(scenarioIntent, scenarioResult)] : []),
    ],
    followUps: [
      `What if I buy a cheaper ${analysis.assetType}?`,
      `How much down payment would make this ${analysis.assetType} safer?`,
      "What would this do to my emergency fund?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: true,
    }),
  };
}

function extractResponseText(response) {
  if (typeof response?.output_text === "string" && response.output_text.length > 0) {
    return response.output_text;
  }

  const parts = [];
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && content?.text) {
        parts.push(content.text);
      }
      if (content?.type === "text" && content?.text) {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

function getLlmClientConfig() {
  return {
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  };
}

function extractJsonObject(rawText) {
  if (typeof rawText !== "string") {
    throw new Error("LLM response was not text");
  }

  const trimmed = rawText.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("LLM response did not contain JSON");
}

function normalizeLlmPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("LLM response payload missing");
  }

  return {
    answer: typeof payload.answer === "string" ? payload.answer.trim() : "",
    citations: Array.isArray(payload.citations)
      ? payload.citations.filter((item) => typeof item === "string")
      : [],
    followUps: Array.isArray(payload.followUps)
      ? payload.followUps.filter((item) => typeof item === "string")
      : [],
    assistantMeta: payload.assistantMeta && typeof payload.assistantMeta === "object"
      ? buildAssistantMeta({
          style: typeof payload.assistantMeta.style === "string" ? payload.assistantMeta.style : "interactive",
          usedFinanceData: Boolean(payload.assistantMeta.usedFinanceData),
          usedGeneralKnowledge: Boolean(payload.assistantMeta.usedGeneralKnowledge),
          needsMoreData: Boolean(payload.assistantMeta.needsMoreData),
          missingData: Array.isArray(payload.assistantMeta.missingData)
            ? payload.assistantMeta.missingData.filter((item) => typeof item === "string")
            : [],
        })
      : buildAssistantMeta({
          usedFinanceData: true,
          usedGeneralKnowledge: true,
        }),
  };
}

function extractChatCompletionText(response) {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text || item?.content || "")
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

async function getGroqAssistantResponse(question, history, contextSnapshot) {
  const { apiKey, baseUrl, model } = getLlmClientConfig();
  if (!apiKey) {
    return null;
  }

  const apiResponse = await axios.post(
    `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
    {
      model,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are FinanceIQ Assistant, a professional personal finance copilot. You may answer only finance and money topics. Cover the user's complete finance picture when relevant: cashflow, savings, budgets, debts, goals, transactions, net worth, portfolio allocation, investing, and risk. Use the provided personal finance context as first source of truth. You may also use broader finance knowledge and live market context when the question is still about finance. Never invent personal facts not present in context. If liveMarketContext is present, you may answer current price/rate questions from it and connect the answer back to the user's finances when possible. If the user asks something non-finance, politely refuse and steer back to finance topics. If the user asks something personal and data is missing, say exactly what is missing. Keep answers concise, practical, conversational, and professional. Reply with valid JSON only using keys answer, citations, followUps, assistantMeta. The citations field must contain citation ids copied exactly from citationCatalog only, and should be an empty array when no citation from the provided context directly supports the answer. assistantMeta must be an object with keys style, usedFinanceData, usedGeneralKnowledge, needsMoreData, missingData.",
        },
        {
          role: "system",
          content: `Financial context:\n${JSON.stringify(contextSnapshot)}`,
        },
        ...history.map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: item.content,
        })),
        {
          role: "user",
          content: question,
        },
      ],
      response_format: {
        type: "json_object",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    },
  );

  const rawText = extractChatCompletionText(apiResponse.data);
  return normalizeLlmPayload(extractJsonObject(rawText));
}

async function answerInvestingQuestion(dashboard, forecast, briefing) {
  const monthlyIncome = round2(forecast.baseline.monthlyIncome || 0);
  const monthlyExpense = round2(forecast.baseline.monthlyExpense || 0);
  const monthlySurplus = round2(monthlyIncome - monthlyExpense);
  const priority = briefing.priorities[0];

  return {
    answer: `To increase income from the share market, focus on process instead of chasing fast returns: invest regularly in diversified index funds or high-quality businesses, add capital consistently, reinvest gains, and avoid oversized bets or frequent trading. In your FinanceIQ data, monthly surplus is about ${currency(monthlySurplus)}, so the first step is to route a fixed part of that into investing only after keeping a cash buffer. ${priority ? `Before taking more market risk, handle "${priority.title}" as well.` : ""}`.trim(),
    citations: [],
    followUps: [
      "How much of my monthly surplus can I invest safely?",
      "Should I pick stocks or index funds?",
      "How much emergency fund should I keep before investing more?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: true,
    }),
  };
}

function buildOutOfScopeResponse() {
  return {
    answer: "I can help only with finance and money topics, such as savings, debt, goals, transactions, budgets, portfolio risk, investing, and market prices that relate to your finances.",
    citations: [],
    followUps: [
      "Review my savings plan.",
      "How risky is my portfolio?",
      "What is the price of gold today and how does it affect me?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: false,
      usedGeneralKnowledge: false,
    }),
  };
}

async function getRuleBasedResponse(
  userId,
  question,
  dashboard,
  forecast,
  briefing,
  debtPlan,
  goalProjections,
  citationMap,
  budgets,
  transactions,
  savings,
  portfolio,
  riskProfile,
  liveMarketContext,
) {
  const normalized = normalizeQuestion(question);
  const purchaseIntent = parsePurchaseIntent(question);

  if (!looksLikeFinanceQuestion(question) && !containsAny(normalized, ["hello", "hi", "hey"])) {
    return buildOutOfScopeResponse();
  }

  const marketAnswer = await answerLiveMarketQuestion(question, liveMarketContext, portfolio, citationMap);
  if (marketAnswer) {
    return marketAnswer;
  }

  if (purchaseIntent && containsAny(normalized, ["afford", "buy", "purchase", "emi", "loan"])) {
    return answerAffordabilityQuestion(
      userId,
      question,
      dashboard,
      forecast,
      debtPlan,
      goalProjections,
      briefing,
      citationMap,
    );
  }

  if (containsAny(normalized, ["debt", "loan", "credit card", "payoff"])) {
    return answerDebtQuestion(debtPlan, citationMap);
  }

  if (containsAny(normalized, ["goal", "save for", "target", "down payment", "retirement"])) {
    return answerGoalQuestion(goalProjections, citationMap);
  }

  if (containsAny(normalized, ["saving", "savings", "emergency fund", "rainy day", "reserve"])) {
    return answerSavingsQuestion(dashboard, forecast, savings, goalProjections, citationMap);
  }

  if (containsAny(normalized, ["transaction", "transactions", "dashboard", "spending dashboard", "expense categories", "recent spending"])) {
    return answerTransactionQuestion(transactions, budgets, citationMap);
  }

  if (containsAny(normalized, ["portfolio", "allocation", "rebalance", "holdings", "gold allocation", "asset mix"])) {
    return answerPortfolioQuestion(portfolio, riskProfile, citationMap, liveMarketContext);
  }

  if (containsAny(normalized, ["risk", "risk profile", "too risky", "safe", "volatility"])) {
    return answerRiskQuestion(dashboard, riskProfile, portfolio, citationMap);
  }

  if (containsAny(normalized, ["share market", "stock market", "stocks", "shares", "invest", "investing", "mutual fund", "sip", "equity", "trading"])) {
    return answerInvestingQuestion(dashboard, forecast, briefing);
  }

  if (containsAny(normalized, ["cash", "cashflow", "run out", "afford", "budget", "spending"])) {
    return answerCashflowQuestion(dashboard, forecast, citationMap, transactions, briefing);
  }

  if (containsAny(normalized, ["health", "score", "improve", "fix first", "financial status"])) {
    return answerHealthQuestion(dashboard, briefing, citationMap);
  }

  if (containsAny(normalized, ["hello", "hi", "hey"])) {
    return {
      answer: "Hello. I can help with your full money picture: savings, budgets, cashflow, debts, goals, transactions, portfolio allocation, risk, and finance-market questions that matter to your finances.",
      citations: citationsById(citationMap, ["metric.health-score"]),
      followUps: [
        "Review my full financial situation.",
        "What should I fix first?",
        "What is the price of gold today and does it matter for me?",
      ],
      assistantMeta: buildAssistantMeta({
        usedFinanceData: true,
        usedGeneralKnowledge: false,
      }),
    };
  }

  return {
    answer: `${briefing.summary} Top recommendation: ${
      briefing.priorities[0]?.title || "keep building your financial data"
    }. I can also help with savings, debt payoff, goals, risk, portfolio allocation, transactions, and live finance-market questions like gold price when they matter to your money.`,
    citations: citationsById(citationMap, ["briefing.top-priority", "metric.health-score", "forecast.lowest-month", "risk.profile"]),
    followUps: [
      "Give me a full finance review.",
      "How should I pay off my debt?",
      "How risky is my portfolio?",
    ],
    assistantMeta: buildAssistantMeta({
      usedFinanceData: true,
      usedGeneralKnowledge: true,
    }),
  };
}

async function getCopilotResponse(userId, question, history = []) {
  const liveMarketSymbol = extractMarketQuery(question);
  const [dashboard, forecast, briefing, debtPlan, goalProjections, budgets, transactions, savings, portfolio, liveMarketContext] = await Promise.all([
    getDashboardAnalytics(userId),
    forecastNext6Months(userId),
    getFinancialBriefing(userId),
    getDebtOptimization(userId),
    getUserGoalProjections(userId),
    getBudgetRows(userId),
    getRecentTransactions(userId),
    getSavingsRows(userId),
    getPortfolioSnapshot(userId),
    liveMarketSymbol ? searchMarketAsset(liveMarketSymbol) : Promise.resolve(null),
  ]);
  const riskProfile = await getRiskProfile(userId, dashboard, portfolio);

  const { catalog, map: citationMap } = buildCitationCatalog(
    dashboard,
    forecast,
    briefing,
    debtPlan,
    goalProjections,
    budgets,
    transactions,
    savings,
    portfolio,
    riskProfile,
  );
  const affordability = buildAffordabilitySnapshot(
    dashboard,
    forecast,
    debtPlan,
    goalProjections,
  );

  const contextSnapshot = buildContextSnapshot(
    dashboard,
    forecast,
    briefing,
    debtPlan,
    goalProjections,
    catalog,
    affordability,
    budgets,
    transactions,
    savings,
    portfolio,
    riskProfile,
    liveMarketContext,
  );

  try {
    const groqResponse = await getGroqAssistantResponse(question, history, contextSnapshot);
    if (groqResponse) {
      const citations = citationsById(citationMap, (groqResponse.citations || []).slice(0, 6));
      return {
        ...groqResponse,
        citations,
        source: "groq",
      };
    }
  } catch (error) {
    console.error("Groq copilot fallback triggered:", error.response?.data || error.message);
  }

  const fallback = await getRuleBasedResponse(
    userId,
    question,
    dashboard,
    forecast,
    briefing,
    debtPlan,
    goalProjections,
    citationMap,
    budgets,
    transactions,
    savings,
    portfolio,
    riskProfile,
    liveMarketContext,
  );

  return {
    ...fallback,
    source: "local",
  };
}

async function getChatResponse(userId, question, history = []) {
  return getCopilotResponse(userId, question, history);
}

module.exports = { getCopilotResponse, getChatResponse };
