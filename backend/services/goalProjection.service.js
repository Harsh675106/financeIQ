const pool = require("../config/database");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate days between two dates (positive if targetDate is in future)
 */
function daysBetween(today, targetDate) {
  if (!targetDate) {
    return null;
  }
  
  const end = new Date(targetDate);
  const start = new Date(today);
  
  // Set time to midnight for consistent date comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Calculate exact months between dates accounting for day-of-month
 * Returns negative if targetDate is in the past
 */
function monthsBetween(today, targetDate) {
  if (!targetDate) {
    return null;
  }

  const end = new Date(targetDate);
  const start = new Date(today);
  
  let months = 
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  
  // Adjust if we haven't reached the same day yet in the target month
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  
  return months;
}

/**
 * Future value with compound interest and regular contributions (annuity due)
 * Contributions are made at the beginning of each month
 */
function futureValueWithContributions(currentAmount, monthlyContribution, monthlyReturn, months) {
  if (months <= 0) {
    return currentAmount;
  }

  if (monthlyReturn === 0) {
    // No returns, simple accumulation
    return currentAmount + monthlyContribution * months;
  }

  // Compound current amount
  const compoundCurrent = currentAmount * Math.pow(1 + monthlyReturn, months);
  
  // Future value of annuity due (payments at beginning of period)
  const fvAnnuityDue = 
    monthlyContribution * (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn * (1 + monthlyReturn);

  return compoundCurrent + fvAnnuityDue;
}

/**
 * Calculate required monthly contribution to reach target
 * Returns 0 if already at target or if target is below current with returns
 */
function requiredMonthlyContribution(currentAmount, targetAmount, monthlyReturn, months) {
  if (months <= 0) {
    // No time left - check if already at target
    return currentAmount >= targetAmount ? 0 : null;
  }

  // How much current amount will grow to
  const grownCurrent = currentAmount * Math.pow(1 + monthlyReturn, months);
  
  // Remaining gap
  const remaining = Math.max(0, targetAmount - grownCurrent);

  if (remaining === 0) {
    return 0;
  }

  if (monthlyReturn === 0) {
    // No returns, simple division
    return remaining / months;
  }

  // Solve for PMT in Future Value of Annuity Due formula
  // FV = PMT * [(1+r)^n - 1]/r * (1+r)
  // PMT = FV / {[(1+r)^n - 1]/r * (1+r)}
  const annuityFactor = (Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn * (1 + monthlyReturn);
  
  if (annuityFactor <= 0) {
    return null;
  }
  
  return remaining / annuityFactor;
}

/**
 * Compute success probability based on:
 * 1. How close projected value is to target (weighted 60%)
 * 2. How much monthly contribution matches required (weighted 40%)
 */
function computeSuccessProbability(projectedValue, targetAmount, monthlyContribution, requiredMonthly, monthsRemaining) {
  if (targetAmount <= 0) {
    return 100;
  }

  // Already met target
  if (projectedValue >= targetAmount) {
    return 100;
  }

  // Calculate ratio of projected to target (capped at 100%)
  const projectionCoverage = Math.min(1, projectedValue / targetAmount);
  
  // Calculate contribution coverage vs required
  let contributionCoverage = 0;
  if (requiredMonthly && requiredMonthly > 0) {
    // How much of the required contribution is being made
    contributionCoverage = Math.min(1, monthlyContribution / requiredMonthly);
  } else if (monthlyContribution > 0 && (!monthsRemaining || monthsRemaining > 0)) {
    // Making contributions even if none strictly required
    contributionCoverage = 0.8;
  }

  // Weighted score: projection is primary factor (60%), contribution is secondary (40%)
  const score = projectionCoverage * 0.6 + contributionCoverage * 0.4;
  
  return Math.round(score * 100);
}


/**
 * Solve for completion months using binary search and iteration
 * Returns the number of months needed to reach targetAmount
 */
function solveMonthsForTarget(currentAmount, monthlyContribution, monthlyReturn, targetAmount) {
  // Check if already at target
  if (currentAmount >= targetAmount) {
    return 0;
  }

  // If no contributions and no returns, impossible
  if (monthlyContribution <= 0 && monthlyReturn <= 0) {
    return null;
  }

  // Try to find month where we reach target (up to 600 years = 7200 months)
  const maxMonths = 7200;
  
  for (let month = 1; month <= maxMonths; month++) {
    const projected = futureValueWithContributions(
      currentAmount,
      monthlyContribution,
      monthlyReturn,
      month
    );
    
    if (projected >= targetAmount) {
      return month;
    }
  }

  // If we've gone 600 years and still can't reach it, it's infeasible
  return null;
}

/**
 * Calculate completion date based on months needed
 */
function calculateCompletionDate(fromDate, months) {
  if (months === null || months === undefined) {
    return null;
  }

  const date = new Date(fromDate);
  date.setMonth(date.getMonth() + Math.floor(months));
  
  // Add remaining partial month as days
  const partialMonth = months % 1;
  if (partialMonth > 0) {
    const daysInMonth = 30; // Approximate
    date.setDate(date.getDate() + Math.round(partialMonth * daysInMonth));
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Project a single goal with all metrics
 */
async function projectGoal(goal, { expectedReturn = 0.08, inflation = 0.03 } = {}) {
  const today = new Date();
  const currentAmount = parseFloat(goal.current_amount) || 0;
  const targetAmount = parseFloat(goal.target_amount) || 0;
  const monthlyContribution = parseFloat(goal.monthly_contribution) || 0;
  
  // Calculate monthly return (annual return minus inflation)
  const netAnnualReturn = Math.max(0, expectedReturn - inflation);
  const monthlyReturn = netAnnualReturn / 12;

  // Calculate days and months to target date
  const daysToTargetDate = daysBetween(today, goal.target_date);
  const monthsToTargetDate = monthsBetween(today, goal.target_date);
  
  // Calculate completion percentage
  const completionPercentage = targetAmount > 0 
    ? Math.min(100, Math.round((currentAmount / targetAmount) * 100 * 100) / 100)
    : 0;

  // Edge case: goal already completed or exceeded
  if (currentAmount >= targetAmount) {
    return {
      goalId: goal.id,
      completionPercentage: 100,
      daysRemaining: daysToTargetDate !== null && daysToTargetDate < 0 ? daysToTargetDate : 0,
      monthsRemaining: monthsToTargetDate !== null && monthsToTargetDate < 0 ? monthsToTargetDate : 0,
      feasible: true,
      monthsToGoal: 0,
      completionDate: today.toISOString().slice(0, 10),
      requiredMonthly: 0,
      projectedValueAtTargetDate: round2(currentAmount),
      projectedShortfall: 0,
      successProbability: 100,
      recommendation: "Goal completed! ✓"
    };
  }

  // Edge case: target date is in the past (overdue)
  if (monthsToTargetDate !== null && monthsToTargetDate < 0) {
    const gap = targetAmount - currentAmount;
    return {
      goalId: goal.id,
      completionPercentage,
      daysRemaining: daysToTargetDate,
      monthsRemaining: monthsToTargetDate,
      feasible: false,
      monthsToGoal: null,
      completionDate: null,
      requiredMonthly: null,
      projectedValueAtTargetDate: round2(currentAmount),
      projectedShortfall: round2(gap),
      successProbability: 0,
      recommendation: `Goal is overdue by ${Math.abs(monthsToTargetDate)} months. Target shortfall: ₹${gap.toLocaleString('en-IN')}`
    };
  }

  // Calculate months needed to reach target with current contribution
  const monthsToReachGoal = solveMonthsForTarget(
    currentAmount,
    monthlyContribution,
    monthlyReturn,
    targetAmount
  );

  const completionDateFromNow = calculateCompletionDate(today, monthsToReachGoal);

  // Calculate projected value at target date if target date exists
  const projectedValueAtTargetDate = monthsToTargetDate !== null
    ? futureValueWithContributions(currentAmount, monthlyContribution, monthlyReturn, monthsToTargetDate)
    : (monthsToReachGoal !== null 
      ? futureValueWithContributions(currentAmount, monthlyContribution, monthlyReturn, monthsToReachGoal)
      : currentAmount);

  const projectedShortfall = Math.max(0, targetAmount - projectedValueAtTargetDate);

  // Calculate required monthly contribution to meet target date
  let requiredMonthly = 0;
  if (monthsToTargetDate !== null && monthsToTargetDate > 0) {
    const needed = requiredMonthlyContribution(
      currentAmount,
      targetAmount,
      monthlyReturn,
      monthsToTargetDate
    );
    requiredMonthly = needed || 0;
  }

  // Calculate success probability
  const successProbability = monthsToTargetDate !== null && monthsToTargetDate > 0
    ? computeSuccessProbability(
        projectedValueAtTargetDate,
        targetAmount,
        monthlyContribution,
        requiredMonthly > 0 ? requiredMonthly : null,
        monthsToTargetDate
      )
    : (monthsToReachGoal !== null && monthsToReachGoal > 0
      ? Math.min(95, 50 + (monthlyContribution > 0 ? 40 : 0)) // No target date specified
      : 20); // No progress possible

  // Generate recommendation
  let recommendation = "On track. ✓";
  
  if (monthsToTargetDate !== null && monthsToTargetDate > 0) {
    if (projectedShortfall > 0) {
      const gap = projectedShortfall;
      const additionalMonthly = requiredMonthly - monthlyContribution;
      
      if (additionalMonthly > 0.01) {
        recommendation = `Increase monthly contribution by ₹${round2(additionalMonthly).toLocaleString('en-IN')} to reach target by ${goal.target_date.slice(0, 10)}`;
      } else {
        recommendation = `Consider one-time contributions of ₹${gap.toLocaleString('en-IN')} to close the gap.`;
      }
    } else if (monthsToReachGoal !== null && monthsToReachGoal < monthsToTargetDate) {
      recommendation = `Ahead of schedule! Goal achievable in ${monthsToReachGoal} months (${(monthsToTargetDate - monthsToReachGoal)} months before deadline).`;
    }
  } else if (monthsToReachGoal !== null) {
    recommendation = `Will reach goal in ${monthsToReachGoal} months (${calculateCompletionDate(today, monthsToReachGoal)}).`;
  } else if (monthlyContribution > 0) {
    recommendation = `Currently not on track. No target date set - specify a target date for better planning.`;
  } else {
    recommendation = `No monthly contributions set. Add recurring contributions to reach this goal.`;
  }

  return {
    goalId: goal.id,
    completionPercentage,
    daysRemaining: daysToTargetDate,
    monthsRemaining: monthsToTargetDate,
    feasible: monthsToTargetDate === null 
      ? (monthsToReachGoal !== null) 
      : (projectedShortfall === 0 || (monthsToReachGoal !== null && monthsToReachGoal <= monthsToTargetDate)),
    monthsToGoal: monthsToReachGoal,
    completionDate: completionDateFromNow,
    requiredMonthly: requiredMonthly > 0 ? round2(requiredMonthly) : 0,
    projectedValueAtTargetDate: round2(projectedValueAtTargetDate),
    projectedShortfall: round2(projectedShortfall),
    successProbability,
    recommendation
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
