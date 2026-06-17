const axios = require('axios')
const pool = require('../config/database')

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function extractResponseText(response) {
  if (typeof response?.output_text === 'string' && response.output_text.length > 0) {
    return response.output_text
  }

  const parts = []
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && content?.text) {
        parts.push(content.text)
      }
      if (content?.type === 'text' && content?.text) {
        parts.push(content.text)
      }
    }
  }

  return parts.join('\n').trim()
}

function getLlmClientConfig() {
  return {
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  }
}

async function getUserMarketContext(userId) {
  const [debtRes, savingsRes, txRes] = await Promise.all([
    pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM debts WHERE user_id=$1', [userId]),
    pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM savings WHERE user_id=$1', [userId]),
    pool.query(
      `SELECT COALESCE(category,'Uncategorized') AS category, COALESCE(SUM(amount),0) AS total
       FROM transactions
       WHERE user_id=$1 AND type='expense' AND date >= CURRENT_DATE - INTERVAL '90 days'
       GROUP BY 1
       ORDER BY total DESC
       LIMIT 3`,
      [userId],
    ),
  ])

  return {
    totalDebt: round2(debtRes.rows[0]?.total || 0),
    totalSavings: round2(savingsRes.rows[0]?.total || 0),
    topExpenseCategories: txRes.rows.map((row) => ({
      category: row.category,
      total: round2(row.total || 0),
    })),
  }
}

function getAsset(assets, label) {
  return assets.find((item) => item.label === label)
}

function buildHeuristicInsights(snapshot, macro, userContext) {
  const assets = snapshot.assets || []
  const indicators = macro.indicators || []

  const equity = getAsset(assets, 'S&P 500')
  const gold = getAsset(assets, 'Gold')
  const oil = getAsset(assets, 'Oil')
  const usdInr = getAsset(assets, 'USD/INR')
  const bitcoin = getAsset(assets, 'Bitcoin')

  const rates = indicators.find((item) => item.key === 'rates')
  const inflation = indicators.find((item) => item.key === 'inflation')
  const spread = indicators.find((item) => item.key === 'spread10Y2Y')

  const headlineParts = []
  if ((equity?.change1W ?? 0) < 0 && (gold?.change1W ?? 0) > 0) {
    headlineParts.push('Defensive assets are outperforming equities this week.')
  }
  if ((oil?.change1W ?? 0) > 3) {
    headlineParts.push('Energy prices are moving higher and may keep inflation pressure elevated.')
  }
  if ((bitcoin?.change1W ?? 0) > 5) {
    headlineParts.push('Crypto risk appetite has strengthened noticeably.')
  }
  if (headlineParts.length === 0) {
    headlineParts.push('Markets look mixed, with no single theme dominating every asset class.')
  }

  const trendNarrative = [
    (gold?.change1W ?? 0) > (equity?.change1W ?? 0)
      ? 'Gold is holding up better than equities, which often signals a more cautious tone.'
      : 'Equities are keeping pace with defensive assets, suggesting risk appetite is still present.',
    (usdInr?.change1M ?? 0) > 0
      ? 'The dollar has strengthened versus the rupee over the last month, which can matter for imported inflation and overseas investing.'
      : 'The rupee has held its ground versus the dollar over the last month, reducing some imported-price pressure.',
    (spread?.value ?? 0) < 0
      ? 'The yield curve remains inverted, so growth-sensitive decisions deserve extra caution.'
      : 'The yield curve is not flashing a deep recession warning right now, though rates still matter.',
  ].join(' ')

  const personalRelevance = []
  if ((rates?.value ?? 0) >= 4 && userContext.totalDebt > 0) {
    personalRelevance.push(
      `Rates remain elevated at about ${rates.value}${rates.unit}, so carrying ${Math.round(userContext.totalDebt).toLocaleString('en-IN')} in debt deserves close attention.`,
    )
  }
  if ((oil?.change1M ?? 0) > 3) {
    const transportExpense = userContext.topExpenseCategories.find((item) =>
      ['fuel', 'transport', 'travel', 'commute'].includes(String(item.category).toLowerCase()),
    )
    personalRelevance.push(
      transportExpense
        ? `Oil is up over the last month, and transport-related spending is already one of your larger categories.`
        : 'Oil is up over the last month, which can spill into transport and living costs.',
    )
  }
  if ((inflation?.value ?? 0) > 3) {
    personalRelevance.push('Sticky inflation means your savings and goal plans should aim to beat rising costs, not just stay flat.')
  }
  if (personalRelevance.length === 0) {
    personalRelevance.push('Your portfolio, debt, and monthly costs will react differently to rates, inflation, and commodity moves, so use this page as a context layer for decisions.')
  }

  const learnCards = [
    {
      title: 'Why watch rates?',
      body: 'Policy rates influence loan EMIs, valuation multiples, and how much return investors demand from risky assets.',
    },
    {
      title: 'Why does gold matter?',
      body: 'Gold often benefits when investors want a hedge against inflation, currency stress, or equity uncertainty.',
    },
    {
      title: 'Why does oil matter?',
      body: 'Oil can ripple through fuel, shipping, and business costs, eventually affecting inflation and household budgets.',
    },
    {
      title: 'Why does USD/INR matter?',
      body: 'A stronger dollar can affect imported inflation, global investing returns, and sentiment around emerging markets.',
    },
  ]

  return {
    headline: headlineParts.join(' '),
    trendNarrative,
    personalRelevance: personalRelevance.slice(0, 3),
    learnCards,
    source: 'local',
  }
}

async function getGroqMarketInsights(snapshot, macro, userContext) {
  const { apiKey, baseUrl, model } = getLlmClientConfig()
  if (!apiKey) {
    return null
  }

  const response = await axios.post(
    `${baseUrl.replace(/\/+$/, '')}/responses`,
    {
      model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'You are a financial educator. Use only the provided market data and user context. Return JSON with keys headline, trendNarrative, personalRelevance, learnCards. personalRelevance must be an array of short strings. learnCards must be an array of objects with title and body. Keep it practical and non-hype.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify({ snapshot, macro, userContext }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'market_intelligence_insights',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              headline: { type: 'string' },
              trendNarrative: { type: 'string' },
              personalRelevance: {
                type: 'array',
                items: { type: 'string' },
              },
              learnCards: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string' },
                    body: { type: 'string' },
                  },
                  required: ['title', 'body'],
                },
              },
            },
            required: ['headline', 'trendNarrative', 'personalRelevance', 'learnCards'],
          },
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    },
  )

  const parsed = JSON.parse(extractResponseText(response.data))
  return {
    ...parsed,
    source: 'groq',
  }
}

async function getMarketInsights(userId, snapshot, macro) {
  const userContext = await getUserMarketContext(userId)

  try {
    const ai = await getGroqMarketInsights(snapshot, macro, userContext)
    if (ai) {
      return {
        ...ai,
        userContext,
      }
    }
  } catch (error) {
    console.error('Groq market insights fallback triggered:', error.response?.data || error.message)
  }

  return {
    ...buildHeuristicInsights(snapshot, macro, userContext),
    userContext,
  }
}

module.exports = {
  getMarketInsights,
}
