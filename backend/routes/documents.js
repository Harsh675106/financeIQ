const express = require('express')
const { body, validationResult } = require('express-validator')
const { authenticateToken } = require('../middleware/auth')
const {
  analyzeDocument,
  listDocumentAnalyses,
  importDocumentAnalysis,
} = require('../services/documentIntelligence.service')

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const documents = await listDocumentAnalyses(req.user.id)
    res.json({ documents })
  } catch (error) {
    console.error('List documents error:', error)
    res.status(500).json({ message: 'Failed to load document analyses' })
  }
})

router.post(
  '/analyze',
  [
    body('documentName').isString().trim().isLength({ min: 2, max: 200 }),
    body('documentType').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('sourceType').optional().isString().trim().isLength({ min: 2, max: 30 }),
    body('content').isString().trim().isLength({ min: 20, max: 50000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
      }

      const result = await analyzeDocument(req.user.id, {
        documentName: req.body.documentName,
        documentType: req.body.documentType || 'auto',
        sourceType: req.body.sourceType || 'text',
        content: req.body.content,
      })

      res.json(result)
    } catch (error) {
      console.error('Analyze document error:', error)
      res.status(500).json({ message: error.message || 'Failed to analyze document' })
    }
  }
)

router.post('/:id/import', async (req, res) => {
  try {
    const result = await importDocumentAnalysis(req.user.id, Number(req.params.id))
    res.json(result)
  } catch (error) {
    console.error('Import document error:', error)
    res.status(500).json({ message: error.message || 'Failed to import document analysis' })
  }
})

module.exports = router
