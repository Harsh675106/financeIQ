const pool = require("../config/database");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values) {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function normalizeMerchant(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(description, type) {
  const text = normalizeMerchant(description);
  const rules = [
    { category: "Transport", keywords: ["uber", "ola", "lyft", "metro", "fuel", "petrol", "gas"] },
    { category: "Food & Dining", keywords: ["zomato", "swiggy", "restaurant", "coffee", "starbucks", "mcd"] },
    { category: "Subscriptions", keywords: ["netflix", "spotify", "prime", "hotstar", "subscription"] },
    { category: "Shopping", keywords: ["amazon", "flipkart", "myntra", "store", "mall"] },
    { category: "Utilities", keywords: ["electric", "water", "internet", "wifi", "airtel", "jio", "bill"] },
    { category: "Housing", keywords: ["rent", "mortgage", "lease", "maintenance"] },
    { category: "Healthcare", keywords: ["hospital", "doctor", "pharmacy", "medical"] },
    { category: "Income", keywords: ["salary", "payroll", "bonus", "stipend", "dividend"] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return {
        category: type === "income" ? "Income" : rule.category,
        confidence: text.length > 0 ? 0.88 : 0.55,
      };
    }
  }

  return {
    category: type === "income" ? "Income" : "Other",
    confidence: text.length > 0 ? 0.52 : 0.35,
  };
}

function detectSalaryCredit(transaction) {
  const text = normalizeMerchant(transaction.description);
  return transaction.type === "income" && ["salary", "payroll", "stipend", "bonus"].some((keyword) => text.includes(keyword));
}

function detectEmiPayment(transaction) {
  const text = normalizeMerchant(transaction.description);
  return transaction.type === "expense" && ["emi", "loan", "credit card", "mortgage"].some((keyword) => text.includes(keyword));
}

async function getTransactionIntelligence(userId) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const result = await pool.query(
    `SELECT id, type, amount, category, description, date
     FROM transactions
     WHERE user_id = $1
       AND date >= $2
     ORDER BY date DESC, created_at DESC`,
    [userId, sixMonthsAgo.toISOString().slice(0, 10)],
  );

  const transactions = result.rows.map((row) => ({
    ...row,
    amount: parseFloat(row.amount) || 0,
  }));

  const duplicates = [];
  const merchantMap = new Map();
  const recurringGroups = [];
  const unusualSpend = [];
  const suggestions = [];
  const recurringMap = new Map();

  for (const transaction of transactions) {
    const merchant = normalizeMerchant(transaction.description);
    const duplicateKey = `${transaction.type}|${transaction.amount.toFixed(2)}|${merchant}|${transaction.date}`;
    if (merchantMap.has(duplicateKey)) {
      duplicates.push({
        originalId: merchantMap.get(duplicateKey),
        duplicateId: transaction.id,
        merchant,
        amount: transaction.amount,
        confidence: 0.97,
      });
    } else {
      merchantMap.set(duplicateKey, transaction.id);
    }

    if (merchant) {
      const recurringKey = `${transaction.type}|${merchant}|${transaction.amount.toFixed(2)}`;
      if (!recurringMap.has(recurringKey)) {
        recurringMap.set(recurringKey, []);
      }
      recurringMap.get(recurringKey).push(transaction);
    }

    const inferred = inferCategory(transaction.description, transaction.type);
    if (!transaction.category || transaction.category === "Other" || transaction.category === "Uncategorized") {
      suggestions.push({
        transactionId: transaction.id,
        currentCategory: transaction.category || null,
        suggestedCategory: inferred.category,
        confidence: round2(inferred.confidence * 100),
        reason: "Pattern matched similar merchant keywords.",
      });
    }
  }

  for (const [, items] of recurringMap.entries()) {
    if (items.length < 3) continue;
    const sorted = items.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const intervals = [];
    for (let index = 1; index < sorted.length; index += 1) {
      const diffDays = (new Date(sorted[index].date) - new Date(sorted[index - 1].date)) / (1000 * 60 * 60 * 24);
      intervals.push(diffDays);
    }
    const avgInterval = average(intervals);
    if (avgInterval >= 25 && avgInterval <= 35) {
      const sample = sorted[0];
      recurringGroups.push({
        merchant: sample.description || "Recurring transaction",
        amount: sample.amount,
        type: sample.type,
        confidence: 88,
        classification: detectEmiPayment(sample)
          ? "EMI / loan payment"
          : detectSalaryCredit(sample)
            ? "Salary credit"
            : "Recurring subscription or bill",
      });
    }
  }

  const expenseByCategory = new Map();
  for (const transaction of transactions.filter((item) => item.type === "expense")) {
    const category = transaction.category || "Other";
    if (!expenseByCategory.has(category)) {
      expenseByCategory.set(category, []);
    }
    expenseByCategory.get(category).push(transaction.amount);
  }

  for (const transaction of transactions.filter((item) => item.type === "expense")) {
    const category = transaction.category || "Other";
    const samples = expenseByCategory.get(category) || [];
    if (samples.length < 4) continue;
    const mean = average(samples);
    const deviation = stdDev(samples);
    if (deviation > 0 && transaction.amount > mean + deviation * 1.5) {
      unusualSpend.push({
        transactionId: transaction.id,
        category,
        amount: transaction.amount,
        average: round2(mean),
        confidence: 82,
        reason: `This is significantly above your normal ${category} spend.`,
      });
    }
  }

  return {
    suggestions: suggestions.slice(0, 12),
    duplicates: duplicates.slice(0, 10),
    recurring: recurringGroups.slice(0, 10),
    salaryCredits: transactions.filter(detectSalaryCredit).slice(0, 5).map((item) => ({
      transactionId: item.id,
      description: item.description,
      amount: item.amount,
      confidence: 91,
    })),
    emiPayments: transactions.filter(detectEmiPayment).slice(0, 5).map((item) => ({
      transactionId: item.id,
      description: item.description,
      amount: item.amount,
      confidence: 86,
    })),
    unusualSpend: unusualSpend.slice(0, 8),
  };
}

async function saveCategorizationFeedback(userId, transactionId, correctedCategory, suggestedCategory) {
  await pool.query(
    `INSERT INTO transaction_feedback (user_id, transaction_id, corrected_category, suggested_category)
     VALUES ($1, $2, $3, $4)`,
    [userId, transactionId, correctedCategory, suggestedCategory || null],
  );
}

module.exports = {
  getTransactionIntelligence,
  saveCategorizationFeedback,
};
