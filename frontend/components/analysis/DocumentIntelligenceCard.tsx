'use client'

import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { FileSearch, FileText, Sparkles, Upload } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

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

/** Badge colour per import status (falls back to neutral for anything else). */
const STATUS_BADGE: Record<string, string> = {
  imported: 'badge-success',
  reviewed: 'badge-info',
  analyzed: 'badge-ai',
}

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
    <div className="card card-pad">
      <SectionHeader icon={FileSearch} tone="violet" title="Document Intelligence" as="h3" />

      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-500">
        Upload text or CSV statements, or paste OCR text from PDFs and images. FinanceIQ will extract structured entries and let you import reviewed records.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <input
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          className="input"
          placeholder="Document name"
          aria-label="Document name"
        />
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="input"
          aria-label="Document type"
        >
          {documentTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <label
          className={`group flex min-h-[2.75rem] min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border border-dashed px-3 py-2 transition-colors duration-200 hover:border-primary-300 hover:bg-primary-50/70 ${
            fileName ? 'border-primary-300 bg-primary-50/70' : 'border-ice-200 bg-ice-50/60'
          }`}
        >
          <span className="icon-tile icon-tile-sm icon-tile-sky h-7 w-7 rounded-lg">
            <Upload className="h-3.5 w-3.5" />
          </span>
          <span
            className={`min-w-0 truncate text-sm transition-colors duration-200 group-hover:text-ink-900 ${
              fileName ? 'font-medium text-ink-900' : 'text-slate-500'
            }`}
          >
            {fileName || 'Upload .txt or .csv'}
          </span>
          <input type="file" accept=".txt,.csv,.json" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="input mt-3 min-h-[160px] resize-y leading-relaxed"
        placeholder="Paste OCR text from a PDF, salary slip, bank statement, or card statement here..."
        aria-label="Document text"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-slate-500">
          Tip: PDF/image OCR is not built in yet, so paste extracted text for those documents.
        </p>
        <button
          onClick={analyze}
          disabled={loading || !documentName.trim() || !content.trim()}
          className="btn-primary w-full shrink-0 sm:w-auto"
        >
          <Sparkles className="h-4 w-4" />
          <span>{loading ? 'Analyzing...' : 'Analyze document'}</span>
        </button>
      </div>

      {currentResult ? (
        <div className="mt-6 space-y-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-ice-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Latest analysis</p>
              <h4 className="mt-1.5 text-base font-semibold leading-snug text-ink-900">{currentResult.summary}</h4>
            </div>
            <span className="badge badge-ai num shrink-0 self-start px-3 py-1">
              {Math.round(currentResult.confidence)}% confidence
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="surface-inset bg-white p-3 sm:p-4">
              <p className="eyebrow">Import preview</p>
              <p className="kpi-value mt-2 text-lg">
                {currentResult.importPreview.transactionCount} rows
              </p>
              <p className="num text-xs text-slate-500">
                {currentResult.importPreview.incomeCount} income | {currentResult.importPreview.expenseCount} expense
              </p>
            </div>
            <div className="surface-inset bg-white p-3 sm:p-4">
              <p className="eyebrow">Assumptions</p>
              <div className="mt-2 space-y-1">
                {currentResult.assumptions.slice(0, 2).map((item) => (
                  <p key={item} className="text-xs leading-relaxed text-ink-700">{item}</p>
                ))}
              </div>
            </div>
            <div className="surface-inset bg-white p-3 sm:p-4">
              <p className="eyebrow">If wrong</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-700">{currentResult.whatChangesIfWrong}</p>
            </div>
          </div>

          {currentResult.suggestedTransactions.length > 0 ? (
            <div className="space-y-2">
              <p className="eyebrow">Detected entries</p>
              <div className="scroll-thin max-h-72 space-y-2 overflow-auto pr-1">
                {currentResult.suggestedTransactions.slice(0, 8).map((item, index) => (
                  <div key={`${item.description}-${index}`} className="surface-inset surface-inset-hover bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-ink-900">{item.description}</p>
                        <p className="num text-xs text-slate-500">
                          {item.date} | {item.category} | {Math.round(item.confidence)}% confidence
                        </p>
                      </div>
                      <div
                        className={`num shrink-0 font-display text-sm font-semibold ${
                          item.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
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
                className="btn-primary w-full sm:w-auto"
              >
                <span>{importingId === latestAnalysis.document.id ? 'Importing...' : 'Import detected records'}</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 border-t border-line pt-5">
        <p className="eyebrow mb-3">Recent analyses</p>
        <div className="space-y-3">
          {documents.length === 0 ? (
            <p className="surface-inset border-dashed border-line-strong p-4 text-sm text-slate-500">No document analyses yet.</p>
          ) : (
            documents.map((item) => (
              <div key={item.id} className="surface-inset surface-inset-hover p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="icon-tile icon-tile-sm icon-tile-slate mt-0.5 hidden sm:inline-flex">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="break-words text-sm font-semibold text-ink-900">{item.documentName}</h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.documentType.replace(/_/g, ' ')} | {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.analysis?.summary}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`badge ${STATUS_BADGE[item.importStatus] ?? 'badge-neutral'}`}>
                      {item.importStatus}
                    </span>
                    <p className="num mt-2 text-xs text-slate-500">
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
