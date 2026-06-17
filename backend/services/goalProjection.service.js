const pool = require("../config/database");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function monthsBetween(today, targetDate) {
  if (!targetDate) {
    return null;
  }

  const end = new Date(targetDate);
  const diffMonths =
    (end.getFullYear() - today.getFullYear()) * 12 +
    (end.getMonth() - today.getMonth()) +
    (end.getDate() >= today.getDate() ? 0 : -1);

  return Math.max(0, diffMonths);
}

function futureValueWithContributions(currentAmount, monthlyContribution, monthlyReturn, months) {
  if (months <= 0) {
    return currentAmount;
  }

  if (monthlyReturn === 0) {
    return currentAmount + monthlyContribution * months;
  }

  const compoundCurrent = currentAmount * Math.pow(1 + monthlyReturn, months);
  const compoundContributions =
    monthlyContribution * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);

  return compoundCurrent + compoundContributions;
}

function requiredMonthlyContribution(currentAmount, targetAmount, monthlyReturn, months) {
  if (months <= 0) {
    return targetAmount > currentAmount ? null : 0;
  }

  const grownCurrent = currentAmount * Math.pow(1 + monthlyReturn, months);
  const remaining = Math.max(0, targetAmount - grownCurrent);

  if (remaining === 0) {
    return 0;
  }

  if (monthlyReturn === 0) {
    return remaining / months;
  }

  const annuityFactor = (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn;
  return annuityFactor > 0 ? remaining / annuityFactor : null;
}

function computeSuccessProbability(projectedValue, targetAmount, monthlyContribution, requiredMonthly) {
  if (targetAmount <= 0) {
    return 100;
  }

  const projectedRatio = projectedValue / targetAmount;
  const contributionCoverage =
    requiredMonthly && requiredMonthly > 0
      ? monthlyContribution / requiredMonthly
      : projectedRatio;

  const score = projectedRatio * 70 + contributionCoverage * 30;
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

function solveMonthsForTarget(currentAmount, monthlyContribution, monthlyReturn, targetAmount) {
  const maxMonths = 1200;
  for (let month = 0; month <= maxMonths; month += 1) {
    const projected = futureValueWithContributions(
      currentAmount,
      monthlyContribution,
      monthlyReturn,
      month,
    );
    if (projected >= targetAmount) {
      return month;
    }
  }

  return null;
}

async function projectGoal(goal, { expectedReturn = 0.08, inflation = 0.03 } = {}) {
  const today = new Date();
  const currentAmount = parseFloat(goal.current_amount) || 0;
  const targetAmount = parseFloat(goal.target_amount) || 0;
  const monthlyContribution = parseFloat(goal.monthly_contribution) || 0;
  const monthlyReturn = Math.max(0, expectedReturn - inflation) / 12;
  const targetMonths = monthsBetween(today, goal.target_date);

  if (targetAmount <= currentAmount) {
    return {
      goalId: goal.id,
      feasible: true,
      monthsToGoal: 0,
      completionDate: today.toISOString().slice(0, 10),
      requiredMonthly: 0,
      projectedValueAtTargetDate: round2(currentAmount),
      projectedShortfall: 0,
      successProbability: 100,
      feasibilityScore: 100,
      recommendation: "Goal already funded.",
    };
  }

  const monthsToGoal = solveMonthsForTarget(
    currentAmount,
    monthlyContribution,
    monthlyReturn,
    targetAmount,
  );

  const completionDate =
    monthsToGoal === null
      ? null
      : new Date(today.getFullYear(), today.getMonth() + monthsToGoal, today.getDate())
          .toISOString()
          .slice(0, 10);

  const projectedValueAtTargetDate =
    targetMonths === null
      ? futureValueWithContributions(currentAmount, monthlyContribution, monthlyReturn, 120)
      : futureValueWithContributions(currentAmount, monthlyContribution, monthlyReturn, targetMonths);

  const shortfall = Math.max(0, targetAmount - projectedValueAtTargetDate);
  const requiredMonthly =
    targetMonths === null
      ? null
      : requiredMonthlyContribution(currentAmount, targetAmount, monthlyReturn, targetMonths);

  const successProbability =
    targetMonths === null
      ? monthsToGoal === null
        ? 55
        : 85
      : computeSuccessProbability(
          projectedValueAtTargetDate,
          targetAmount,
          monthlyContribution,
          requiredMonthly,
        );

  let recommendation = "Current contribution pace looks healthy.";
  if (targetMonths !== null && shortfall > 0) {
    recommendation =
      requiredMonthly && requiredMonthly > monthlyContribution
        ? `Increase monthly contribution to about ${round2(requiredMonthly).toLocaleString("en-IN")} to stay on track.`
        : "Goal is slightly behind plan. Consider adding one-time contributions when possible.";
  } else if (monthsToGoal !== null && targetMonths !== null && monthsToGoal < targetMonths) {
    recommendation = "You are ahead of schedule. Excess savings can support other goals.";
  }

  return {
    goalId: goal.id,
    feasible: targetMonths === null ? monthsToGoal !== null : shortfall === 0,
    monthsToGoal,
    completionDate,
    requiredMonthly: requiredMonthly === null ? null : round2(requiredMonthly),
    projectedValueAtTargetDate: round2(projectedValueAtTargetDate),
    projectedShortfall: round2(shortfall),
    successProbability,
    feasibilityScore: successProbability,
    recommendation,
  };
}

async function getUserGoalProjections(userId, opts) {
  const result = await pool.query(
    "SELECT * FROM goals WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC",
    [userId],
  );

  const projections = [];
  for (const goal of result.rows) {
    const projection = await projectGoal(goal, opts);
    projections.push({
      goal: {
        id: goal.id,
        name: goal.name,
        target_amount: parseFloat(goal.target_amount) || 0,
        current_amount: parseFloat(goal.current_amount) || 0,
        monthly_contribution: parseFloat(goal.monthly_contribution) || 0,
        target_date: goal.target_date,
      },
      projection,
    });
  }

  return projections;
}

module.exports = { projectGoal, getUserGoalProjections };
