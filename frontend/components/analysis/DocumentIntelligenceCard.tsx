'use client'

import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { FileSearch, Sparkles, Upload } from 'lucide-react'

interface SuggestedTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  confidence: number
}

interface AnalysisResult {
  documentType: string
  summary: string
  confidence: number
  assumptions: string[]
  whatChangesIfWrong: string
  extractedFields: Record<string, string | number | null | string[]>
  suggestedTransactions: SuggestedTransaction[]
  importPreview: {
    transactionCount: number
    incomeCount: number
    expenseCount: number
  }
}

interface SavedDocument {
  id: number
  documentName: string
  documentType: string
  sourceType: string
  importStatus: string
  importedRecordsCount: number
  createdAt: string
  analysis: AnalysisResult
}

const documentTypes = [
  { value: 'auto', label: 'Auto detect' },
  { value: 'bank_statement', label: 'Bank statement' },
  { value: 'credit_card_statement', label: 'Credit card statement' },
  { value: 'salary_slip', label: 'Salary slip' },
  { value: 'insurance', label: 'Insurance document' },
  { value: 'tax_document', label: 'Tax document' },
]

export default function DocumentIntelligenceCard() {
  const [documentName, setDocumentName] = useState('')
  const [documentType, setDocumentType] = useState('auto')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [importingId, setImportingId] = useState<number | null>(null)
  const [latestAnalysis, setLatestAnalysis] = useState<{ document: SavedDocument; analysis: AnalysisResult } | null>(null)
  const [documents, setDocuments] = useState<SavedDocument[]>([])

  const loadDocuments = async () => {
    try {
      const response = await api.get('/documents')
      setDocuments(response.data.documents || [])
    } catch (error) {
      console.error('Failed to load document analyses', error)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setDocumentName(file.name.replace(/\.[^.]+$/, ''))

    try {
      const text = await file.text()
      setContent(text)
    } catch (error) {
      console.error('Failed to read file', error)
    }
  }

  const analyze = async () => {
    if (!documentName.trim() || !content.trim()) return
    setLoading(true)
    try {
      const response = await api.post('/documents/analyze', {
        documentName: documentName.trim(),
        documentType,
        sourceType: fileName ? 'file_text' : 'pasted_text',
        content,
      })
      setLatestAnalysis(response.data)
      setContent('')
      setFileName('')
      await loadDocuments()
    } catch (error) {
      console.error('Failed to analyze document', error)
    } finally {
      setLoading(false)
    }
  }

  const importAnalysis = async (id: number) => {
    setImportingId(id)
    try {
      await api.post(`/documents/${id}/import`)
      await loadDocuments()
    } catch (error) {
      console.error('Failed to import document analysis', error)
    } finally {
      setImportingId(null)
    }
  }

  const currentResult = latestAnalysis?.analysis

  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center gap-2 mb-4">
        <FileSearch className="h-5 w-5 text-primary-300" />
        <h3 className="text-lg font-semibold text-slate-50">Document Intelligence</h3>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        Upload text or CSV statements, or paste OCR text from PDFs and images. FinanceIQ will extract structured entries and let you import reviewed records.
      </p>

      <div className="grid gap-3 md:grid-cols-3 mb-3">
        <input
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          className="input"
          placeholder="Document name"
        />
        <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="input">
          {documentTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <label className="input flex items-center gap-2 cursor-pointer">
          <Upload className="h-4 w-4 text-slate-400" />
          <span className="truncate text-sm text-slate-300">{fileName || 'Upload .txt or .csv'}</span>
          <input type="file" accept=".txt,.csv,.json" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="input min-h-[160px] mb-3"
        placeholder="Paste OCR text from a PDF, salary slip, bank statement, or card statement here..."
      />

      <div className="flex items-center justify-between gap-3 mb-6">
        <p className="text-xs text-slate-500">
          Tip: PDF/image OCR is not built in yet, so paste extracted text for those documents.
        </p>
        <button onClick={analyze} disabled={loading || !documentName.trim() || !content.trim()} className="btn-primary">
          <Sparkles className="h-4 w-4" />
          <span>{loading ? 'Analyzing...' : 'Analyze document'}</span>
        </button>
      </div>

      {currentResult ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 mb-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Latest analysis</p>
              <h4 className="text-base font-semibold text-slate-50 mt-1">{currentResult.summary}</h4>
            </div>
            <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs text-primary-200">
              {Math.round(currentResult.confidence)}% confidence
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Import preview</p>
              <p className="mt-2 text-sm text-slate-200">
                {currentResult.importPreview.transactionCount} rows
              </p>
              <p className="text-xs text-slate-400">
                {currentResult.importPreview.incomeCount} income | {currentResult.importPreview.expenseCount} expense
              </p>
            </div>
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Assumptions</p>
              <div className="mt-2 space-y-1">
                {currentResult.assumptions.slice(0, 2).map((item) => (
                  <p key={item} className="text-xs text-slate-300">{item}</p>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">If wrong</p>
              <p className="mt-2 text-xs text-slate-300">{currentResult.whatChangesIfWrong}</p>
            </div>
          </div>

          {currentResult.suggestedTransactions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Detected entries</p>
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {currentResult.suggestedTransactions.slice(0, 8).map((item, index) => (
                  <div key={`${item.description}-${index}`} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-100">{item.description}</p>
                        <p className="text-xs text-slate-400">
                          {item.date} | {item.category} | {Math.round(item.confidence)}% confidence
                        </p>
                      </div>
                      <div className={`text-sm font-medium ${item.type === 'income' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {Math.round(item.amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {latestAnalysis ? (
            <div className="flex justify-end">
              <button
                onClick={() => importAnalysis(latestAnalysis.document.id)}
                disabled={importingId === latestAnalysis.document.id || currentResult.importPreview.transactionCount === 0}
                className="btn-primary"
              >
                <span>{importingId === latestAnalysis.document.id ? 'Importing...' : 'Import detected records'}</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Recent analyses</p>
        <div className="space-y-3">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-400">No document analyses yet.</p>
          ) : (
            documents.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-50">{item.documentName}</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      {item.documentType.replace(/_/g, ' ')} | {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-300 mt-2">{item.analysis?.summary}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {item.importStatus}
                    </span>
                    <p className="text-xs text-slate-500 mt-2">
                      {item.importedRecordsCount} imported
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
