const express = require('express')
const axios = require('axios')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get financial overview
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user.id

    // Get income and expenses
    const incomeResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type = $2',
      [userId, 'income']
    )
    const expenseResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type = $2',
      [userId, 'expense']
    )

    const totalIncome = parseFloat(incomeResult.rows[0].total) || 0
    const totalExpenses = parseFloat(expenseResult.rows[0].total) || 0
    const savings = totalIncome - totalExpenses

    // Calculate debt ratio
    const debtResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM debts WHERE user_id = $1',
      [userId]
    )
    const totalDebt = parseFloat(debtResult.rows[0].total) || 0
    const debtRatio = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0

    // Calculate health score
    const healthScore = calculateHealthScore(totalIncome, totalExpenses, savings, debtRatio)

    res.json({
      healthScore: Math.round(healthScore),
      totalIncome,
      totalExpenses,
      savings,
      debtRatio: Math.round(debtRatio * 100) / 100,
    })
  } catch (error) {
    console.error('Overview error:', error)
    res.status(500).json({ message: 'Failed to fetch overview' })
  }
})

// Get risk assessment
router.get('/risk-assessment', async (req, res) => {
  try {
    const userId = req.user.id

    // Get user financial data
    const userResult = await pool.query(
      'SELECT created_at FROM users WHERE id = $1',
      [userId]
    )
    const user = userResult.rows[0]
    // Try to read age from profiles if available; fallback if not present
    let profileAge = null
    try {
      const profRes = await pool.query('SELECT age FROM profiles WHERE user_id = $1', [userId])
      if (profRes.rows.length) profileAge = profRes.rows[0].age
    } catch (e) {
      // profiles table may not exist yet; ignore
    }

    const incomeResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type = $2',
      [userId, 'income']
    )
    const expenseResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type = $2',
      [userId, 'expense']
    )
    const savingsResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM savings WHERE user_id = $1',
      [userId]
    )
    const debtResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM debts WHERE user_id = $1',
      [userId]
    )

    const totalIncome = parseFloat(incomeResult.rows[0].total) || 0
    const totalExpenses = parseFloat(expenseResult.rows[0].total) || 0
    const totalSavings = parseFloat(savingsResult.rows[0].total) || 0
    const totalDebt = parseFloat(debtResult.rows[0].total) || 0

    // Check if user has any financial data
    const hasData = totalIncome > 0 || totalExpenses > 0 || totalDebt > 0 || totalSavings > 0

    // If no data, return empty state response
    if (!hasData) {
      return res.json({
        hasData: false,
        riskScore: null,
        riskLevel: null,
        stressProbability: null,
      })
    }

    // Calculate age (if not provided, estimate from account age)
    const age = profileAge || calculateAgeFromAccount(user.created_at)

    // Call ML service for risk assessment
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000'
    
    try {
      const mlResponse = await axios.post(`${mlServiceUrl}/api/risk-assessment`, {
        age,
        income: totalIncome,
        expenses: totalExpenses,
        savings: totalSavings,
        debt: totalDebt,
      })

      res.json({ ...mlResponse.data, hasData: true })
    } catch (mlError) {
      // Fallback to basic calculation if ML service unavailable
      console.warn('ML service unavailable, using fallback calculation')
      const riskScore = calculateRiskScore(age, totalIncome, totalSavings, totalDebt, totalExpenses)
      const riskLevel = getRiskLevel(riskScore)
      const stressProbability = calculateStressProbability(totalDebt, totalIncome, totalExpenses)

      res.json({
        hasData: true,
        riskScore,
        riskLevel,
        stressProbability,
      })
    }
  } catch (error) {
    console.error('Risk assessment error:', error)
    res.status(500).json({ message: 'Failed to assess risk' })
  }
})

// Helper functions
function calculateHealthScore(income, expenses, savings, debtRatio) {
  let score = 100

  // Savings rate (40% weight)
  const savingsRate = income > 0 ? (savings / income) * 100 : 0
  score -= Math.max(0, (20 - savingsRate) * 2)

  // Expense ratio (30% weight)
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 100
  if (expenseRatio > 90) score -= 30
  else if (expenseRatio > 70) score -= 15

  // Debt ratio (30% weight)
  if (debtRatio > 40) score -= 30
  else if (debtRatio > 30) score -= 15
  else if (debtRatio > 20) score -= 5

  return Math.max(0, Math.min(100, score))
}

function calculateRiskScore(age, income, savings, debt, expenses) {
  let score = 50 // Base score

  // Age factor (younger = higher risk tolerance)
  if (age < 30) score += 20
  else if (age < 40) score += 10
  else if (age < 50) score += 5

  // Savings ratio
  const savingsRatio = income > 0 ? savings / income : 0
  if (savingsRatio > 0.3) score += 15
  else if (savingsRatio > 0.2) score += 10
  else if (savingsRatio > 0.1) score += 5

  // Debt ratio
  const debtRatio = income > 0 ? debt / income : 0
  if (debtRatio < 0.2) score += 10
  else if (debtRatio < 0.3) score += 5
  else if (debtRatio > 0.4) score -= 15

  return Math.max(0, Math.min(100, score))
}

function getRiskLevel(score) {
  if (score < 40) return 'Conservative'
  if (score < 70) return 'Balanced'
  return 'Aggressive'
}

function calculateStressProbability(debt, income, expenses) {
  if (income === 0) return 100

  const debtToIncome = debt / income
  const expenseRatio = expenses / income

  let probability = 0

  if (debtToIncome > 0.4) probability += 40
  else if (debtToIncome > 0.3) probability += 25
  else if (debtToIncome > 0.2) probability += 10

  if (expenseRatio > 0.9) probability += 30
  else if (expenseRatio > 0.8) probability += 20
  else if (expenseRatio > 0.7) probability += 10

  return Math.min(100, Math.max(0, probability))
}

function calculateAgeFromAccount(createdAt) {
  // Estimate age as 25-35 if not provided
  return 30
}

module.exports = router
