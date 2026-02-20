'use client'
import React, { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface LogDetailsProps {
  details: any
  className?: string
}

interface DetailItem {
  amount?: number
  concept?: string
  [key: string]: any
}

export default function LogDetails({ details, className = '' }: LogDetailsProps) {
  const [expanded, setExpanded] = useState(false)

  if (!details || typeof details !== 'object') {
    return <span className="text-gray-500">-</span>
  }

  // Helper to get icon for concept
  const getConceptIcon = (concept: string) => {
    const conceptLower = concept.toLowerCase()
    if (conceptLower.includes('horas') || conceptLower.includes('extras')) {
      return <Clock className="w-4 h-4 text-blue-500" />
    }
    if (conceptLower.includes('dietas') || conceptLower.includes('restaurant')) {
      return <DollarSign className="w-4 h-4 text-green-500" />
    }
    if (conceptLower.includes('prima') || conceptLower.includes('bonus')) {
      return <CheckCircle className="w-4 h-4 text-purple-500" />
    }
    return <FileText className="w-4 h-4 text-gray-500" />
  }

  // Helper to format value based on key and type
  const formatValue = (value: any, key?: string) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Ja' : 'Nein'
    if (typeof value === 'number') {
      // Check if this is a year field (anio, año, year) or a year-like number (1000-2999)
      const keyLower = (key || '').toLowerCase()
      const isYearField = keyLower.includes('anio') || keyLower.includes('año') || keyLower.includes('year')
      const isYearNumber = value >= 1000 && value <= 2999 && Number.isInteger(value)
      
      if (isYearField || isYearNumber) {
        return value.toString() // Display years as plain numbers
      }
      
      // For other numbers, use German locale formatting
      return value.toLocaleString('de-DE')
    }
    return String(value)
  }

  // Helper to format concept name
  const formatConcept = (concept: string) => {
    return concept
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Render items array
  const renderItems = (items: DetailItem[]) => {
    if (!Array.isArray(items) || items.length === 0) return null

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              {item.concept && getConceptIcon(item.concept)}
              <span className="text-sm font-medium text-gray-700">
                {item.concept ? formatConcept(item.concept) : 'Unbekannt'}
              </span>
            </div>
            {item.amount !== undefined && (
              <span className="text-sm font-semibold text-green-600">
                €{item.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Render defer concepts
  const renderDeferConcepts = (deferConcepts: string[]) => {
    if (!Array.isArray(deferConcepts) || deferConcepts.length === 0) return null

    return (
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">Aufgeschobene Konzepte:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {deferConcepts.map((concept, index) => (
            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              {formatConcept(concept)}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // Render change details (old/new values)
  const renderChangeDetails = (details: any) => {
    const changes = Object.entries(details).filter(([_, value]) => 
      typeof value === 'object' && value !== null && ('old' in value || 'new' in value)
    )

    if (changes.length === 0) return null

    return (
      <div className="space-y-3">
        {changes.map(([field, change]) => {
          const changeObj = change as { old?: any; new?: any }
          return (
            <div key={field} className="border-l-4 border-blue-400 pl-3">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {formatConcept(field)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {changeObj.old !== undefined && (
                  <div className="bg-red-50 p-2 rounded">
                    <div className="text-red-600 font-medium mb-1">Vorher:</div>
                    <div className="text-red-800">
                      {formatValue(changeObj.old)}
                    </div>
                  </div>
                )}
                {changeObj.new !== undefined && (
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-green-600 font-medium mb-1">Nachher:</div>
                    <div className="text-green-800">
                      {formatValue(changeObj.new)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Render simple key-value pairs
  const renderKeyValuePairs = (obj: any) => {
    const entries = Object.entries(obj).filter(([key, value]) => 
      !Array.isArray(value) && typeof value !== 'object'
    )

    if (entries.length === 0) return null

    return (
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-gray-600">{formatConcept(key)}:</span>
            <span className="font-medium text-gray-900">
              {formatValue(value, key)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Main render logic
  const renderContent = () => {
    // Check for items array (most common case from screenshot)
    if (details.items && Array.isArray(details.items)) {
      return (
        <div>
          {details.defer_concepts && renderDeferConcepts(details.defer_concepts)}
          {renderItems(details.items)}
        </div>
      )
    }

    // Check for change details (old/new structure)
    if (Object.values(details).some(value => 
      typeof value === 'object' && value !== null && ('old' in value || 'new' in value)
    )) {
      return renderChangeDetails(details)
    }

    // Fallback to key-value pairs
    return renderKeyValuePairs(details)
  }

  const content = renderContent()

  return (
    <div className={`max-w-lg ${className}`}>
      {content ? (
        <div>
          <div className="text-sm text-gray-600">
            {content}
          </div>
          {/* Always show raw JSON option for debugging */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Verbergen' : 'Zeigen'} Rohdaten
          </button>
          {expanded && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <span className="text-gray-500">Keine Details verfügbar</span>
      )}
    </div>
  )
}
