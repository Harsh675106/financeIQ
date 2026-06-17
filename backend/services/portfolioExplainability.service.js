const pool = require("../config/database");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function mapTypeToBucket(type) {
  const text = (type || "").toLowerCase();
  if (["stock", "equity", "mutualfund", "mutual fund", "mf", "crypto", "etf"].some((item) => text.includes(item))) return "equity";
  if (["debt", "bond", "fixed income", "fd"].some((item) => text.includes(item))) return "debt";
  if (text.includes("gold")) return "gold";
  if (["cash", "liquid", "savings", "bank"].some((item) => text.includes(item))) return "liquid";
  return "equity";
}

async function getPortfolioExplainability(userId) {
  const assets = await pool.query(
    "SELECT type, quantity, price FROM assets WHERE user_id = $1",
    [userId],
  );
  const goals = await pool.query(
    "SELECT name, target_date FROM goals WHERE user_id = $1 AND status = 'active' ORDER BY target_date ASC NULLS LAST LIMIT 3",
    [userId],
  );

  const buckets = { equity: 0, debt: 0, gold: 0, liquid: 0 };
  let total = 0;
  for (const row of assets.rows) {
    const value = (parseFloat(row.quantity) || 0) * (parseFloat(row.price) || 0);
    const bucket = mapTypeToBucket(row.type);
    buckets[bucket] += value;
    total += value;
  }

  const weights = total > 0
    ? Object.fromEntries(Object.entries(buckets).map(([key, value]) => [key, round2((value / total) * 100)]))
    : { equity: 0, debt: 0, gold: 0, liquid: 0 };

  const explanations = [];
  if (weights.equity > 75) {
    explanations.push({
      type: "concentration_risk",
      severity: "high",
      title: "High concentration risk",
      explanation: `About ${weights.equity}% of your portfolio sits in equity-like assets, so a market drawdown could hit your near-term capital hard.`,
      confidence: 88,
      assumptions: ["All stock, mutual fund, ETF, and crypto assets are grouped as equity."],
    });
  }
  if (weights.liquid < 10) {
    explanations.push({
      type: "liquidity_risk",
      severity: "medium",
      title: "Low liquid buffer",
      explanation: `Only ${weights.liquid}% of your portfolio is liquid/cash-like, which may be too low for near-term goals or emergencies.`,
      confidence: 81,
      assumptions: ["Savings and cash-like holdings are represented in liquid assets."],
    });
  }
  if (goals.rows.some((goal) => goal.target_date && new Date(goal.target_date) < new Date(new Date().setFullYear(new Date().getFullYear() + 3))) && weights.equity > 60) {
    explanations.push({
      type: "goal_mismatch",
      severity: "high",
      title: "Goal horizon mismatch",
      explanation: "You have at least one shorter-term goal, but your portfolio still leans aggressively toward growth assets.",
      confidence: 79,
      assumptions: ["Goals within 3 years should generally not depend heavily on high-volatility assets."],
    });
  }

  const stressTests = [
    { scenario: "Recession", estimatedImpactPercent: round2(-(weights.equity * 0.28 + weights.debt * 0.05) / 100) },
    { scenario: "High inflation", estimatedImpactPercent: round2(-(weights.debt * 0.12 + weights.liquid * 0.04) / 100) },
    { scenario: "Rate cuts", estimatedImpactPercent: round2((weights.debt * 0.05 + weights.equity * 0.04) / 100) },
    { scenario: "Market crash", estimatedImpactPercent: round2(-(weights.equity * 0.35 + weights.gold * 0.05) / 100) },
  ].map((item) => ({
    ...item,
    projectedPortfolioValue: round2(total * (1 + item.estimatedImpactPercent)),
  }));

  return {
    totalValue: round2(total),
    weights,
    explanations,
    stressTests,
  };
}

module.exports = { getPortfolioExplainability };
