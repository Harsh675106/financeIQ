const pool = require("../config/database");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function estimateMinimumPayment(balance, annualRatePercent) {
  const monthlyRate = Math.max(0, annualRatePercent) / 100 / 12;
  const interestOnly = balance * monthlyRate;
  return Math.max(balance * 0.02, interestOnly + balance * 0.005, Math.min(balance, 50));
}

function simulateStrategy(debts, monthlyBudget, strategyName) {
  const working = debts.map((debt) => ({
    ...debt,
    balance: debt.balance,
    paidOffMonth: null,
  }));

  let month = 0;
  let totalInterest = 0;
  const payoffOrder = [];
  const maxMonths = 600;

  while (working.some((debt) => debt.balance > 0.01) && month < maxMonths) {
    month += 1;
    let available = monthlyBudget;

    for (const debt of working) {
      if (debt.balance <= 0.01) {
        continue;
      }

      const interest = debt.balance * debt.monthlyRate;
      debt.balance += interest;
      totalInterest += interest;
    }

    for (const debt of working) {
      if (debt.balance <= 0.01) {
        continue;
      }

      const minimum = Math.min(debt.balance, debt.minimumPayment);
      const payment = Math.min(minimum, available);
      debt.balance -= payment;
      available -= payment;
    }

    const candidates = working
      .filter((debt) => debt.balance > 0.01)
      .sort((left, right) => {
        if (strategyName === "snowball") {
          return left.balance - right.balance || right.annualRate - left.annualRate;
        }
        return right.annualRate - left.annualRate || left.balance - right.balance;
      });

    for (const debt of candidates) {
      if (available <= 0) {
        break;
      }

      const payment = Math.min(debt.balance, available);
      debt.balance -= payment;
      available -= payment;
    }

    for (const debt of working) {
      if (debt.balance <= 0.01 && debt.paidOffMonth === null) {
        debt.balance = 0;
        debt.paidOffMonth = month;
        payoffOrder.push({
          id: debt.id,
          debtType: debt.debtType,
          description: debt.description,
          month,
        });
      }
    }
  }

  return {
    strategy: strategyName,
    monthsToDebtFree: month >= maxMonths ? null : month,
    totalInterest: round2(totalInterest),
    payoffOrder,
  };
}

async function getAverageMonthlySavings(userId) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const result = await pool.query(
    `SELECT DATE_TRUNC('month', date) AS month,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
     FROM transactions
     WHERE user_id = $1
       AND date >= $2
     GROUP BY 1
     ORDER BY 1`,
    [userId, start.toISOString().slice(0, 10)],
  );

  if (!result.rows.length) {
    return 0;
  }

  const monthlySavings = result.rows.map((row) => {
    const income = parseFloat(row.income) || 0;
    const expenses = parseFloat(row.expenses) || 0;
    return income - expenses;
  });

  return monthlySavings.reduce((sum, value) => sum + value, 0) / monthlySavings.length;
}

async function getDebtOptimization(userId) {
  const result = await pool.query(
    `SELECT id, amount, interest_rate, debt_type, description
     FROM debts
     WHERE user_id = $1
     ORDER BY interest_rate DESC NULLS LAST, amount DESC`,
    [userId],
  );

  const debts = result.rows.map((row) => {
    const balance = parseFloat(row.amount) || 0;
    const annualRate = parseFloat(row.interest_rate) || 0;
    const minimumPayment = estimateMinimumPayment(balance, annualRate);
    return {
      id: row.id,
      debtType: row.debt_type || "Debt",
      description: row.description || "",
      balance,
      annualRate,
      monthlyRate: annualRate / 100 / 12,
      minimumPayment,
    };
  });

  if (!debts.length) {
    return {
      hasDebts: false,
      monthlyPaymentBudget: 0,
      summary: "No debts found. Add a debt to see a payoff strategy.",
      strategies: [],
      recommendedStrategy: null,
    };
  }

  const averageSavings = await getAverageMonthlySavings(userId);
  const minimums = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const extraBudget = Math.max(0, averageSavings * 0.6);
  const monthlyPaymentBudget = round2(minimums + extraBudget);

  const avalanche = simulateStrategy(debts, monthlyPaymentBudget, "avalanche");
  const snowball = simulateStrategy(debts, monthlyPaymentBudget, "snowball");

  const recommendedStrategy =
    avalanche.monthsToDebtFree !== null &&
    (snowball.monthsToDebtFree === null ||
      avalanche.totalInterest <= snowball.totalInterest)
      ? avalanche
      : snowball;

  const interestSaved =
    avalanche.totalInterest < snowball.totalInterest
      ? round2(snowball.totalInterest - avalanche.totalInterest)
      : 0;

  return {
    hasDebts: true,
    monthlyPaymentBudget,
    summary:
      recommendedStrategy.strategy === "avalanche"
        ? `Avalanche is recommended because it should minimize interest and save about ${interestSaved.toLocaleString("en-IN")} overall.`
        : "Snowball is recommended because it should clear smaller balances faster and create quicker momentum.",
    strategies: [avalanche, snowball],
    recommendedStrategy: {
      ...recommendedStrategy,
      label:
        recommendedStrategy.strategy === "avalanche"
          ? "Avalanche"
          : "Snowball",
    },
    debts: debts.map((debt) => ({
      id: debt.id,
      debtType: debt.debtType,
      description: debt.description,
      balance: round2(debt.balance),
      annualRate: round2(debt.annualRate),
      minimumPayment: round2(debt.minimumPayment),
    })),
  };
}

module.exports = { getDebtOptimization };
