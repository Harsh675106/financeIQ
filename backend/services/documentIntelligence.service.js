const pool = require('../config/database')

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function normalizeText(text) {
  return (text || '')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function inferDocumentType(documentType, content, documentName) {
  if (documentType && documentType !== 'auto') {
    return documentType
  }

  const sample = `${documentName || ''}\n${content || ''}`.toLowerCase()
  if (['salary slip', 'payslip', 'net pay', 'gross pay', 'ctc'].some((item) => sample.includes(item))) return 'salary_slip'
  if (['credit card', 'statement due', 'minimum due', 'card ending'].some((item) => sample.includes(item))) return 'credit_card_statement'
  if (['insurance', 'policy number', 'premium'].some((item) => sample.includes(item))) return 'insurance'
  if (['tax', 'form 16', 'itr', 'tds', 'income tax'].some((item) => sample.includes(item))) return 'tax_document'
  return 'bank_statement'
}

function parseAmount(rawValue) {
  if (!rawValue) return null
  const cleaned = String(rawValue).replace(/[, ]/g, '')
  const match = cleaned.match(/-?\d+(?:\.\d{1,2})?/)
  if (!match) return null
  const value = parseFloat(match[0])
  return Number.isFinite(value) ? round2(value) : null
}

function parseDate(rawValue) {
  if (!rawValue) return null
  const cleaned = rawValue.trim()
  const direct = new Date(cleaned)
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10)
  }

  const match = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3])
  const date = new Date(year, month, day)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

function inferTransactionCategory(description, type) {
  const text = (description || '').toLowerCase()
  const rules = [
    { category: 'Food & Dining', keywords: ['restaurant', 'zomato', 'swiggy', 'cafe', 'coffee'] },
    { category: 'Transport', keywords: ['uber', 'ola', 'metro', 'petrol', 'fuel'] },
    { category: 'Shopping', keywords: ['amazon', 'flipkart', 'myntra', 'mall'] },
    { category: 'Utilities', keywords: ['electric', 'water', 'internet', 'wifi', 'bill', 'recharge'] },
    { category: 'Housing', keywords: ['rent', 'lease', 'maintenance'] },
    { category: 'Healthcare', keywords: ['hospital', 'doctor', 'medical', 'pharmacy'] },
    { category: 'Subscriptions', keywords: ['netflix', 'spotify', 'prime', 'subscription', 'youtube'] },
    { category: 'Salary', keywords: ['salary', 'payroll', 'stipend', 'bonus'] },
  ]

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return type === 'income' ? 'Income' : rule.category
    }
  }

  return type === 'income' ? 'Income' : 'Other'
}

function parseDelimitedRows(content) {
  const lines = normalizeText(content).split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const delimiter = lines[0].includes(',') ? ',' : lines[0].includes('\t') ? '\t' : null
  if (!delimiter) return []

  const headers = lines[0].split(delimiter).map((item) => item.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter).map((item) => item.trim())
    const row = {}
    headers.forEach((header, index) => {
      row[header] = cells[index] || ''
    })
    return row
  })
}

function parseTransactionRowsFromText(content) {
  const rows = parseDelimitedRows(content)
  if (rows.length > 0) {
    return rows
      .map((row) => {
        const description = row.description || row.narration || row.merchant || row.details || ''
        const credit = parseAmount(row.credit || row.cr || row.deposit)
        const debit = parseAmount(row.debit || row.dr || row.withdrawal)
        const amount = credit || debit || parseAmount(row.amount)
        const type = credit ? 'income' : 'expense'
        const date = parseDate(row.date || row.txn_date || row.posted_on)
        if (!amount || !date || !description) return null
        return {
          date,
          description,
          amount: Math.abs(amount),
          type,
          category: inferTransactionCategory(description, type),
          confidence: 86,
        }
      })
      .filter(Boolean)
  }

  const lines = normalizeText(content).split('\n').map((line) => line.trim()).filter(Boolean)
  const parsed = []
  for (const line of lines) {
    const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/)
    const amountMatches = [...line.matchAll(/-?\d[\d,]*(?:\.\d{1,2})/g)].map((match) => match[0])
    if (!dateMatch || amountMatches.length === 0) continue
    const date = parseDate(dateMatch[1])
    const amount = parseAmount(amountMatches[amountMatches.length - 1])
    if (!date || !amount) continue
    const lower = line.toLowerCase()
    const type = ['credit', 'salary', 'refund', 'deposit', 'cr'].some((item) => lower.includes(item)) ? 'income' : 'expense'
    const description = line.replace(dateMatch[1], '').replace(amountMatches[amountMatches.length - 1], '').trim().replace(/\s+/g, ' ')
    if (!description) continue
    parsed.push({
      date,
      description,
      amount: Math.abs(amount),
      type,
      category: inferTransactionCategory(description, type),
      confidence: 68,
    })
  }
  return parsed
}

function analyzeSalarySlip(content) {
  const normalized = normalizeText(content)
  const lines = normalized.split('\n')
  const extractByLabel = (labels) => {
    for (const line of lines) {
      const lower = line.toLowerCase()
      if (labels.some((label) => lower.includes(label))) {
        const amount = parseAmount(line)
        if (amount !== null) return amount
      }
    }
    return null
  }

  const netPay = extractByLabel(['net pay', 'take home', 'net salary'])
  const grossPay = extractByLabel(['gross pay', 'gross salary', 'total earnings'])
  const deductions = extractByLabel(['deduction', 'total deductions'])

  const suggestedTransactions = netPay
    ? [{
        date: new Date().toISOString().slice(0, 10),
        description: 'Imported salary slip income',
        amount: netPay,
        type: 'income',
        category: 'Income',
        confidence: 82,
      }]
    : []

  return {
    extractedFields: {
      netPay,
      grossPay,
      deductions,
    },
    suggestedTransactions,
    summary: netPay
      ? `Detected a likely take-home salary of ${Math.round(netPay).toLocaleString('en-IN')}.`
      : 'Detected salary-slip style content, but the net pay field was not clear enough to import automatically.',
    confidence: netPay ? 84 : 56,
    assumptions: [
      'Salary fields are inferred from text labels like net pay and gross pay.',
      'If OCR changed the labels or number formatting, extracted values may be incomplete.',
    ],
    whatChangesIfWrong: 'If the payslip uses different labels or has OCR errors, review the extracted pay fields before importing.',
  }
}

function analyzeStatementLikeDocument(content, resolvedType) {
  const transactions = parseTransactionRowsFromText(content)
  const income = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const monthlySummary = {
    entriesDetected: transactions.length,
    income: round2(income),
    expenses: round2(expenses),
  }

  return {
    extractedFields: monthlySummary,
    suggestedTransactions: transactions.slice(0, 100),
    summary: transactions.length > 0
      ? `Detected ${transactions.length} structured ${resolvedType === 'credit_card_statement' ? 'card' : 'bank'} transaction line(s).`
      : 'No structured transaction rows were detected. Paste cleaner OCR text or a CSV export for better results.',
    confidence: transactions.length >= 5 ? 82 : transactions.length > 0 ? 64 : 35,
    assumptions: [
      'Each parsed line should contain a date, description, and amount.',
      'Income/expense direction is inferred from CSV columns or keywords like credit/debit.',
    ],
    whatChangesIfWrong: 'If statement rows are split across lines or OCR dropped columns, some transactions may be misread or skipped.',
  }
}

function analyzeStaticDocument(content, resolvedType) {
  const summary =
    resolvedType === 'insurance'
      ? 'Insurance-style document detected. Key policy values can be reviewed, but auto-import into financial records is not enabled yet.'
      : 'Tax-style document detected. FinanceIQ can store the analysis, but tax auto-import is not enabled yet.'

  return {
    extractedFields: {
      highlightedNumbers: [...normalizeText(content).matchAll(/\d[\d,]*(?:\.\d{1,2})/g)].slice(0, 8).map((match) => match[0]),
    },
    suggestedTransactions: [],
    summary,
    confidence: 52,
    assumptions: [
      'This document type is stored mainly for review, not full auto-import.',
      'Numeric highlights are extracted without semantic tax or insurance validation.',
    ],
    whatChangesIfWrong: 'Use manual review before relying on these extracted values for decisions.',
  }
}

async function saveDocumentAnalysis(userId, payload, analysis) {
  const result = await pool.query(
    `INSERT INTO document_analyses (
      user_id, document_name, document_type, source_type, raw_content, extracted_data, import_status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, document_name, document_type, source_type, import_status, created_at`,
    [
      userId,
      payload.documentName,
      analysis.documentType,
      payload.sourceType,
      payload.content.slice(0, 50000),
      JSON.stringify(analysis),
      'analyzed',
    ]
  )

  return {
    id: result.rows[0].id,
    documentName: result.rows[0].document_name,
    documentType: result.rows[0].document_type,
    sourceType: result.rows[0].source_type,
    importStatus: result.rows[0].import_status,
    importedRecordsCount: 0,
    createdAt: result.rows[0].created_at,
    analysis,
  }
}

async function analyzeDocument(userId, payload) {
  const content = normalizeText(payload.content)
  if (!content) {
    throw new Error('Document content is empty')
  }

  const documentType = inferDocumentType(payload.documentType, content, payload.documentName)
  const baseAnalysis =
    documentType === 'salary_slip'
      ? analyzeSalarySlip(content)
      : documentType === 'bank_statement' || documentType === 'credit_card_statement'
        ? analyzeStatementLikeDocument(content, documentType)
        : analyzeStaticDocument(content, documentType)

  const analysis = {
    documentType,
    summary: baseAnalysis.summary,
    confidence: baseAnalysis.confidence,
    assumptions: baseAnalysis.assumptions,
    whatChangesIfWrong: baseAnalysis.whatChangesIfWrong,
    extractedFields: baseAnalysis.extractedFields,
    suggestedTransactions: baseAnalysis.suggestedTransactions,
    importPreview: {
      transactionCount: baseAnalysis.suggestedTransactions.length,
      incomeCount: baseAnalysis.suggestedTransactions.filter((item) => item.type === 'income').length,
      expenseCount: baseAnalysis.suggestedTransactions.filter((item) => item.type === 'expense').length,
    },
  }

  const saved = await saveDocumentAnalysis(userId, payload, analysis)
  return {
    document: saved,
    analysis,
  }
}

async function listDocumentAnalyses(userId) {
  const result = await pool.query(
    `SELECT id, document_name, document_type, source_type, import_status, imported_records_count, created_at, extracted_data
     FROM document_analyses
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [userId]
  )

  return result.rows.map((row) => ({
    id: row.id,
    documentName: row.document_name,
    documentType: row.document_type,
    sourceType: row.source_type,
    importStatus: row.import_status,
    importedRecordsCount: row.imported_records_count || 0,
    createdAt: row.created_at,
    analysis: row.extracted_data,
  }))
}

async function importDocumentAnalysis(userId, documentId) {
  const result = await pool.query(
    `SELECT id, extracted_data, import_status
     FROM document_analyses
     WHERE id = $1 AND user_id = $2`,
    [documentId, userId]
  )

  if (!result.rows.length) {
    throw new Error('Document analysis not found')
  }

  const document = result.rows[0]
  const extracted = document.extracted_data || {}
  const suggestions = extracted.suggestedTransactions || []
  let importedRecordsCount = 0

  for (const item of suggestions) {
    const duplicateCheck = await pool.query(
      `SELECT id
       FROM transactions
       WHERE user_id = $1
         AND type = $2
         AND amount = $3
         AND date = $4
         AND description = $5
       LIMIT 1`,
      [userId, item.type, item.amount, item.date, item.description]
    )

    if (duplicateCheck.rows.length > 0) {
      continue
    }

    await pool.query(
      `INSERT INTO transactions (user_id, type, category, amount, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, item.type, item.category || null, item.amount, item.description, item.date]
    )
    importedRecordsCount += 1
  }

  await pool.query(
    `UPDATE document_analyses
     SET import_status = $1,
         imported_records_count = $2,
         imported_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND user_id = $4`,
    [importedRecordsCount > 0 ? 'imported' : 'reviewed', importedRecordsCount, documentId, userId]
  )

  return {
    importedRecordsCount,
    importStatus: importedRecordsCount > 0 ? 'imported' : 'reviewed',
  }
}

module.exports = {
  analyzeDocument,
  listDocumentAnalyses,
  importDocumentAnalysis,
}
